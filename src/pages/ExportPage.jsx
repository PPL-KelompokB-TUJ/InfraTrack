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
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from '../context/NotificationContext';
import { getActiveInfrastructureCategoryNames } from '../lib/masterDataService';

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

  // Polling reference
  const pollingRef = useRef(null);

  // Fetch export history
  const loadHistory = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) return;

      const res = await fetch('/api/export/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat riwayat ekspor');
      }

      const data = await res.json();
      setHistory(data.history || []);
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

      const response = await fetch('/api/export', {
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

      const data = await response.json();

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

  const getReportName = (type) => {
    switch (type) {
      case 'asset-condition':
        return 'Laporan Kondisi Aset';
      case 'maintenance-recap':
        return 'Rekapitulasi Pemeliharaan Periodik';
      case 'officer-performance':
        return 'Laporan Kinerja Petugas';
      default:
        return type;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
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
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Side: Parameters Form */}
        <section className="lg:col-span-2 space-y-6">
          <div className="glass-panel fade-slide-in rounded-3xl p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                InfraTrack / Administrator
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-800">
                Ekspor Laporan
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Buat dan unduh laporan resmi untuk kebutuhan audit, pelaporan instansi, dan analisis internal.
              </p>
            </div>

            <form onSubmit={handleExport} className="mt-8 space-y-6">
              {/* Step 1: Select Report Type */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">1. Pilih Jenis Laporan</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setReportType('asset-condition')}
                    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition ${
                      reportType === 'asset-condition'
                        ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900 shadow-glow'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Database className={reportType === 'asset-condition' ? 'text-cyan-600' : 'text-slate-400'} size={28} />
                    <div>
                      <p className="text-sm font-semibold">Kondisi Aset</p>
                      <p className="mt-1 text-[10px] leading-normal opacity-85">Kondisi fisik, lokasi koordinat, & aduan kerusakan</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('maintenance-recap')}
                    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition ${
                      reportType === 'maintenance-recap'
                        ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900 shadow-glow'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className={reportType === 'maintenance-recap' ? 'text-cyan-600' : 'text-slate-400'} size={28} />
                    <div>
                      <p className="text-sm font-semibold">Pemeliharaan</p>
                      <p className="mt-1 text-[10px] leading-normal opacity-85">Realisasi biaya & rekap penugasan periodik</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('officer-performance')}
                    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition ${
                      reportType === 'officer-performance'
                        ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900 shadow-glow'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Users className={reportType === 'officer-performance' ? 'text-cyan-600' : 'text-slate-400'} size={28} />
                    <div>
                      <p className="text-sm font-semibold">Kinerja Petugas</p>
                      <p className="mt-1 text-[10px] leading-normal opacity-85">Total tugas, status penyelesaian, & durasi kerja</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Filters */}
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                  <Calendar size={16} className="text-cyan-600" />
                  <h3 className="text-sm font-bold text-slate-700">2. Sesuaikan Filter & Rentang Tanggal</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fromDate" className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      id="fromDate"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="toDate" className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      id="toDate"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {reportType === 'asset-condition' && (
                  <div className="pt-2">
                    <label htmlFor="category" className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Filter Kategori Aset
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="all">Semua Kategori</option>
                      {categoryOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Step 3: Format File */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">3. Pilih Format Unduhan</label>
                <div className="flex gap-4">
                  <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={format === 'pdf'}
                      onChange={() => setFormat('pdf')}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Dokumen PDF (.pdf)</p>
                      <p className="text-[10px] text-slate-400">Cocok untuk dicetak langsung & arsip formal</p>
                    </div>
                  </label>

                  <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="radio"
                      name="format"
                      value="xlsx"
                      checked={format === 'xlsx'}
                      onChange={() => setFormat('xlsx')}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Spreadsheet Excel (.xlsx)</p>
                      <p className="text-[10px] text-slate-400">Mudah untuk diolah & dianalisis ulang</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isExporting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 py-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menjadwalkan Ekspor...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Ekspor Sekarang (Background)
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Side: Export History Sidebar */}
        <section className="lg:col-span-1 space-y-6">
          <div className="glass-panel fade-slide-in rounded-3xl p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Riwayat Ekspor</h2>
            <p className="text-xs text-slate-500 mb-6">Tautan unduhan tetap aktif selama server berjalan.</p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  <Loader2 size={24} className="animate-spin mx-auto text-slate-300 mb-2" />
                  Memuat riwayat...
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                  Belum ada dokumen yang diekspor.
                </div>
              ) : (
                history.map((job) => (
                  <div
                    key={job.id}
                    className="group relative rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-cyan-100 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-cyan-800">
                          {getReportName(job.report_type)}
                        </h4>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(job.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {job.format}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-50 pt-3">
                      {getStatusBadge(job.status)}

                      {job.status === 'completed' && job.file_url ? (
                        <a
                          href={job.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
                        >
                          <Download size={12} />
                          Unduh
                        </a>
                      ) : job.status === 'failed' ? (
                        <div 
                          className="text-rose-600 hover:text-rose-800 cursor-help"
                          title={job.error_message || 'Terjadi kesalahan sistem'}
                        >
                          <AlertCircle size={14} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
