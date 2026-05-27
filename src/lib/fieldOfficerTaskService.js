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
        report:report_id(id, ticket_code, damage_type_id, urgency_level, description, photo_url),
        asset:asset_id(id, name)
      `)
      .eq('assigned_to', officerId);

    if (tasksError) throw tasksError;

    // 2. Fetch all damage reports
    const { data: reports, error: reportsError } = await supabase
      .from('damage_reports')
      .select(`
        id,
        ticket_code,
        urgency_level,
        description,
        photo_url,
        created_at,
        status
      `);

    if (reportsError) throw reportsError;

    // 3. Map reports to task-like structures
    const taskMapByReportId = new Map((tasks || []).map(t => [t.report_id, t]));
    const combined = [];

    for (const r of (reports || [])) {
      const realTask = taskMapByReportId.get(r.id);
      
      // Determine mapped status strictly from the report's status
      let taskStatus;
      let instructions = 'Laporan aduan dari warga.';
      let notes = '';

      if (r.status === 'pending') {
        taskStatus = 'pending';
        instructions = 'Laporan masuk dari masyarakat (Menunggu verifikasi admin).';
        notes = 'Belum ditugaskan ke petugas.';
      } else if (r.status === 'terverifikasi') {
        taskStatus = 'assigned';
        instructions = 'Laporan terverifikasi oleh admin. Melakukan persiapan perbaikan.';
        notes = 'Menunggu instruksi tugas resmi.';
      } else if (r.status === 'sedang_dikerjakan') {
        taskStatus = 'in_progress';
        instructions = 'Laporan dalam proses pengerjaan oleh petugas lapangan.';
      } else if (r.status === 'selesai') {
        taskStatus = 'completed';
        instructions = 'Perbaikan selesai dilakukan.';
      } else if (r.status === 'ditolak') {
        taskStatus = 'cancelled';
        instructions = 'Laporan ini telah ditolak oleh administrator.';
        notes = 'Laporan tidak ditindaklanjuti.';
      } else {
        continue;
      }

      if (realTask) {
        combined.push({
          ...realTask,
          status: taskStatus // Override task status with mapped report status
        });
      } else {
        // Generate a pseudo-task for any report that does not have a task assigned to this officer
        combined.push({
          id: `${taskStatus}-${r.id}`,
          status: taskStatus,
          scheduled_date: r.created_at,
          estimated_cost: 0,
          instructions,
          notes,
          last_officer_notes: null,
          last_status_update: null,
          created_at: r.created_at,
          updated_at: r.created_at,
          report: {
            id: r.id,
            ticket_code: r.ticket_code,
            damage_type_id: null,
            urgency_level: r.urgency_level,
            description: r.description,
            photo_url: r.photo_url
          },
          asset: null,
          isExternalReport: true
        });
      }
    }

    // Sort by scheduled_date ascending
    combined.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

    return combined;
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
    const isPseudoTask = typeof taskId === 'string' && (
      taskId.startsWith('pending-') || 
      taskId.startsWith('assigned-') || 
      taskId.startsWith('in_progress-') || 
      taskId.startsWith('completed-') || 
      taskId.startsWith('cancelled-')
    );

    // If it is a pseudo-task, return details mocked from damage_report
    if (isPseudoTask) {
      const parts = taskId.split('-');
      const pseudoStatus = parts[0];
      const realId = parts.slice(1).join('-');

      const { data: report, error: reportError } = await supabase
        .from('damage_reports')
        .select('id, ticket_code, urgency_level, description, photo_url, latitude, longitude, created_at, status')
        .eq('id', realId)
        .single();

      if (reportError) throw reportError;

      let taskStatus;
      let instructions = 'Laporan aduan dari warga.';
      let notes = '';

      if (pseudoStatus === 'pending') {
        taskStatus = 'pending';
        instructions = 'Laporan masuk dari masyarakat (Menunggu verifikasi admin).';
        notes = 'Belum ditugaskan ke petugas.';
      } else if (pseudoStatus === 'assigned') {
        taskStatus = 'assigned';
        instructions = 'Laporan terverifikasi oleh admin. Melakukan persiapan perbaikan.';
        notes = 'Menunggu instruksi tugas resmi.';
      } else if (pseudoStatus === 'in_progress') {
        taskStatus = 'in_progress';
        instructions = 'Laporan dalam proses pengerjaan oleh petugas lapangan.';
      } else if (pseudoStatus === 'completed') {
        taskStatus = 'completed';
        instructions = 'Perbaikan selesai dilakukan.';
      } else if (pseudoStatus === 'cancelled') {
        taskStatus = 'cancelled';
        instructions = 'Laporan ini telah ditolak oleh administrator.';
        notes = 'Laporan tidak ditindaklanjuti.';
      }

      return {
        id: taskId,
        status: taskStatus,
        scheduled_date: report.created_at,
        estimated_cost: 0,
        instructions,
        notes,
        last_officer_notes: null,
        last_status_update: null,
        created_at: report.created_at,
        updated_at: report.created_at,
        report: {
          id: report.id,
          ticket_code: report.ticket_code,
          urgency_level: report.urgency_level,
          description: report.description,
          photo_url: report.photo_url,
          latitude: report.latitude,
          longitude: report.longitude
        },
        asset: null,
        progressHistory: [],
        isExternalReport: true
      };
    }

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
export async function updateTaskStatus(taskId, status, notes = '', photoUrl = null) {
  try {
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session.session) {
      throw new Error('Not authenticated');
    }

    const officerId = session.session.user.id;
    let realTaskId = taskId;

    const isPseudoTask = typeof taskId === 'string' && (
      taskId.startsWith('pending-') || 
      taskId.startsWith('assigned-') || 
      taskId.startsWith('in_progress-') || 
      taskId.startsWith('completed-') || 
      taskId.startsWith('cancelled-')
    );

    if (isPseudoTask) {
      // Extract the real report UUID
      const parts = taskId.split('-');
      const reportId = parts.slice(1).join('-');

      // Create a physical task in maintenance_tasks table
      const { data: newTask, error: insertError } = await supabase
        .from('maintenance_tasks')
        .insert({
          report_id: reportId,
          assigned_to: officerId,
          status: status,
          scheduled_date: new Date().toISOString(),
          instructions: 'Laporan terverifikasi oleh admin. Melakukan persiapan perbaikan.',
          notes: notes,
          last_status_update: new Date().toISOString(),
          last_officer_notes: notes,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      realTaskId = newTask.id;
    }

    // Insert progress record
    const { error: progressError } = await supabase
      .from('task_progress')
      .insert({
        task_id: realTaskId,
        officer_id: officerId,
        status,
        notes,
        photo_url: photoUrl,
      });

    if (progressError) throw progressError;

    // Only run update if it was not a newly created task
    if (!isPseudoTask) {
      const { error: updateError } = await supabase
        .from('maintenance_tasks')
        .update({
          status,
          notes,
          last_status_update: new Date().toISOString(),
          last_officer_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', realTaskId)
        .eq('assigned_to', officerId);

      if (updateError) throw updateError;
    }

    return {
      success: true,
      taskId: realTaskId,
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
