import { supabase } from './supabaseClient';

async function resolveDamageTypeIdByName(damageTypeName) {
  const normalizedDamageTypeName = String(damageTypeName || '').trim();

  if (!normalizedDamageTypeName) {
    throw new Error('Jenis kerusakan tidak boleh kosong.');
  }

  const { data, error } = await supabase
    .from('damage_types')
    .select('id, is_default, created_at')
    .eq('name', normalizedDamageTypeName)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error(
      `Jenis kerusakan "${normalizedDamageTypeName}" tidak ditemukan pada master data aktif.`
    );
  }

  return data.id;
}

/**
 * Generate unique ticket code for damage reports
 * Format: INF-YYYYMMDD-XXXXX (where XXXXX is random)
 */
export const generateTicketCode = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase();
  return `INF-${year}${month}${day}-${random}`;
};

/**
 * Submit a damage report
 */
export const submitDamageReport = async ({
  reporterName,
  reporterEmail,
  reporterPhone,
  damageType,
  urgencyLevel,
  description,
  latitude,
  longitude,
  photoFile,
}) => {
  try {
    const damageTypeId = await resolveDamageTypeIdByName(damageType);
    let photoUrl = null;

    // Upload photo if provided
    if (photoFile) {
      const fileName = `damage-report-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('damage-reports')
        .upload(fileName, photoFile);

      if (uploadError) {
        throw new Error(`Gagal upload foto: ${uploadError.message}`);
      }

      // Get public URL
      const { data } = supabase.storage
        .from('damage-reports')
        .getPublicUrl(fileName);
      photoUrl = data.publicUrl;
    }

    // Generate ticket code
    const ticketCode = generateTicketCode();

    // Ensure ticket code is unique by checking if it already exists
    let uniqueCode = ticketCode;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const { data, error } = await supabase
        .from('damage_reports')
        .select('id')
        .eq('ticket_code', uniqueCode)
        .limit(1);

      if (error) throw error;
      if (data && data.length === 0) {
        isUnique = true;
      } else {
        uniqueCode = generateTicketCode();
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('Gagal generate kode tiket unik');
    }

    // Insert damage report
    const { data, error } = await supabase
      .from('damage_reports')
      .insert([
        {
          reporter_name: reporterName,
          reporter_email: reporterEmail,
          reporter_phone: reporterPhone,
          damage_type_id: damageTypeId,
          urgency_level: urgencyLevel,
          description,
          photo_url: photoUrl,
          location: `POINT(${longitude} ${latitude})`,
          latitude,
          longitude,
          ticket_code: uniqueCode,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal submit laporan: ${error.message}`);
    }

    return {
      success: true,
      ticketCode: uniqueCode,
      report: data,
    };
  } catch (error) {
    console.error('Error submitting damage report:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get damage report by ticket code
 */
export const getDamageReportByTicket = async (ticketCode) => {
  try {
    const { data, error } = await supabase
      .from('damage_reports_public')
      .select('*')
      .eq('ticket_code', ticketCode)
      .single();

    if (error) {
      throw new Error(`Laporan tidak ditemukan: ${error.message}`);
    }

    return {
      success: true,
      report: data,
    };
  } catch (error) {
    console.error('Error fetching damage report:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get all damage reports (admin only - should be protected on backend)
 */
export const getAllDamageReports = async ({
  status = null,
  limit = 50,
  offset = 0,
} = {}) => {
  try {
    let query = supabase
      .from('damage_reports')
      .select('*, damage_types(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      success: true,
      reports: (data || []).map((item) => ({
        ...item,
        damage_type: item.damage_types?.name || '-',
      })),
      total: count,
    };
  } catch (error) {
    console.error('Error fetching damage reports:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update damage report status (admin only)
 */
export const updateDamageReportStatus = async (reportId, status, notes = null) => {
  try {
    const { data, error } = await supabase
      .from('damage_reports')
      .update({ status, updated_at: new Date() })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      report: data,
    };
  } catch (error) {
    console.error('Error updating damage report:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get recent damage reports for dashboard (with damage type, asset info)
 * Fetches latest reports with full details
 */
export const getRecentDamageReports = async (limit = 10) => {
  try {
    // Get recent reports
    const { data: reports, error: reportsError } = await supabase
      .from('damage_reports')
      .select(
        'id, ticket_code, damage_type_id, urgency_level, status, description, latitude, longitude, created_at, reporter_name, asset_id'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reportsError) {
      throw reportsError;
    }

    if (!reports || reports.length === 0) {
      return {
        success: true,
        reports: [],
      };
    }

    // Fetch damage types
    const damageTypeIds = [...new Set(reports.map((r) => r.damage_type_id))];
    const { data: damageTypes, error: damageTypesError } = await supabase
      .from('damage_types')
      .select('id, name')
      .in('id', damageTypeIds);

    if (damageTypesError) {
      console.warn('Warning: Could not fetch damage types:', damageTypesError);
    }

    const damageTypeMap = {};
    (damageTypes || []).forEach((dt) => {
      damageTypeMap[dt.id] = dt.name;
    });

    // Fetch asset info
    const assetIds = [...new Set(reports.map((r) => r.asset_id).filter(Boolean))];
    const { data: assets, error: assetsError } = await supabase
      .from('infrastructure_assets')
      .select('id, name, location')
      .in('id', assetIds);

    if (assetsError) {
      console.warn('Warning: Could not fetch assets:', assetsError);
    }

    const assetMap = {};
    (assets || []).forEach((asset) => {
      assetMap[asset.id] = asset;
    });

    // Enrich reports with damage type and asset info
    const enrichedReports = reports.map((report) => ({
      ...report,
      damage_type_name: damageTypeMap[report.damage_type_id] || '-',
      asset_name: report.asset_id ? assetMap[report.asset_id]?.name || '-' : '-',
      location_description:
        report.latitude && report.longitude
          ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
          : '-',
    }));

    return {
      success: true,
      reports: enrichedReports,
    };
  } catch (error) {
    console.error('Error fetching recent damage reports:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
