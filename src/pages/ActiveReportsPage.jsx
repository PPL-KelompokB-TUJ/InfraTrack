import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, Eye, AlertCircle, Filter, X } from 'lucide-react';
import { getRecentDamageReports, verifyDamageReport, rejectDamageReport } from '../lib/damageReportService';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabaseClient';

export default function ActiveReportsPage({ onBackToDashboard }) {
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

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.damage_type_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location_description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || report.status === statusFilter;

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
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
          <p className="mt-4 text-sm text-slate-600">Memuat laporan aktif...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header with Back Button */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold transition-colors"
            >
              <ChevronLeft size={20} />
              Kembali
            </button>
          )}
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Laporan Aktif</h1>
            <p className="mt-1 text-slate-600">Daftar semua laporan kerusakan infrastruktur</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">Total Laporan</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{reports.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">Pending</p>
          <p className="text-3xl font-bold text-slate-400 mt-2">
            {reports.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">Terverifikasi</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {reports.filter((r) => r.status === 'terverifikasi').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">Ditolak</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {reports.filter((r) => r.status === 'ditolak').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">Selesai</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {reports.filter((r) => r.status === 'selesai').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Search className="inline mr-2" size={16} />
              Cari Laporan
            </label>
            <input
              type="text"
              placeholder="Cari kode tiket, jenis, atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Filter className="inline mr-2" size={16} />
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="terverifikasi">Terverifikasi</option>
              <option value="ditolak">Ditolak</option>
              <option value="sedang_dikerjakan">Sedang Dikerjakan</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle size={48} className="mx-auto mb-3 text-slate-400" />
            <p className="text-slate-600">Tidak ada laporan yang sesuai dengan filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Kode Tiket</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Jenis Kerusakan</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Lokasi</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Urgensi</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Tanggal</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-cyan-700">{report.ticket_code}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-700">{report.damage_type_name || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-600 text-xs">{report.location_description}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${getUrgencyColor(report.urgency_level)}`}>
                        {getUrgencyLabel(report.urgency_level)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold border ${getStatusColor(report.status)}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      {new Date(report.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-4 px-6 text-center">
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
        <ReportDetailModal report={selectedReport} onClose={handleCloseModal} />
      )}
    </main>
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Detail Laporan</h2>
            <p className="text-cyan-100 text-sm mt-1">{report.ticket_code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-2">Status</p>
            <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${
              report.status === 'pending' 
                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                : report.status === 'terverifikasi'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : report.status === 'ditolak'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {report.status === 'pending' && 'Pending'}
              {report.status === 'terverifikasi' && 'Terverifikasi'}
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
