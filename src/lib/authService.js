import { supabase } from './supabaseClient';

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

export function extractUserRole(user) {
  const roleFromAppMetadata = normalizeRole(user?.app_metadata?.role);
  const roleFromUserMetadata = normalizeRole(user?.user_metadata?.role);

  return roleFromAppMetadata || roleFromUserMetadata || 'citizen';
}

export function isAdminUser(user) {
  return extractUserRole(user) === 'admin';
}

export function isFieldOfficer(user) {
  return extractUserRole(user) === 'field_officer';
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

export async function signIn({ email, password }) {
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

  // Return the user with full metadata from the session
  return data.session?.user || data.user;
}

export async function signInAdmin({ email, password }) {
  const user = await signIn({ email, password });
  
  if (!isAdminUser(user)) {
    await signOutCurrentUser();
    throw new Error('Akun ini tidak memiliki role admin.');
  }

  return user;
}

export async function signOutCurrentUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}
