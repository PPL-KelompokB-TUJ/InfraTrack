import { useNavigate } from 'react-router-dom';
import { useInAppNotification } from '../../context/NotificationContext';

export default function NotificationBell({ align = 'right' }) {
  const { unreadCount } = useInAppNotification();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => navigate('/dashboard/notifications')}
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors relative active:scale-95 duration-150"
        title="Lihat Notifikasi"
      >
        <span className="material-symbols-outlined text-[24px] text-on-surface">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-error text-on-error text-[10px] font-black px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center border-2 border-surface-container shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
