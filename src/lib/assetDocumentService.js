import { supabase } from './supabaseClient';

const TABLE = 'asset_documents';
const BUCKET = 'asset-documents';

const DOC_TYPE_LABELS = {
  gambar_teknis: 'Gambar Teknis',
  spesifikasi: 'Spesifikasi',
  kontrak: 'Kontrak',
  lainnya: 'Lainnya',
};

export { DOC_TYPE_LABELS };

function buildDocPath(assetId, file) {
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin';
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${assetId}/${Date.now()}-${rand}.${ext}`;
}

/**
 * Upload a document file to storage and save metadata to DB.
 */
export async function uploadAssetDocument({ assetId, file, docType, description }) {
  const filePath = buildDocPath(assetId, file);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  // Signed URL (private bucket) — generate a long-lived URL for storage
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

  if (signedError) throw new Error(signedError.message);

  const { data: { user } } = await supabase.auth.getUser();

  const { error: dbError } = await supabase.from(TABLE).insert({
    asset_id: assetId,
    uploaded_by: user.id,
    name: file.name,
    file_path: filePath,
    file_url: signedData.signedUrl,
    file_size: file.size,
    file_type: file.type,
    doc_type: docType,
    description: description || null,
  });

  if (dbError) {
    // cleanup uploaded file on DB failure
    await supabase.storage.from(BUCKET).remove([filePath]);
    throw new Error(dbError.message);
  }
}

/**
 * Get all documents for an asset, with optional filters.
 */
export async function getAssetDocuments(assetId, { docType, dateFrom, dateTo } = {}) {
  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false });

  if (docType) query = query.eq('doc_type', docType);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Generate a fresh signed download URL for a document.
 */
export async function getDocumentDownloadUrl(filePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60 * 60); // 1 hour

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/**
 * Delete a document (storage + DB record).
 */
export async function deleteAssetDocument(id, filePath) {
  await supabase.storage.from(BUCKET).remove([filePath]);

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
