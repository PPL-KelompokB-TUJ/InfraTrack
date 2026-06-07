import { getSupabaseClient } from '../services/exportService.js';

/**
 * Helper to check if caller is an Admin in Supabase
 */
async function validateAdminSession(req) {
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

  const isAdmin = 
    user.app_metadata?.role === 'admin' || 
    user.user_metadata?.role === 'admin' ||
    user.role === 'admin';

  if (!isAdmin) {
    throw new Error('Access forbidden: Administrator privileges required.');
  }

  return { supabase, token, user };
}

/**
 * GET /api/budgets
 * Fetch all budgets with maintenance task and asset details
 */
export async function getBudgets(req, res, next) {
  try {
    const { supabase } = await validateAdminSession(req);

    // 1. Fetch budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });

    if (budgetsError) throw budgetsError;

    if (!budgets || budgets.length === 0) {
      return res.json({ success: true, budgets: [] });
    }

    // 2. Fetch tasks corresponding to these budgets
    const taskIds = budgets.map(b => b.task_id);
    const { data: tasks, error: tasksError } = await supabase
      .from('maintenance_tasks')
      .select(`
        id,
        scheduled_date,
        status,
        instructions,
        asset:infrastructure_assets!maintenance_tasks_asset_id_fkey(id, name),
        report:damage_reports!maintenance_tasks_report_id_fkey(id, ticket_code)
      `)
      .in('id', taskIds);

    if (tasksError) throw tasksError;

    // 3. Map tasks by ID
    const tasksMap = new Map();
    if (tasks) {
      tasks.forEach(t => {
        tasksMap.set(t.id, t);
      });
    }

    // 4. Merge budgets with their task details
    const mergedBudgets = budgets.map(b => ({
      ...b,
      task: tasksMap.get(b.task_id) || null
    }));

    return res.json({ success: true, budgets: mergedBudgets });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/budgets/task/:taskId
 * Fetch budget by task ID
 */
export async function getBudgetByTaskId(req, res, next) {
  try {
    const { taskId } = req.params;
    const { supabase } = await validateAdminSession(req);

    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) throw error;

    return res.json({ success: true, budget });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/budgets
 * Create a new budget record
 */
export async function createBudget(req, res, next) {
  try {
    const { task_id, estimated_cost, actual_cost } = req.body;
    if (!task_id) {
      return res.status(400).json({ error: 'task_id is required' });
    }

    const { supabase } = await validateAdminSession(req);

    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        task_id,
        estimated_cost: estimated_cost || 0,
        actual_cost: actual_cost || null
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, budget });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/budgets/task/:taskId
 * Update or upsert a budget record by task ID
 */
export async function updateBudgetByTaskId(req, res, next) {
  try {
    const { taskId } = req.params;
    const { estimated_cost, actual_cost } = req.body;
    const { supabase } = await validateAdminSession(req);

    const { data: budget, error } = await supabase
      .from('budgets')
      .upsert(
        {
          task_id: taskId,
          estimated_cost: estimated_cost !== undefined ? estimated_cost : 0,
          actual_cost: actual_cost !== undefined ? actual_cost : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'task_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, budget });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/budgets/:id
 * Delete a budget record by ID
 */
export async function deleteBudget(req, res, next) {
  try {
    const { id } = req.params;
    const { supabase } = await validateAdminSession(req);

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/budgets/aggregation
 * Aggregates estimated and actual cost by period (monthly/yearly)
 */
export async function getBudgetAggregation(req, res, next) {
  try {
    const { period = 'monthly' } = req.query;
    const { supabase } = await validateAdminSession(req);

    // 1. Fetch budgets
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('task_id, estimated_cost, actual_cost');

    if (budgetError) throw budgetError;

    if (!budgets || budgets.length === 0) {
      return res.json({ success: true, items: [] });
    }

    // 2. Fetch scheduled dates for those tasks
    const taskIds = budgets.map(b => b.task_id);
    const tasksMap = new Map();

    if (taskIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('maintenance_tasks')
        .select('id, scheduled_date')
        .in('id', taskIds);

      if (!tasksError && tasks) {
        tasks.forEach(t => {
          tasksMap.set(t.id, t.scheduled_date);
        });
      }
    }

    const periodsMap = {};

    budgets.forEach((b) => {
      const dateStr = tasksMap.get(b.task_id);
      if (!dateStr) return;

      const date = new Date(dateStr);
      let periodKey = '';

      if (period === 'yearly') {
        periodKey = `${date.getFullYear()}`;
      } else {
        // monthly: e.g. "2024-10"
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        periodKey = `${year}-${month}`;
      }

      if (!periodsMap[periodKey]) {
        periodsMap[periodKey] = {
          period: periodKey,
          estimated: 0,
          actual: 0,
        };
      }

      periodsMap[periodKey].estimated += Number(b.estimated_cost || 0);
      periodsMap[periodKey].actual += Number(b.actual_cost || 0);
    });

    const items = Object.values(periodsMap).sort((a, b) =>
      a.period.localeCompare(b.period)
    );

    return res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
}
