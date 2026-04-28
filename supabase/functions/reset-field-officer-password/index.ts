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

  const inputUserId = String(payload.userId || '').trim();
  const inputEmail = String(payload.email || '').trim().toLowerCase();

  if (!inputUserId && !inputEmail) {
    return jsonResponse({ error: 'userId atau email wajib diisi.' }, 400);
  }

  let userId = inputUserId;
  let email = inputEmail;

  if (!userId) {
    const { data, error: lookupError } = await adminClient.auth.admin.getUserByEmail(email);
    if (lookupError || !data?.user) {
      return jsonResponse({ error: 'User tidak ditemukan.' }, 404);
    }
    userId = data.user.id;
    email = data.user.email || email;
  }

  const temporaryPassword = generateTemporaryPassword();
  const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
    userId,
    { password: temporaryPassword }
  );

  if (updateError || !updatedUser?.user) {
    return jsonResponse({ error: updateError?.message || 'Gagal reset password.' }, 500);
  }

  return jsonResponse({
    userId,
    email,
    temporaryPassword,
  });
});
