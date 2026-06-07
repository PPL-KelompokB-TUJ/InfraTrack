const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch all notifications for the user
 */
export async function getNotifications(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to fetch notifications');
    }
    const data = await res.json();
    return data.notifications || [];
  } catch (error) {
    console.error('Error in getNotifications service:', error);
    throw error;
  }
}

/**
 * Fetch unread notification count
 */
export async function getUnreadCount(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to fetch unread count');
    }
    const data = await res.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error in getUnreadCount service:', error);
    throw error;
  }
}

/**
 * Mark a specific notification as read
 */
export async function markAsRead(token, id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to mark notification as read');
    }
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('Error in markAsRead service:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to mark all notifications as read');
    }
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('Error in markAllAsRead service:', error);
    throw error;
  }
}
