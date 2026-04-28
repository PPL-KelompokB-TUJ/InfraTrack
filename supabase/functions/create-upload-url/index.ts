import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, readJson } from '../_shared/http.ts';
import { adminClient, getUserFromRequest } from '../_shared/supabase.ts';

const bucketRules = {
  'maintenance-progress-photos': { requireAuth: true, enforceOwnerPrefix: true },
  'maintenance-progress': { requireAuth: true, enforceOwnerPrefix: true },
  'assets-photos': { requireAuth: true, enforceOwnerPrefix: true },
  'damage-reports': { requireAuth: false, enforceOwnerPrefix: false },
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true }, 204);
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const payload = await readJson(request);
  if (!payload) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const bucket = String(payload.bucket || '').trim();
  const path = String(payload.path || '').trim();

  if (!bucket || !path || !bucketRules[bucket]) {
    return jsonResponse({ error: 'Bucket/path tidak valid.' }, 400);
  }

  if (path.includes('..') || path.startsWith('/')) {
    return jsonResponse({ error: 'Path tidak valid.' }, 400);
  }

  const rule = bucketRules[bucket];
  let userId = null;

  if (rule.requireAuth) {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    userId = user.id;
  }

  if (rule.enforceOwnerPrefix && userId && !path.startsWith(`${userId}/`)) {
    return jsonResponse({ error: 'Path harus diawali userId.' }, 400);
  }

  const { data, error } = await adminClient.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return jsonResponse({ error: error?.message || 'Gagal membuat signed URL.' }, 500);
  }

  return jsonResponse({
    signedUrl: data.signedUrl,
    path: data.path,
  });
});
