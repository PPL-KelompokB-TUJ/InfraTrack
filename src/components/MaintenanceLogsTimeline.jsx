import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const statusIcons = {
  started: Clock,
  in_progress: Clock,
  completed: CheckCircle2,
};

const statusLabels = {
  started: 'Mulai Dikerjakan',
  in_progress: 'Dalam Progres',
  completed: 'Selesai',
};

const statusColors = {
  started: 'text-amber-600 bg-amber-50 border-amber-200',
  in_progress: 'text-blue-600 bg-blue-50 border-blue-200',
  completed: 'text-green-600 bg-green-50 border-green-200',
};

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MaintenanceLogsTimeline({ logs, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-slate-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto text-slate-400 mb-2" size={32} />
        <p className="text-slate-600">Belum ada log aktivitas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log, index) => {
        const StatusIcon = statusIcons[log.status] || Clock;

        return (
          <div key={log.id} className="relative">
            {/* Timeline connector */}
            {index < logs.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-slate-200"></div>
            )}

            {/* Log entry card */}
            <div className="flex gap-4">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${statusColors[log.status] || 'text-slate-600 bg-slate-50 border-slate-200'}`}
              >
                <StatusIcon size={20} />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                {/* Status badge */}
                <div className="inline-block">
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full border ${statusColors[log.status] || 'text-slate-700 bg-slate-100 border-slate-200'}`}
                  >
                    {statusLabels[log.status] || log.status}
                  </span>
                </div>

                {/* Officer and time */}
                <div className="mt-2 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">{log.officer?.name || 'Petugas'}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(log.logged_at)}</p>
                </div>

                {/* Notes */}
                {log.notes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700">{log.notes}</p>
                  </div>
                )}

                {/* Photo */}
                {log.photo_url && (
                  <div className="mt-3">
                    <img
                      src={log.photo_url}
                      alt="Progress photo"
                      className="max-w-sm w-full h-auto rounded-lg border border-slate-200 hover:cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        // Open image in fullscreen
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4';
                        modal.innerHTML = `
                          <img src="${log.photo_url}" alt="Full size photo" class="max-w-2xl max-h-96 rounded-lg" />
                        `;
                        modal.onclick = () => modal.remove();
                        document.body.appendChild(modal);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
