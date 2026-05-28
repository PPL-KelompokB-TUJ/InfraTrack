import { getSupabaseClient } from '../services/exportService.js';
import { exportQueue } from '../queues/exportQueue.js';

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

  // Check role in user metadata / app metadata
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
 * POST /api/export
 * Trigger a report export in the background
 */
export async function triggerExport(req, res) {
  try {
    const { reportType, format, filters = {} } = req.body;

    if (!reportType || !format) {
      return res.status(400).json({ error: 'Parameter reportType dan format wajib diisi.' });
    }

    // 1. Verify admin role
    const { supabase, token, user } = await validateAdminSession(req);

    // Save printedBy in filters for PDF rendering
    filters.printedBy = user.user_metadata?.name || user.email;

    // 2. Insert record in export_history (sets initial status to 'pending')
    const { data: jobRecord, error: insertError } = await supabase
      .from('export_history')
      .insert({
        report_type: reportType,
        format: format,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting export history record:', insertError);
      return res.status(500).json({ error: `Gagal membuat record ekspor: ${insertError.message}` });
    }

    // 3. Queue Bull job to execute async
    await exportQueue.add({
      jobId: jobRecord.id,
      reportType,
      format,
      filters,
      accessToken: token,
    }, {
      jobId: jobRecord.id, // Assign matching job ID for easy monitoring if needed
      removeOnComplete: true, // Auto clean Bull job on success
      removeOnFail: false,   // Keep on fail to investigate errors
    });

    console.log(`Export job queued in Bull: Job ID ${jobRecord.id}`);

    // Respond immediately with the job ID and details to prevent UI block
    return res.status(202).json({
      success: true,
      message: 'Proses ekspor telah dijadwalkan di background.',
      job: jobRecord
    });

  } catch (error) {
    console.error('Error triggering export:', error.message);
    const status = error.message.includes('forbidden') ? 403 : error.message.includes('auth') ? 401 : 500;
    return res.status(status).json({ error: error.message });
  }
}

/**
 * GET /api/export/history
 * Fetch previous export job histories
 */
export async function getExportHistory(req, res) {
  try {
    // 1. Verify admin role
    const { supabase } = await validateAdminSession(req);

    // 2. Query history list
    const { data: history, error: fetchError } = await supabase
      .from('export_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      return res.status(500).json({ error: `Gagal mengambil riwayat ekspor: ${fetchError.message}` });
    }

    return res.json({ success: true, history });

  } catch (error) {
    console.error('Error fetching export history:', error.message);
    const status = error.message.includes('forbidden') ? 403 : error.message.includes('auth') ? 401 : 500;
    return res.status(status).json({ error: error.message });
  }
}

/**
 * GET /api/export/status/:id
 * Poll status of a specific background export job
 */
export async function getExportStatus(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID ekspor diperlukan.' });
    }

    // 1. Verify admin session
    const { supabase } = await validateAdminSession(req);

    // 2. Query specific record
    const { data: record, error: fetchError } = await supabase
      .from('export_history')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: `Record ekspor tidak ditemukan: ${fetchError.message}` });
    }

    return res.json({
      success: true,
      job: record
    });

  } catch (error) {
    console.error('Error fetching export status:', error.message);
    const status = error.message.includes('forbidden') ? 403 : error.message.includes('auth') ? 401 : 500;
    return res.status(status).json({ error: error.message });
  }
}
