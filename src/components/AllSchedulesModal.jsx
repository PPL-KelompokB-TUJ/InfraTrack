import React, { useState, useMemo } from 'react';
import { X, Calendar, MapPin, Search } from 'lucide-react';

const statusLabelStyles = {
  pending: 'border-slate-200 bg-slate-100 text-slate-700',
  scheduled: 'border-purple-200 bg-purple-100 text-purple-700',
  assigned: 'border-primary/20 bg-primary/10 text-primary',
  in_progress: 'border-amber-200 bg-amber-100 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-100 text-rose-700',
};

const statusLabels = {
  pending: 'Pending',
  scheduled: 'Dijadwalkan',
  assigned: 'Ditugaskan',
  in_progress: 'Sedang Dikerjakan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const getPriorityStyle = (level) => {
  switch (level?.toLowerCase()) {
    case 'sangat tinggi':
    case 'sangat_tinggi':
      return { badge: 'bg-rose-100 text-rose-700' };
    case 'tinggi':
      return { badge: 'bg-orange-100 text-orange-700' };
    case 'sedang':
      return { badge: 'bg-emerald-100 text-emerald-700' };
    default:
      return { badge: 'bg-sky-100 text-sky-700' };
  }
};

export default function AllSchedulesModal({ isOpen, onClose, tasks, onViewDetail }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!startDate && !endDate) return true;
      const taskDate = new Date(task.scheduled_date);
      taskDate.setHours(0, 0, 0, 0);

      let start = null;
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      }

      let end = null;
      if (endDate) {
        end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
      }

      if (start && end) {
        return taskDate >= start && taskDate <= end;
      } else if (start) {
        return taskDate >= start;
      } else if (end) {
        return taskDate <= end;
      }
      return true;
    }).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  }, [tasks, startDate, endDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative flex w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl h-[85vh] max-h-[800px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Semua Jadwal Pemeliharaan</h2>
              <p className="text-sm text-slate-500">Lihat dan saring seluruh jadwal penugasan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Section */}
        <div className="border-b border-slate-100 bg-primary/5/50 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex sm:self-end">
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-primary/5"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-primary/5/30">
          {filteredTasks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Tidak Ada Jadwal</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Tidak ditemukan jadwal penugasan pada rentang tanggal yang dipilih.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => {
                const urgency = task.report?.urgency_level || 'rendah';
                const style = getPriorityStyle(urgency);

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      onViewDetail(task.id);
                      onClose();
                    }}
                    className="flex flex-col glass-card border-none rounded-2xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${style.badge}`}>
                          {urgency}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusLabelStyles[task.status] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                          {statusLabels[task.status] || task.status}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-600 whitespace-nowrap ml-2 bg-slate-100 px-2 py-1 rounded-lg">
                        {new Date(task.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base mb-2 line-clamp-2 leading-tight">
                      {task.asset?.name || task.report?.damage_type_name || 'Tugas Pemeliharaan'}
                    </h3>

                    <div className="flex items-start gap-2 text-slate-500 mb-4 flex-1">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="text-xs line-clamp-2">
                        {task.report?.latitude && task.report?.longitude
                          ? `${task.report.latitude}, ${task.report.longitude}`
                          : task.report?.location_description || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assigned_officer?.email || 'user'}`}
                          alt="Officer"
                          className="w-7 h-7 rounded-full bg-slate-100"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            {task.assigned_officer?.name || 'Unassigned'}
                          </p>
                          <p className="text-[10px] text-slate-400">Teknisi</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">
                        #{task.report?.ticket_code?.split('-')[2] || 'TICKET'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
