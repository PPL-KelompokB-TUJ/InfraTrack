import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, readJson } from '../_shared/http.ts';
import { adminClient, getUserFromRequest, isAdminUser } from '../_shared/supabase.ts';

const DEFAULT_PASSWORD = '1234';

/**
 * Generate default email from officer name.
 * Example: "Ahmad Sutrisno" -> "ahmadsutrisno@gmail.com"
 */
function generateDefaultEmail(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${sanitized}@gmail.com`;
}

serve(async (request) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
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

  const name = String(payload.name || '').trim();

  if (!name) {
    return jsonResponse({ error: 'Nama petugas wajib diisi.' }, 400);
  }

  // Auto-generate email from name, or use provided email if given
  const email = payload.email
    ? String(payload.email).trim().toLowerCase()
    : generateDefaultEmail(name);

  const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    app_metadata: { role: 'field_officer' },
    user_metadata: { role: 'field_officer', name },
  });

  if (createAuthError || !createdAuth?.user) {
    const message = createAuthError?.message || 'Gagal membuat akun auth.';
    const status = message.toLowerCase().includes('already') ? 409 : 500;
    return jsonResponse({ error: message }, status);
  }

  const userId = createdAuth.user.id;

  const { data: userRow, error: userRowError } = await adminClient
    .from('users')
    .upsert(
      [
        {
          id: userId,
          name,
          email,
          role: 'field_officer',
          is_active: true,
        },
      ],
      { onConflict: 'id' }
    )
    .select('id, name, email, role, is_active')
    .single();

  if (userRowError) {
    return jsonResponse({ error: userRowError.message }, 500);
  }

  const profilePayload = {
    user_id: userId,
    specialization: payload.specialization || null,
    work_area: payload.work_area || null,
    phone: payload.phone || null,
  };

  const { error: profileError } = await adminClient
    .from('user_profiles')
    .upsert([profilePayload], { onConflict: 'user_id' });

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500);
  }

  return jsonResponse({
    user: userRow,
    defaultEmail: email,
    defaultPassword: DEFAULT_PASSWORD,
  });
});
