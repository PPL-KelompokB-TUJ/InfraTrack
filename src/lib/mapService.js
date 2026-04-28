import { supabase } from './supabaseClient';

/**
 * Get all damage reports with location data for map visualization
 */
export async function getDamageReportsForMap() {
  try {
    const { data: reports, error } = await supabase
      .from('damage_reports')
      .select(`
        id,
        ticket_code,
        damage_type_name,
        location_description,
        latitude,
        longitude,
        status,
        created_at,
        description
      `)
      .order('created_at', { ascending: false });

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
        damage_type_name,
        location_description,
        latitude,
        longitude,
        status,
        created_at,
        description
      `);

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
