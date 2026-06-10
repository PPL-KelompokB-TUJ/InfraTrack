import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase Client dynamically
 * If service role key is present, it uses it for full admin access.
 * Otherwise, it uses the publishable key with the user's forwarded authorization token.
 */
export function getSupabaseClient(accessToken) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const options = {
    auth: { persistSession: false },
  };

  if (accessToken && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createClient(supabaseUrl, serviceKey, options);
}

/**
 * Fetch and format data for Laporan Kondisi Aset
 */
export async function getAssetConditionData(supabase, filters = {}) {
  // 1. Fetch assets from view
  let query = supabase.from('infrastructure_assets_view').select('*');
  
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  const { data: assets, error: assetError } = await query;
  if (assetError) throw new Error(`Error fetching assets: ${assetError.message}`);

  // Apply date filters in JS if provided
  let filteredAssets = assets || [];
  if (filters.fromDate) {
    const fromDate = new Date(filters.fromDate);
    filteredAssets = filteredAssets.filter(a => new Date(a.created_at) >= fromDate);
  }
  if (filters.toDate) {
    const toDate = new Date(filters.toDate);
    // Include the full day of the end date
    toDate.setHours(23, 59, 59, 999);
    filteredAssets = filteredAssets.filter(a => new Date(a.created_at) <= toDate);
  }

  // 2. Fetch damage reports to calculate counts
  const { data: damageReports, error: damageError } = await supabase
    .from('damage_reports')
    .select('id, asset_id');
  if (damageError) throw new Error(`Error fetching damage reports: ${damageError.message}`);

  // 3. Fetch completed tasks to find last repaired date
  const { data: completedTasks, error: taskError } = await supabase
    .from('maintenance_tasks')
    .select('id, asset_id, status, updated_at')
    .eq('status', 'completed');
  if (taskError) throw new Error(`Error fetching maintenance tasks: ${taskError.message}`);

  // 4. Map and aggregate data
  let baikCount = 0;
  let rusakCount = 0;

  const items = filteredAssets.map((asset, index) => {
    const assetDamageReports = (damageReports || []).filter(d => d.asset_id === asset.id);
    const assetCompletedTasks = (completedTasks || []).filter(t => t.asset_id === asset.id);

    const condition = String(asset.condition || 'baik').toLowerCase();
    if (condition === 'baik') {
      baikCount++;
    } else {
      rusakCount++;
    }

    // Determine condition styling class
    let conditionClass = 'baik';
    if (condition.includes('ringan')) conditionClass = 'rusak-ringan';
    else if (condition.includes('sedang')) conditionClass = 'rusak-sedang';
    else if (condition.includes('berat')) conditionClass = 'rusak-berat';

    let lastRepaired = '-';
    if (assetCompletedTasks.length > 0) {
      const latestTask = assetCompletedTasks.reduce((latest, current) => 
        new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest
      );
      lastRepaired = new Date(latestTask.updated_at).toLocaleDateString('id-ID');
    }

    return {
      no: index + 1,
      asset_name: asset.name,
      category_name: asset.category || '-',
      latitude: asset.lat ? Number(asset.lat).toFixed(6) : '-',
      longitude: asset.lng ? Number(asset.lng).toFixed(6) : '-',
      condition: asset.condition || 'baik',
      condition_class: conditionClass,
      year_built: asset.year_built || '-',
      total_damage_reports: assetDamageReports.length,
      last_repaired_at: lastRepaired,
    };
  });

  return {
    items,
    summary: {
      total_assets: filteredAssets.length,
      assets_baik: baikCount,
      assets_rusak: rusakCount,
      total_damage_reports: (damageReports || []).length,
    }
  };
}

/**
 * Fetch and format data for Rekapitulasi Pemeliharaan Periodik
 */
export async function getMaintenanceRecapData(supabase, filters = {}) {
  // 1. Fetch maintenance tasks
  let query = supabase
    .from('maintenance_tasks')
    .select(`
      id,
      scheduled_date,
      instructions,
      status,
      assigned_to,
      asset:infrastructure_assets!maintenance_tasks_asset_id_fkey(name)
    `)
    .order('scheduled_date', { ascending: false });

  const { data: tasks, error: tasksError } = await query;
  if (tasksError) throw new Error(`Error fetching maintenance tasks: ${tasksError.message}`);

  // Fetch budgets separately to avoid relationship schema cache errors
  const budgetsMap = new Map();
  try {
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('task_id, estimated_cost, actual_cost');
    
    if (!budgetError && budgets) {
      budgets.forEach(b => {
        budgetsMap.set(b.task_id, b);
      });
    }
  } catch (err) {
    console.error('Failed to fetch budgets for export:', err);
  }

  // Apply filters in JS for reliability
  let filteredTasks = tasks || [];
  if (filters.fromDate) {
    const fromDate = new Date(filters.fromDate);
    filteredTasks = filteredTasks.filter(t => new Date(t.scheduled_date) >= fromDate);
  }
  if (filters.toDate) {
    const toDate = new Date(filters.toDate);
    toDate.setHours(23, 59, 59, 999);
    filteredTasks = filteredTasks.filter(t => new Date(t.scheduled_date) <= toDate);
  }
  if (filters.status && filters.status !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.status === filters.status);
  }

  // 2. Fetch User names for assignments
  const userIds = [...new Set(filteredTasks.map(t => t.assigned_to).filter(Boolean))];
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name')
    .in('id', userIds);
  if (usersError) throw new Error(`Error fetching users: ${usersError.message}`);

  const userMap = new Map((users || []).map(u => [u.id, u.name]));

  // Status Indonsian labels mapping
  const statusLabels = {
    pending: 'Menunggu',
    assigned: 'Ditugaskan',
    in_progress: 'Pengerjaan',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  };

  let totalEst = 0;
  let totalAct = 0;

  const items = filteredTasks.map((task, index) => {
    const budget = budgetsMap.get(task.id);
    const est = Number(budget?.estimated_cost || 0);
    const act = Number(budget?.actual_cost || 0);
    totalEst += est;
    totalAct += act;

    const scheduledDate = new Date(task.scheduled_date);
    const periodStr = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}`;

    return {
      no: index + 1,
      period: periodStr,
      asset_name: task.asset?.name || '-',
      maintenance_type: task.instructions || 'Pemeliharaan Rutin',
      officer_name: task.assigned_to ? userMap.get(task.assigned_to) || 'Petugas' : '-',
      status: task.status,
      status_label: statusLabels[task.status] || task.status,
      status_class: task.status.replace(/_/g, '-'),
      estimated_cost: est,
      actual_cost: act,
      estimated_cost_formatted: est.toLocaleString('id-ID'),
      actual_cost_formatted: act.toLocaleString('id-ID'),
    };
  });

  const variance = totalEst - totalAct;

  return {
    items,
    summary: {
      total_tasks: filteredTasks.length,
      total_estimated_cost: `Rp ${totalEst.toLocaleString('id-ID')}`,
      total_actual_cost: `Rp ${totalAct.toLocaleString('id-ID')}`,
      budget_variance: `Rp ${variance.toLocaleString('id-ID')}`,
      raw_total_estimated_cost: totalEst,
      raw_total_actual_cost: totalAct,
      raw_budget_variance: variance,
    }
  };
}

/**
 * Fetch and format data for Laporan Kinerja Petugas
 */
export async function getOfficerPerformanceData(supabase, filters = {}) {
  // 1. Fetch active field officers from the view
  const { data: officers, error: officerError } = await supabase
    .from('field_officers_view')
    .select('id, name, email, specialization, work_area');
  if (officerError) throw new Error(`Error fetching field officers: ${officerError.message}`);

  // 2. Fetch all maintenance tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('maintenance_tasks')
    .select('id, assigned_to, status, scheduled_date');
  if (tasksError) throw new Error(`Error fetching tasks: ${tasksError.message}`);

  // Apply date filters in JS for reliability
  let filteredTasks = tasks || [];
  if (filters.fromDate) {
    const fromDate = new Date(filters.fromDate);
    filteredTasks = filteredTasks.filter(t => new Date(t.scheduled_date) >= fromDate);
  }
  if (filters.toDate) {
    const toDate = new Date(filters.toDate);
    toDate.setHours(23, 59, 59, 999);
    filteredTasks = filteredTasks.filter(t => new Date(t.scheduled_date) <= toDate);
  }

  // 3. Fetch completed progress logs to compute completion time
  const { data: progressLogs, error: logError } = await supabase
    .from('task_progress')
    .select('task_id, created_at')
    .eq('status', 'completed');
  if (logError) throw new Error(`Error fetching progress logs: ${logError.message}`);

  // Map progress completed dates
  const taskCompletionMap = new Map();
  (progressLogs || []).forEach(log => {
    // If multiple complete logs, take the first one or latest
    taskCompletionMap.set(log.task_id, new Date(log.created_at));
  });

  let totalTasksAll = 0;
  let totalCompletedAll = 0;
  let totalDaysAll = 0;
  let completedCountWithDuration = 0;

  const items = (officers || []).map((officer, index) => {
    const officerTasks = (filteredTasks || []).filter(t => t.assigned_to === officer.id);
    const completedTasks = officerTasks.filter(t => t.status === 'completed');

    let totalDurationDays = 0;
    let completedCount = 0;

    completedTasks.forEach(task => {
      const completedAt = taskCompletionMap.get(task.id);
      if (completedAt) {
        const scheduledAt = new Date(task.scheduled_date);
        const diffMs = completedAt - scheduledAt;
        const diffDays = Math.max(0.1, diffMs / (1000 * 60 * 60 * 24)); // Minimum 0.1 day
        totalDurationDays += diffDays;
        completedCount++;
      }
    });

    const avgDays = completedCount > 0 ? Number((totalDurationDays / completedCount).toFixed(1)) : 0;

    totalTasksAll += officerTasks.length;
    totalCompletedAll += completedTasks.length;
    totalDaysAll += totalDurationDays;
    completedCountWithDuration += completedCount;

    return {
      no: index + 1,
      officer_name: officer.name,
      specialization: officer.specialization || '-',
      work_area: officer.work_area || '-',
      total_tasks: officerTasks.length,
      completed_tasks: completedTasks.length,
      avg_days_to_complete: avgDays,
    };
  });

  const grandAvgDays = completedCountWithDuration > 0 
    ? Number((totalDaysAll / completedCountWithDuration).toFixed(1)) 
    : 0;

  return {
    items,
    summary: {
      total_officers: (officers || []).length,
      total_tasks: totalTasksAll,
      total_completed_tasks: totalCompletedAll,
      avg_resolution_time: grandAvgDays,
    }
  };
}

/**
 * Fetch and format data for Laporan Manajemen Inventaris (Rekapitulasi)
 */
export async function getInventoryRecapData(supabase, filters = {}) {
  // 1. Fetch materials
  let query = supabase.from('materials').select('*').order('name', { ascending: true });
  
  const { data: materials, error: materialsError } = await query;
  if (materialsError) throw new Error(`Error fetching materials: ${materialsError.message}`);

  // Apply filters in JS if needed, though for inventory we usually want current state.
  // We can filter out inactive if necessary, but typically a recap shows everything or just active.
  let filteredMaterials = materials || [];

  let totalItems = 0;
  let emptyItems = 0;
  let totalValuation = 0;

  const items = filteredMaterials.map((item, index) => {
    const stock = Number(item.stock || 0);
    const price = Number(item.unit_price || 0);
    const totalValue = stock * price;

    totalItems++;
    if (stock === 0) emptyItems++;
    totalValuation += totalValue;

    return {
      no: index + 1,
      material_name: item.name,
      stock: stock,
      unit: item.unit || '-',
      unit_price: price.toLocaleString('id-ID'),
      total_value: totalValue.toLocaleString('id-ID'),
      status_label: item.is_active ? 'Aktif' : 'Non-aktif',
      status_class: item.is_active ? 'aktif' : 'nonaktif'
    };
  });

  return {
    items,
    summary: {
      total_materials: totalItems,
      empty_materials: emptyItems,
      total_valuation: `Rp ${totalValuation.toLocaleString('id-ID')}`,
      raw_total_valuation: totalValuation
    }
  };
}
