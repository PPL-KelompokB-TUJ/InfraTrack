import { getSupabaseClient } from '../services/exportService.js';

/**
 * Helper to validate user session and return Supabase client
 */
async function validateUserSession(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided.');
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseClient(token);

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Invalid or expired authentication session.');
  }

  const role = user.app_metadata?.role || user.user_metadata?.role || user.role || 'citizen';

  return { supabase, token, user, role };
}

/**
 * GET /api/notifications
 * Fetch notifications for the logged-in user
 */
export async function getNotifications(req, res, next) {
  try {
    const { supabase, user, role } = await validateUserSession(req);

    // If user is admin, trigger preventive reminders update
    if (role === 'admin') {
      try {
        await supabase.rpc('send_preventive_schedule_reminders');
      } catch (rpcErr) {
        console.error('Failed to trigger send_preventive_schedule_reminders:', rpcErr);
      }
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, notifications: notifications || [] });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notifications/unread-count
 * Fetch unread notifications count for the logged-in user
 */
export async function getUnreadCount(req, res, next) {
  try {
    const { supabase, user } = await validateUserSession(req);

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    return res.json({ success: true, count: count || 0 });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const { supabase, user } = await validateUserSession(req);

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for the user as read
 */
export async function markAllAsRead(req, res, next) {
  try {
    const { supabase, user } = await validateUserSession(req);

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notifications
 * Delete selected notifications
 */
export async function deleteNotifications(req, res, next) {
  try {
    const { ids } = req.body;
    const { supabase, user } = await validateUserSession(req);

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No IDs provided' });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id);

    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

