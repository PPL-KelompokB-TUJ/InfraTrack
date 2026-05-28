import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom lightweight template engine to compile variables and loops in HTML templates
 */
function compileTemplate(html, data) {
  let compiled = html;

  // 1. Compile simple variables: {{name}}
  Object.keys(data).forEach((key) => {
    if (key !== 'items') {
      const val = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
      // Escape special characters in key for regex safety
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      compiled = compiled.replace(new RegExp(`{{${escapedKey}}}`, 'g'), val);
    }
  });

  // 2. Compile array loops: {{#each items}} ... {{/each}}
  const eachRegex = /\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/g;
  compiled = compiled.replace(eachRegex, (match, blockTemplate) => {
    if (!data.items || !Array.isArray(data.items)) return '';

    return data.items
      .map((item) => {
        let blockHtml = blockTemplate;
        Object.keys(item).forEach((itemKey) => {
          const val = item[itemKey] !== undefined && item[itemKey] !== null ? String(item[itemKey]) : '';
          const escapedItemKey = itemKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          blockHtml = blockHtml.replace(new RegExp(`{{${escapedItemKey}}}`, 'g'), val);
        });
        return blockHtml;
      })
      .join('');
  });

  return compiled;
}

/**
 * Generates a PDF buffer based on report type and data
 */
export async function generatePdfReport(reportType, data, filters = {}) {
  try {
    // 1. Read the template file
    const templateFileName = `${reportType}.html`;
    const templatePath = path.join(__dirname, '..', 'templates', templateFileName);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}`);
    }

    const htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // 2. Prepare rendering variables
    const renderData = {
      periode: filters.fromDate && filters.toDate 
        ? `${new Date(filters.fromDate).toLocaleDateString('id-ID')} s/d ${new Date(filters.toDate).toLocaleDateString('id-ID')}`
        : 'Semua Waktu',
      printed_by: filters.printedBy || 'Administrator',
      printed_at: new Date().toLocaleString('id-ID'),
      ...data.summary,
      items: data.items,
    };

    // 3. Compile the template
    const compiledHtml = compileTemplate(htmlContent, renderData);

    // 4. Launch headless browser and print to PDF
    let browser;
    if (process.env.NODE_ENV === 'production') {
      // Use sparticuz/chromium for serverless / Render environments
      const chromium = (await import('@sparticuz/chromium')).default;
      const puppeteer = (await import('puppeteer-core')).default;
      
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    } else {
      // Use standard puppeteer for local development
      const puppeteer = (await import('puppeteer')).default;
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await browser.newPage();
    await page.setContent(compiledHtml, { waitUntil: 'networkidle0' });

    // Print A4 format with clean page margins
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });

    await browser.close();
    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}
