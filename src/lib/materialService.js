import { supabase } from './supabaseClient';

// ==========================================
// Materials Management
// ==========================================

export async function getMaterials(activeOnly = false) {
  let query = supabase.from('materials').select('*').order('name', { ascending: true });
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getInventoryHistory(materialId = null) {
  let query = supabase
    .from('inventory_history')
    .select(`
      *,
      materials (name, unit),
      users!actor_id (name)
    `)
    .order('created_at', { ascending: false });

  if (materialId) {
    query = query.eq('material_id', materialId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createMaterial(materialData) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('materials')
    .insert([materialData])
    .select()
    .single();

  if (error) throw error;

  // Log to history
  await supabase.from('inventory_history').insert({
    material_id: data.id,
    action_type: 'Material Baru',
    quantity_change: data.stock,
    stock_before: 0,
    stock_after: data.stock,
    unit_price: data.unit_price,
    actor_id: user?.id,
    reference_note: 'Penambahan material baru'
  });

  return data;
}

export async function updateMaterial(id, materialData) {
  const { data: { user } } = await supabase.auth.getUser();

  // Get current state to log 'stock_before'
  const oldData = await getMaterialById(id);

  const { data, error } = await supabase
    .from('materials')
    .update(materialData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log to history
  await supabase.from('inventory_history').insert({
    material_id: id,
    action_type: 'Edit Data',
    quantity_change: data.stock - oldData.stock,
    stock_before: oldData.stock,
    stock_after: data.stock,
    unit_price: data.unit_price,
    actor_id: user?.id,
    reference_note: 'Pembaruan data/harga material'
  });

  return data;
}

export async function deleteMaterial(id) {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function restockMaterial(id, newStock, referenceNote = 'Restok material') {
  const { data: { user } } = await supabase.auth.getUser();

  // Get current state
  const oldData = await getMaterialById(id);
  const quantityChange = newStock - oldData.stock;

  const { data, error } = await supabase
    .from('materials')
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log to history
  await supabase.from('inventory_history').insert({
    material_id: id,
    action_type: 'Restok',
    quantity_change: quantityChange,
    stock_before: oldData.stock,
    stock_after: newStock,
    unit_price: oldData.unit_price,
    actor_id: user?.id,
    reference_note: referenceNote
  });

  return data;
}

// ==========================================
// Material Usages
// ==========================================

export async function getMaterialUsages(taskId) {
  const { data, error } = await supabase
    .from('material_usages')
    .select(`
      *,
      materials:material_id (name, unit),
      users:reported_by (name)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addMaterialUsage(usageDataArray) {
  // Check if it's an array for bulk insert, if not, wrap it in array
  const dataToInsert = Array.isArray(usageDataArray) ? usageDataArray : [usageDataArray];
  
  const { data, error } = await supabase
    .from('material_usages')
    .insert(dataToInsert)
    .select();

  if (error) throw error;
  
  // Return single if it was not an array initially (backward compatibility), else return array
  return Array.isArray(usageDataArray) ? data : data[0];
}

export async function getMaterialById(id) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}
