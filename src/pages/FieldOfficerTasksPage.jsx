import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Eye, Loader2, RefreshCw } from 'lucide-react';
import UpdateTaskStatusModal from '../components/UpdateTaskStatusModal';
import MaintenanceLogsTimeline from '../components/MaintenanceLogsTimeline';
import {
  getMaintenanceTasksByOfficer,
  getMaintenanceLogsForTask,
  updateTaskStatusWithLog,
  uploadMaintenanceProgressPhoto,
  getMaintenanceTaskById,
} from '../lib/maintenanceTaskService';
import { getCurrentSession } from '../lib/authService';

const statusLabelStyles = {
  assigned: 'border-cyan-200 bg-cyan-100 text-cyan-700',
  in_progress: 'border-amber-200 bg-amber-100 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-100 text-emerald-700',
};

const statusLabels = {
  assigned: 'Ditugaskan',
  in_progress: 'Sedang Dikerjakan',
  completed: 'Selesai',
};

const statusIcons = {
  assigned: Clock3,
  in_progress: Clock3,
  completed: CheckCircle2,
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function FieldOfficerTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Modal states
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [taskLogs, setTaskLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Load current user and tasks
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Get current authenticated user session
      const session = await getCurrentSession();
      const user = session?.user;
      if (!user) {
        throw new Error('Tidak dapat memuat informasi pengguna');
      }
      setCurrentUser(user);

      // Get tasks assigned to this officer
      const tasksData = await getMaintenanceTasksByOfficer(user.id);
      setTasks(tasksData);
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memuat penugasan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load logs for selected task
  const loadTaskLogs = useCallback(async (taskId) => {
    setIsLoadingLogs(true);
    try {
      const logs = await getMaintenanceLogsForTask(taskId);
      setTaskLogs(logs);
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memuat log aktivitas');
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Open detail modal for a task
  const handleOpenDetailModal = async (task) => {
    setSelectedTaskDetails(task);
    setDetailModalOpen(true);
    await loadTaskLogs(task.id);
  };

  // Open update status modal
  const handleOpenUpdateModal = (task) => {
    setSelectedTask(task);
    setIsUpdateModalOpen(true);
  };

  // Handle status update
  const handleUpdateStatus = async (updateData) => {
    if (!selectedTask) return;

    setIsUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let photoUrl = null;

      // Upload photo if provided
      if (updateData.photo && currentUser) {
        photoUrl = await uploadMaintenanceProgressPhoto(
          updateData.photo,
          selectedTask.id,
          currentUser.id
        );
      }

      // Map status for log: radio button values to log status values
      const logStatusMap = {
        started: 'started',
        in_progress: 'in_progress',
        completed: 'completed',
      };

      // Update task status and create log
      const result = await updateTaskStatusWithLog(
        selectedTask.id,
        updateData.status,
        currentUser.id,
        {
          logStatus: logStatusMap[updateData.status],
          notes: updateData.notes,
          photo_url: photoUrl,
        }
      );

      setSuccessMessage('Status pekerjaan berhasil diperbarui');

      // Reload tasks
      await loadData();
      setIsUpdateModalOpen(false);
      setSelectedTask(null);

      // Reload logs if detail modal is open
      if (detailModalOpen && selectedTaskDetails) {
        await loadTaskLogs(selectedTaskDetails.id);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memperbarui status pekerjaan');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Penugasan Saya</h1>
            <p className="text-slate-600 mt-1">
              {currentUser?.name ? `Selamat datang, ${currentUser.name}` : ''}
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-700">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="mx-auto text-slate-400 mb-3" size={48} />
            <p className="text-slate-600 text-lg">Tidak ada penugasan untuk Anda saat ini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const StatusIcon = statusIcons[task.status] || Clock3;

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Task Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <StatusIcon
                            size={20}
                            className={
                              task.status === 'completed'
                                ? 'text-emerald-600'
                                : task.status === 'in_progress'
                                  ? 'text-amber-600'
                                  : 'text-cyan-600'
                            }
                          />
                          <span
                            className={`text-sm font-semibold px-3 py-1 rounded-full border ${statusLabelStyles[task.status] || 'border-slate-200 bg-slate-100 text-slate-700'}`}
                          >
                            {statusLabels[task.status] || task.status}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {task.asset?.name || 'Aset Tidak Ditemukan'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">
                              Tiket
                            </p>
                            <p className="font-medium text-slate-900">
                              {task.report?.ticket_code || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">
                              Jadwal
                            </p>
                            <p className="font-medium text-slate-900">
                              {formatDate(task.scheduled_date)}
                            </p>
                          </div>
                        </div>

                        {task.report?.description && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                              Deskripsi Kerusakan
                            </p>
                            <p className="text-sm text-slate-700">{task.report.description}</p>
                          </div>
                        )}

                        {task.instructions && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-700 uppercase tracking-wide mb-1 font-semibold">
                              Instruksi Pekerjaan
                            </p>
                            <p className="text-sm text-blue-900">{task.instructions}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleOpenDetailModal(task)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Eye size={18} />
                          <span className="hidden sm:inline">Detail</span>
                        </button>

                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleOpenUpdateModal(task)}
                            disabled={isUpdating}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                <span className="hidden sm:inline">Updating...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={18} />
                                <span className="hidden sm:inline">Update Status</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {isUpdateModalOpen && selectedTask && (
        <UpdateTaskStatusModal
          task={selectedTask}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setSelectedTask(null);
          }}
          onSubmit={handleUpdateStatus}
          isLoading={isUpdating}
        />
      )}

      {/* Task Detail Modal with Logs */}
      {detailModalOpen && selectedTaskDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-slate-900">Detail Penugasan</h2>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Task Summary */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Ringkasan Pekerjaan</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <div>
                    <span className="text-slate-600">Aset:</span>{' '}
                    <span className="font-medium">{selectedTaskDetails.asset?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Tiket:</span>{' '}
                    <span className="font-medium">{selectedTaskDetails.report?.ticket_code}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Status:</span>{' '}
                    <span className="font-medium">
                      {statusLabels[selectedTaskDetails.status] || selectedTaskDetails.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Jadwal:</span>{' '}
                    <span className="font-medium">
                      {formatDate(selectedTaskDetails.scheduled_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Timeline Aktivitas</h3>
                <MaintenanceLogsTimeline logs={taskLogs} isLoading={isLoadingLogs} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
