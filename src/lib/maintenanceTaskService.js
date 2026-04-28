import { supabase } from './supabaseClient';

async function getUsersMapByIds(userIds = []) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', uniqueIds);

  if (error) {
    return new Map();
  }

  return new Map((data || []).map((user) => [user.id, user]));
}

function hydrateTaskUsers(task, usersMap) {
  if (!task) {
    return task;
  }

  return {
    ...task,
    assigned_officer: task.assigned_to ? usersMap.get(task.assigned_to) || null : null,
    assigned_by_user: task.assigned_by ? usersMap.get(task.assigned_by) || null : null,
  };
}

/**
 * Get all maintenance tasks with optional filters
 */
export async function getMaintenanceTasks(filters = {}) {
  try {
    let query = supabase
      .from('maintenance_tasks')
      .select(`
        *,
        report:damage_reports!maintenance_tasks_report_id_fkey(id, ticket_code, urgency_level, description),
        asset:infrastructure_assets!maintenance_tasks_asset_id_fkey(id, name)
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

    const rows = data || [];
    const usersMap = await getUsersMapByIds(
      rows.flatMap((task) => [task.assigned_to, task.assigned_by])
    );

    return rows.map((task) => hydrateTaskUsers(task, usersMap));
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
        report:damage_reports!maintenance_tasks_report_id_fkey(id, ticket_code, urgency_level, status, description),
        asset:infrastructure_assets!maintenance_tasks_asset_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    const usersMap = await getUsersMapByIds([data?.assigned_to, data?.assigned_by]);
    return hydrateTaskUsers(data, usersMap);
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
      assigned_by: userId || null,
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
        report:damage_reports!maintenance_tasks_report_id_fkey(id, ticket_code, urgency_level),
        asset:infrastructure_assets!maintenance_tasks_asset_id_fkey(id, name)
      `)
      .eq('assigned_to', officerId)
      .in('status', ['assigned', 'in_progress'])
      .order('scheduled_date', { ascending: true });

    if (error) throw new Error(error.message);

    const rows = data || [];
    const usersMap = await getUsersMapByIds(rows.map((task) => task.assigned_by));

    return rows.map((task) => hydrateTaskUsers(task, usersMap));
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
      .from('field_officers_view')
      .select('id, name, email, specialization, work_area')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((officer) => ({
      id: officer.id,
      name: officer.name,
      email: officer.email,
      phone: officer.phone || '',
      specialization: officer.specialization || '',
      work_area: officer.work_area || '',
    }));
  } catch (error) {
    const rawMessage = String(error.message || '');

    if (rawMessage.toLowerCase().includes('permission denied')) {
      throw new Error(
        'Gagal memuat petugas: akses database belum dikonfigurasi. Jalankan script supabase/fix_pbi04_permissions.sql di Supabase SQL Editor.'
      );
    }

    throw new Error(`Failed to fetch field officers: ${error.message}`);
  }
}

function generateTemporaryPassword(length = 10) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

/**
 * Create field officer user + profile.
 */
export async function createFieldOfficer(formData) {
  try {
    const name = String(formData?.name || '').trim();
    const email = String(formData?.email || '').trim().toLowerCase();

    if (!name || !email) {
      throw new Error('Nama dan email petugas wajib diisi.');
    }

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          role: 'field_officer',
          is_active: true,
        },
      ])
      .select('id, name, email, role, is_active')
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    const profilePayload = {
      user_id: userRow.id,
      specialization: formData?.specialization || null,
      work_area: formData?.work_area || null,
      phone: formData?.phone || null,
    };

    const { error: profileError } = await supabase.from('user_profiles').upsert([profilePayload], {
      onConflict: 'user_id',
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    return {
      user: userRow,
      temporaryPassword: generateTemporaryPassword(),
    };
  } catch (error) {
    throw new Error(`Failed to create field officer: ${error.message}`);
  }
}

/**
 * Update field officer user + profile.
 */
export async function updateFieldOfficer(id, formData) {
  try {
    const officerId = String(id || '').trim();
    if (!officerId) {
      throw new Error('ID petugas tidak valid.');
    }

    const userUpdate = {
      name: String(formData?.name || '').trim(),
      email: String(formData?.email || '').trim().toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update(userUpdate)
      .eq('id', officerId)
      .eq('role', 'field_officer')
      .select('id, name, email, role, is_active')
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    const profilePayload = {
      user_id: officerId,
      specialization: formData?.specialization || null,
      work_area: formData?.work_area || null,
      phone: formData?.phone || null,
    };

    const { error: profileError } = await supabase.from('user_profiles').upsert([profilePayload], {
      onConflict: 'user_id',
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    return updatedUser;
  } catch (error) {
    throw new Error(`Failed to update field officer: ${error.message}`);
  }
}

/**
 * Soft-delete field officer by deactivating account.
 */
export async function deleteFieldOfficer(id) {
  try {
    const officerId = String(id || '').trim();
    if (!officerId) {
      throw new Error('ID petugas tidak valid.');
    }

    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', officerId)
      .eq('role', 'field_officer');

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete field officer: ${error.message}`);
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

/**
 * Get maintenance logs for a specific task
 */
export async function getMaintenanceLogsForTask(taskId) {
  try {
    const { data, error } = await supabase
      .from('maintenance_logs')
      .select(`
        *,
        officer:officer_id(id, name, email)
      `)
      .eq('task_id', taskId)
      .order('logged_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch maintenance logs: ${error.message}`);
  }
}

/**
 * Create a maintenance log entry when officer updates task status
 */
export async function createMaintenanceLog(logData) {
  try {
    const payload = {
      task_id: logData.task_id,
      officer_id: logData.officer_id,
      status: logData.status, // 'started', 'in_progress', 'completed'
      notes: logData.notes || '',
      photo_url: logData.photo_url || null,
      logged_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('maintenance_logs')
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to create maintenance log: ${error.message}`);
  }
}

/**
 * Upload maintenance progress photo to storage
 */
export async function uploadMaintenanceProgressPhoto(file, taskId, userId) {
  try {
    if (!file || !taskId || !userId) {
      throw new Error('File, task ID, and user ID are required');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${taskId}/${timestamp}_${file.name}`;

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from('maintenance-progress-photos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw new Error(error.message);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('maintenance-progress-photos')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error) {
    throw new Error(`Failed to upload maintenance progress photo: ${error.message}`);
  }
}

/**
 * Update maintenance task status and create log in one operation
 */
export async function updateTaskStatusWithLog(taskId, newStatus, officerId, logData) {
  try {
    // First, update the task status
    const taskUpdateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedTask, error: taskError } = await supabase
      .from('maintenance_tasks')
      .update(taskUpdateData)
      .eq('id', taskId)
      .select()
      .single();

    if (taskError) throw new Error(`Task update error: ${taskError.message}`);

    // Then create a maintenance log
    const maintenanceLog = await createMaintenanceLog({
      task_id: taskId,
      officer_id: officerId,
      status: logData.logStatus || 'in_progress',
      notes: logData.notes || '',
      photo_url: logData.photo_url || null,
    });

    // If task is completed, create notification for admin
    if (newStatus === 'completed') {
      const taskDetails = await getMaintenanceTaskById(taskId);
      if (taskDetails?.assigned_by_user?.id) {
        await createNotification({
          user_id: taskDetails.assigned_by_user.id,
          type: 'task_completed',
          title: 'Pekerjaan Pemeliharaan Selesai',
          message: `Pekerjaan pemeliharaan untuk aset ${taskDetails.asset?.name} telah selesai`,
          related_id: taskId,
        });
      }
    }

    return {
      task: updatedTask,
      log: maintenanceLog,
    };
  } catch (error) {
    throw new Error(`Failed to update task status with log: ${error.message}`);
  }
}
