import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePdfReport } from '../src/services/pdfTemplateService.js';
import { generateExcelReport } from '../src/services/excelGeneratorService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure scratch output directory exists
const outputDir = path.join(__dirname, '..', 'artifacts', 'test_outputs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const mockAssetData = {
  summary: {
    total_assets: 3,
    assets_baik: 2,
    assets_rusak: 1,
    total_damage_reports: 5,
  },
  items: [
    {
      no: 1,
      asset_name: 'Jembatan Ciliwung Raya',
      category_name: 'Jembatan',
      latitude: '-6.2088',
      longitude: '106.8456',
      condition: 'Baik',
      condition_class: 'baik',
      year_built: 2012,
      total_damage_reports: 0,
      last_repaired_at: '2026-05-10',
    },
    {
      no: 2,
      asset_name: 'Jalan Raya Sudirman KM 3',
      category_name: 'Jalan',
      latitude: '-6.2115',
      longitude: '106.8412',
      condition: 'Rusak Ringan',
      condition_class: 'rusak-ringan',
      year_built: 2018,
      total_damage_reports: 3,
      last_repaired_at: '-',
    },
    {
      no: 3,
      asset_name: 'Saluran Pembuangan Mampang',
      category_name: 'Saluran Drainase',
      latitude: '-6.2332',
      longitude: '106.8245',
      condition: 'Rusak Berat',
      condition_class: 'rusak-berat',
      year_built: 2005,
      total_damage_reports: 2,
      last_repaired_at: '2025-11-20',
    }
  ]
};

const mockMaintenanceData = {
  summary: {
    total_tasks: 3,
    total_estimated_cost: 'Rp 27.500.000',
    total_actual_cost: 'Rp 29.200.000',
    budget_variance: 'Rp -1.700.000',
    raw_total_estimated_cost: 27500000,
    raw_total_actual_cost: 29200000,
    raw_budget_variance: -1700000,
  },
  items: [
    {
      no: 1,
      period: '2026-05',
      asset_name: 'Jembatan Ciliwung Raya',
      maintenance_type: 'Pengecatan ulang & pembersihan korosi baja jembatan',
      officer_name: 'Ahmad Sutrisno',
      status: 'completed',
      status_label: 'Selesai',
      status_class: 'completed',
      estimated_cost: 10000000,
      actual_cost: 9500000,
      estimated_cost_formatted: '10.000.000',
      actual_cost_formatted: '9.500.000',
    },
    {
      no: 2,
      period: '2026-05',
      asset_name: 'Saluran Pembuangan Mampang',
      maintenance_type: 'Normalisasi sedimentasi lumpur & pemasangan turap beton',
      officer_name: 'Budi Santoso',
      status: 'completed',
      status_label: 'Selesai',
      status_class: 'completed',
      estimated_cost: 15000000,
      actual_cost: 18000000,
      estimated_cost_formatted: '15.000.000',
      actual_cost_formatted: '18.000.000',
    },
    {
      no: 3,
      period: '2026-05',
      asset_name: 'Jalan Raya Sudirman KM 3',
      maintenance_type: 'Tambal sulam aspal berlubang',
      officer_name: 'Citra Dewi',
      status: 'assigned',
      status_label: 'Ditugaskan',
      status_class: 'assigned',
      estimated_cost: 2500000,
      actual_cost: 1700000,
      estimated_cost_formatted: '2.500.000',
      actual_cost_formatted: '1.700.000',
    }
  ]
};

const mockOfficerData = {
  summary: {
    total_officers: 3,
    total_tasks: 12,
    total_completed_tasks: 8,
    avg_resolution_time: 4.2,
  },
  items: [
    {
      no: 1,
      officer_name: 'Ahmad Sutrisno',
      specialization: 'Teknik Jembatan',
      work_area: 'Jakarta Pusat',
      total_tasks: 5,
      completed_tasks: 4,
      avg_days_to_complete: 3.5,
    },
    {
      no: 2,
      officer_name: 'Budi Santoso',
      specialization: 'Teknik Pengairan',
      work_area: 'Jakarta Selatan',
      total_tasks: 4,
      completed_tasks: 3,
      avg_days_to_complete: 5.1,
    },
    {
      no: 3,
      officer_name: 'Citra Dewi',
      specialization: 'Teknik Jalan',
      work_area: 'Jakarta Barat',
      total_tasks: 3,
      completed_tasks: 1,
      avg_days_to_complete: 4.0,
    }
  ]
};

async function runTests() {
  console.log('🧪 Starting Report Exporter Verification Tests...\n');
  
  let passedCount = 0;
  let failedCount = 0;

  // Helper function for step assertions
  async function assertStep(name, fn) {
    try {
      console.log(`⏳ Testing: ${name}...`);
      await fn();
      console.log(`✅ Passed: ${name}\n`);
      passedCount++;
    } catch (error) {
      console.error(`❌ Failed: ${name}`);
      console.error(`   Error details: ${error.message}\n`);
      failedCount++;
    }
  }

  // 1. Test PDF Generation: Asset Condition
  await assertStep('PDF Generator - Asset Condition', async () => {
    const pdfBuffer = await generatePdfReport('asset-condition', mockAssetData, {
      fromDate: '2026-05-01',
      toDate: '2026-05-28',
      printedBy: 'Admin Tester'
    });
    const destPath = path.join(outputDir, 'asset-condition-test.pdf');
    fs.writeFileSync(destPath, pdfBuffer);
    console.log(`   Written to: ${destPath}`);
  });

  // 2. Test PDF Generation: Maintenance Recap
  await assertStep('PDF Generator - Maintenance Recap', async () => {
    const pdfBuffer = await generatePdfReport('maintenance-recap', mockMaintenanceData, {
      fromDate: '2026-05-01',
      toDate: '2026-05-28',
      printedBy: 'Admin Tester'
    });
    const destPath = path.join(outputDir, 'maintenance-recap-test.pdf');
    fs.writeFileSync(destPath, pdfBuffer);
    console.log(`   Written to: ${destPath}`);
  });

  // 3. Test PDF Generation: Officer Performance
  await assertStep('PDF Generator - Officer Performance', async () => {
    const pdfBuffer = await generatePdfReport('officer-performance', mockOfficerData, {
      printedBy: 'Admin Tester'
    });
    const destPath = path.join(outputDir, 'officer-performance-test.pdf');
    fs.writeFileSync(destPath, pdfBuffer);
    console.log(`   Written to: ${destPath}`);
  });

  // 4. Test Excel Generation: Asset Condition
  await assertStep('Excel Generator - Asset Condition', async () => {
    const xlsxBuffer = await generateExcelReport('asset-condition', mockAssetData, {
      category: 'Semua',
      fromDate: '2026-05-01',
      toDate: '2026-05-28'
    });
    const destPath = path.join(outputDir, 'asset-condition-test.xlsx');
    fs.writeFileSync(destPath, xlsxBuffer);
    console.log(`   Written to: ${destPath}`);
  });

  // 5. Test Excel Generation: Maintenance Recap
  await assertStep('Excel Generator - Maintenance Recap', async () => {
    const xlsxBuffer = await generateExcelReport('maintenance-recap', mockMaintenanceData, {
      fromDate: '2026-05-01',
      toDate: '2026-05-28'
    });
    const destPath = path.join(outputDir, 'maintenance-recap-test.xlsx');
    fs.writeFileSync(destPath, xlsxBuffer);
    console.log(`   Written to: ${destPath}`);
  });

  // 6. Test Excel Generation: Officer Performance
  await assertStep('Excel Generator - Officer Performance', async () => {
    const xlsxBuffer = await generateExcelReport('officer-performance', mockOfficerData);
    const destPath = path.join(outputDir, 'officer-performance-test.xlsx');
    fs.writeFileSync(destPath, xlsxBuffer);
    console.log(`   Written to: ${destPath}`);
  });

  console.log('════════════════════════════════════════════════════════');
  console.log(`📊 SUMMARY: ${passedCount} passed, ${failedCount} failed.`);
  console.log('════════════════════════════════════════════════════════\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All document generation tests completed successfully!');
    process.exit(0);
  }
}

runTests();
