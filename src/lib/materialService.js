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

export async function createMaterial(materialData) {
  const { data, error } = await supabase
    .from('materials')
    .insert([materialData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMaterial(id, materialData) {
  const { data, error } = await supabase
    .from('materials')
    .update(materialData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
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

export async function restockMaterial(id, newStock) {
  const { data, error } = await supabase
    .from('materials')
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
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
