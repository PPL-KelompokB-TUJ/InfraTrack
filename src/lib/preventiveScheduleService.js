import { supabase } from './supabaseClient';
import { createNotification } from './maintenanceTaskService';

const TABLE_NAME = 'preventive_schedules';

/**
 * Get all preventive schedules with optional filters
 */
export async function getPreventiveSchedules(filters = {}) {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select(`
        *,
        asset:infrastructure_assets!preventive_schedules_asset_id_fkey(id, name)
      `)
      .order('next_due', { ascending: true });

    if (filters.asset_id) {
      query = query.eq('asset_id', filters.asset_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.month && filters.year) {
      const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
      const endMonth = Number(filters.month) + 1;
      const endYear = endMonth > 12 ? Number(filters.year) + 1 : Number(filters.year);
      const endMonthNorm = endMonth > 12 ? 1 : endMonth;
      const endDate = `${endYear}-${String(endMonthNorm).padStart(2, '0')}-01`;
      query = query.gte('next_due', startDate).lt('next_due', endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch preventive schedules: ${error.message}`);
  }
}

/**
 * Get calendar data for a date range
 */
export async function getPreventiveSchedulesCalendar(start, end) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        asset:infrastructure_assets!preventive_schedules_asset_id_fkey(id, name)
      `)
      .gte('next_due', start)
      .lte('next_due', end)
      .order('next_due', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch calendar data: ${error.message}`);
  }
}

/**
 * Get a single preventive schedule by ID
 */
export async function getPreventiveScheduleById(id) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        asset:infrastructure_assets!preventive_schedules_asset_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch preventive schedule: ${error.message}`);
  }
}

/**
 * Create a new preventive schedule
 */
export async function createPreventiveSchedule(scheduleData) {
  try {
    const nextDue = scheduleData.last_done
      ? addDays(new Date(scheduleData.last_done), Number(scheduleData.frequency_days))
      : scheduleData.next_due;

    const payload = {
      asset_id: scheduleData.asset_id,
      title: String(scheduleData.title || '').trim(),
      description: scheduleData.description || '',
      frequency_days: Number(scheduleData.frequency_days),
      last_done: scheduleData.last_done || null,
      next_due: typeof nextDue === 'string' ? nextDue : formatDate(nextDue),
      status: 'scheduled',
      created_by: scheduleData.created_by || null,
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to create preventive schedule: ${error.message}`);
  }
}

/**
 * Update a preventive schedule
 */
export async function updatePreventiveSchedule(id, scheduleData) {
  try {
    const payload = {
      asset_id: scheduleData.asset_id,
      title: String(scheduleData.title || '').trim(),
      description: scheduleData.description || '',
      frequency_days: Number(scheduleData.frequency_days),
      last_done: scheduleData.last_done || null,
      next_due: scheduleData.next_due,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to update preventive schedule: ${error.message}`);
  }
}

/**
 * Mark schedule as completed + auto-generate next schedule
 */
export async function completePreventiveSchedule(id) {
  try {
    // 1) Get current schedule
    const current = await getPreventiveScheduleById(id);
    if (!current) throw new Error('Jadwal tidak ditemukan');

    const today = new Date();
    const todayStr = formatDate(today);
    const nextDueDate = addDays(today, current.frequency_days);
    const nextDueStr = formatDate(nextDueDate);

    // 2) Mark current as completed
    const { data: completed, error: completeError } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'completed',
        last_done: todayStr,
        completed_at: today.toISOString(),
        updated_at: today.toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (completeError) throw new Error(completeError.message);

    // 3) Auto-generate next schedule
    const { data: nextSchedule, error: nextError } = await supabase
      .from(TABLE_NAME)
      .insert([{
        asset_id: current.asset_id,
        title: current.title,
        description: current.description || '',
        frequency_days: current.frequency_days,
        last_done: todayStr,
        next_due: nextDueStr,
        status: 'scheduled',
        created_by: current.created_by,
      }])
      .select()
      .single();

    if (nextError) throw new Error(nextError.message);

    return { completed, nextSchedule };
  } catch (error) {
    throw new Error(`Failed to complete preventive schedule: ${error.message}`);
  }
}

/**
 * Cancel a preventive schedule
 */
export async function cancelPreventiveSchedule(id) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    throw new Error(`Failed to cancel preventive schedule: ${error.message}`);
  }
}

/**
 * Delete a preventive schedule
 */
export async function deletePreventiveSchedule(id) {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  } catch (error) {
    throw new Error(`Failed to delete preventive schedule: ${error.message}`);
  }
}

/**
 * Get preventive schedule history for a specific asset
 */
export async function getAssetPreventiveHistory(assetId) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        asset:infrastructure_assets!preventive_schedules_asset_id_fkey(id, name)
      `)
      .eq('asset_id', assetId)
      .order('next_due', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch asset preventive history: ${error.message}`);
  }
}

/**
 * Trigger reminder check (client-side fallback)
 * Calls the DB function that marks overdue + sends notifications
 */
export async function triggerReminderCheck() {
  try {
    const { error } = await supabase.rpc('send_preventive_schedule_reminders');
    if (error) throw new Error(error.message);
  } catch (error) {
    // Non-critical — log but don't throw
    console.warn('Reminder check failed:', error.message);
  }
}

// ── Utility helpers ──────────────────────────────────────────

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
