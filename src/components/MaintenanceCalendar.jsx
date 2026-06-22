import React, { useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '../lib/utils';

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

const PRIORITIES = {
  rendah: { bg: 'bg-[#e0f2fe]', text: 'text-[#0284c7]', border: 'border-l-[#0284c7]' },
  sedang: { bg: 'bg-[#dcfce7]', text: 'text-[#15803d]', border: 'border-l-[#15803d]' },
  tinggi: { bg: 'bg-[#ffedd5]', text: 'text-[#c2410c]', border: 'border-l-[#c2410c]' },
  sangat_tinggi: { bg: 'bg-[#fee2e2]', text: 'text-[#b91c1c]', border: 'border-l-[#b91c1c]' },
};

export default function MaintenanceCalendar({ tasks, currentDate, onNavigate, onView, view, onTaskClick }) {
  // Map tasks to react-big-calendar event format
  const events = useMemo(() => {
    return tasks.map(task => {
      // Ensure we have a valid date
      const date = new Date(task.scheduled_date);
      const isInvalidDate = isNaN(date.getTime());
      
      const start = isInvalidDate ? new Date() : new Date(date.setHours(8, 0, 0, 0));
      const end = isInvalidDate ? new Date() : new Date(date.setHours(17, 0, 0, 0));

      return {
        id: task.id,
        title: task.report?.ticket_code || 'Tugas',
        start,
        end,
        allDay: true,
        resource: task,
      };
    });
  }, [tasks]);

  // Custom styling for events
  const eventStyleGetter = useCallback((event) => {
    const task = event.resource;
    const urgency = task.report?.urgency_level?.toLowerCase() || 'rendah';
    
    // Convert Tailwind classes to inline styles for react-big-calendar if needed
    // but react-big-calendar allows className returning in eventStyleGetter too!
    
    let bgColor = '#ebdce0';
    let borderLeftColor = '#857379';
    let textColor = '#5b4a50';

    if (urgency === 'sangat_tinggi' || urgency === 'sangat tinggi') {
      bgColor = '#ffdad6'; borderLeftColor = '#ba1a1a'; textColor = '#410002';
    } else if (urgency === 'tinggi') {
      bgColor = '#f3e1e6'; borderLeftColor = '#705760'; textColor = '#46333c';
    } else if (urgency === 'sedang') {
      bgColor = '#ffd9e6'; borderLeftColor = '#805062'; textColor = '#522b3b';
    }

    return {
      style: {
        backgroundColor: bgColor,
        border: 'none',
        borderLeft: `4px solid ${borderLeftColor}`,
        color: textColor,
        borderRadius: '4px',
        opacity: 0.9,
        display: 'block',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 4px',
      }
    };
  }, []);

  const CustomEvent = ({ event }) => {
    const task = event.resource;
    return (
      <div className="flex flex-col overflow-hidden leading-tight">
        <span className="font-bold truncate">{event.title}</span>
        <span className="text-[9px] truncate font-medium opacity-80 mt-0.5">
          {task.asset?.name || task.report?.damage_type_name || 'Infrastruktur'}
        </span>
        <span className="text-[9px] truncate opacity-70 mt-0.5">
          {task.assigned_officer?.name?.split(' ')[0] || 'Unassigned'}
        </span>
      </div>
    );
  };

  return (
    <div className="glass-card rounded- border-none p-6 shadow-sm h-[700px] w-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {moment(currentDate).format('MMMM YYYY')}
        </h2>
        <div className="flex items-center gap-2 text-slate-700">
          <button 
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/20 mr-2"
          >
            Hari Ini
          </button>
          <button 
            onClick={() => onNavigate('PREV')}
            className="p-1 hover:text-primary transition font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button 
            onClick={() => onNavigate('NEXT')}
            className="p-1 hover:text-primary transition font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
          }}
          date={currentDate}
          onNavigate={() => {}} // Controlled manually above
          view={view}
          onView={onView}
          onSelectEvent={(event) => onTaskClick && onTaskClick(event.id)}
          toolbar={false} // We hid the default toolbar to use our custom one
          messages={{
            showMore: total => `+${total} lagi`
          }}
          className="custom-calendar-theme"
          formats={{
            weekdayFormat: (date, culture, localizer) => {
              // Custom short days for MIN, SEN, SEL, RAB, KAM, JUM, SAB
              const days = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
              return days[date.getDay()];
            }
          }}
        />
      </div>
      
      {/* Custom styles for calendar overrides to match mockup */}
      <style>{`
        .custom-calendar-theme {
          font-family: 'Inter', sans-serif;
        }
        .custom-calendar-theme .rbc-month-view {
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          overflow: hidden;
        }
        .custom-calendar-theme .rbc-month-row {
          border-top: 1px solid #f1f5f9;
        }
        .custom-calendar-theme .rbc-header {
          border-bottom: 1px solid #f1f5f9;
          border-left: 1px solid #f1f5f9;
          padding: 12px 0;
          font-weight: 600;
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
          background-color: #f8fafc;
        }
        .custom-calendar-theme .rbc-header:first-child {
          border-left: none;
        }
        .custom-calendar-theme .rbc-day-bg {
          border-left: 1px solid #f1f5f9;
        }
        .custom-calendar-theme .rbc-day-bg:first-child {
          border-left: none;
        }
        .custom-calendar-theme .rbc-date-cell {
          padding: 8px;
          font-weight: 500;
          color: #475569;
          text-align: left;
          font-size: 12px;
        }
        .custom-calendar-theme .rbc-off-range-bg {
          background-color: #ffffff;
        }
        .custom-calendar-theme .rbc-off-range .rbc-date-cell {
          color: #cbd5e1;
        }
        .custom-calendar-theme .rbc-today {
          background-color: #ffffff;
        }
        .custom-calendar-theme .rbc-today .rbc-date-cell {
          color: #805062;
          font-weight: 800;
        }
        .custom-calendar-theme .rbc-event {
          box-shadow: none;
          margin-bottom: 2px;
        }
        .custom-calendar-theme .rbc-row-segment {
          padding: 0 4px;
        }
      `}</style>
    </div>
  );
}
