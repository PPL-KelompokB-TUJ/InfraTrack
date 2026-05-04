import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getPreventiveSchedulesCalendar } from '../lib/preventiveScheduleService';
import { useNotification } from '../context/NotificationContext';

const localizer = momentLocalizer(moment);

const STATUS_COLORS = {
  scheduled: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
  overdue: { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c' },
  completed: { bg: '#f1f5f9', border: '#94a3b8', text: '#64748b' },
  cancelled: { bg: '#f1f5f9', border: '#cbd5e1', text: '#94a3b8' },
};

function getDueSoonColor() {
  return { bg: '#fef9c3', border: '#ca8a04', text: '#a16207' };
}

function isDueSoon(nextDue) {
  const now = new Date();
  const due = new Date(nextDue);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

export default function PreventiveCalendar({ onSelectEvent }) {
  const { addNotification } = useNotification();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  });

  const loadCalendar = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPreventiveSchedulesCalendar(range.start, range.end);
      setSchedules(data);
    } catch (err) {
      addNotification(err.message || 'Gagal memuat kalender', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [range, addNotification]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const events = useMemo(() => schedules.map((s) => ({
    id: s.id,
    title: `${s.title} — ${s.asset?.name || 'Aset'}`,
    start: new Date(s.next_due + 'T00:00:00'),
    end: new Date(s.next_due + 'T23:59:59'),
    allDay: true,
    resource: s,
  })), [schedules]);

  const eventStyleGetter = useCallback((event) => {
    const s = event.resource;
    let colors = STATUS_COLORS[s.status] || STATUS_COLORS.scheduled;
    if (s.status === 'scheduled' && isDueSoon(s.next_due)) {
      colors = getDueSoonColor();
    }
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        color: colors.text,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        padding: '2px 6px',
      },
    };
  }, []);

  const handleRangeChange = useCallback((newRange) => {
    let start, end;
    if (Array.isArray(newRange)) {
      start = newRange[0];
      end = newRange[newRange.length - 1];
    } else {
      start = newRange.start;
      end = newRange.end;
    }
    setRange({
      start: new Date(start).toISOString().slice(0, 10),
      end: new Date(end).toISOString().slice(0, 10),
    });
  }, []);

  const handleSelectEvent = useCallback((event) => {
    if (onSelectEvent) onSelectEvent(event.resource);
  }, [onSelectEvent]);

  const [currentDate, setCurrentDate] = useState(new Date());

  const handleNavigate = useCallback((newDate) => {
    setCurrentDate(newDate);
  }, []);

  return (
    <div className="rounded-2xl border border-cyan-100 bg-white p-4">
      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-green-600 bg-green-100" />
          Terjadwal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-yellow-600 bg-yellow-100" />
          Segera (≤3 hari)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-red-600 bg-red-100" />
          Overdue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-slate-400 bg-slate-100" />
          Selesai
        </span>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-[2px]">
            <span className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-md">Memuat kalender...</span>
          </div>
        )}
        <div style={{ height: 560 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={eventStyleGetter}
            onRangeChange={handleRangeChange}
            onSelectEvent={handleSelectEvent}
            date={currentDate}
            onNavigate={handleNavigate}
            views={['month', 'week']}
            defaultView="month"
            messages={{
              today: 'Hari Ini',
              previous: '◀',
              next: '▶',
              month: 'Bulan',
              week: 'Minggu',
              noEventsInRange: 'Tidak ada jadwal di periode ini.',
            }}
            popup
          />
        </div>
      </div>
    </div>
  );
}
