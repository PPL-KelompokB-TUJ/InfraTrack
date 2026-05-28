import { supabase } from './supabaseClient';

/**
 * Aggregate all maintenance-related activity for an asset into a unified
 * chronological timeline.
 *
 * Event types: damage_report | maintenance_task | maintenance_log | preventive_schedule
 */
export async function getAssetTimeline(assetId, { dateFrom, dateTo, eventTypes } = {}) {
  const results = await Promise.allSettled([
    fetchDamageReports(assetId, dateFrom, dateTo),
    fetchMaintenanceTasks(assetId, dateFrom, dateTo),
    fetchMaintenanceLogs(assetId, dateFrom, dateTo),
    fetchPreventiveSchedules(assetId, dateFrom, dateTo),
  ]);

  const [drResult, mtResult, mlResult, psResult] = results;

  const events = [
    ...(drResult.status === 'fulfilled' ? drResult.value : []),
    ...(mtResult.status === 'fulfilled' ? mtResult.value : []),
    ...(mlResult.status === 'fulfilled' ? mlResult.value : []),
    ...(psResult.status === 'fulfilled' ? psResult.value : []),
  ];

  const filtered = eventTypes && eventTypes.length > 0
    ? events.filter((e) => eventTypes.includes(e.event_type))
    : events;

  // Sort descending (newest first)
  filtered.sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

  return filtered;
}

// ── private fetchers ──────────────────────────────────────────────────────────

async function fetchDamageReports(assetId, dateFrom, dateTo) {
  let query = supabase
    .from('damage_reports')
    .select('id, ticket_code, urgency_level, description, status, created_at, reporter_name, reporter_email')
    .eq('asset_id', assetId);

  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map((r) => ({
    id: `dr-${r.id}`,
    event_type: 'damage_report',
    occurred_at: r.created_at,
    title: `Laporan Kerusakan – ${r.ticket_code}`,
    subtitle: `Urgensi: ${r.urgency_level}`,
    description: r.description,
    status: r.status,
    meta: {
      ticket_code: r.ticket_code,
      urgency_level: r.urgency_level,
      reporter: r.reporter_name || r.reporter_email || 'Anonim',
    },
    raw: r,
  }));
}

async function fetchMaintenanceTasks(assetId, dateFrom, dateTo) {
  let query = supabase
    .from('maintenance_tasks')
    .select(`
      id, title, description, status, priority, created_at, updated_at,
      assigned_officer:users!maintenance_tasks_assigned_to_fkey(name),
      report:damage_reports!maintenance_tasks_report_id_fkey(ticket_code)
    `)
    .eq('asset_id', assetId);

  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map((t) => ({
    id: `mt-${t.id}`,
    event_type: 'maintenance_task',
    occurred_at: t.created_at,
    title: `Penugasan – ${t.title}`,
    subtitle: `Prioritas: ${t.priority || '-'}`,
    description: t.description,
    status: t.status,
    meta: {
      officer: t.assigned_officer?.name || '—',
      ticket: t.report?.ticket_code || null,
      priority: t.priority,
    },
    raw: t,
  }));
}

async function fetchMaintenanceLogs(assetId, dateFrom, dateTo) {
  // logs are linked to tasks → join through maintenance_tasks
  let query = supabase
    .from('maintenance_logs')
    .select(`
      id, status, notes, photo_url, logged_at,
      officer:users!maintenance_logs_officer_id_fkey(name),
      task:maintenance_tasks!maintenance_logs_task_id_fkey(id, title, asset_id)
    `)
    .eq('task.asset_id', assetId);

  if (dateFrom) query = query.gte('logged_at', dateFrom);
  if (dateTo) query = query.lte('logged_at', dateTo + 'T23:59:59');

  const { data, error } = await query.order('logged_at', { ascending: false });
  if (error) throw new Error(error.message);

  // Filter to only logs whose task belongs to this asset
  const rows = (data || []).filter((l) => l.task?.asset_id === assetId);

  return rows.map((l) => ({
    id: `ml-${l.id}`,
    event_type: 'maintenance_log',
    occurred_at: l.logged_at,
    title: `Log Pekerjaan – ${l.task?.title || '—'}`,
    subtitle: `Status: ${l.status}`,
    description: l.notes,
    status: l.status,
    meta: {
      officer: l.officer?.name || '—',
      photo_url: l.photo_url || null,
      task_title: l.task?.title || '—',
    },
    raw: l,
  }));
}

async function fetchPreventiveSchedules(assetId, dateFrom, dateTo) {
  let query = supabase
    .from('preventive_schedules')
    .select('id, title, description, status, next_due, frequency, created_at')
    .eq('asset_id', assetId);

  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map((p) => ({
    id: `ps-${p.id}`,
    event_type: 'preventive_schedule',
    occurred_at: p.created_at,
    title: `Jadwal Preventif – ${p.title}`,
    subtitle: `Jatuh tempo: ${p.next_due ? new Date(p.next_due).toLocaleDateString('id-ID') : '—'}`,
    description: p.description,
    status: p.status,
    meta: {
      next_due: p.next_due,
      frequency: p.frequency,
    },
    raw: p,
  }));
}
