import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useInAppNotification } from '../context/NotificationContext';
import { Check, CheckCheck, Bell, Clock, Info, CheckCircle2, AlertTriangle, Hammer, Trash2, ListChecks, X, ArrowRight, CalendarClock, Ban, CalendarSync, PackageMinus } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingNotification, setViewingNotification] = useState(null);
  const { fetchUnreadCount } = useInAppNotification();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotifications(data || []);
      setSelectedIds(prev => prev.filter(id => (data || []).some(n => n.id === id)));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount(); // update the context badge
  }, [fetchNotifications, fetchUnreadCount]);

  // Polling only on this page every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchNotifications, fetchUnreadCount]);

  const markAsRead = async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state optimistic
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state optimistic
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', selectedIds)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notifications', error);
      alert(`Gagal menghapus notifikasi. (Error: ${error.message})`);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const handleNotificationClick = async (notif) => {
    if (isSelectionMode) {
      toggleSelection(notif.id);
      return;
    }

    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    
    // Buka pop-up pesan alih-alih langsung pindah halaman
    setViewingNotification(notif);
  };

  const handleActionClick = (notif) => {
    if (notif.type === 'new_report') {
      navigate('/dashboard/reports', { state: { openReportId: notif.related_id } });
    } else if (['task_assigned', 'task_scheduled', 'task_rescheduled', 'task_cancelled'].includes(notif.type)) {
      navigate('/dashboard/my-tasks', { state: { openTaskId: notif.related_id } });
    } else if (notif.type === 'task_completed' || notif.type === 'material_added') {
      navigate('/dashboard/maintenance', { state: { openTaskId: notif.related_id } });
    } else if (notif.type === 'preventive_reminder' || notif.type === 'preventive_overdue') {
      navigate('/dashboard/preventive');
    } else if (notif.type === 'low_stock') {
      navigate('/dashboard/inventory');
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'new_report': return <AlertTriangle className="text-orange-500" size={24} />;
      case 'task_assigned': return <Hammer className="text-blue-500" size={24} />;
      case 'task_scheduled': return <CalendarClock className="text-purple-500" size={24} />;
      case 'task_cancelled': return <Ban className="text-rose-500" size={24} />;
      case 'task_rescheduled': return <CalendarSync className="text-amber-500" size={24} />;
      case 'task_completed': return <CheckCircle2 className="text-emerald-500" size={24} />;
      case 'preventive_overdue': return <Clock className="text-red-500" size={24} />;
      case 'low_stock': return <PackageMinus className="text-rose-600" size={24} />;
      default: return <Info className="text-primary" size={24} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Bell size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Notifikasi</h1>
            <p className="text-slate-500 text-sm">Pemberitahuan aktivitas dan sistem ({unreadCount} belum dibaca)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedIds([]);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isSelectionMode ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ListChecks size={18} />
              {isSelectionMode ? 'Batal Pilih' : 'Pilih Multiple'}
            </button>
          )}

          {isSelectionMode && selectedIds.length > 0 && (
            <button 
              onClick={deleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 size={18} />
              {isDeleting ? 'Menghapus...' : `Hapus Terpilih (${selectedIds.length})`}
            </button>
          )}

          {!isSelectionMode && unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
            >
              <CheckCheck size={18} />
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-slate-200 overflow-hidden">
        {isSelectionMode && notifications.length > 0 && (
          <div className="bg-primary/5 px-5 py-3 border-b border-slate-200 flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={notifications.length > 0 && selectedIds.length === notifications.length}
              onChange={toggleAllSelection}
              className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
            />
            <span className="text-sm font-semibold text-slate-600">Pilih Semua</span>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Bell size={48} className="text-slate-200 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">Belum Ada Notifikasi</h3>
            <p className="text-sm">Anda sudah melihat semua pembaruan terbaru.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                className={`px-5 py-4 flex gap-4 items-start transition-all cursor-pointer hover:shadow-sm ${
                  selectedIds.includes(notif.id) ? 'bg-primary/5/50' : 
                  notif.is_read ? 'bg-white hover:bg-primary/5' : 'bg-primary/5/20 hover:bg-primary/5/60'
                }`}
              >
                <div className="flex-shrink-0 mt-1 flex items-center gap-3">
                  {isSelectionMode && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(notif.id)}
                        onChange={() => toggleSelection(notif.id)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
                      />
                    </div>
                  )}
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className={`text-base font-semibold ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap ml-4">
                      {new Date(notif.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${notif.is_read ? 'text-slate-500' : 'text-slate-700'} line-clamp-1`}>
                    {notif.message}
                  </p>
                </div>
                {!isSelectionMode && !notif.is_read && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center glass-card border-none text-slate-400 hover:text-primary hover:border-primary/30 transition-colors tooltip-trigger relative group"
                    title="Tandai dibaca"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detail Pesan */}
      {viewingNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                {getIcon(viewingNotification.type)}
                <h3 className="text-lg font-semibold text-slate-800">Detail Pesan</h3>
              </div>
              <button 
                onClick={() => setViewingNotification(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-slate-900 mb-2">{viewingNotification.title}</h4>
                <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Clock size={14} />
                  {new Date(viewingNotification.created_at).toLocaleString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              
              <div className="bg-primary/5 rounded-xl p-5 border border-slate-100 mb-8 overflow-auto">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                  {viewingNotification.message}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setViewingNotification(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 glass-card border-none rounded-lg hover:bg-primary/5 transition-colors"
                >
                  Tutup
                </button>
                {viewingNotification.type !== 'task_cancelled' && (
                  <button 
                    onClick={() => handleActionClick(viewingNotification)}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary rounded-lg transition-colors shadow-sm"
                  >
                    {viewingNotification.type === 'new_report' ? 'Lihat Detail Laporan' : 
                     (viewingNotification.type === 'preventive_overdue' || viewingNotification.type === 'preventive_reminder') ? 'Lihat Jadwal Preventif' : 
                     viewingNotification.type === 'low_stock' ? 'Lihat Inventaris' :
                     'Lihat Detail Penugasan'}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
