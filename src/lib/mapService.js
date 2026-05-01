import { supabase } from './supabaseClient';

/**
 * Get all damage reports with location data for map visualization
 */
export async function getActiveDamageReportsForMap() {
  try {
    const { data: reports, error } = await supabase
      .from('damage_reports')
      .select(`
        id,
        ticket_code,
        damage_type_id,
        damage_types(name),
        latitude,
        longitude,
        status,
        created_at,
        description,
        location
      `)
      .in('status', ['pending', 'terverifikasi'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map nested damage_types to damage_type_name
    const mappedReports = (reports || []).map(r => ({
      ...r,
      damage_type_name: r.damage_types?.name || 'Unknown',
      location_description: r.description || 'Lokasi laporan',
    }));

    console.log('Active damage reports loaded:', mappedReports?.length, mappedReports);

    return {
      success: true,
      reports: mappedReports,
    };
  } catch (error) {
    console.error('Error loading active damage reports:', error);
    return {
      success: false,
      error: error.message,
      reports: [],
    };
  }
}

export async function getDamageReportsForMap() {
  return getActiveDamageReportsForMap();
}

export async function getInfrastructureAssetsForMap() {
  try {
    const { data: assets, error } = await supabase
      .from('infrastructure_assets_view')
      .select(`
        id,
        name,
        condition,
        year_built,
        lat,
        lng,
        photo_url,
        description,
        category_name,
        infrastructure_category_name
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      assets: (assets || []).map((row) => ({
        ...row,
        lat: Number(row.lat ?? row.latitude),
        lng: Number(row.lng ?? row.longitude),
        category_name: row.category_name || row.infrastructure_category_name || 'Aset Infrastruktur',
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      assets: [],
    };
  }
}

/**
 * Get all damage types/categories
 */
export async function getDamageCategories() {
  try {
    const { data: categories, error } = await supabase
      .from('damage_types')
      .select('id, name, description')
      .order('name');

    if (error) throw error;

    return {
      success: true,
      categories: categories || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      categories: [],
    };
  }
}

/**
 * Get damage reports filtered by category
 */
export async function getDamageReportsByCategory(categoryId) {
  try {
    let query = supabase
      .from('damage_reports')
      .select(`
        id,
        ticket_code,
        damage_type_id,
        damage_type_name,
        location_description,
        latitude,
        longitude,
        status,
        created_at,
        description
      `)
      .in('status', ['pending', 'terverifikasi']);

    if (categoryId) {
      query = query.eq('damage_type_id', categoryId);
    }

    const { data: reports, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      reports: reports || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      reports: [],
    };
  }
}

/**
 * Calculate priority score based on status and damage type
 */
export function calculatePriorityScore(report) {
  let score = 50; // base score

  // Adjust based on status
  if (report.status === 'pending') score += 30;
  else if (report.status === 'terverifikasi') score += 20;
  else if (report.status === 'selesai') score -= 40;

  return Math.min(100, Math.max(0, score));
}

/**
 * Get priority level based on score
 */
export function getPriorityLevel(score) {
  if (score > 80) return 'critical';
  if (score > 60) return 'high';
  if (score > 40) return 'moderate';
  return 'low';
}
