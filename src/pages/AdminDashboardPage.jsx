import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Building2, FileText, Users, AlertCircle, Clock, MapPin, Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getRecentDamageReports } from '../lib/damageReportService';
import { useNotification } from '../context/NotificationContext';

export default function AdminDashboardPage() {
  const { addNotification } = useNotification();
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalReports: 0,
    pendingReports: 0,
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

      // Get pending reports (status not 'selesai')
      const { count: pendingReports, error: pendingError } = await supabase
        .from('damage_reports')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'selesai');

      if (pendingError) throw pendingError;

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
        pendingReports: pendingReports || 0,
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
        <h1 className="text-3xl font-extrabold text-slate-800">Dashboard Admin</h1>
        <p className="mt-2 text-slate-600">
          Ringkasan aktivitas dan statistik sistem InfraTrack
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Assets */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.totalAssets}</p>
              <p className="text-sm text-slate-600">Total Aset</p>
            </div>
          </div>
        </div>

        {/* Total Reports */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.totalReports}</p>
              <p className="text-sm text-slate-600">Total Laporan</p>
            </div>
          </div>
        </div>

        {/* Pending Reports */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.pendingReports}</p>
              <p className="text-sm text-slate-600">Laporan Pending</p>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Users size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.completedTasks}</p>
              <p className="text-sm text-slate-600">Tugas Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for future interactive elements */}
      <div className="mt-8 glass-panel rounded-3xl p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Aktivitas Terbaru</h2>
        {recentReports.length === 0 ? (
          <p className="text-slate-600">Belum ada laporan kerusakan terbaru</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Tiket</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Pelapor</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Jenis Kerusakan</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Lokasi</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Urgensi</th>
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
                    <td className="py-3 px-4">
                      <span className="text-slate-700">{report.reporter_name || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700">{report.damage_type_name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate text-xs">{report.location_description}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <UrgencyBadge level={report.urgency_level} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-600">
                        {new Date(report.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleViewDetail(report)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-semibold text-sm transition-colors"
                      >
                        <Eye size={16} />
                        Lihat Detail
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
 * Badge untuk menampilkan tingkat urgensi dengan warna berbeda
 */
function UrgencyBadge({ level }) {
  const urgencyConfig = {
    rendah: { bg: 'bg-green-100', text: 'text-green-800', label: 'Rendah' },
    sedang: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Sedang' },
    tinggi: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Tinggi' },
    'sangat tinggi': { bg: 'bg-red-100', text: 'text-red-800', label: 'Sangat Tinggi' },
  };

  const config = urgencyConfig[level] || urgencyConfig.sedang;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
      <AlertCircle size={14} />
      {config.label}
    </span>
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
 * Modal untuk menampilkan detail laporan kerusakan
 */
function ReportDetailModal({ report, onClose }) {
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
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">Tingkat Urgensi</p>
              <UrgencyBadge level={report.urgency_level} />
            </div>
          </div>

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
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}