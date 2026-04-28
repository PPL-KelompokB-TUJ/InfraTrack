import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, readJson } from '../_shared/http.ts';
import { adminClient, getUserFromRequest, isAdminUser } from '../_shared/supabase.ts';
import { generateTemporaryPassword } from '../_shared/password.ts';

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

  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();

  if (!name || !email) {
    return jsonResponse({ error: 'Nama dan email wajib diisi.' }, 400);
  }

  const temporaryPassword = generateTemporaryPassword();

  const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
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
    temporaryPassword,
  });
});
