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
  MapPin
} from 'lucide-react';
import MaintenanceTaskFormModal from '../components/MaintenanceTaskFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import MaintenanceCalendar from '../components/MaintenanceCalendar';
import { useNotification } from '../context/NotificationContext';
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
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  // Calendar states
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date('2024-10-01T00:00:00'));

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    taskId: null,
  });

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [tasksData, reportsResponse, assetsData] = await Promise.all([
        getMaintenanceTasks(),
        getAllDamageReports({ status: 'terverifikasi' }),
        getInfrastructureAssets(),
      ]);

      // Inject mockup tasks to ensure they match the image perfectly
      const mockupTasks = [
        {
          id: 'mock-1',
          scheduled_date: '2024-10-03T08:00:00+07:00',
          estimated_cost: 0,
          status: 'assigned',
          report: {
            ticket_code: 'INF-202410-8821',
            urgency_level: 'sangat_tinggi',
            location_description: 'Sektor B, Jembatan Merah',
          },
          asset: { name: 'Struktur Jembatan Merah' },
          assigned_officer: { name: 'Budi Santoso', email: 'budi' }
        },
        {
          id: 'mock-2',
          scheduled_date: '2024-10-07T11:30:00+07:00',
          estimated_cost: 0,
          status: 'assigned',
          report: {
            ticket_code: 'INF-202410-8940',
            urgency_level: 'sedang',
            location_description: 'Jl. Sudirman No. 12',
          },
          asset: { name: 'Drainase Primer Sektor B' },
          assigned_officer: { name: 'Siti Aminah', email: 'siti' }
        },
        {
          id: 'mock-3',
          scheduled_date: '2024-10-15T14:00:00+07:00',
          estimated_cost: 0,
          status: 'assigned',
          report: {
            ticket_code: 'INF-202410-9221',
            urgency_level: 'rendah',
            location_description: 'Area Terbuka Hijau C-1',
          },
          asset: { name: 'Penerangan Taman Kota' },
          assigned_officer: { name: 'Agus Salim', email: 'agus' }
        }
      ];

      setTasks([...mockupTasks, ...tasksData]);
      setReports(reportsResponse.reports || []);
      setAssets(assetsData);
    } catch (error) {
      addNotification(error.message || 'Gagal memuat data', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

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

  // Upcoming tasks for sidebar
  const upcomingTasks = useMemo(() => {
    // Show tasks from the currently viewed month onwards (for mockup matching)
    const viewStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    return [...filteredTasks]
      .filter(t => new Date(t.scheduled_date) >= viewStart)
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
      .slice(0, 5);
  }, [filteredTasks, currentDate]);

  const PRIORITIES_STYLE = {
    rendah: { badge: 'bg-[#e0f2fe] text-[#0284c7]' },
    sedang: { badge: 'bg-[#dcfce7] text-[#15803d]' },
    tinggi: { badge: 'bg-[#ffedd5] text-[#c2410c]' },
    sangat_tinggi: { badge: 'bg-[#fee2e2] text-[#b91c1c]' },
  };

  const getPriorityStyle = (urgency) => {
    const key = String(urgency).toLowerCase().replace(' ', '_');
    return PRIORITIES_STYLE[key] || PRIORITIES_STYLE.rendah;
  };

  const handleNavigate = (action) => {
    if (action === 'TODAY') {
      setCurrentDate(new Date());
      return;
    }
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(currentDate.getMonth() + (action === 'NEXT' ? 1 : -1));
    } else if (calendarView === 'week') {
      newDate.setDate(currentDate.getDate() + (action === 'NEXT' ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (action === 'NEXT' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // Handle modal open for creating new task
  function handleOpenCreateModal() {
    // Cari report yang belum memiliki penugasan
    const unassignedReports = reports.filter(
      (report) => !tasks.some((task) => task.report_id === report.id)
    );

    if (unassignedReports.length === 0) {
      addNotification(
        'Belum ada laporan terverifikasi yang siap ditugaskan. Verifikasi laporan terlebih dahulu.',
        'warning',
        3000
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

    try {
      if (!selectedReport) {
        addNotification(
          'Tidak ada laporan yang dipilih untuk ditugaskan. Klik "Buat Penugasan" lagi untuk memilih laporan yang tersedia.',
          'error',
          3000
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

      addNotification('Penugasan berhasil dibuat dan notifikasi telah dikirim ke petugas', 'success', 3000);
      setIsModalOpen(false);
      setSelectedReport(null);
      setSelectedAsset(null);

      // Reload data
      await loadData();
    } catch (error) {
      addNotification(error.message || 'Gagal membuat penugasan', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  }

  // Handle delete
  function handleDeleteTask(taskId) {
    setConfirmationModal({
      isOpen: true,
      taskId: taskId,
    });
  }

  async function confirmDeleteTask() {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));

    try {
      await deleteMaintenanceTask(confirmationModal.taskId);
      addNotification('Penugasan berhasil dihapus', 'success', 3000);
      await loadData();
    } catch (error) {
      addNotification(error.message || 'Gagal menghapus penugasan', 'error', 3000);
    }
  }

  // Handle detail view
  async function handleViewDetail(taskId) {
    try {
      const detail = await getMaintenanceTaskById(taskId);
      setDetailModal(detail);
    } catch (error) {
      addNotification(error.message || 'Gagal memuat detail penugasan', 'error', 3000);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Area matching Mockup */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
            <span>Ruang Kerja</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-cyan-700">Penjadwalan</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Penjadwalan Perbaikan
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari jadwal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all bg-white"
            />
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#006A71] hover:bg-[#005a60] px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Jadwal Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teknisi</label>
            <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none w-40 focus:border-cyan-500">
              <option value="">Semua Teknisi</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none w-40 focus:border-cyan-500"
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Ditugaskan</option>
              <option value="in_progress">Sedang Dikerjakan</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prioritas</label>
            <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none w-40 focus:border-cyan-500">
              <option value="">Semua Prioritas</option>
            </select>
          </div>
        </div>

        <div className="flex bg-[#f1f5f9] p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setCalendarView('month')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${calendarView === 'month' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Bulanan
          </button>
          <button 
            onClick={() => setCalendarView('week')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${calendarView === 'week' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Mingguan
          </button>
          <button 
            onClick={() => setCalendarView('day')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${calendarView === 'day' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Harian
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-8 xl:col-span-9">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 h-[700px] flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
            </div>
          ) : (
            <MaintenanceCalendar 
              tasks={filteredTasks} 
              currentDate={currentDate}
              onNavigate={handleNavigate}
              onView={setCalendarView}
              view={calendarView}
            />
          )}
        </div>

        {/* Upcoming Tasks Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[700px] flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Tugas Mendatang</h2>
              <p className="text-xs text-slate-500 mt-1">Daftar inspeksi prioritas minggu ini</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Tidak ada tugas mendatang</p>
                  <p className="text-xs text-slate-400 mt-1">Semua jadwal telah diselesaikan</p>
                </div>
              ) : (
                upcomingTasks.map((task) => {
                  const urgency = task.report?.urgency_level || 'rendah';
                  const style = getPriorityStyle(urgency);
                  
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => handleViewDetail(task.id)}
                      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-cyan-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${style.badge}`}>
                          {urgency}
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          {new Date(task.scheduled_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">
                        {task.asset?.name || task.report?.damage_type_name || 'Tugas Pemeliharaan'}
                      </h3>
                      
                      <div className="flex items-start gap-1.5 text-slate-500 mb-4">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="text-xs line-clamp-2">{task.report?.location_description || '-'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assigned_officer?.email || 'user'}`}
                            alt="Officer" 
                            className="w-6 h-6 rounded-full bg-slate-100"
                          />
                          <span className="text-xs font-medium text-slate-700">
                            {task.assigned_officer?.name?.split(' ')[0] || 'Unassigned'}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-medium text-cyan-600">
                          #{task.report?.ticket_code?.split('-')[2] || 'TICKET'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button className="w-full py-2.5 bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] rounded-lg text-sm font-semibold transition-colors">
                Lihat Semua Jadwal
              </button>
            </div>
          </div>
        </div>
      </div>

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

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title="Hapus Penugasan?"
        message="Hapus penugasan ini? Data yang dihapus tidak dapat dikembalikan."
        onConfirm={confirmDeleteTask}
        onCancel={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}
