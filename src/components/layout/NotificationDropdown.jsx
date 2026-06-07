import { useNavigate } from 'react-router-dom';
import { useInAppNotification } from '../../context/NotificationContext';
import { cn } from '../../lib/utils';

export default function NotificationDropdown({ onClose, align = 'right' }) {
  const { inAppNotifications, markAsRead, markAllAsRead } = useInAppNotification();
  const navigate = useNavigate();

  const handleNotificationClick = async (notif) => {
    // 1. Mark as read
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    
    // 2. Redirect based on type
    if (notif.type === 'new_report') {
      navigate('/dashboard/reports');
    } else if (notif.type === 'maintenance_assigned') {
      navigate('/dashboard/my-tasks');
    } else if (notif.type === 'preventive_reminder' || notif.type === 'preventive_overdue') {
      navigate('/dashboard/preventive');
    } else if (notif.type === 'task_completed') {
      navigate('/dashboard/maintenance');
    }
    
    // 3. Close dropdown
    if (onClose) onClose();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_report':
        return { symbol: 'report_problem', bg: 'bg-error-container text-on-error-container' };
      case 'maintenance_assigned':
        return { symbol: 'assignment_ind', bg: 'bg-primary-container text-on-primary-container' };
      case 'preventive_reminder':
      case 'preventive_overdue':
        return { symbol: 'event_note', bg: 'bg-secondary-container text-on-secondary-container' };
      case 'task_completed':
        return { symbol: 'check_circle', bg: 'bg-secondary-container text-on-secondary-container' };
      default:
        return { symbol: 'notifications', bg: 'bg-surface-variant text-on-surface-variant' };
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className={cn(
      "absolute mt-2 w-80 md:w-96 rounded-2xl border border-outline-variant bg-surface-container-low shadow-2xl z-50 flex flex-col max-h-[500px]",
      align === 'right' ? "right-0" : "left-0"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-outline-variant/30 bg-surface-container-high rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary font-bold">notifications</span>
          <h3 className="font-bold text-on-surface text-base">Notifikasi</h3>
        </div>
        {inAppNotifications.some((n) => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-primary hover:text-primary-hover hover:underline transition-colors"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/20 max-h-[380px]">
        {inAppNotifications.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant/60 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">notifications_off</span>
            <p className="text-sm font-medium">Tidak ada notifikasi baru</p>
          </div>
        ) : (
          inAppNotifications.map((notif) => {
            const iconData = getIcon(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "flex items-start gap-3 p-4 hover:bg-surface-container-high cursor-pointer transition-colors relative group",
                  !notif.is_read && "bg-primary-container/10"
                )}
              >
                {/* Icon wrapper */}
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm", iconData.bg)}>
                  <span className="material-symbols-outlined text-lg">{iconData.symbol}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-xs font-black truncate group-hover:text-primary transition-colors",
                      notif.is_read ? "text-on-surface-variant" : "text-on-surface"
                    )}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-on-surface-variant font-medium whitespace-nowrap">
                      {formatTime(notif.created_at)}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs mt-1 leading-relaxed line-clamp-2",
                    notif.is_read ? "text-on-surface-variant/70" : "text-on-surface-variant font-semibold"
                  )}>
                    {notif.message}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notif.is_read && (
                  <span className="absolute top-4 right-4 w-2 h-2 bg-error rounded-full" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-surface-container-high border-t border-outline-variant/30 text-center rounded-b-2xl">
        <button
          onClick={onClose}
          className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
