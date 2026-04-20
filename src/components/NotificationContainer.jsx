import { useNotification } from '../context/NotificationContext';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  const getIconAndStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          iconColor: 'text-green-600',
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          iconColor: 'text-red-600',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-900',
          iconColor: 'text-yellow-600',
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {notifications.map((notification) => {
        const styles = getIconAndStyles(notification.type);
        const Icon = styles.icon;

        return (
          <div
            key={notification.id}
            className={`
              ${styles.bgColor}
              ${styles.borderColor}
              ${styles.textColor}
              border rounded-lg shadow-lg p-4 flex gap-3 items-start
              animate-fadeInSlideIn pointer-events-auto
              max-w-sm
            `}
          >
            {/* Icon */}
            <Icon className={`flex-shrink-0 w-5 h-5 mt-0.5 ${styles.iconColor}`} />

            {/* Message */}
            <div className="flex-1 font-medium text-sm">{notification.message}</div>

            {/* Close Button */}
            <button
              onClick={() => removeNotification(notification.id)}
              className={`flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
