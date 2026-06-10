import ExcelJS from 'exceljs';

/**
 * Generates an Excel workbook buffer based on report type and data
 */
export async function generateExcelReport(reportType, data, filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'InfraTrack';
  workbook.created = new Date();

  // Create primary sheet
  const sheet = workbook.addWorksheet('Laporan');
  sheet.views = [{ showGridLines: true }];

  // Common Theme Colors (Slate Blue / Dark Teal theme)
  const headerFillColor = 'FF0F172A'; // Slate-900
  const zebraFillColor = 'FFF8FAFC';  // Slate-50
  const borderStyle = { style: 'thin', color: { argb: 'FFE2E8F0' } };
  
  if (reportType === 'asset-condition') {
    generateAssetConditionSheet(sheet, data, filters, headerFillColor, zebraFillColor, borderStyle);
  } else if (reportType === 'maintenance-recap') {
    generateMaintenanceRecapSheet(sheet, data, filters, headerFillColor, zebraFillColor, borderStyle);
  } else if (reportType === 'officer-performance') {
    generateOfficerPerformanceSheet(sheet, data, filters, headerFillColor, zebraFillColor, borderStyle);
  } else if (reportType === 'inventory-recap') {
    generateInventoryRecapSheet(sheet, data, filters, headerFillColor, zebraFillColor, borderStyle);
  }

  // Adjust column widths automatically
  sheet.columns.forEach((column) => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      // Skip title row (row 1 & 2) for width calculation
      if (cell.row <= 3) return;
      const cellVal = cell.value ? String(cell.value) : '';
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    });
    column.width = Math.max(maxLen + 4, 12);
  });

  return await workbook.xlsx.writeBuffer();
}

/**
 * Build Asset Condition report sheet
 */
function generateAssetConditionSheet(sheet, data, filters, headerBg, zebraBg, borderStyle) {
  // Title Rows
  sheet.addRow(['LAPORAN KONDISI ASET INFRASTRUKTUR']);
  sheet.addRow([`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Filter: Kategori: ${filters.category || 'Semua'}, Periode: ${filters.fromDate || ''} s/d ${filters.toDate || ''}`]);
  sheet.addRow([]); // Blank spacer

  // Summary Metrics Rows
  sheet.addRow(['SUMMARY METRICS']);
  sheet.addRow(['Total Aset', data.summary.total_assets, 'Kondisi Baik', data.summary.assets_baik]);
  sheet.addRow(['Kondisi Rusak', data.summary.assets_rusak, 'Total Aduan', data.summary.total_damage_reports]);
  sheet.addRow([]); // Blank spacer

  // Setup Table Header
  const headerRow = sheet.addRow([
    'No', 
    'Nama Aset', 
    'Kategori', 
    'Latitude', 
    'Longitude', 
    'Kondisi', 
    'Tahun Dibangun', 
    'Jumlah Aduan', 
    'Perbaikan Terakhir'
  ]);

  // Insert Table Data
  data.items.forEach((item) => {
    sheet.addRow([
      item.no,
      item.asset_name,
      item.category_name,
      item.latitude === '-' ? '-' : Number(item.latitude),
      item.longitude === '-' ? '-' : Number(item.longitude),
      item.condition.toUpperCase(),
      item.year_built === '-' ? '-' : Number(item.year_built),
      item.total_damage_reports,
      item.last_repaired_at
    ]);
  });

  // Apply Styling
  styleSheetLayout(sheet, 8, 14, headerBg, zebraBg, borderStyle);

  // Format latitude/longitude columns to 6 decimals if numeric
  sheet.getColumn(4).numFmt = '0.000000';
  sheet.getColumn(5).numFmt = '0.000000';
}

/**
 * Build Maintenance Recap report sheet
 */
function generateMaintenanceRecapSheet(sheet, data, filters, headerBg, zebraBg, borderStyle) {
  // Title Rows
  sheet.addRow(['REKAPITULASI PEMELIHARAAN PERIODIK']);
  sheet.addRow([`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Rentang: ${filters.fromDate || 'Semua'} s/d ${filters.toDate || 'Semua'}`]);
  sheet.addRow([]);

  // Summary Metrics
  sheet.addRow(['SUMMARY METRICS']);
  sheet.addRow(['Total Pekerjaan', data.summary.total_tasks, 'Total Estimasi Biaya', data.summary.raw_total_estimated_cost]);
  sheet.addRow(['Total Realisasi Biaya', data.summary.raw_total_actual_cost, 'Selisih Anggaran', data.summary.raw_budget_variance]);
  sheet.addRow([]);

  // Setup Table Header
  sheet.addRow([
    'No',
    'Periode',
    'Nama Aset',
    'Jenis Pemeliharaan',
    'Petugas Pelaksana',
    'Status',
    'Estimasi Biaya (Rp)',
    'Realisasi Biaya (Rp)'
  ]);

  // Insert Data Rows
  data.items.forEach((item) => {
    sheet.addRow([
      item.no,
      item.period,
      item.asset_name,
      item.maintenance_type,
      item.officer_name,
      item.status_label,
      item.estimated_cost,
      item.actual_cost
    ]);
  });

  // Apply Styling
  styleSheetLayout(sheet, 8, 14, headerBg, zebraBg, borderStyle);

  // Format Currency Columns
  sheet.getColumn(7).numFmt = '#,##0';
  sheet.getColumn(8).numFmt = '#,##0';

  // Apply currency formatting to summary cells (Row 5 & 6)
  sheet.getCell('D5').numFmt = 'Rp #,##0';
  sheet.getCell('B6').numFmt = 'Rp #,##0';
  sheet.getCell('D6').numFmt = 'Rp #,##0';
}

/**
 * Build Officer Performance report sheet
 */
function generateOfficerPerformanceSheet(sheet, data, filters, headerBg, zebraBg, borderStyle) {
  // Title Rows
  sheet.addRow(['LAPORAN KINERJA PETUGAS LAPANGAN']);
  sheet.addRow([`Dicetak pada: ${new Date().toLocaleString('id-ID')}`]);
  sheet.addRow([]);

  // Summary Metrics
  sheet.addRow(['SUMMARY METRICS']);
  sheet.addRow(['Total Petugas Aktif', data.summary.total_officers]);
  sheet.addRow(['Total Tugas Selesai', data.summary.total_completed_tasks, 'Rata-rata Waktu Penyelesaian', `${data.summary.avg_resolution_time} Hari`]);
  sheet.addRow([]);

  // Setup Table Header
  sheet.addRow([
    'No',
    'Nama Petugas',
    'Spesialisasi',
    'Wilayah Kerja',
    'Jumlah Tugas',
    'Selesai',
    'Rata-rata Waktu (Hari)'
  ]);

  // Insert Data Rows
  data.items.forEach((item) => {
    sheet.addRow([
      item.no,
      item.officer_name,
      item.specialization,
      item.work_area,
      item.total_tasks,
      item.completed_tasks,
      item.avg_days_to_complete
    ]);
  });

  // Apply Styling
  styleSheetLayout(sheet, 8, 14, headerBg, zebraBg, borderStyle);
}

/**
 * Build Inventory Recap report sheet
 */
function generateInventoryRecapSheet(sheet, data, filters, headerBg, zebraBg, borderStyle) {
  // Title Rows
  sheet.addRow(['LAPORAN REKAPITULASI MANAJEMEN INVENTARIS']);
  sheet.addRow([`Dicetak pada: ${new Date().toLocaleString('id-ID')}`]);
  sheet.addRow([]);

  // Summary Metrics
  sheet.addRow(['SUMMARY METRICS']);
  sheet.addRow(['Total Jenis Material', data.summary.total_materials, 'Estimasi Total Nilai Aset', data.summary.raw_total_valuation]);
  sheet.addRow(['Material Habis (Stok 0)', data.summary.empty_materials]);
  sheet.addRow([]);

  // Setup Table Header
  sheet.addRow([
    'No',
    'Nama Material',
    'Stok Saat Ini',
    'Satuan',
    'Harga Satuan (Rp)',
    'Total Nilai (Rp)',
    'Status'
  ]);

  // Insert Data Rows
  data.items.forEach((item) => {
    // We used toLocaleString in the service for the HTML template, but Excel needs numbers for summation
    // Let's strip the formatting back to raw numbers for Excel if needed, 
    // OR we can just use the raw numbers if we parse them.
    // Wait, in exportService, unit_price and total_value are returned as formatted strings.
    // Excel needs raw numbers to sum correctly.
    // I will parse the formatted string back to number just for Excel.
    const rawPrice = typeof item.unit_price === 'string' ? Number(item.unit_price.replace(/\./g, '')) : item.unit_price;
    const rawTotal = typeof item.total_value === 'string' ? Number(item.total_value.replace(/\./g, '')) : item.total_value;

    sheet.addRow([
      item.no,
      item.material_name,
      Number(item.stock),
      item.unit,
      rawPrice,
      rawTotal,
      item.status_label
    ]);
  });

  // Apply Styling
  styleSheetLayout(sheet, 8, 14, headerBg, zebraBg, borderStyle);

  // Format Currency Columns
  sheet.getColumn(5).numFmt = '#,##0';
  sheet.getColumn(6).numFmt = '#,##0';

  // Apply currency formatting to summary cell (Row 5, Col D)
  sheet.getCell('D5').numFmt = 'Rp #,##0';
}

/**
 * Helper to apply fonts, alignments, borders, and header colors
 */
function styleSheetLayout(sheet, headerRowIdx, dataStartRowIdx, headerBg, zebraBg, borderStyle) {
  // 1. Style Title Block
  const titleCell = sheet.getCell('A1');
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };

  // 2. Style Summary Metrics Block
  for (let r = 4; r <= 6; r++) {
    sheet.getRow(r).eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: cell.col % 2 !== 0 }; // Bold labels
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = borderStyle;
    });
  }
  sheet.getCell('A4').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };

  // 3. Style Table Headers
  const headerRow = sheet.getRow(headerRowIdx);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = borderStyle;
  });

  // 4. Style Table Data Cells
  sheet.eachRow((row) => {
    if (row.number < dataStartRowIdx) return;
    
    row.height = 20;
    const isEven = row.number % 2 === 0;

    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.border = borderStyle;

      // Align columns: Numbering to center, names/text to left, scores/counts to center
      if (cell.column === 1) {
        cell.alignment = { horizontal: 'center' };
      } else if (typeof cell.value === 'number') {
        cell.alignment = { horizontal: 'right' };
      } else {
        cell.alignment = { horizontal: 'left' };
      }

      // Zebra striping
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      }
    });
  });
}
