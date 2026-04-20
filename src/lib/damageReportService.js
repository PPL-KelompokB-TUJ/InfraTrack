import { supabase } from './supabaseClient';

/**
 * Convert WebP or other image formats to JPG
 */
async function convertImageToJpg(file) {
  // If not WebP, return original file
  if (file.type !== 'image/webp') {
    return file;
  }

  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                throw new Error('Gagal mendapatkan canvas context');
              }
              
              ctx.fillStyle = 'white'; // white background for PNG transparency
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              
              canvas.toBlob(
                (blob) => {
                  try {
                    if (!blob) {
                      throw new Error('Gagal membuat blob dari canvas');
                    }
                    
                    // Create a new File object from the blob
                    const jpgFile = new File([blob], file.name.replace('.webp', '.jpg'), {
                      type: 'image/jpeg',
                      lastModified: file.lastModified,
                    });
                    resolve(jpgFile);
                  } catch (err) {
                    reject(err);
                  }
                },
                'image/jpeg',
                0.95 // 95% quality
              );
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error('Gagal memproses gambar'));
          img.src = e.target.result;
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
}

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
      try {
        // Convert WebP to JPG if needed
        const fileToUpload = await convertImageToJpg(photoFile);
        
        const fileName = `damage-report-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('damage-reports')
          .upload(fileName, fileToUpload);

        if (uploadError) {
          throw new Error(`Gagal upload foto: ${uploadError.message}`);
        }

        // Get public URL
        const { data } = supabase.storage
          .from('damage-reports')
          .getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      } catch (photoError) {
        throw new Error(`Gagal memproses foto: ${photoError.message}`);
      }
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
    // Get report with damage type
    const { data: report, error: reportError } = await supabase
      .from('damage_reports')
      .select('*')
      .eq('ticket_code', ticketCode)
      .single();

    if (reportError) {
      throw new Error(`Laporan tidak ditemukan: ${reportError.message}`);
    }

    if (!report) {
      throw new Error('Laporan tidak ditemukan');
    }

    // Fetch damage type name
    let damageTypeName = '-';
    if (report.damage_type_id) {
      const { data: damageType } = await supabase
        .from('damage_types')
        .select('name')
        .eq('id', report.damage_type_id)
        .single();
      
      damageTypeName = damageType?.name || '-';
    }

    // Fetch asset info
    let assetName = '-';
    if (report.asset_id) {
      const { data: asset } = await supabase
        .from('infrastructure_assets')
        .select('name')
        .eq('id', report.asset_id)
        .single();
      
      assetName = asset?.name || '-';
    }

    // Enrich report data
    const enrichedReport = {
      ...report,
      damage_type_name: damageTypeName,
      asset_name: assetName,
      location_description: report.latitude && report.longitude
        ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
        : '-'
    };

    return {
      success: true,
      report: enrichedReport,
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
    // Get recent reports with damage type JOIN
    const { data: reports, error: reportsError } = await supabase
      .from('damage_reports')
      .select(
        'id, ticket_code, damage_type_id, urgency_level, status, description, latitude, longitude, created_at, reporter_name, asset_id, photo_url, damage_types(name)'
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
      damage_type_name: report.damage_types?.name || '-',
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

/**
 * Get pending damage reports for admin verification
 */
export const getPendingDamageReports = async ({ limit = 50, offset = 0 } = {}) => {
  try {
    const { data: reports, error, count } = await supabase
      .from('damage_reports')
      .select('*, damage_types(name)', { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      success: true,
      reports: (reports || []).map((item) => ({
        ...item,
        damage_type: item.damage_types?.name || '-',
      })),
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching pending reports:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verify/approve a damage report
 */
export const verifyDamageReport = async ({
  reportId,
  verificationNotes,
  priorityLevel,
  adminId,
}) => {
  try {
    // Update the report
    const { data: report, error: updateError } = await supabase
      .from('damage_reports')
      .update({
        status: 'terverifikasi',
        verification_notes: verificationNotes || null,
        priority_level: priorityLevel,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to audit table
    await supabase.from('verification_audit_logs').insert({
      damage_report_id: reportId,
      old_status: 'pending',
      new_status: 'terverifikasi',
      verified_by: adminId,
      verification_notes: verificationNotes || null,
      priority_level: priorityLevel,
    });

    return {
      success: true,
      report,
      action: 'verified',
    };
  } catch (error) {
    console.error('Error verifying damage report:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Reject a damage report
 */
export const rejectDamageReport = async ({
  reportId,
  verificationNotes,
  adminId,
}) => {
  try {
    // Update the report
    const { data: report, error: updateError } = await supabase
      .from('damage_reports')
      .update({
        status: 'ditolak',
        verification_notes: verificationNotes || null,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to audit table
    await supabase.from('verification_audit_logs').insert({
      damage_report_id: reportId,
      old_status: 'pending',
      new_status: 'ditolak',
      verified_by: adminId,
      verification_notes: verificationNotes || null,
    });

    return {
      success: true,
      report,
      action: 'rejected',
    };
  } catch (error) {
    console.error('Error rejecting damage report:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get verification audit logs for a report
 */
export const getVerificationAuditLogs = async (reportId) => {
  try {
    const { data, error } = await supabase
      .from('verification_audit_logs')
      .select('*')
      .eq('damage_report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      logs: data || [],
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
