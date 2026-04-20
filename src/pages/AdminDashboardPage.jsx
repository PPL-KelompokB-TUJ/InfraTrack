import { useCallback, useEffect, useState } from 'react';
import { Building2, FileText, CheckCircle2, AlertCircle, Eye, X, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getRecentDamageReports, getPendingDamageReports, verifyDamageReport, rejectDamageReport } from '../lib/damageReportService';
import { useNotification } from '../context/NotificationContext';
import DamageReportVerificationPanel from '../components/DamageReportVerificationPanel';

export default function AdminDashboardPage({ onNavigateToModule }) {
  const { addNotification } = useNotification();
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalReports: 0,
    reportsResolved: 0,
    completedTasks: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);

    try {
      // Get total assets
      const { count: totalAssets, error: assetsError } = await supabase
        .from('infrastructure_assets')
        .select('*', { count: 'exact', head: true });

      if (assetsError) throw assetsError;

      // Get total reports
      const { count: totalReports, error: reportsError } = await supabase
        .from('damage_reports')
        .select('*', { count: 'exact', head: true });

      if (reportsError) throw reportsError;

      // Get resolved reports (status = 'selesai')
      const { count: reportsResolved, error: resolvedError } = await supabase
        .from('damage_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'selesai');

      if (resolvedError) throw resolvedError;

      // Get completed maintenance tasks
      const { count: completedTasks, error: tasksError } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'selesai');

      if (tasksError) throw tasksError;

      // Get recent damage reports
      const reportsResult = await getRecentDamageReports(10);
      
      setStats({
        totalAssets: totalAssets || 0,
        totalReports: totalReports || 0,
        reportsResolved: reportsResolved || 0,
        completedTasks: completedTasks || 0,
      });

      if (reportsResult.success) {
        setRecentReports(reportsResult.reports);
      }
    } catch (error) {
      addNotification(error.message || 'Gagal memuat statistik dashboard.', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleViewDetail = (report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReport(null);
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
          <p className="mt-2 text-sm text-slate-600">Memuat dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Ringkasan aktivitas dan statistik sistem InfraTrack</p>
      </div>

      {/* Verification Panel - High Priority */}
      <div className="mb-8">
        <DamageReportVerificationPanel />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Assets */}
        <div className="glass-panel rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Aset</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalAssets}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-100">
              <Building2 size={28} className="text-cyan-700" />
            </div>
          </div>
        </div>

        {/* Total Reports - Clickable */}
        <button
          onClick={() => onNavigateToModule?.('active-reports')}
          className="glass-panel rounded-lg p-6 hover:bg-orange-50 transition-colors cursor-pointer border border-transparent hover:border-orange-200"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm font-medium text-slate-600">Laporan Aktif</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalReports}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-100">
              <FileText size={28} className="text-orange-700" />
            </div>
          </div>
        </button>

        {/* Resolved Reports */}
        <div className="glass-panel rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Laporan Selesai</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.reportsResolved}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 size={28} className="text-emerald-700" />
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-panel rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Tugas Selesai</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.completedTasks}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-100">
              <AlertCircle size={28} className="text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="glass-panel rounded-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Laporan Terbaru</h2>
        
        {recentReports.length === 0 ? (
          <p className="text-center text-slate-600 py-8">Belum ada laporan kerusakan terbaru</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Tiket</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Jenis Kerusakan</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Lokasi</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Tanggal</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-cyan-700">{report.ticket_code}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{report.damage_type_name}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{report.location_description}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {new Date(report.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleViewDetail(report)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-semibold text-sm transition-colors"
                      >
                        <Eye size={16} />
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

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReport && (
        <ReportDetailModal 
          report={selectedReport} 
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}

/**
 * Badge untuk menampilkan status laporan dengan warna berbeda
 */
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Pending' },
    terverifikasi: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terverifikasi' },
    ditolak: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
    sedang_dikerjakan: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sedang Dikerjakan' },
    selesai: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Selesai' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
      <Clock size={14} />
      {config.label}
    </span>
  );
}

/**
 * Modal untuk menampilkan detail laporan kerusakan dengan verifikasi
 */
function ReportDetailModal({ report, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('sedang');
  const [verificationAction, setVerificationAction] = useState(null); // 'approve' or 'reject'
  const { addNotification } = useNotification();

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
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Detail Laporan</h2>
            <p className="text-cyan-100 text-sm mt-1">{report.ticket_code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">Status</p>
              <StatusBadge status={report.status} />
            </div>
          </div>

          {/* Foto Laporan */}
          {report.photo_url && (
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-3">Foto Laporan</p>
              <div className="w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
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

          {/* Informasi Pelapor */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Informasi Pelapor</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Nama:</span>
                <span className="font-semibold text-slate-800">{report.reporter_name || '-'}</span>
              </div>
            </div>
          </div>

          {/* Kerusakan */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Informasi Kerusakan</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Jenis Kerusakan:</span>
                <span className="font-semibold text-slate-800">{report.damage_type_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lokasi (Koordinat):</span>
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

          {/* Aset */}
          {report.asset_name !== '-' && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Aset Terkait</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Nama Aset:</span>
                  <span className="font-semibold text-slate-800">{report.asset_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tanggal */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
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
                      className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      ✓ Setuju
                    </button>
                    <button
                      onClick={() => handleVerificationClick('reject')}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                    >
                      ✗ Tolak
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
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

                {verificationAction === 'approve' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Tingkat Prioritas *
                    </label>
                    <select
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 resize-none"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleVerificationSubmit}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-white transition-colors ${
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
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 disabled:opacity-50 transition-colors"
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