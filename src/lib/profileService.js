import { supabase } from './supabaseClient';

/**
 * Get the current authenticated user's profile from the users + user_profiles tables.
 */
export async function getProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('Tidak terautentikasi.');

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, profile_photo')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  // fetch phone separately to avoid schema-cache join issues
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('phone')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    name: data?.name ?? user.user_metadata?.full_name ?? '',
    email: data?.email ?? user.email ?? '',
    role: data?.role ?? user.app_metadata?.role ?? user.user_metadata?.role ?? '',
    profile_photo: data?.profile_photo ?? user.user_metadata?.avatar_url ?? '',
    phone: profileData?.phone ?? '',
  };
}

/**
 * Update name, phone, and/or profile_photo for the current user.
 * Also syncs display name and avatar_url to auth user_metadata
 * so that the session subscription immediately reflects the changes.
 */
export async function updateProfile({ name, phone, profile_photo }) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('Tidak terautentikasi.');

  // ── update public.users ────────────────────────────────────────────
  const userUpdates = {};
  if (name !== undefined) userUpdates.name = name.trim();
  if (profile_photo !== undefined) userUpdates.profile_photo = profile_photo;

  if (Object.keys(userUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', user.id);
    if (updateError) throw new Error(updateError.message);
  }

  // ── upsert public.user_profiles (phone) ───────────────────────────
  if (phone !== undefined) {
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ phone: phone.trim() })
        .eq('user_id', user.id);
      if (profileError) throw new Error(profileError.message);
    } else {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({ user_id: user.id, phone: phone.trim() });
      if (profileError) throw new Error(profileError.message);
    }
  }

  // ── sync to auth user_metadata so navbar reacts instantly ─────────
  const metaUpdates = {};
  if (name !== undefined) metaUpdates.full_name = name.trim();
  if (profile_photo !== undefined) metaUpdates.avatar_url = profile_photo;

  if (Object.keys(metaUpdates).length > 0) {
    const { error: metaError } = await supabase.auth.updateUser({
      data: metaUpdates,
    });
    if (metaError) throw new Error(metaError.message);
  }
}

/**
 * Upload an avatar file to the "avatars" storage bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadAvatar(file) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('Tidak terautentikasi.');

  const ext = file.name.split('.').pop().toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
  if (!allowedExts.includes(ext)) {
    throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
  }

  const filePath = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  // append cache-buster so the browser re-fetches the new image
  return `${publicUrl}?t=${Date.now()}`;
}

/**
 * Change the current user's password.
 * Verifies the old password by re-authenticating before updating.
 */
export async function changePassword({ currentPassword, newPassword }) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('Tidak terautentikasi.');

  if (!newPassword || newPassword.length < 8) {
    throw new Error('Kata sandi baru minimal 8 karakter.');
  }

  // Re-authenticate with the old password first
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    throw new Error('Kata sandi lama tidak sesuai. Periksa kembali dan coba lagi.');
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) throw new Error(updateError.message);
}
