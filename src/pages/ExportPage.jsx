import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Layers, 
  Users, 
  Database,
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock,
  Trash2,
  Package,
  Server
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from '../context/NotificationContext';
import { getActiveInfrastructureCategoryNames } from '../lib/masterDataService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function ExportPage() {
  const { addNotification } = useNotification();
  const [reportType, setReportType] = useState('asset-condition');
  const [format, setFormat] = useState('pdf');
  
  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [category, setCategory] = useState('all');
  const [categoryOptions, setCategoryOptions] = useState(['Jalan', 'Jembatan', 'Saluran Drainase', 'Air Bersih', 'Listrik']);

  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [currentServer, setCurrentServer] = useState(null); // X-Backend-Server dari nginx
  const [serverInfoMap, setServerInfoMap] = useState({}); // jobId → server string (frozen per-record)

  // Polling reference
  const pollingRef = useRef(null);

  // Fetch export history
  const loadHistory = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/export/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat riwayat ekspor');
      }

      // Tangkap server backend: coba header nginx dulu, fallback ke JSON body
      const data = await res.json();
      const backendServer = res.headers.get('x-backend-server') || data.current_server;
      if (backendServer) setCurrentServer(backendServer);

      const jobs = data.history || [];
      setHistory(jobs);

      // Simpan server info per-record di local state — dibekukan saat pertama muncul
      // Jika job sudah punya server_info di DB → pakai itu (paling akurat)
      // Jika belum → pakai backend yang sedang merespons saat ini (frozen, tidak berubah lagi)
      setServerInfoMap(prev => {
        const next = { ...prev };
        jobs.forEach(job => {
          if (job.server_info) {
            next[job.id] = job.server_info; // akurat dari DB
          } else if (!next[job.id] && backendServer) {
            next[job.id] = backendServer; // frozen saat pertama kali muncul
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Fetch category options on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const options = await getActiveInfrastructureCategoryNames();
        if (options && options.length > 0) {
          setCategoryOptions(options);
        }
      } catch (err) {
        console.error('Failed to load active categories:', err);
      }
    }
    loadCategories();
    loadHistory();
  }, [loadHistory]);

  // Setup/clear polling based on pending/processing jobs
  useEffect(() => {
    const hasActiveJobs = history.some(
      (job) => job.status === 'pending' || job.status === 'processing'
    );

    if (hasActiveJobs) {
      if (!pollingRef.current) {
        console.log('Starting background polling for active export jobs...');
        pollingRef.current = setInterval(() => {
          loadHistory();
        }, 3000);
      }
    } else {
      if (pollingRef.current) {
        console.log('Stopping background polling: no active jobs.');
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [history, loadHistory]);

  // Handle export submission
  const handleExport = async (e) => {
    e.preventDefault();
    setIsExporting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Sesi anda telah berakhir. Silakan login kembali.');
      }

      const filters = {};
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;
      if (reportType === 'asset-condition' && category !== 'all') {
        filters.category = category;
      }

      const response = await fetch(`${API_BASE_URL}/api/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportType,
          format,
          filters,
        }),
      });

      // Tangkap server backend: coba header nginx dulu, fallback ke JSON body
      const data = await response.json();
      const backendServer = response.headers.get('x-backend-server') || data.current_server;
      if (backendServer) setCurrentServer(backendServer);

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses ekspor');
      }

      addNotification(
        'Permintaan ekspor berhasil dikirim. Proses berjalan di background.',
        'success',
        4000
      );
      
      // Reload history to show the pending job immediately
      await loadHistory();
    } catch (error) {
      addNotification(error.message, 'error', 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map((job) => job.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setShowConfirmModal(false);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Sesi anda telah berakhir. Silakan login kembali.');
      }

      const res = await fetch(`${API_BASE_URL}/api/export/delete-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus riwayat ekspor');
      }

      addNotification(data.message || 'Riwayat ekspor berhasil dihapus.', 'success', 4000);
      setSelectedIds([]);
      setIsSelectionMode(false);
      await loadHistory();
    } catch (error) {
      addNotification(error.message, 'error', 4000);
    }
  };

  const getReportName = (type) => {
    switch (type) {
      case 'asset-condition':
        return 'Laporan Kondisi Aset';
      case 'maintenance-recap':
        return 'Rekapitulasi Pemeliharaan Periodik';
      case 'officer-performance':
        return 'Laporan Kinerja Petugas';
      case 'inventory-recap':
        return 'Laporan Manajemen Inventaris';
      default:
        return type;
    }
  };

  const getServerInfo = (job) => {
    // Ambil dari map frozen — tidak berubah walau backend berganti
    return serverInfoMap[job.id] || null;
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <Clock size={13} className="animate-pulse" />
            Antrean
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Loader2 size={13} className="animate-spin" />
            Memproses
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} />
            Selesai
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
            <XCircle size={13} />
            Gagal
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: '#fdf8f8' }}>
      
      {/* ── TOP BAR ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(253,248,248,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(206,128,147,0.1)', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px', color: '#ce8093' }}>download</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2d1520' }}>Ekspor</span>
            <span style={{ color: 'rgba(206,128,147,0.4)', fontSize: '14px' }}>›</span>
            <span style={{ fontSize: '13px', color: '#6b3a4a', opacity: 0.6 }}>Dokumen</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '28px 24px' }}>
        
        {/* ── HEADER ── */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.25em', color: '#ce8093', opacity: 0.6, textTransform: 'uppercase', marginBottom: '6px' }}>Manajemen Data</p>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#1e0f16', letterSpacing: '-0.03em', lineHeight: 1 }}>Ekspor Laporan</h1>
            <p style={{ fontSize: '14px', color: '#6b3a4a', opacity: 0.6, marginTop: '6px' }}>Buat dan unduh laporan resmi untuk kebutuhan audit, pelaporan instansi, dan analisis internal.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Side: Parameters Form */}
          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.04)', padding: '32px' }}>
            <form onSubmit={handleExport} className="space-y-8">
              {/* Step 1: Select Report Type */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1e0f16', marginBottom: '16px' }}>1. Pilih Jenis Laporan</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {[
                    { id: 'asset-condition', label: 'Kondisi Aset', icon: 'database', desc: 'Kondisi fisik, lokasi, & aduan' },
                    { id: 'maintenance-recap', label: 'Pemeliharaan', icon: 'description', desc: 'Realisasi & rekap penugasan' },
                    { id: 'officer-performance', label: 'Kinerja Petugas', icon: 'group', desc: 'Total tugas & durasi kerja' },
                    { id: 'inventory-recap', label: 'Inventaris', icon: 'inventory_2', desc: 'Stok, harga & nilai material' }
                  ].map(type => (
                    <button key={type.id} type="button" onClick={() => setReportType(type.id)}
                      style={{ 
                        padding: '20px', borderRadius: '16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                        border: reportType === type.id ? '2px solid #ce8093' : '1.5px solid rgba(206,128,147,0.15)',
                        background: reportType === type.id ? 'rgba(206,128,147,0.06)' : 'transparent',
                        boxShadow: reportType === type.id ? '0 4px 16px rgba(206,128,147,0.12)' : 'none'
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: reportType === type.id ? '#ce8093' : '#b39ad4', marginBottom: '12px', display: 'block' }}>{type.icon}</span>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: '#1e0f16', marginBottom: '4px' }}>{type.label}</p>
                      <p style={{ fontSize: '11px', color: '#6b3a4a', opacity: 0.7 }}>{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Filters */}
              <div style={{ background: 'rgba(206,128,147,0.04)', borderRadius: '16px', padding: '24px', border: '1.5px solid rgba(206,128,147,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ce8093', fontSize: '18px' }}>calendar_month</span>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1e0f16' }}>2. Sesuaikan Filter & Rentang Tanggal</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label htmlFor="fromDate" style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Tanggal Mulai</label>
                    <input type="date" id="fromDate" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                      style={{ w: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(206,128,147,0.15)', fontSize: '13px', outline: 'none', background: 'white' }} />
                  </div>
                  <div>
                    <label htmlFor="toDate" style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Tanggal Selesai</label>
                    <input type="date" id="toDate" value={toDate} onChange={(e) => setToDate(e.target.value)}
                      style={{ w: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(206,128,147,0.15)', fontSize: '13px', outline: 'none', background: 'white' }} />
                  </div>
                </div>

                {reportType === 'asset-condition' && (
                  <div style={{ marginTop: '16px' }}>
                    <label htmlFor="category" style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Filter Kategori Aset</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid rgba(206,128,147,0.15)', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer' }}>
                      <option value="all">Semua Kategori</option>
                      {categoryOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Step 3: Format */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1e0f16', marginBottom: '16px' }}>3. Pilih Format Unduhan</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[
                    { id: 'pdf', label: 'Dokumen PDF (.pdf)', desc: 'Cocok untuk dicetak langsung' },
                    { id: 'xlsx', label: 'Spreadsheet Excel (.xlsx)', desc: 'Mudah untuk diolah ulang' }
                  ].map(f => (
                    <label key={f.id} style={{ 
                      flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
                      border: format === f.id ? '2px solid #ce8093' : '1.5px solid rgba(206,128,147,0.15)',
                      background: format === f.id ? 'rgba(206,128,147,0.06)' : 'transparent'
                    }}>
                      <input type="radio" name="format" value={f.id} checked={format === f.id} onChange={() => setFormat(f.id)} style={{ accentColor: '#ce8093', width: '18px', height: '18px' }} />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e0f16' }}>{f.label}</p>
                        <p style={{ fontSize: '11px', color: '#6b3a4a', opacity: 0.7, marginTop: '2px' }}>{f.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isExporting}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #ce8093, #8c3a56)', color: 'white', fontSize: '14px', fontWeight: 800, border: 'none', cursor: isExporting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isExporting ? 0.7 : 1, boxShadow: '0 8px 24px rgba(206,128,147,0.3)'
                }}
                onMouseEnter={e => { if(!isExporting) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { if(!isExporting) e.currentTarget.style.transform = 'translateY(0)' }}>
                {isExporting ? (
                  <><span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>progress_activity</span> Menjadwalkan...</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span> Ekspor Sekarang (Background)</>
                )}
              </button>
            </form>
          </div>

          {/* Right Side: History Sidebar */}
          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.04)', display: 'flex', flexDirection: 'column', height: 'fit-content', maxHeight: '800px' }}>
            <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1.5px solid rgba(206,128,147,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#1e0f16' }}>Riwayat Ekspor</h2>
                {history.length > 0 && (
                  <button onClick={() => { if(isSelectionMode) setSelectedIds([]); setIsSelectionMode(!isSelectionMode); }}
                    style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, border: '1.5px solid rgba(206,128,147,0.2)', background: isSelectionMode ? 'rgba(206,128,147,0.1)' : 'transparent', color: '#ce8093', cursor: 'pointer' }}>
                    {isSelectionMode ? 'Batal' : 'Pilih'}
                  </button>
                )}
              </div>
              <p style={{ fontSize: '11px', color: '#6b3a4a', opacity: 0.6 }}>Tautan unduhan tetap aktif selama server berjalan.</p>
              
              {currentServer && (
                <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(206,128,147,0.08)', border: '1px solid rgba(206,128,147,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ce8093' }}>dns</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#8c3a56' }}>Backend aktif: <span style={{ fontFamily: 'monospace' }}>{currentServer}</span></span>
                </div>
              )}

              {isSelectionMode && selectedIds.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#1e0f16', cursor: 'pointer' }}>
                    <input type="checkbox" checked={history.length > 0 && selectedIds.length === history.length} onChange={handleSelectAll} style={{ accentColor: '#ce8093', width: '16px', height: '16px' }} /> Pilih Semua
                  </label>
                  <button onClick={handleDeleteSelected}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(248,113,113,0.1)', color: '#ef4444', border: 'none', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span> Hapus ({selectedIds.length})
                  </button>
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px', color: '#ce8093', opacity: 0.5 }}>progress_activity</span>
                </div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', border: '1.5px dashed rgba(206,128,147,0.2)', borderRadius: '16px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#ce8093', opacity: 0.3, marginBottom: '8px' }}>description</span>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b3a4a', opacity: 0.6 }}>Belum ada dokumen yang diekspor.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {history.map(job => (
                    <div key={job.id} style={{ 
                      padding: '16px', borderRadius: '16px', border: '1.5px solid rgba(206,128,147,0.12)', background: isSelectionMode && selectedIds.includes(job.id) ? 'rgba(206,128,147,0.06)' : 'white',
                      transition: 'all 0.2s', display: 'flex', gap: '12px' }}>
                      
                      {isSelectionMode && (
                        <input type="checkbox" checked={selectedIds.includes(job.id)} onChange={() => handleToggleSelect(job.id)} style={{ accentColor: '#ce8093', width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }} />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#1e0f16', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{getReportName(job.report_type)}</h4>
                          <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', background: 'rgba(206,128,147,0.1)', color: '#8c3a56', textTransform: 'uppercase' }}>{job.format}</span>
                        </div>
                        <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginBottom: '12px' }}>{new Date(job.created_at).toLocaleString('id-ID')}</p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, 
                            background: job.status === 'pending' ? 'rgba(148,163,184,0.1)' : job.status === 'processing' ? 'rgba(252,211,77,0.1)' : job.status === 'completed' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                            color: job.status === 'pending' ? '#64748b' : job.status === 'processing' ? '#d97706' : job.status === 'completed' ? '#16a34a' : '#dc2626'
                           }}>
                            {job.status === 'pending' ? 'Antrean' : job.status === 'processing' ? 'Memproses' : job.status === 'completed' ? 'Selesai' : 'Gagal'}
                          </div>

                          {job.status === 'completed' && job.file_url ? (
                            <a href={job.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: '#ce8093', color: 'white', fontSize: '11px', fontWeight: 800, textDecoration: 'none' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>download</span> Unduh
                            </a>
                          ) : job.status === 'failed' ? (
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ef4444', cursor: 'help' }} title={job.error_message || 'Terjadi kesalahan sistem'}>error</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(30,15,22,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 48px rgba(30,15,22,0.2)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ef4444' }}>delete</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1e0f16', textAlign: 'center', marginBottom: '8px' }}>Hapus Riwayat</h3>
            <p style={{ fontSize: '13px', color: '#6b3a4a', textAlign: 'center', opacity: 0.8, marginBottom: '24px', lineHeight: 1.6 }}>Apakah Anda yakin ingin menghapus <strong>{selectedIds.length}</strong> riwayat ekspor secara permanen? File fisik di server juga akan dihapus.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid rgba(206,128,147,0.2)', background: 'transparent', color: '#6b3a4a', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Batal</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
