import { supabase } from './supabaseClient';

const TABLE_NAME = 'infrastructure_assets';
const VIEW_NAME = 'infrastructure_assets_view';
const BUCKET_NAME = 'assets-photos';
const CATEGORY_TABLE = 'infrastructure_categories';

function toPoint(lat, lng) {
  const safeLat = Number(lat);
  const safeLng = Number(lng);

  if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) {
    throw new Error('Koordinat tidak valid.');
  }

  return `SRID=4326;POINT(${safeLng} ${safeLat})`;
}

function normalizeAsset(row) {
  return {
    ...row,
    lat: Number(row.lat),
    lng: Number(row.lng),
    year_built: Number(row.year_built),
  };
}

function buildPhotoPath(file) {
  const extension = file.name.includes('.')
    ? file.name.split('.').pop().toLowerCase()
    : 'jpg';
  const randomPart =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `assets/${Date.now()}-${randomPart}.${extension}`;
}

async function resolveInfrastructureCategoryIdByName(categoryName) {
  const normalizedCategoryName = String(categoryName || '').trim();

  if (!normalizedCategoryName) {
    throw new Error('Kategori infrastruktur tidak boleh kosong.');
  }

  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .select('id')
    .eq('name', normalizedCategoryName)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error(
      `Kategori "${normalizedCategoryName}" tidak ditemukan pada master data aktif.`
    );
  }

  return data.id;
}

export async function getInfrastructureAssets() {
  const { data, error } = await supabase
    .from(VIEW_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeAsset);
}

export async function uploadInfrastructureAssetPhoto(file) {
  if (!file) {
    return null;
  }

  const filePath = buildPhotoPath(file);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function createInfrastructureAsset(input) {
  const infrastructureCategoryId = await resolveInfrastructureCategoryIdByName(
    input.category
  );

  const payload = {
    name: input.name.trim(),
    infrastructure_category_id: infrastructureCategoryId,
    location: toPoint(input.lat, input.lng),
    condition: input.condition,
    year_built: Number(input.year_built),
    photo_url: input.photo_url || null,
  };

  const { error } = await supabase.from(TABLE_NAME).insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateInfrastructureAsset(id, input) {
  const infrastructureCategoryId = await resolveInfrastructureCategoryIdByName(
    input.category
  );

  const payload = {
    name: input.name.trim(),
    infrastructure_category_id: infrastructureCategoryId,
    location: toPoint(input.lat, input.lng),
    condition: input.condition,
    year_built: Number(input.year_built),
    photo_url: input.photo_url || null,
  };

  const { error } = await supabase.from(TABLE_NAME).update(payload).eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteInfrastructureAsset(id) {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
