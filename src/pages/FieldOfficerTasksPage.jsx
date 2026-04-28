import { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Loader,
  Upload,
  ChevronDown,
  Calendar,
  MapPin,
  FileText,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import {
  getOfficerTasks,
  getTaskDetails,
  updateTaskStatus,
  uploadProgressPhoto,
  getOfficerTaskStats,
} from '../lib/fieldOfficerTaskService';
import { useNotification } from '../context/NotificationContext';

const statusOptions = [
  { value: 'pending', label: 'Menunggu', color: 'slate', icon: AlertCircle },
  { value: 'assigned', label: 'Ditugaskan', color: 'blue', icon: Clock },
  { value: 'in_progress', label: 'Sedang Dikerjakan', color: 'amber', icon: Play },
  { value: 'completed', label: 'Selesai', color: 'emerald', icon: CheckCircle },
];

export default function FieldOfficerTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);

  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updatePhoto, setUpdatePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { showNotification } = useNotification();

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      const officerId = sessionData.session.user.id;

      const [tasksData, statsData] = await Promise.all([
        getOfficerTasks(officerId),
        getOfficerTaskStats(officerId),
      ]);

      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showNotification('Gagal memuat penugasan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (task) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const officerId = sessionData.session.user.id;

      const details = await getTaskDetails(task.id, officerId);
      setTaskDetails(details);
      setSelectedTask(task);
      setUpdateStatus(task.status);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading task details:', error);
      showNotification('Gagal memuat detail penugasan', 'error');
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUpdatePhoto(file);
      const reader = new FileReader();
      reader.onload = (evt) => setPhotoPreview(evt.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      let photoUrl = null;

      // Upload photo if provided
      if (updatePhoto) {
        const uploadResult = await uploadProgressPhoto(selectedTask.id, updatePhoto);
        photoUrl = uploadResult.url;
      }

      // Update status
      await updateTaskStatus(selectedTask.id, updateStatus, updateNotes, photoUrl);

      showNotification('Penugasan berhasil diperbarui', 'success');

      // Reset form
      setUpdateNotes('');
      setUpdatePhoto(null);
      setPhotoPreview(null);
      setShowDetailModal(false);

      // Reload tasks
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      showNotification('Gagal memperbarui penugasan: ' + error.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.color || 'slate';
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.label || status;
  };

  const getStatusIcon = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.icon || AlertCircle;
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Loader className="mx-auto mb-4 animate-spin text-cyan-500" size={32} />
            <p className="text-slate-600">Memuat penugasan...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Penugasan Saya</h1>
        <p className="mt-2 text-sm text-slate-600">
          Kelola dan perbarui status pekerjaan Anda
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-5">
          {[
            { label: 'Total', value: stats.total, color: 'slate' },
            { label: 'Ditugaskan', value: stats.assigned, color: 'blue' },
            { label: 'Sedang Dikerjakan', value: stats.in_progress, color: 'amber' },
            { label: 'Selesai', value: stats.completed, color: 'emerald' },
            { label: 'Dibatalkan', value: stats.cancelled, color: 'rose' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl bg-${stat.color}-50 px-4 py-6 border border-${stat.color}-100`}
            >
              <p className={`text-xs font-semibold text-${stat.color}-700 uppercase tracking-wide`}>
                {stat.label}
              </p>
              <p className={`mt-2 text-2xl font-bold text-${stat.color}-900`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <AlertCircle size={32} className="mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">Tidak ada penugasan untuk Anda saat ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status);
            const statusColor = getStatusColor(task.status);

            return (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-left transition hover:border-cyan-300 hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left side - Task info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl bg-${statusColor}-100 p-2`}>
                        <StatusIcon size={18} className={`text-${statusColor}-600`} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {task.report?.ticket_code || 'Task ' + task.id.slice(0, 8)}
                      </h3>
                    </div>
                    
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      {task.instructions || 'No instructions'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      {task.scheduled_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(task.scheduled_date).toLocaleDateString('id-ID')}
                        </div>
                      )}
                      {task.asset?.name && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {task.asset.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Status badge */}
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl bg-${statusColor}-100 px-3 py-1.5 text-sm font-semibold text-${statusColor}-700`}>
                      {getStatusLabel(task.status)}
                    </div>
                    <ChevronDown size={18} className="text-slate-400" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && taskDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">
                {taskDetails.report?.ticket_code || 'Detail Penugasan'}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Task Info */}
            <div className="mb-6 rounded-2xl bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Aset</p>
                  <p className="mt-1 font-medium text-slate-800">{taskDetails.asset?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Jadwal</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {new Date(taskDetails.scheduled_date).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Status Laporan</p>
                  <p className="mt-1 font-medium text-slate-800">{taskDetails.report?.urgency_level || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Estimasi Biaya</p>
                  <p className="mt-1 font-medium text-slate-800">
                    Rp {(taskDetails.estimated_cost || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            {taskDetails.instructions && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-700">Instruksi Kerja</p>
                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">{taskDetails.instructions}</p>
                </div>
              </div>
            )}

            {/* Report Photos */}
            {taskDetails.report?.photo_url && (
              <div className="mb-6">
                <p className="mb-2 text-sm font-semibold text-slate-700">Foto Laporan</p>
                <img
                  src={taskDetails.report.photo_url}
                  alt="Report"
                  className="max-h-48 rounded-xl object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=Foto+Tidak+Tersedia';
                  }}
                />
              </div>
            )}

            {/* Update Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              {/* Status Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Status Pekerjaan</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Catatan Lapangan</label>
                <textarea
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Tambahkan catatan tentang progress pekerjaan..."
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Foto Progress</label>
                <div className="mt-2">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="max-h-48 rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUpdatePhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute right-2 top-2 rounded-lg bg-rose-500 p-2 text-white hover:bg-rose-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 transition hover:border-cyan-400">
                      <Upload size={20} className="text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Pilih foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>

            {/* Progress History */}
            {taskDetails.progressHistory && taskDetails.progressHistory.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-700">Riwayat Progress</h3>
                <div className="mt-4 space-y-3">
                  {taskDetails.progressHistory.map((progress) => (
                    <div key={progress.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold text-${getStatusColor(progress.status)}-700 uppercase`}>
                          {getStatusLabel(progress.status)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(progress.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {progress.notes && (
                        <p className="mt-2 text-sm text-slate-700">{progress.notes}</p>
                      )}
                      {progress.photo_url && (
                        <a
                          href={progress.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-600 hover:underline"
                        >
                          <ImageIcon size={12} />
                          Lihat Foto
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
