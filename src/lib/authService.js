import { supabase } from './supabaseClient';

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

export function extractUserRole(user) {
  const roleFromAppMetadata = normalizeRole(user?.app_metadata?.role);
  const roleFromUserMetadata = normalizeRole(user?.user_metadata?.role);

  return roleFromAppMetadata || roleFromUserMetadata || 'user';
}

export function isAdminUser(user) {
  return extractUserRole(user) === 'admin';
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export function subscribeToAuthChanges(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

export async function signInAdmin({ email, password }) {
  const normalizedEmail = String(email || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error('Email dan password wajib diisi.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

export async function signOutCurrentUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}
