import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
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
  pending: 'border-slate-200 bg-slate-100 text-slate-700',
  assigned: 'border-cyan-200 bg-cyan-100 text-cyan-700',
  in_progress: 'border-amber-200 bg-amber-100 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-100 text-rose-700',
};

const statusLabels = {
  pending: 'Pending',
  assigned: 'Ditugaskan',
  in_progress: 'Sedang Dikerjakan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const statusIcons = {
  pending: AlertCircle,
  assigned: Clock3,
  in_progress: Clock3,
  completed: CheckCircle2,
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
  if (!value) {
    return '-';
  }

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
    return tasks.filter((task) => {
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
      pending: tasks.filter((task) => task.status === 'pending').length,
      assigned: tasks.filter((task) => task.status === 'assigned').length,
      in_progress: tasks.filter((task) => task.status === 'in_progress').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    };
  }, [tasks]);

  const availableReportsCount = useMemo(() => {
    return reports.filter((report) => !tasks.some((task) => task.report_id === report.id)).length;
  }, [reports, tasks]);

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
    if (isSaving) {
      return;
    }

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
    if (!window.confirm('Hapus penugasan ini? Data yang dihapus tidak dapat dikembalikan.')) {
      return;
    }

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
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="glass-panel fade-slide-in rounded-3xl p-6 sm:p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              InfraTrack / Administrator
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-800">
              Penugasan Pemeliharaan
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Tetapkan petugas lapangan, jadwal, serta instruksi kerja untuk laporan kerusakan
              yang sudah terverifikasi.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-cyan-700">Laporan Siap Ditugaskan</p>
            <p className="text-2xl font-bold text-cyan-900">{availableReportsCount}</p>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-cyan-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-cyan-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-cyan-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Ditugaskan</p>
            <p className="mt-1 text-2xl font-bold text-cyan-700">{stats.assigned}</p>
          </div>
          <div className="rounded-xl border border-cyan-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Sedang Dikerjakan</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{stats.in_progress}</p>
          </div>
          <div className="rounded-xl border border-cyan-100 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Selesai</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.completed}</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-cyan-100 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari laporan, aset, atau petugas..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-cyan-100 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-cyan-100 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400"
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Ditugaskan</option>
                <option value="in_progress">Sedang Dikerjakan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Buat Penugasan
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-cyan-100 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Memuat data penugasan...
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-white">
            {filteredTasks.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada penugasan</p>
                <p className="mt-1 text-sm text-slate-500">Mulai dengan membuat penugasan baru.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cyan-100 text-sm">
                  <thead className="bg-cyan-50/70 text-left text-xs uppercase tracking-wide text-cyan-800">
                    <tr>
                      <th className="px-4 py-3">Laporan</th>
                      <th className="px-4 py-3">Aset</th>
                      <th className="px-4 py-3">Petugas</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Biaya</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-50">
                    {filteredTasks.map((task) => {
                      const StatusIcon = statusIcons[task.status] || AlertCircle;

                      return (
                        <tr key={task.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs font-semibold text-cyan-700">
                              {task.report?.ticket_code || '-'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 capitalize">
                              {task.report?.urgency_level || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{task.asset?.name || '-'}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-700">{task.assigned_officer?.name || '-'}</p>
                            <p className="text-xs text-slate-500">{task.assigned_officer?.email || '-'}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatDate(task.scheduled_date)}</td>
                          <td className="px-4 py-3 text-slate-700">{formatCurrency(task.estimated_cost)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusLabelStyles[task.status]}`}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              {statusLabels[task.status] || task.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewDetail(task.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Detail
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Hapus
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
      </section>

      <MaintenanceTaskFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        report={selectedReport}
        asset={selectedAsset}
        onSubmit={handleSubmitTask}
        isSaving={isSaving}
      />

      {detailModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
          <div className="glass-panel fade-slide-in max-h-[92vh] w-full max-w-xl overflow-auto rounded-3xl">
            <div className="flex items-center justify-between border-b border-cyan-100 px-6 py-5">
              <h2 className="text-xl font-extrabold text-slate-800">Detail Penugasan</h2>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-cyan-50 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Laporan</p>
                <p className="mt-1 font-mono text-cyan-700">{detailModal.report?.ticket_code || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aset</p>
                <p className="mt-1 text-slate-700">{detailModal.asset?.name || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Petugas</p>
                <p className="mt-1 text-slate-700">{detailModal.assigned_officer?.name || '-'}</p>
                <p className="text-xs text-slate-500">{detailModal.assigned_officer?.email || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Terjadwal</p>
                <p className="mt-1 text-slate-700">{formatDate(detailModal.scheduled_date)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Biaya Estimasi</p>
                <p className="mt-1 text-slate-700">{formatCurrency(detailModal.estimated_cost)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instruksi</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{detailModal.instructions || '-'}</p>
              </div>

              {detailModal.notes ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Catatan</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{detailModal.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="border-t border-cyan-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="w-full rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
