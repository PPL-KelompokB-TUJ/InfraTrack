import Queue from 'bull';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import Redis from 'ioredis';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { 
  getSupabaseClient, 
  getAssetConditionData, 
  getMaintenanceRecapData, 
  getOfficerPerformanceData,
  getInventoryRecapData
} from '../services/exportService.js';
import { generatePdfReport } from '../services/pdfTemplateService.js';
import { generateExcelReport } from '../services/excelGeneratorService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Redis options
const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

/**
 * Get the primary non-internal IPv4 of this machine
 */
const getServerIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return os.hostname();
};

/**
 * High-performance report generation worker
 */
const processExport = async (data, queueMode = 'redis') => {
  const { jobId, reportType, format, filters, accessToken } = data;
  console.log(`Processing export job: ${jobId} (${reportType} - ${format})`);

  // Initialize supabase client for this job context
  const supabase = getSupabaseClient(accessToken);

  // 1. Update export_history status to 'processing'
  const { error: startError } = await supabase
    .from('export_history')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (startError) {
    console.error(`Error updating job ${jobId} to processing:`, startError.message);
  }

  try {
    // 2. Fetch correct dataset based on report type
    let reportData;
    if (reportType === 'asset-condition') {
      reportData = await getAssetConditionData(supabase, filters);
    } else if (reportType === 'maintenance-recap') {
      reportData = await getMaintenanceRecapData(supabase, filters);
    } else if (reportType === 'officer-performance') {
      reportData = await getOfficerPerformanceData(supabase, filters);
    } else if (reportType === 'inventory-recap') {
      reportData = await getInventoryRecapData(supabase, filters);
    } else {
      throw new Error(`Invalid report type: ${reportType}`);
    }

    // 3. Generate file buffer
    let buffer;
    const typeMap = {
      'asset-condition': 'AssetCondition',
      'maintenance-recap': 'MaintenanceRecap',
      'officer-performance': 'OfficerPerformance',
      'inventory-recap': 'InventoryRecap'
    };
    const pascalType = typeMap[reportType] || 'Report';

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}${mm}${dd}`;

    const filename = `InfraTrack_${pascalType}_${formattedDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const contentType = format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (format === 'pdf') {
      buffer = await generatePdfReport(reportType, reportData, filters);
    } else if (format === 'xlsx' || format === 'excel') {
      buffer = await generateExcelReport(reportType, reportData, filters);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }

    // 4. File Storage Upload (S3/MinIO vs Local Fallback)
    let fileUrl = '';
    const hasS3Config = process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY;
    const storageType = hasS3Config ? 'S3 / MinIO' : 'Local Storage';
    const queueLabel = queueMode === 'redis' ? 'Redis Bull Queue' : 'In-Memory Fallback';
    const serverInfo = `${queueLabel} • ${storageType}`;

    if (hasS3Config) {
      console.log(`Uploading ${filename} to S3 bucket...`);
      const s3Client = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY,
          secretAccessKey: process.env.S3_SECRET_KEY,
        },
        forcePathStyle: true,
      });

      const bucketName = process.env.S3_BUCKET_NAME || 'exports';

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: filename,
          Body: buffer,
          ContentType: contentType,
        })
      );

      // Build S3 download link
      const s3BaseUrl = String(process.env.S3_ENDPOINT || '').endsWith('/') 
        ? process.env.S3_ENDPOINT 
        : `${process.env.S3_ENDPOINT}/`;
      fileUrl = `${s3BaseUrl}${bucketName}/${filename}`;
    } else {
      console.log(`S3 keys missing. Storing ${filename} locally in public/exports fallback folder...`);
      // Save locally to public/exports/
      const publicExportsDir = path.join(__dirname, '..', '..', 'public', 'exports');
      
      if (!fs.existsSync(publicExportsDir)) {
        fs.mkdirSync(publicExportsDir, { recursive: true });
      }

      const localFilePath = path.join(publicExportsDir, filename);
      fs.writeFileSync(localFilePath, buffer);

      const localServerPort = process.env.PORT || 5000;
      const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_BACKEND_URL || `http://localhost:${localServerPort}`;
      fileUrl = `${baseUrl}/exports/${filename}`;
    }

    const serverPort = process.env.PORT || 5000;
    const serverIP = getServerIP();
    const queueLabel = queueMode === 'redis' ? 'Redis Queue' : 'In-Memory';
    const serverInfo = `${serverIP}:${serverPort} (${queueLabel})`;

    // 5. Update history status to 'completed' with download link and server info
    let completeError;
    ({ error: completeError } = await supabase
      .from('export_history')
      .update({
        status: 'completed',
        file_url: fileUrl,
        server_info: serverInfo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId));

    // Graceful fallback jika kolom server_info belum ada di DB
    if (completeError && (completeError.message?.includes('server_info') || completeError.code === '42703')) {
      console.warn('Kolom server_info belum ada di DB, menyimpan tanpa server_info...');
      ({ error: completeError } = await supabase
        .from('export_history')
        .update({
          status: 'completed',
          file_url: fileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId));
    }

    if (completeError) {
      throw new Error(`Failed to save completed job details: ${completeError.message}`);
    }

    console.log(`Job ${jobId} finished successfully! File URL: ${fileUrl}`);
    return { success: true, fileUrl };

  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);

    // Update history status to 'failed'
    await supabase
      .from('export_history')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown processing error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    throw error;
  }
};

/**
 * Resilient queue container that falls back to in-memory processing if Redis is unavailable
 */
class ResilientExportQueue {
  constructor() {
    this.bullQueue = null;
    this.isInitialized = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    const testClient = new Redis({
      ...redisOptions,
      connectTimeout: 1000,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
    });

    testClient.on('error', () => {}); // Silence connection error events

    try {
      console.log('Testing connection to Redis server...');
      await testClient.connect();
      await testClient.ping();
      testClient.disconnect();

      console.log('✅ Redis is running. Initializing Bull background queue.');
      this.bullQueue = new Queue('export-reports', { redis: redisOptions });
      this.bullQueue.process(async (job) => {
        await processExport(job.data, 'redis');
      });

      this.bullQueue.on('failed', (job, err) => {
        console.error(`Job ID ${job.id} failed in worker:`, err.message);
      });

      this.bullQueue.on('completed', (job, result) => {
        console.log(`Job ID ${job.id} completed successfully in worker.`);
      });

    } catch (err) {
      console.warn('⚠️ Redis is NOT running. Using in-memory fallback queue for background processing.');
      this.bullQueue = null;
    } finally {
      this.isInitialized = true;
    }
  }

  async add(data, options = {}) {
    await this.initPromise;

    if (this.bullQueue) {
      return await this.bullQueue.add(data, options);
    } else {
      console.log(`[Fallback Queue] Scheduling job ${data.jobId} asynchronously...`);
      // Simulating background worker using setTimeout
      setTimeout(async () => {
        try {
          await processExport(data, 'fallback');
        } catch (err) {
          console.error(`[Fallback Queue] In-memory job ${data.jobId} failed:`, err.message);
        }
      }, 500);

      return { id: data.jobId };
    }
  }
}

export const exportQueue = new ResilientExportQueue();
