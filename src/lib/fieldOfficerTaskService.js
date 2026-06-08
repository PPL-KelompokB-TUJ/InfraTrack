import { supabase } from './supabaseClient';

/**
 * Get all tasks assigned to current officer
 */
export async function getOfficerTasks(officerId) {
  try {
    // 1. Fetch assigned maintenance tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('maintenance_tasks')
      .select(`
        id,
        status,
        scheduled_date,
        estimated_cost,
        instructions,
        notes,
        last_officer_notes,
        last_status_update,
        created_at,
        updated_at,
        report:report_id(id, ticket_code, damage_type_id, urgency_level, description, photo_url, status),
        asset:asset_id(id, name)
      `)
      .eq('assigned_to', officerId);

    if (tasksError) throw tasksError;

    // 2. Map and sync status with report status if present
    const formattedTasks = (tasks || []).map(task => {
      let taskStatus = task.status;
      if (task.report) {
        const repStatus = task.report.status;
        if (repStatus === 'pending') taskStatus = 'pending';
        else if (repStatus === 'terverifikasi') taskStatus = 'assigned';
        else if (repStatus === 'sedang_dikerjakan') taskStatus = 'in_progress';
        else if (repStatus === 'selesai') taskStatus = 'completed';
        else if (repStatus === 'ditolak') taskStatus = 'cancelled';
      }
      return {
        ...task,
        status: taskStatus
      };
    });

    // Sort by scheduled_date ascending
    formattedTasks.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

    return formattedTasks;
  } catch (error) {
    console.error('Error fetching officer tasks:', error);
    throw error;
  }
}

/**
 * Get specific task with full details and history
 */
export async function getTaskDetails(taskId, officerId) {
  try {
    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('maintenance_tasks')
      .select(`
        id,
        status,
        scheduled_date,
        estimated_cost,
        instructions,
        notes,
        last_officer_notes,
        last_status_update,
        created_at,
        updated_at,
        report:report_id(id, ticket_code, damage_type_id, urgency_level, description, photo_url, latitude, longitude, status),
        asset:asset_id(id, name, location)
      `)
      .eq('id', taskId)
      .eq('assigned_to', officerId)
      .single();

    if (taskError) throw taskError;

    // Override task status based on report status to maintain absolute sync
    let taskStatus = task.status;
    if (task.report) {
      const repStatus = task.report.status;
      if (repStatus === 'pending') taskStatus = 'pending';
      else if (repStatus === 'terverifikasi') taskStatus = 'assigned';
      else if (repStatus === 'sedang_dikerjakan') taskStatus = 'in_progress';
      else if (repStatus === 'selesai') taskStatus = 'completed';
      else if (repStatus === 'ditolak') taskStatus = 'cancelled';
    }

    // Get task progress history
    const { data: history, error: historyError } = await supabase
      .from('task_progress')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (historyError) console.warn('Could not fetch history:', historyError);

    return {
      ...task,
      status: taskStatus,
      progressHistory: history || [],
    };
  } catch (error) {
    console.error('Error fetching task details:', error);
    throw error;
  }
}

/**
 * Update task status with notes and photo
 */
export async function updateTaskStatus(taskId, status, notes = '', photoUrl = null, additionalCost = 0) {
  try {
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session.session) {
      throw new Error('Not authenticated');
    }

    const officerId = session.session.user.id;

    // Insert progress record
    const { error: progressError } = await supabase
      .from('task_progress')
      .insert({
        task_id: taskId,
        officer_id: officerId,
        status,
        notes,
        photo_url: photoUrl,
      });

    if (progressError) throw progressError;

    let updateData = {
      status,
      notes,
      last_status_update: new Date().toISOString(),
      last_officer_notes: notes,
      updated_at: new Date().toISOString(),
    };

    if (Number(additionalCost) > 0 && status === 'completed') {
      const { data: taskData } = await supabase.from('maintenance_tasks').select('actual_cost').eq('id', taskId).single();
      const newCost = (taskData.actual_cost || 0) + Number(additionalCost);
      updateData.actual_cost = newCost;

      // Update budgets table as well
      const { data: budgetData } = await supabase.from('budgets').select('actual_cost').eq('task_id', taskId).single();
      if (budgetData) {
        await supabase.from('budgets').update({ actual_cost: (budgetData.actual_cost || 0) + Number(additionalCost) }).eq('task_id', taskId);
      }
    }

    // Update the task status and details
    const { error: updateError } = await supabase
      .from('maintenance_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('assigned_to', officerId);

    if (updateError) throw updateError;

    return {
      success: true,
      taskId: taskId,
      status,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

/**
 * Upload progress photo
 */
export async function uploadProgressPhoto(taskId, file) {
  try {
    if (!file) throw new Error('No file selected');

    const timestamp = new Date().getTime();
    const fileName = `task-${taskId}-progress-${timestamp}-${file.name}`;
    const filePath = `task-progress/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('maintenance-progress')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('maintenance-progress')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl.publicUrl,
      fileName,
    };
  } catch (error) {
    console.error('Error uploading progress photo:', error);
    throw error;
  }
}

/**
 * Get task statistics for officer
 */
export async function getOfficerTaskStats(officerId) {
  try {
    const tasks = await getOfficerTasks(officerId);

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      assigned: tasks.filter(t => t.status === 'assigned').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    };

    return stats;
  } catch (error) {
    console.error('Error getting task stats:', error);
    throw error;
  }
}

/**
 * Get task progress history
 */
export async function getTaskProgressHistory(taskId) {
  try {
    const { data, error } = await supabase
      .from('task_progress')
      .select(`
        id,
        status,
        notes,
        photo_url,
        created_at,
        officer:officer_id(id, name, email)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching progress history:', error);
    throw error;
  }
}
