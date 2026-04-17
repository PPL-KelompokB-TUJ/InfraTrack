import { supabase } from './supabaseClient';

const CATEGORY_TABLE = 'infrastructure_categories';
const DAMAGE_TYPE_TABLE = 'damage_types';
const PRIORITY_SCALE_TABLE = 'priority_scales';

const FALLBACK_CATEGORY_OPTIONS = ['Jalan', 'Jembatan', 'Fasum'];
const FALLBACK_DAMAGE_TYPE_OPTIONS = [
  'Jalan berlubang',
  'Jembatan rusak',
  'Trotoar pecah',
  'Saluran macet',
  'Tiang roboh',
  'Lampu jalan rusak',
  'Marka kerusakan',
  'Lainnya',
];

function toBoolean(value) {
  return Boolean(value);
}

export async function getActiveInfrastructureCategoryNames() {
  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .select('name, is_default')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      return FALLBACK_CATEGORY_OPTIONS;
    }

    throw new Error(error.message);
  }

  const names = (data || []).map((item) => item.name);
  return names.length > 0 ? names : FALLBACK_CATEGORY_OPTIONS;
}

export async function getInfrastructureCategories() {
  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getActiveDamageTypeNames() {
  const { data, error } = await supabase
    .from(DAMAGE_TYPE_TABLE)
    .select('name, is_default')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      return FALLBACK_DAMAGE_TYPE_OPTIONS;
    }

    throw new Error(error.message);
  }

  const uniqueNames = [];
  const seen = new Set();

  for (const item of data || []) {
    const name = String(item.name || '').trim();
    const key = name.toLowerCase();

    if (!name || seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueNames.push(name);
  }

  return uniqueNames.length > 0 ? uniqueNames : FALLBACK_DAMAGE_TYPE_OPTIONS;
}

export async function createInfrastructureCategory(payload) {
  if (toBoolean(payload.is_default)) {
    const { error: resetError } = await supabase
      .from(CATEGORY_TABLE)
      .update({ is_default: false })
      .eq('is_default', true);

    if (resetError) {
      throw new Error(resetError.message);
    }
  }

  const { error } = await supabase.from(CATEGORY_TABLE).insert({
    name: payload.name.trim(),
    is_default: toBoolean(payload.is_default),
    is_active: toBoolean(payload.is_active),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateInfrastructureCategory(id, payload) {
  if (toBoolean(payload.is_default)) {
    const { error: resetError } = await supabase
      .from(CATEGORY_TABLE)
      .update({ is_default: false })
      .neq('id', id)
      .eq('is_default', true);

    if (resetError) {
      throw new Error(resetError.message);
    }
  }

  const { error } = await supabase
    .from(CATEGORY_TABLE)
    .update({
      name: payload.name.trim(),
      is_default: toBoolean(payload.is_default),
      is_active: toBoolean(payload.is_active),
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteInfrastructureCategory(id) {
  const { error } = await supabase.from(CATEGORY_TABLE).delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getDamageTypes() {
  const { data, error } = await supabase
    .from(DAMAGE_TYPE_TABLE)
    .select('id, name, infrastructure_category_id, is_default, is_active, created_at, updated_at, infrastructure_categories(name)')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => ({
    ...item,
    category_name: item.infrastructure_categories?.name || '-',
  }));
}

export async function createDamageType(payload) {
  if (toBoolean(payload.is_default)) {
    const { error: resetError } = await supabase
      .from(DAMAGE_TYPE_TABLE)
      .update({ is_default: false })
      .eq('is_default', true);

    if (resetError) {
      throw new Error(resetError.message);
    }
  }

  const { error } = await supabase.from(DAMAGE_TYPE_TABLE).insert({
    name: payload.name.trim(),
    infrastructure_category_id: payload.infrastructure_category_id,
    is_default: toBoolean(payload.is_default),
    is_active: toBoolean(payload.is_active),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateDamageType(id, payload) {
  if (toBoolean(payload.is_default)) {
    const { error: resetError } = await supabase
      .from(DAMAGE_TYPE_TABLE)
      .update({ is_default: false })
      .neq('id', id)
      .eq('is_default', true);

    if (resetError) {
      throw new Error(resetError.message);
    }
  }

  const { error } = await supabase
    .from(DAMAGE_TYPE_TABLE)
    .update({
      name: payload.name.trim(),
      infrastructure_category_id: payload.infrastructure_category_id,
      is_default: toBoolean(payload.is_default),
      is_active: toBoolean(payload.is_active),
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteDamageType(id) {
  const { error } = await supabase.from(DAMAGE_TYPE_TABLE).delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getPriorityScales() {
  const { data, error } = await supabase
    .from(PRIORITY_SCALE_TABLE)
    .select('*')
    .order('is_default', { ascending: false })
    .order('level', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function createPriorityScale(payload) {
  if (toBoolean(payload.is_default)) {
    const { error: resetError } = await supabase
      .from(PRIORITY_SCALE_TABLE)
      .update({ is_default: false })
      .eq('is_default', true);

    if (resetError) {
      throw new Error(resetError.message);
    }
  }

  const { error } = await supabase.from(PRIORITY_SCALE_TABLE).insert({
    name: payload.name.trim(),
    level: Number(payload.level),
    is_default: toBoolean(payload.is_default),
    is_active: toBoolean(payload.is_active),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePriorityScale(id, payload) {
  if (toBoolean(payload.is_default)) {
    const { error: resetError } = await supabase
      .from(PRIORITY_SCALE_TABLE)
      .update({ is_default: false })
      .neq('id', id)
      .eq('is_default', true);

    if (resetError) {
      throw new Error(resetError.message);
    }
  }

  const { error } = await supabase
    .from(PRIORITY_SCALE_TABLE)
    .update({
      name: payload.name.trim(),
      level: Number(payload.level),
      is_default: toBoolean(payload.is_default),
      is_active: toBoolean(payload.is_active),
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deletePriorityScale(id) {
  const { error } = await supabase.from(PRIORITY_SCALE_TABLE).delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
