import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronLeft, Eye, AlertCircle, Filter, X, Brain, Loader2, Info, Target } from 'lucide-react';
import { getRecentDamageReports, verifyDamageReport, rejectDamageReport } from '../lib/damageReportService';
import { getAnalysisResult, SEVERITY_CONFIG } from '../lib/aiAnalysisService';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabaseClient';

export default function ActiveReportsPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getRecentDamageReports(100);
      if (result.success) {
        setReports(result.reports);
      } else {
        addNotification('Gagal memuat laporan aktif', 'error');
      }
    } catch (error) {
      addNotification('Error: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleViewDetail = (report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReport(null);
  };

  const location = useLocation();
  useEffect(() => {
    if (location.state?.openReportId && reports.length > 0) {
      const report = reports.find(r => r.id === location.state.openReportId);
      if (report) {
        handleViewDetail(report);
        // Clear state so it doesn't re-open on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, reports]);

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.damage_type_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location_description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'terverifikasi'
        ? (report.status === 'terverifikasi' || report.status === 'sedang_dikerjakan')
        : report.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-800 border-slate-300',
      terverifikasi: 'bg-blue-100 text-blue-800 border-blue-300',
      ditolak: 'bg-red-100 text-red-800 border-red-300',
      sedang_dikerjakan: 'bg-purple-100 text-purple-800 border-purple-300',
      selesai: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      terverifikasi: 'Terverifikasi',
      ditolak: 'Ditolak',
      sedang_dikerjakan: 'Sedang Dikerjakan',
      selesai: 'Selesai',
    };
    return labels[status] || status;
  };

  const getUrgencyColor = (level) => {
    const colors = {
      rendah: 'bg-emerald-100 text-emerald-800',
      sedang: 'bg-yellow-100 text-yellow-800',
      tinggi: 'bg-orange-100 text-orange-800',
      sangat_tinggi: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-slate-100 text-slate-800';
  };

  const getUrgencyLabel = (level) => {
    const labels = {
      rendah: 'Rendah',
      sedang: 'Sedang',
      tinggi: 'Tinggi',
      sangat_tinggi: 'Sangat Tinggi',
    };
    return labels[level] || level;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf8f8' }}>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: 'linear-gradient(135deg,#ce8093,#8c3a56)' }}>
            <span className="material-symbols-outlined text-white animate-spin" style={{ fontSize: '28px' }}>progress_activity</span>
          </div>
          <p className="font-semibold" style={{ color: '#6b3a4a' }}>Memuat laporan aktif...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: '#fdf8f8' }}>
      
      {/* ── TOP BAR ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(253,248,248,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(206,128,147,0.1)', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px', color: '#ce8093' }}>inbox</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2d1520' }}>Laporan</span>
            <span style={{ color: 'rgba(206,128,147,0.4)', fontSize: '14px' }}>›</span>
            <span style={{ fontSize: '13px', color: '#6b3a4a', opacity: 0.6 }}>Aktif</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'rgba(107,58,74,0.4)' }}>search</span>
              <input type="text" placeholder="Cari laporan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '12px', fontSize: '13px', outline: 'none', width: '220px', background: 'rgba(206,128,147,0.06)', border: '1.5px solid rgba(206,128,147,0.15)', color: '#2d1520' }}
                onFocus={e => { e.target.style.borderColor = '#ce8093'; e.target.style.background = 'white'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(206,128,147,0.15)'; e.target.style.background = 'rgba(206,128,147,0.06)'; }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px' }}>
        
        {/* ── HEADER ── */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyItems: 'space-between', justifyContent: 'space-between' }}>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => navigate('/dashboard')} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid rgba(206,128,147,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(206,128,147,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ce8093' }}>arrow_back</span>
              </button>
              <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.25em', color: '#ce8093', opacity: 0.6, textTransform: 'uppercase' }}>Manajemen Laporan</p>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#1e0f16', letterSpacing: '-0.03em', lineHeight: 1 }}>Laporan Aktif</h1>
            <p style={{ fontSize: '14px', color: '#6b3a4a', opacity: 0.6, marginTop: '6px' }}>Daftar semua laporan kerusakan infrastruktur dari warga.</p>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Laporan', value: reports.length, color: '#8c3a56' },
            { label: 'Pending', value: reports.filter((r) => r.status === 'pending').length, color: '#f87171' },
            { label: 'Terverifikasi', value: reports.filter((r) => r.status === 'terverifikasi' || r.status === 'sedang_dikerjakan').length, color: '#7fa8d4' },
            { label: 'Ditolak', value: reports.filter((r) => r.status === 'ditolak').length, color: '#94a3b8' },
            { label: 'Selesai', value: reports.filter((r) => r.status === 'selesai').length, color: '#4ade80' }
          ].map((card, i) => (
            <div key={i} style={{ background: 'white', border: '1.5px solid rgba(206,128,147,0.12)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 4px 20px rgba(206,128,147,0.04)' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{card.label}</p>
              <p style={{ fontSize: '26px', fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── TABLE CONTAINER ── */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.06)', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '16px 24px', borderBottom: '1.5px solid rgba(206,128,147,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#ce8093' }}>filter_list</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid rgba(206,128,147,0.2)', fontSize: '12px', fontWeight: 600, color: '#6b3a4a', outline: 'none', background: 'rgba(206,128,147,0.04)' }}>
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="terverifikasi">Terverifikasi</option>
                <option value="ditolak">Ditolak</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredReports.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(206,128,147,0.3)', marginBottom: '16px' }}>search_off</span>
              <p style={{ color: '#6b3a4a', fontSize: '14px', fontWeight: 600 }}>Tidak ada laporan yang sesuai dengan filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(206,128,147,0.03)' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kode Tiket</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jenis Kerusakan</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lokasi</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal</th>
                    <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} style={{ borderTop: '1px solid rgba(206,128,147,0.06)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(206,128,147,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', color: '#1e0f16' }}>{report.ticket_code}</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b3a4a' }}>{report.damage_type_name || '-'}</span>
                      </td>
                      <td style={{ padding: '16px 24px', maxWidth: '250px' }}>
                        <span style={{ fontSize: '12px', color: '#6b3a4a', opacity: 0.8, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{report.location_description}</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, 
                          background: report.status === 'pending' ? 'rgba(248,113,113,0.1)' : report.status === 'selesai' ? 'rgba(74,222,128,0.1)' : 'rgba(127,168,212,0.1)',
                          color: report.status === 'pending' ? '#f87171' : report.status === 'selesai' ? '#16a34a' : '#7fa8d4'
                         }}>
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>{new Date(report.created_at).toLocaleDateString('id-ID')}</span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <button onClick={() => handleViewDetail(report)}
                          style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(206,128,147,0.1)', color: '#ce8093', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(206,128,147,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(206,128,147,0.1)'}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={handleCloseModal} />
      )}
    </div>
  );
}

/**
 * Report Detail Modal with Verification
 */
function ReportDetailModal({ report, onClose }) {
  const { addNotification } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('sedang');
  const [verificationAction, setVerificationAction] = useState(null); // 'approve' or 'reject'
  const [aiResult, setAiResult] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(true);

  // Set priority level from recommendation
  useEffect(() => {
    if (report?.priority_recommendation === 'Sangat Mendesak') setPriorityLevel('sangat_tinggi');
    else if (report?.priority_recommendation === 'Mendesak') setPriorityLevel('tinggi');
    else setPriorityLevel('sedang');
  }, [report]);

  // Fetch AI analysis result when modal opens
  useEffect(() => {
    let isMounted = true;
    async function fetchAiResult() {
      setIsLoadingAi(true);
      const response = await getAnalysisResult(report.id);
      if (isMounted) {
        setAiResult(response.success ? response.data : null);
        setIsLoadingAi(false);
      }
    }
    fetchAiResult();
    return () => { isMounted = false; };
  }, [report.id]);

  const handleVerificationClick = (action) => {
    setVerificationAction(action);
    setShowVerificationForm(true);
  };

  const handleVerificationSubmit = async () => {
    if (verificationAction === 'approve' && !priorityLevel) {
      addNotification('Pilih tingkat prioritas untuk persetujuan', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addNotification('Unauthorized: User tidak ditemukan', 'error');
        setIsProcessing(false);
        return;
      }

      let result;
      if (verificationAction === 'approve') {
        result = await verifyDamageReport({
          reportId: report.id,
          verificationNotes: verificationNotes || null,
          priorityLevel,
          adminId: user.id,
        });
      } else {
        result = await rejectDamageReport({
          reportId: report.id,
          verificationNotes: verificationNotes || null,
          adminId: user.id,
        });
      }

      setIsProcessing(false);

      if (result.success) {
        const action = verificationAction === 'approve' ? 'disetujui' : 'ditolak';
        addNotification(`Laporan ${report.ticket_code} berhasil ${action} ✓`, 'success');
        setShowVerificationForm(false);
        onClose();
      } else {
        addNotification(`Gagal ${verificationAction === 'approve' ? 'menyetujui' : 'menolak'}: ${result.error}`, 'error');
      }
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setShowVerificationForm(false);
    setVerificationNotes('');
    setPriorityLevel('sedang');
    setVerificationAction(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-primary px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Detail Laporan</h2>
            <p className="text-primary-container text-sm mt-1">{report.ticket_code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status */}
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-2">Status</p>
            <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${
              report.status === 'pending' 
                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                : (report.status === 'terverifikasi' || report.status === 'sedang_dikerjakan')
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : report.status === 'ditolak'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {report.status === 'pending' && 'Pending'}
              {report.status === 'terverifikasi' && 'Terverifikasi'}
              {report.status === 'sedang_dikerjakan' && 'Terverifikasi'}
              {report.status === 'ditolak' && 'Ditolak'}
              {report.status === 'selesai' && 'Selesai'}
            </span>
          </div>

          {/* Foto Laporan */}
          {report.photo_url && (
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-3">Foto Laporan</p>
              <div className="w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <img 
                  src={report.photo_url} 
                  alt="Foto laporan" 
                  className="w-full h-auto max-h-96 object-contain"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e2e8f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="14" fill="%2364748b" text-anchor="middle" dy=".3em"%3EGambar tidak dapat ditampilkan%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>
          )}

          {/* AI Analysis Result */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary/5 to-tertiary-container/20 border-b border-slate-200">
              <Brain size={18} className="text-primary" />
              <h3 className="font-semibold text-slate-800 text-sm">Hasil Analisis AI</h3>
            </div>
            <div className="p-4">
              {isLoadingAi ? (
                <div className="flex items-center gap-3 py-4 justify-center text-slate-500">
                  <Loader2 size={20} className="animate-spin text-primary" />
                  <span className="text-sm">Memuat hasil analisis...</span>
                </div>
              ) : aiResult ? (
                aiResult.error_message ? (
                  <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Analisis gagal</p>
                      <p className="text-xs mt-1 text-amber-600">{aiResult.error_message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Severity Badge */}
                    {aiResult.severity_level && SEVERITY_CONFIG[aiResult.severity_level] && (
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${SEVERITY_CONFIG[aiResult.severity_level].bg} ${SEVERITY_CONFIG[aiResult.severity_level].border}`}>
                        <Target size={20} className={SEVERITY_CONFIG[aiResult.severity_level].color} />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Kerusakan</p>
                          <p className={`text-base font-extrabold ${SEVERITY_CONFIG[aiResult.severity_level].color}`}>
                            {SEVERITY_CONFIG[aiResult.severity_level].label}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        <p className="text-xs text-slate-500 font-medium">Total Deteksi</p>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">{aiResult.total_detections}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        <p className="text-xs text-slate-500 font-medium">Avg. Confidence</p>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">
                          {aiResult.total_detections > 0 ? `${(aiResult.avg_confidence * 100).toFixed(0)}%` : '-'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        <p className="text-xs text-slate-500 font-medium">Threshold</p>
                        <p className="text-xl font-extrabold text-slate-900 mt-1">{aiResult.confidence_threshold}%</p>
                      </div>
                    </div>

                    {/* Detection details */}
                    {aiResult.predictions && aiResult.predictions.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Detail Deteksi</p>
                        {aiResult.predictions.map((pred, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white shadow-sm" />
                              <span className="font-semibold text-slate-800">
                                {pred.class === 'pothole' ? 'Lubang Jalan' : pred.class} #{idx + 1}
                              </span>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                              {(pred.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Analysis Metadata */}
                    <div className="flex items-start gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <Info size={12} className="shrink-0 mt-0.5" />
                      <p>
                        Dianalisis pada {new Date(aiResult.analyzed_at).toLocaleString('id-ID')}.
                        Resolusi: {aiResult.image_width}×{aiResult.image_height}px.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-3 py-4 justify-center text-slate-400">
                  <Brain size={20} />
                  <span className="text-sm">Belum ada hasil analisis AI untuk laporan ini.</span>
                </div>
              )}
            </div>
          </div>

          {/* Informasi Pelapor */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Informasi Pelapor</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Nama:</span>
                <span className="font-semibold text-slate-800">{report.reporter_name || '-'}</span>
              </div>
            </div>
          </div>

          {/* Kerusakan */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Informasi Kerusakan</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Jenis Kerusakan:</span>
                <span className="font-semibold text-slate-800">{report.damage_type_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lokasi:</span>
                <span className="font-mono text-sm font-semibold text-slate-800">
                  {report.location_description}
                </span>
              </div>
              {report.description && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-600 text-sm font-semibold mb-2">Deskripsi:</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{report.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tanggal */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">Dilaporkan:</span>
              <span className="text-slate-800 font-semibold">
                {new Date(report.created_at).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            {!showVerificationForm ? (
              <div className="flex gap-3">
                {report.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleVerificationClick('approve')}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      ✓ Setuju
                    </button>
                    <button
                      onClick={() => handleVerificationClick('reject')}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                    >
                      ✗ Tolak
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">
                    {verificationAction === 'approve' ? 'Proses Persetujuan Laporan' : 'Proses Penolakan Laporan'}
                  </p>
                </div>

                {verificationAction === 'approve' && report.priority_score && (
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary-container/20 flex items-start gap-3">
                    <Info className="text-primary flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-primary">Rekomendasi Prioritas (Skor: {report.priority_score}/100)</p>
                      <p className="text-xs text-primary mt-1">Sistem menyarankan prioritas: <strong>{report.priority_recommendation}</strong></p>
                    </div>
                  </div>
                )}

                {verificationAction === 'approve' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Tingkat Prioritas *
                    </label>
                    <select
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="rendah">Rendah</option>
                      <option value="sedang">Sedang</option>
                      <option value="tinggi">Tinggi</option>
                      <option value="sangat_tinggi">Sangat Tinggi</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Catatan {verificationAction === 'approve' ? 'Persetujuan' : 'Penolakan'} (Opsional)
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder={`Masukkan catatan ${verificationAction === 'approve' ? 'persetujuan' : 'penolakan'}...`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleVerificationSubmit}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition-colors ${
                      verificationAction === 'approve'
                        ? 'bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50'
                        : 'bg-red-500 hover:bg-red-600 disabled:opacity-50'
                    }`}
                  >
                    {isProcessing ? 'Memproses...' : (verificationAction === 'approve' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan')}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 disabled:opacity-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
