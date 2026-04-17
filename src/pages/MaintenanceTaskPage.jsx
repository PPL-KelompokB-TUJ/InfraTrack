import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, Trash2, Eye, X } from 'lucide-react';
import MaintenanceTaskFormModal from '../components/MaintenanceTaskFormModal';
import {
  getMaintenanceTasks,
  createMaintenanceTask,
  deleteMaintenanceTask,
  getMaintenanceTaskById,
} from '../lib/maintenanceTaskService';
import { getAllDamageReports } from '../lib/damageReportService';
import { getInfrastructureAssets } from '../lib/infrastructureAssetsService';

const statusLabelStyles = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  assigned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
};

const statusIcons = {
  pending: AlertCircle,
  assigned: Clock,
  in_progress: Clock,
  completed: CheckCircle,
  cancelled: AlertCircle,
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(value) {
  if (!value) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function MaintenanceTaskPage() {
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [tasksData, reportsResponse, assetsData] = await Promise.all([
        getMaintenanceTasks(),
        getAllDamageReports({ status: 'terverifikasi' }),
        getInfrastructureAssets(),
      ]);

      if (!reportsResponse?.success) {
        throw new Error(reportsResponse?.error || 'Gagal memuat laporan kerusakan.');
      }

      setTasks(tasksData);
      setReports(reportsResponse.reports || []);
      setAssets(assetsData);
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memuat data penugasan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        task.report?.ticket_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.asset?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assigned_officer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      assigned: tasks.filter(t => t.status === 'assigned').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  }, [tasks]);

  // Handle modal open for creating new task
  function handleOpenCreateModal() {
    setErrorMessage('');

    // Cari report yang belum memiliki penugasan
    const unassignedReports = reports.filter(
      (report) => !tasks.some((task) => task.report_id === report.id)
    );

    if (unassignedReports.length === 0) {
      setErrorMessage(
        'Belum ada laporan terverifikasi yang siap ditugaskan. Verifikasi laporan terlebih dahulu.'
      );
      return;
    }

    const unassignedReport = unassignedReports[0];

    const relatedAsset = assets.find((asset) => asset.id === unassignedReport.asset_id);
    setSelectedReport(unassignedReport);
    setSelectedAsset(relatedAsset || null);

    setIsModalOpen(true);
  }

  function handleCloseModal() {
    if (isSaving) return;

    setIsModalOpen(false);
    setSelectedReport(null);
    setSelectedAsset(null);
  }

  // Handle form submit
  async function handleSubmitTask(formValues) {
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (!selectedReport) {
        setErrorMessage(
          'Tidak ada laporan yang dipilih untuk ditugaskan. Klik "Buat Penugasan" lagi untuk memilih laporan yang tersedia.'
        );
        return;
      }

      await createMaintenanceTask(
        {
          report_id: selectedReport.id,
          asset_id: selectedReport.asset_id,
          ...formValues,
        },
        // Assuming current user ID - replace with actual auth context
        null
      );

      setSuccessMessage('Penugasan berhasil dibuat dan notifikasi telah dikirim ke petugas');
      setIsModalOpen(false);
      setSelectedReport(null);
      setSelectedAsset(null);

      // Reload data
      await loadData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Gagal membuat penugasan');
    } finally {
      setIsSaving(false);
    }
  }

  // Handle delete
  async function handleDeleteTask(taskId) {
    if (!confirm('Yakin ingin menghapus penugasan ini?')) return;

    setErrorMessage('');
    try {
      await deleteMaintenanceTask(taskId);
      setSuccessMessage('Penugasan berhasil dihapus');
      await loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Gagal menghapus penugasan');
    }
  }

  // Handle detail view
  async function handleViewDetail(taskId) {
    try {
      const detail = await getMaintenanceTaskById(taskId);
      setDetailModal(detail);
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memuat detail penugasan');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Penugasan Pemeliharaan</h1>
          <p className="text-gray-600 mt-1">Kelola penugasan pekerjaan pemeliharaan ke petugas lapangan</p>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 flex gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
            <p className="text-gray-600 text-sm font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
            <p className="text-gray-600 text-sm font-medium">Pending</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-400">
            <p className="text-blue-600 text-sm font-medium">Ditugaskan</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.assigned}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-400">
            <p className="text-amber-600 text-sm font-medium">Sedang Dikerjakan</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.in_progress}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-400">
            <p className="text-emerald-600 text-sm font-medium">Selesai</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari laporan, aset, atau petugas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Ditugaskan</option>
                <option value="in_progress">Sedang Dikerjakan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              Buat Penugasan
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Memuat data penugasan...</p>
          </div>
        ) : (
          /* Tasks List */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Belum ada penugasan</p>
                <p className="text-gray-500 text-sm mt-1">Mulai dengan membuat penugasan baru</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Laporan</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Aset</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Petugas</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Tgl Terjadwal</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Biaya</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => {
                      const StatusIcon = statusIcons[task.status] || AlertCircle;
                      return (
                        <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-mono text-blue-600">{task.report?.ticket_code}</p>
                              <p className="text-xs text-gray-500">{task.report?.urgency_level || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">{task.asset?.name}</td>
                          <td className="px-6 py-4">
                            <p className="font-medium">{task.assigned_officer?.name}</p>
                            <p className="text-xs text-gray-500">{task.assigned_officer?.email}</p>
                          </td>
                          <td className="px-6 py-4">{formatDate(task.scheduled_date)}</td>
                          <td className="px-6 py-4">{formatCurrency(task.estimated_cost)}</td>
                          <td className="px-6 py-4">
                            <div
                              className={`flex items-center gap-2 w-fit px-3 py-1 rounded-full border ${statusLabelStyles[task.status]}`}
                            >
                              <StatusIcon className="w-4 h-4" />
                              <span className="text-xs font-medium capitalize">
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetail(task.id)}
                                className="p-2 hover:bg-blue-50 rounded text-blue-600 transition"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 hover:bg-red-50 rounded text-red-600 transition"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <MaintenanceTaskFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        report={selectedReport}
        asset={selectedAsset}
        onSubmit={handleSubmitTask}
        isSaving={isSaving}
      />

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Detail Penugasan</h2>
              <button
                onClick={() => setDetailModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <p className="text-xs text-gray-500 font-medium">Laporan</p>
                <p className="font-mono text-blue-600 mt-1">{detailModal.report?.ticket_code}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Aset</p>
                <p className="mt-1">{detailModal.asset?.name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Petugas</p>
                <p className="mt-1">{detailModal.assigned_officer?.name}</p>
                <p className="text-sm text-gray-600">{detailModal.assigned_officer?.email}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Tanggal Terjadwal</p>
                <p className="mt-1">{formatDate(detailModal.scheduled_date)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Biaya</p>
                <p className="mt-1">{formatCurrency(detailModal.estimated_cost)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Instruksi</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{detailModal.instructions}</p>
              </div>

              {detailModal.notes && (
                <div>
                  <p className="text-xs text-gray-500 font-medium">Catatan</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{detailModal.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setDetailModal(null)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
