import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, readJson } from '../_shared/http.ts';
import { adminClient, getUserFromRequest, isAdminUser } from '../_shared/supabase.ts';

const allowedStatus = new Set(['terverifikasi', 'ditolak']);

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true }, 204);
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const { user, error } = await getUserFromRequest(request);
  if (error || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  if (!isAdminUser(user)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const payload = await readJson(request);
  if (!payload) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const reportId = String(payload.reportId || '').trim();
  const status = String(payload.status || '').trim();
  const verificationNotes = payload.verificationNotes ?? null;
  const priorityLevel = payload.priorityLevel ?? null;

  if (!reportId || !allowedStatus.has(status)) {
    return jsonResponse({ error: 'Payload tidak valid.' }, 400);
  }

  const updatePayload = {
    status,
    verification_notes: verificationNotes,
    priority_level: priorityLevel,
    verified_by: user.id,
    verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: report, error: updateError } = await adminClient
    .from('damage_reports')
    .update(updatePayload)
    .eq('id', reportId)
    .select()
    .single();

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  await adminClient
    .from('verification_audit_logs')
    .insert({
      damage_report_id: reportId,
      old_status: null,
      new_status: status,
      verified_by: user.id,
      verification_notes: verificationNotes,
      priority_level: priorityLevel,
    })
    .then(() => null)
    .catch(() => null);

  return jsonResponse({
    report,
  });
});
