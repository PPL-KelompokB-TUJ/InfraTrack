import { supabase } from './supabaseClient';

/**
 * Get all maintenance tasks with optional filters
 * Uses separate queries to avoid relationship ambiguity (multiple FKs to users)
 */
export async function getMaintenanceTasks(filters = {}) {
  try {
    let query = supabase
      .from('maintenance_tasks')
      .select('*')
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

    const { data: tasks, error } = await query;

    if (error) throw new Error(error.message);
    if (!tasks || tasks.length === 0) return [];

    // Fetch related data separately to avoid relationship ambiguity
    // Get all unique IDs
    const reportIds = [...new Set(tasks.map(t => t.report_id).filter(Boolean))];
    const assetIds = [...new Set(tasks.map(t => t.asset_id).filter(Boolean))];
    const userIds = [...new Set(
      tasks.flatMap(t => [t.assigned_to, t.assigned_by]).filter(Boolean)
    )];

    // Fetch in parallel
    const [{ data: reports }, { data: assets }, { data: users }] = await Promise.all([
      reportIds.length > 0
        ? supabase.from('damage_reports').select('id, ticket_code, urgency_level, description, status').in('id', reportIds)
        : Promise.resolve({ data: [] }),
      assetIds.length > 0
        ? supabase.from('infrastructure_assets').select('id, name').in('id', assetIds)
        : Promise.resolve({ data: [] }),
      userIds.length > 0
        ? supabase.from('users').select('id, name, email').in('id', userIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Build maps for quick lookup
    const reportMap = {};
    (reports || []).forEach(r => {
      reportMap[r.id] = r;
    });

    const assetMap = {};
    (assets || []).forEach(a => {
      assetMap[a.id] = a;
    });

    const userMap = {};
    (users || []).forEach(u => {
      userMap[u.id] = u;
    });

    // Enrich tasks with related data
    return tasks.map(task => ({
      ...task,
      report: reportMap[task.report_id] || null,
      asset: assetMap[task.asset_id] || null,
      assigned_officer: userMap[task.assigned_to] || null,
      assigned_by_user: userMap[task.assigned_by] || null,
    }));
  } catch (error) {
    throw new Error(`Failed to fetch maintenance tasks: ${error.message}`);
  }
}

/**
 * Get a single maintenance task by ID
 * Uses separate queries to avoid relationship ambiguity
 */
export async function getMaintenanceTaskById(id) {
  try {
    const { data: task, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    if (!task) return null;

    // Fetch related data separately
    const [{ data: report }, { data: asset }, { data: officers }] = await Promise.all([
      task.report_id
        ? supabase.from('damage_reports').select('id, ticket_code, urgency_level, status, description').eq('id', task.report_id).single()
        : Promise.resolve({ data: null }),
      task.asset_id
        ? supabase.from('infrastructure_assets').select('id, name').eq('id', task.asset_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('users').select('id, name, email').in('id', [task.assigned_to, task.assigned_by].filter(Boolean)),
    ]);

    const userMap = {};
    (officers || []).forEach(u => {
      userMap[u.id] = u;
    });

    return {
      ...task,
      report: report || null,
      asset: asset || null,
      assigned_officer: userMap[task.assigned_to] || null,
      assigned_by_user: userMap[task.assigned_by] || null,
    };
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
 * Uses separate queries to avoid relationship ambiguity
 */
export async function getMaintenanceTasksByOfficer(officerId) {
  try {
    const { data: tasks, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('assigned_to', officerId)
      .in('status', ['assigned', 'in_progress'])
      .order('scheduled_date', { ascending: true });

    if (error) throw new Error(error.message);
    if (!tasks || tasks.length === 0) return [];

    // Fetch related data separately
    const reportIds = [...new Set(tasks.map(t => t.report_id).filter(Boolean))];
    const assetIds = [...new Set(tasks.map(t => t.asset_id).filter(Boolean))];
    const assignedByIds = [...new Set(tasks.map(t => t.assigned_by).filter(Boolean))];

    const [{ data: reports }, { data: assets }, { data: assignedByUsers }] = await Promise.all([
      reportIds.length > 0
        ? supabase.from('damage_reports').select('id, ticket_code, urgency_level').in('id', reportIds)
        : Promise.resolve({ data: [] }),
      assetIds.length > 0
        ? supabase.from('infrastructure_assets').select('id, name').in('id', assetIds)
        : Promise.resolve({ data: [] }),
      assignedByIds.length > 0
        ? supabase.from('users').select('id, name').in('id', assignedByIds)
        : Promise.resolve({ data: [] }),
    ]);

    const reportMap = {};
    (reports || []).forEach(r => {
      reportMap[r.id] = r;
    });

    const assetMap = {};
    (assets || []).forEach(a => {
      assetMap[a.id] = a;
    });

    const userMap = {};
    (assignedByUsers || []).forEach(u => {
      userMap[u.id] = u;
    });

    return tasks.map(task => ({
      ...task,
      report: reportMap[task.report_id] || null,
      asset: assetMap[task.asset_id] || null,
      assigned_by_user: userMap[task.assigned_by] || null,
    }));
  } catch (error) {
    throw new Error(`Failed to fetch officer tasks: ${error.message}`);
  }
}

/**
 * Get active field officers (untuk dropdown di form penugasan)
 * Queries users and user_profiles tables directly to avoid view not found errors
 */
export async function getActiveFieldOfficers() {
  try {
    // Query users table directly instead of using view (more reliable)
    // Note: removed is_active filter to avoid schema cache issues
    const { data: officers, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'field_officer')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    if (!officers || officers.length === 0) return [];

    // Fetch user profiles separately
    const officerIds = officers.map(o => o.id);
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, specialization, work_area, phone')
      .in('user_id', officerIds);

    if (profilesError) {
      console.warn('Warning: Could not fetch user profiles:', profilesError.message);
    }

    // Build profile map
    const profileMap = {};
    (profiles || []).forEach(p => {
      profileMap[p.user_id] = p;
    });

    // Enrich officers with profile data
    return officers.map((officer) => ({
      id: officer.id,
      name: officer.name,
      email: officer.email,
      specialization: profileMap[officer.id]?.specialization || '',
      work_area: profileMap[officer.id]?.work_area || '',
      phone: profileMap[officer.id]?.phone || '',
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
 * Hash password using a simple algorithm
 * Note: For production, use bcryptjs package instead
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 */
async function verifyPassword(password, hash) {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

/**
 * Generate a random temporary password
 */
function generateTemporaryPassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Create a new field officer with temporary password
 */
export async function createFieldOfficer(officerData) {
  try {
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword(10);
    const passwordHash = await hashPassword(temporaryPassword);

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          name: officerData.name,
          email: officerData.email,
          role: 'field_officer',
          is_active: true,
          profile_photo: null,
        },
      ])
      .select()
      .single();

    if (userError) throw new Error(userError.message);

    // Create user profile
    if (userData) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: userData.id,
            specialization: officerData.specialization || null,
            work_area: officerData.work_area || null,
            phone: officerData.phone || null,
          },
        ]);

      if (profileError) {
        console.warn('Warning: Profile not created but user was:', profileError.message);
      }

      // Create password record
      const { error: passwordError } = await supabase
        .from('officer_passwords')
        .insert([
          {
            user_id: userData.id,
            password_hash: passwordHash,
            temp_password_hash: passwordHash,
            must_change_password: true,
          },
        ]);

      if (passwordError) {
        console.warn('Warning: Password record not created:', passwordError.message);
      }
    }

    return {
      ...userData,
      temporaryPassword,
    };
  } catch (error) {
    throw new Error(`Failed to create field officer: ${error.message}`);
  }
}

/**
 * Update a field officer
 */
export async function updateFieldOfficer(officerId, officerData) {
  try {
    // Update user record
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: officerData.name,
        email: officerData.email,
      })
      .eq('id', officerId);

    if (userError) throw new Error(userError.message);

    // Update or insert user profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', officerId)
      .single();

    if (existingProfile) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          specialization: officerData.specialization || null,
          work_area: officerData.work_area || null,
          phone: officerData.phone || null,
        })
        .eq('user_id', officerId);

      if (profileError) throw new Error(profileError.message);
    } else {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: officerId,
            specialization: officerData.specialization || null,
            work_area: officerData.work_area || null,
            phone: officerData.phone || null,
          },
        ]);

      if (profileError) throw new Error(profileError.message);
    }

    return true;
  } catch (error) {
    throw new Error(`Failed to update field officer: ${error.message}`);
  }
}

/**
 * Delete a field officer
 */
export async function deleteFieldOfficer(officerId) {
  try {
    // Delete user (cascades to user_profiles and other relations)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', officerId);

    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete field officer: ${error.message}`);
  }
}
