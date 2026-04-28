const baseHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...baseHeaders, ...corsHeaders, ...headers },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch (_error) {
    return null;
  }
}
