import { supabase } from './supabaseClient';

/**
 * Get asset condition statistics
 * Returns count of assets by condition (good/light damage/heavy damage)
 */
export async function getAssetConditionStats() {
  try {
    // Get all assets with their damage reports
    const { data: assets, error: assetsError } = await supabase
      .from('infrastructure_assets')
      .select('id, condition, created_at');

    if (assetsError) throw assetsError;

    // Count assets by condition using the actual schema values
    const stats = {
      good: 0,
      light_damage: 0,
      heavy_damage: 0,
    };

    const conditionMap = {
      baik: 'good',
      'rusak ringan': 'light_damage',
      'rusak berat': 'heavy_damage',
    };

    assets?.forEach(asset => {
      const conditionKey = conditionMap[String(asset.condition || 'baik').toLowerCase()] || 'good';
      stats[conditionKey]++;
    });

    return {
      success: true,
      stats,
      total: assets?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stats: { good: 0, light_damage: 0, heavy_damage: 0 },
    };
  }
}

/**
 * Get damage reports by status
 * Returns count of reports grouped by status (pending/verified/completed)
 */
export async function getDamageReportStats() {
  try {
    const { data: reports, error } = await supabase
      .from('damage_reports')
      .select('id, status, created_at');

    if (error) throw error;

    const stats = {
      pending: 0,
      terverifikasi: 0,
      selesai: 0,
      ditolak: 0,
    };

    reports?.forEach(report => {
      const status = report.status || 'pending';
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });

    return {
      success: true,
      stats,
      total: reports?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stats: { pending: 0, terverifikasi: 0, selesai: 0, ditolak: 0 },
    };
  }
}

/**
 * Get maintenance KPIs
 * Returns average completion time and on-time completion percentage
 */
export async function getMaintenanceKPIs() {
  try {
    const { data: tasks, error } = await supabase
      .from('maintenance_tasks')
      .select('id, status, created_at, updated_at, scheduled_date');

    if (error) throw error;

    let totalCompletionTime = 0;
    let completedTasks = 0;
    let onTimeCount = 0;

    tasks?.forEach(task => {
      if (task.status === 'completed' && task.updated_at) {
        completedTasks++;
        
        const createdDate = new Date(task.created_at);
        const completedDate = new Date(task.updated_at);
        const completionTime = Math.max(0, Math.ceil((completedDate - createdDate) / (1000 * 60 * 60 * 24))); // in days
        
        totalCompletionTime += completionTime;

        // Check if completed before scheduled date
        if (task.scheduled_date) {
          const scheduledDate = new Date(task.scheduled_date);
          if (completedDate <= scheduledDate) {
            onTimeCount++;
          }
        }
      }
    });

    const avgCompletionTime = completedTasks > 0 ? Math.round(totalCompletionTime / completedTasks) : 0;
    const onTimePercentage = completedTasks > 0 ? Math.round((onTimeCount / completedTasks) * 100) : 0;

    return {
      success: true,
      kpis: {
        avgCompletionTime,
        onTimePercentage,
        totalCompleted: completedTasks,
        totalTasks: tasks?.length || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      kpis: {
        avgCompletionTime: 0,
        onTimePercentage: 0,
        totalCompleted: 0,
        totalTasks: 0,
      },
    };
  }
}

/**
 * Get damage trend data
 * Returns damage reports grouped by period (weekly or monthly)
 */
export async function getDamageTrend(period = 'monthly', monthsBack = 6) {
  try {
    const { data: reports, error } = await supabase
      .from('damage_reports')
      .select('id, created_at, status')
      .gte('created_at', new Date(Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const trendData = {};

    reports?.forEach(report => {
      const date = new Date(report.created_at);
      let key;
      let sortKey;

      if (period === 'weekly') {
        const year = date.getFullYear();
        const week = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7);
        key = `Week ${week} ${date.toLocaleString('id-ID', { month: 'short' })}`;
        sortKey = new Date(year, date.getMonth(), date.getDate()).getTime();
      } else {
        key = date.toLocaleString('id-ID', { year: 'numeric', month: 'short' });
        sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      }

      if (!trendData[key]) {
        trendData[key] = { period: key, total: 0, completed: 0, pending: 0, sortKey };
      }

      trendData[key].total++;
      if (report.status === 'selesai') {
        trendData[key].completed++;
      } else if (report.status === 'pending') {
        trendData[key].pending++;
      }
    });

    // Convert to array format for charts and sort chronologically (oldest to newest)
    const trendArray = Object.values(trendData)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, ...data }) => data);

    return {
      success: true,
      trend: trendArray,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      trend: [],
    };
  }
}

/**
 * Get comprehensive dashboard data
 * Combines all dashboard data in one call
 */
export async function getComprehensiveDashboardData(period = 'monthly') {
  try {
    const [
      assetCondition,
      damageReports,
      maintenanceKPIs,
      damageTrend,
    ] = await Promise.all([
      getAssetConditionStats(),
      getDamageReportStats(),
      getMaintenanceKPIs(),
      getDamageTrend(period, 6),
    ]);

    return {
      success: true,
      data: {
        assetCondition: assetCondition.stats,
        damageReports: damageReports.stats,
        maintenanceKPIs: maintenanceKPIs.kpis,
        damageTrend: damageTrend.trend,
        totals: {
          totalAssets: assetCondition.total,
          totalReports: damageReports.total,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
