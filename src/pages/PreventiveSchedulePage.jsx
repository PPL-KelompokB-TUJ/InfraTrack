import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Clock3,
  Plus, Search, X, Trash2, Edit3, Ban, MapPin,
} from 'lucide-react';
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
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const STATUS_COLORS = {
  scheduled: { bg: '#ffd9e6', border: '#805062', text: '#522b3b' },
  overdue:   { bg: '#ffdad6', border: '#ba1a1a', text: '#410002' },
  completed: { bg: '#f3e1e6', border: '#705760', text: '#46333c' },
  cancelled: { bg: '#ebdce0', border: '#857379', text: '#5b4a50' },
};

const statusStyles = {
  scheduled: 'border-primary/20 bg-primary-container text-on-primary-container',
  overdue: 'border-error/20 bg-error-container text-on-error-container',
  completed: 'border-secondary/20 bg-secondary-container text-on-secondary-container',
  cancelled: 'border-surface-variant bg-surface-variant/50 text-on-surface-variant',
};
const statusLabels = {
  scheduled: 'Terjadwal',
  overdue: 'Overdue',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const STATUS_BADGE = {
  scheduled: 'bg-primary-container text-on-primary-container',
  overdue:   'bg-error-container text-on-error-container',
  completed: 'bg-secondary-container text-on-secondary-container',
  cancelled: 'bg-surface-variant text-on-surface-variant',
};

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PreventiveSchedulePage() {
  const { addNotification } = useNotification();
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assetFilter, setAssetFilter] = useState('');

  // Calendar states
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals
  const [formModal, setFormModal] = useState({ open: false, editData: null });
  const [detailModal, setDetailModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, action: '' });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const assetsData = await getInfrastructureAssets();
      setAssets(assetsData);
    } catch (err) {
      addNotification('Gagal memuat daftar aset: ' + (err.message || ''), 'error');
    }
    try {
      const schedulesData = await getPreventiveSchedules();
      setSchedules(schedulesData);
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

  // Upcoming schedules for sidebar
  const upcomingSchedules = useMemo(() => {
    return [...filtered]
      .filter(s => s.status === 'scheduled' || s.status === 'overdue')
      .sort((a, b) => new Date(a.next_due) - new Date(b.next_due))
      .slice(0, 5);
  }, [filtered]);

  // Calendar events
  const events = useMemo(() => filtered.map((s) => ({
    id: s.id,
    title: s.title || 'Jadwal',
    start: new Date(s.next_due + 'T00:00:00'),
    end: new Date(s.next_due + 'T23:59:59'),
    allDay: true,
    resource: s,
  })), [filtered]);

  const eventStyleGetter = useCallback((event) => {
    const s = event.resource;
    const colors = STATUS_COLORS[s.status] || STATUS_COLORS.scheduled;
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        color: colors.text,
        border: 'none',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 4px',
        opacity: 0.9,
      },
    };
  }, []);

  const CustomEvent = ({ event }) => {
    const s = event.resource;
    return (
      <div className="flex flex-col overflow-hidden leading-tight">
        <span className="font-bold truncate">{s.title}</span>
        <span className="text-[9px] truncate font-medium opacity-80 mt-0.5">
          {s.asset?.name || 'Aset'}
        </span>
      </div>
    );
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
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-2 mb-1">
            <span>Ruang Kerja</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">Jadwal Preventif</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Jadwal Pemeliharaan Preventif
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
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
            />
          </div>
          <button
            onClick={() => setFormModal({ open: true, editData: null })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:brightness-90 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Jadwal Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card border-none rounded-xl p-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aset</label>
            <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}
              className="glass-card border-none rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none w-40 focus:border-primary">
              <option value="">Semua Aset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-card border-none rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none w-40 focus:border-primary">
              <option value="">Semua Status</option>
              <option value="scheduled">Terjadwal</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Frekuensi</label>
            <select className="glass-card border-none rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none w-40 focus:border-primary">
              <option value="">Semua Frekuensi</option>
            </select>
          </div>
        </div>
        <div className="flex bg-[#f1f5f9] p-1 rounded-lg border border-slate-200">
          <button onClick={() => setCalendarView('month')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${calendarView === 'month' ? 'glass-card shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            Bulanan
          </button>
          <button onClick={() => setCalendarView('week')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${calendarView === 'week' ? 'glass-card shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            Mingguan
          </button>
          <button onClick={() => setCalendarView('day')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${calendarView === 'day' ? 'glass-card shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            Harian
          </button>
        </div>
      </div>

      {/* Main Content: Calendar + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="glass-card rounded- border-none p-6 shadow-sm h-[700px] w-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {moment(currentDate).format('MMMM YYYY')}
              </h2>
              <div className="flex items-center gap-2 text-slate-700">
                <button onClick={() => handleNavigate('TODAY')} className="px-3 py-1 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/20 mr-2">
                  Hari Ini
                </button>
                <button onClick={() => handleNavigate('PREV')} className="p-1 hover:text-primary transition font-bold">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button onClick={() => handleNavigate('NEXT')} className="p-1 hover:text-primary transition font-bold">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
                </div>
              ) : (
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  eventPropGetter={eventStyleGetter}
                  components={{ event: CustomEvent }}
                  date={currentDate}
                  onNavigate={() => {}}
                  view={calendarView}
                  onView={setCalendarView}
                  onSelectEvent={(event) => openDetail(event.resource)}
                  toolbar={false}
                  messages={{ showMore: total => `+${total} lagi` }}
                  className="custom-calendar-theme"
                  formats={{
                    weekdayFormat: (date) => {
                      const days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
                      return days[date.getDay()];
                    }
                  }}
                />
              )}
            </div>
            <style>{`
              .custom-calendar-theme { font-family: 'Inter', sans-serif; }
              .custom-calendar-theme .rbc-month-view { border: 1px solid #f1f5f9; border-radius: 8px; overflow: hidden; }
              .custom-calendar-theme .rbc-month-row { border-top: 1px solid #f1f5f9; }
              .custom-calendar-theme .rbc-header { border-bottom: 1px solid #f1f5f9; border-left: 1px solid #f1f5f9; padding: 12px 0; font-weight: 600; color: #64748b; font-size: 11px; text-transform: uppercase; background-color: #f8fafc; }
              .custom-calendar-theme .rbc-header:first-child { border-left: none; }
              .custom-calendar-theme .rbc-day-bg { border-left: 1px solid #f1f5f9; }
              .custom-calendar-theme .rbc-day-bg:first-child { border-left: none; }
              .custom-calendar-theme .rbc-date-cell { padding: 8px; font-weight: 500; color: #475569; text-align: left; font-size: 12px; }
              .custom-calendar-theme .rbc-off-range-bg { background-color: #ffffff; }
              .custom-calendar-theme .rbc-today { background-color: #ffffff; }
              .custom-calendar-theme .rbc-today .rbc-date-cell { color: #805062; font-weight: 800; }
              .custom-calendar-theme .rbc-event { box-shadow: none; margin-bottom: 2px; }
              .custom-calendar-theme .rbc-row-segment { padding: 0 4px; }
            `}</style>
          </div>
        </div>

        {/* Sidebar: Upcoming Schedules */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="glass-card rounded- border-none shadow-sm overflow-hidden h-[700px] flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Jadwal Mendatang</h2>
              <p className="text-xs text-slate-500 mt-1">Daftar pemeliharaan preventif terdekat</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {upcomingSchedules.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Tidak ada jadwal mendatang</p>
                  <p className="text-xs text-slate-400 mt-1">Semua jadwal telah diselesaikan</p>
                </div>
              ) : (
                upcomingSchedules.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openDetail(s)}
                    className="glass-card border-none rounded-xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${STATUS_BADGE[s.status]}`}>
                        {statusLabels[s.status]}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {fmtDate(s.next_due)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">
                      {s.title}
                    </h3>
                    <div className="flex items-start gap-1.5 text-slate-500 mb-4">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="text-xs line-clamp-2">{s.asset?.name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        Setiap {s.frequency_days} hari
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-primary/5/50">
              <button className="w-full py-2.5 bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] rounded-lg text-sm font-semibold transition-colors">
                Lihat Semua Jadwal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
          <div className="glass-panel fade-slide-in max-h-[92vh] w-full max-w-xl overflow-auto rounded-3xl">
            <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
              <h2 className="text-xl font-extrabold text-slate-800">Detail Jadwal Preventif</h2>
              <button type="button" onClick={() => setDetailModal(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-primary/5 hover:text-slate-600">
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
            <div className="flex flex-wrap gap-2 border-t border-primary/10 px-6 py-4">
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
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5">
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
                className="ml-auto rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-primary/5">
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
