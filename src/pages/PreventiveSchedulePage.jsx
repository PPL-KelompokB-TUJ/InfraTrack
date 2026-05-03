import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Calendar as CalendarIcon, CheckCircle2, Clock3,
  Filter, List, Plus, Search, X, Trash2, Edit3, Ban,
} from 'lucide-react';
import PreventiveCalendar from '../components/PreventiveCalendar';
import PreventiveScheduleFormModal from '../components/PreventiveScheduleFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNotification } from '../context/NotificationContext';
import { getInfrastructureAssets } from '../lib/infrastructureAssetsService';
import {
  getPreventiveSchedules,
  completePreventiveSchedule,
  cancelPreventiveSchedule,
  deletePreventiveSchedule,
  createPreventiveSchedule,
  updatePreventiveSchedule,
  triggerReminderCheck,
} from '../lib/preventiveScheduleService';

const statusStyles = {
  scheduled: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  overdue: 'border-rose-200 bg-rose-100 text-rose-700',
  completed: 'border-slate-200 bg-slate-100 text-slate-600',
  cancelled: 'border-slate-200 bg-slate-50 text-slate-400',
};
const statusLabels = {
  scheduled: 'Terjadwal',
  overdue: 'Overdue',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};
const statusIcons = {
  scheduled: Clock3,
  overdue: AlertCircle,
  completed: CheckCircle2,
  cancelled: Ban,
};

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PreventiveSchedulePage() {
  const { addNotification } = useNotification();
  const [tab, setTab] = useState('calendar');
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assetFilter, setAssetFilter] = useState('');

  // Modals
  const [formModal, setFormModal] = useState({ open: false, editData: null });
  const [detailModal, setDetailModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, action: '' });

  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Load assets independently — must always succeed for the form dropdown
    try {
      const assetsData = await getInfrastructureAssets();
      setAssets(assetsData);
    } catch (err) {
      addNotification('Gagal memuat daftar aset: ' + (err.message || ''), 'error');
    }

    // Load schedules separately so asset loading is not blocked
    try {
      const schedulesData = await getPreventiveSchedules();
      setSchedules(schedulesData);
      // Client-side reminder trigger on page load
      triggerReminderCheck();
    } catch (err) {
      addNotification(err.message || 'Gagal memuat jadwal', 'error');
    }

    setIsLoading(false);
  }, [addNotification]);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered list
  const filtered = useMemo(() => schedules.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || s.title?.toLowerCase().includes(q) || s.asset?.name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    const matchAsset = !assetFilter || s.asset_id === assetFilter;
    return matchSearch && matchStatus && matchAsset;
  }), [schedules, searchQuery, statusFilter, assetFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: schedules.length,
    scheduled: schedules.filter((s) => s.status === 'scheduled').length,
    overdue: schedules.filter((s) => s.status === 'overdue').length,
    completed: schedules.filter((s) => s.status === 'completed').length,
  }), [schedules]);

  // Handlers
  async function handleSave(formData) {
    setIsSaving(true);
    try {
      if (formModal.editData) {
        await updatePreventiveSchedule(formModal.editData.id, formData);
        addNotification('Jadwal berhasil diperbarui', 'success');
      } else {
        await createPreventiveSchedule(formData);
        addNotification('Jadwal preventif berhasil dibuat', 'success');
      }
      setFormModal({ open: false, editData: null });
      await loadData();
    } catch (err) {
      addNotification(err.message || 'Gagal menyimpan', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleComplete(id) {
    try {
      await completePreventiveSchedule(id);
      addNotification('Jadwal ditandai selesai & jadwal berikutnya dibuat otomatis', 'success');
      setDetailModal(null);
      await loadData();
    } catch (err) {
      addNotification(err.message || 'Gagal menyelesaikan jadwal', 'error');
    }
  }

  async function handleCancel(id) {
    try {
      await cancelPreventiveSchedule(id);
      addNotification('Jadwal dibatalkan', 'success');
      setDetailModal(null);
      await loadData();
    } catch (err) {
      addNotification(err.message || 'Gagal membatalkan jadwal', 'error');
    }
  }

  async function confirmDelete() {
    try {
      await deletePreventiveSchedule(confirmModal.id);
      addNotification('Jadwal dihapus', 'success');
      setConfirmModal({ open: false, id: null, action: '' });
      setDetailModal(null);
      await loadData();
    } catch (err) {
      addNotification(err.message || 'Gagal menghapus', 'error');
    }
  }

  function openDetail(schedule) {
    setDetailModal(schedule);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="glass-panel fade-slide-in rounded-3xl p-6 sm:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              InfraTrack / Administrator
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-800">
              Jadwal Pemeliharaan Preventif
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Kelola jadwal pemeliharaan rutin berdasarkan periode atau kondisi aset.
            </p>
          </div>
          <button type="button" onClick={() => setFormModal({ open: true, editData: null })}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110">
            <Plus className="h-4 w-4" /> Buat Jadwal
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', val: stats.total, color: 'text-slate-800' },
            { label: 'Terjadwal', val: stats.scheduled, color: 'text-emerald-700' },
            { label: 'Overdue', val: stats.overdue, color: 'text-rose-700' },
            { label: 'Selesai', val: stats.completed, color: 'text-slate-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-cyan-100 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button onClick={() => setTab('calendar')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'calendar'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md'
                : 'bg-white border border-cyan-100 text-slate-700 hover:bg-cyan-50'
            }`}>
            <CalendarIcon className="h-4 w-4" /> Kalender
          </button>
          <button onClick={() => setTab('list')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'list'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md'
                : 'bg-white border border-cyan-100 text-slate-700 hover:bg-cyan-50'
            }`}>
            <List className="h-4 w-4" /> Daftar & Riwayat
          </button>
        </div>

        {/* Calendar Tab */}
        {tab === 'calendar' && <PreventiveCalendar onSelectEvent={openDetail} />}

        {/* List Tab */}
        {tab === 'list' && (
          <>
            {/* Filters */}
            <div className="mb-4 rounded-2xl border border-cyan-100 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input type="text" placeholder="Cari judul atau aset..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-cyan-100 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-400" />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-cyan-100 px-3 py-2.5 text-sm outline-none focus:border-cyan-400">
                    <option value="">Semua Status</option>
                    <option value="scheduled">Terjadwal</option>
                    <option value="overdue">Overdue</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                  <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}
                    className="rounded-xl border border-cyan-100 px-3 py-2.5 text-sm outline-none focus:border-cyan-400">
                    <option value="">Semua Aset</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="rounded-2xl border border-cyan-100 bg-white px-4 py-10 text-center text-sm text-slate-500">
                Memuat data jadwal...
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-white">
                {filtered.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada jadwal</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-cyan-100 text-sm">
                      <thead className="bg-cyan-50/70 text-left text-xs uppercase tracking-wide text-cyan-800">
                        <tr>
                          <th className="px-4 py-3">Judul</th>
                          <th className="px-4 py-3">Aset</th>
                          <th className="px-4 py-3">Frekuensi</th>
                          <th className="px-4 py-3">Terakhir</th>
                          <th className="px-4 py-3">Jatuh Tempo</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-50">
                        {filtered.map((s) => {
                          const Icon = statusIcons[s.status] || AlertCircle;
                          return (
                            <tr key={s.id} className="transition hover:bg-cyan-50/30">
                              <td className="px-4 py-3 font-semibold text-slate-700">{s.title}</td>
                              <td className="px-4 py-3 text-slate-700">{s.asset?.name || '-'}</td>
                              <td className="px-4 py-3 text-slate-600">{s.frequency_days} hari</td>
                              <td className="px-4 py-3 text-slate-600">{fmtDate(s.last_done)}</td>
                              <td className="px-4 py-3 text-slate-700 font-medium">{fmtDate(s.next_due)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[s.status]}`}>
                                  <Icon className="h-3.5 w-3.5" />
                                  {statusLabels[s.status]}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button type="button" onClick={() => openDetail(s)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50">
                                    Detail
                                  </button>
                                  {s.status === 'scheduled' || s.status === 'overdue' ? (
                                    <button type="button" onClick={() => handleComplete(s.id)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                                    </button>
                                  ) : null}
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
          </>
        )}
      </section>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
          <div className="glass-panel fade-slide-in max-h-[92vh] w-full max-w-xl overflow-auto rounded-3xl">
            <div className="flex items-center justify-between border-b border-cyan-100 px-6 py-5">
              <h2 className="text-xl font-extrabold text-slate-800">Detail Jadwal Preventif</h2>
              <button type="button" onClick={() => setDetailModal(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-cyan-50 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Judul</p>
                <p className="mt-1 text-slate-700 font-semibold">{detailModal.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aset</p>
                <p className="mt-1 text-slate-700">{detailModal.asset?.name || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frekuensi</p>
                  <p className="mt-1 text-slate-700">{detailModal.frequency_days} hari</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[detailModal.status]}`}>
                    {statusLabels[detailModal.status]}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Terakhir Dilakukan</p>
                  <p className="mt-1 text-slate-700">{fmtDate(detailModal.last_done)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jatuh Tempo</p>
                  <p className="mt-1 text-slate-700 font-semibold">{fmtDate(detailModal.next_due)}</p>
                </div>
              </div>
              {detailModal.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deskripsi</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700">{detailModal.description}</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-cyan-100 px-6 py-4">
              {(detailModal.status === 'scheduled' || detailModal.status === 'overdue') && (
                <>
                  <button type="button" onClick={() => handleComplete(detailModal.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Tandai Selesai
                  </button>
                  <button type="button" onClick={() => {
                    setDetailModal(null);
                    setFormModal({ open: true, editData: detailModal });
                  }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50">
                    <Edit3 className="h-4 w-4" /> Edit
                  </button>
                  <button type="button" onClick={() => handleCancel(detailModal.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50">
                    <Ban className="h-4 w-4" /> Batalkan
                  </button>
                </>
              )}
              <button type="button" onClick={() => {
                setConfirmModal({ open: true, id: detailModal.id, action: 'delete' });
              }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
                <Trash2 className="h-4 w-4" /> Hapus
              </button>
              <button type="button" onClick={() => setDetailModal(null)}
                className="ml-auto rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <PreventiveScheduleFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, editData: null })}
        onSubmit={handleSave}
        isSaving={isSaving}
        assets={assets}
        editData={formModal.editData}
      />

      <ConfirmationModal
        isOpen={confirmModal.open}
        title="Hapus Jadwal?"
        message="Jadwal yang dihapus tidak dapat dikembalikan."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ open: false, id: null, action: '' })}
      />
    </main>
  );
}
