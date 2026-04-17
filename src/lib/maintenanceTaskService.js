import { supabase } from './supabaseClient';

/**
 * Get all maintenance tasks with optional filters
 */
export async function getMaintenanceTasks(filters = {}) {
  try {
    let query = supabase
      .from('maintenance_tasks')
      .select(`
        *,
        report:report_id(id, ticket_code, urgency_level, description),
        asset:asset_id(id, name),
        assigned_officer:assigned_to(id, name, email),
        assigned_by_user:assigned_by(id, name)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters.asset_id) {
      query = query.eq('asset_id', filters.asset_id);
    }
    if (filters.report_id) {
      query = query.eq('report_id', filters.report_id);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch maintenance tasks: ${error.message}`);
  }
}

/**
 * Get a single maintenance task by ID
 */
export async function getMaintenanceTaskById(id) {
  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        report:report_id(id, ticket_code, urgency_level, status, description),
        asset:asset_id(id, name, latitude, longitude),
        assigned_officer:assigned_to(id, name, email),
        assigned_by_user:assigned_by(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch maintenance task: ${error.message}`);
  }
}

/**
 * Create a new maintenance task (penugasan)
 */
export async function createMaintenanceTask(taskData, userId) {
  try {
    const payload = {
      report_id: taskData.report_id,
      asset_id: taskData.asset_id,
      assigned_to: taskData.assigned_to,
      assigned_by: userId,
      scheduled_date: taskData.scheduled_date,
      estimated_cost: taskData.estimated_cost || null,
      status: 'assigned',
      instructions: taskData.instructions || '',
      notes: taskData.notes || '',
    };

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create notification for assigned officer
    if (taskData.assigned_to) {
      await createNotification({
        user_id: taskData.assigned_to,
        type: 'maintenance_assigned',
        title: 'Penugasan Pemeliharaan Baru',
        message: `Anda telah ditugaskan untuk pekerjaan pemeliharaan dengan estimasi tanggal ${new Date(taskData.scheduled_date).toLocaleDateString('id-ID')}`,
        related_id: data.id,
      });
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to create maintenance task: ${error.message}`);
  }
}

/**
 * Update a maintenance task
 */
export async function updateMaintenanceTask(id, taskData) {
  try {
    const payload = {
      ...taskData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to update maintenance task: ${error.message}`);
  }
}

/**
 * Update maintenance task status
 */
export async function updateMaintenanceTaskStatus(id, status, notes = '') {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to update maintenance task status: ${error.message}`);
  }
}

/**
 * Delete a maintenance task
 */
export async function deleteMaintenanceTask(id) {
  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  } catch (error) {
    throw new Error(`Failed to delete maintenance task: ${error.message}`);
  }
}

/**
 * Get maintenance tasks assigned to a specific officer
 */
export async function getMaintenanceTasksByOfficer(officerId) {
  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        report:report_id(id, ticket_code, urgency_level),
        asset:asset_id(id, name, latitude, longitude),
        assigned_by_user:assigned_by(id, name)
      `)
      .eq('assigned_to', officerId)
      .in('status', ['assigned', 'in_progress'])
      .order('scheduled_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch officer tasks: ${error.message}`);
  }
}

/**
 * Get active field officers (untuk dropdown di form penugasan)
 */
export async function getActiveFieldOfficers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        user_profiles(specialization, work_area)
      `)
      .eq('role', 'field_officer')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    
    // Flatten the response to make specialization & work_area accessible
    return (data || []).map(officer => ({
      id: officer.id,
      name: officer.name,
      email: officer.email,
      specialization: officer.user_profiles?.[0]?.specialization || '',
      work_area: officer.user_profiles?.[0]?.work_area || '',
    }));
  } catch (error) {
    throw new Error(`Failed to fetch field officers: ${error.message}`);
  }
}

/**
 * Create a notification
 */
export async function createNotification(notificationData) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
}
