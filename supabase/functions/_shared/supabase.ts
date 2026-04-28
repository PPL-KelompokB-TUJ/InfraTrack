import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('Supabase environment variables are missing.');
}

export const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export function createUserClient(request) {
  const authHeader = request.headers.get('Authorization') ?? '';

  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

export async function getUserFromRequest(request) {
  const client = createUserClient(request);
  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) {
    return { user: null, error: error?.message || 'Unauthorized' };
  }

  return { user: data.user, error: null };
}

export function isAdminUser(user) {
  const appRole = String(user?.app_metadata?.role || '').toLowerCase();
  const userRole = String(user?.user_metadata?.role || '').toLowerCase();
  return appRole === 'admin' || userRole === 'admin';
}
