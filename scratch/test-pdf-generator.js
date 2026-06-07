import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getOfficerPerformanceData } from '../src/services/exportService.js';
import { generatePdfReport } from '../src/services/pdfTemplateService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgcunyebdabjvzgiaidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'admin@infratrack.id';
  const password = 'Admin@1234';

  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    process.exit(1);
  }

  console.log('Fetching officer performance data...');
  const data = await getOfficerPerformanceData(supabase, {});
  console.log('Data summary:', data.summary);
  console.log('Items sample:');
  console.log(data.items);

  // Directly run generatePdfReport or a dry run compile
  console.log('Generating PDF report (compiled HTML test)...');
  
  // Reading template manually to test compileTemplate
  const templatePath = path.join(__dirname, '..', 'src', 'templates', 'officer-performance.html');
  const htmlContent = fs.readFileSync(templatePath, 'utf8');

  // Let's import pdfTemplateService dynamically or just load it
  const { compileTemplate } = await import('../src/services/pdfTemplateService.js');
  
  const renderData = {
    periode: 'Semua Waktu',
    printed_by: 'Administrator',
    printed_at: new Date().toLocaleString('id-ID'),
    ...data.summary,
    items: data.items,
  };

  const compiledHtml = compileTemplate(htmlContent, renderData);
  const outputHtmlPath = path.join(__dirname, 'test-officer-performance.html');
  fs.writeFileSync(outputHtmlPath, compiledHtml);
  console.log('✅ Test HTML saved to:', outputHtmlPath);

  try {
    const buffer = await generatePdfReport('officer-performance', data, {});
    console.log('✅ PDF Buffer generated successfully. Length:', buffer.length);
    
    // Let's write the PDF to a test file in scratch
    const outputPdfPath = path.join(__dirname, 'test-officer-performance.pdf');
    fs.writeFileSync(outputPdfPath, buffer);
    console.log('✅ Test PDF saved to:', outputPdfPath);
  } catch (err) {
    console.error('Error generating PDF report:', err);
  }

  await supabase.auth.signOut();
}

run();
