/**
 * AI Analysis Service
 *
 * Reusable module for running AI road-damage detection on images
 * and persisting results to the database.
 *
 * Extracts core logic from AIAnalyticsPage so it can be called
 * automatically after a public damage report is submitted.
 */

import { supabase } from './supabaseClient';
import { detectRoadDamage, fileToBase64, summarizeDetections } from './roboflowService';

// ─── Severity helpers (mirrored from AIAnalyticsPage) ────────────────────────

function computeSizeMetrics(predictions, imageWidth, imageHeight) {
  if (!predictions || predictions.length === 0) {
    return { totalAreaRatio: 0, maxAreaRatio: 0, details: [], avgAreaRatio: 0 };
  }

  const imageArea = imageWidth * imageHeight;
  let totalDetArea = 0;
  let maxAreaRatio = 0;

  const details = predictions.map((pred) => {
    const detArea = pred.width * pred.height;
    const areaRatio = imageArea > 0 ? detArea / imageArea : 0;
    totalDetArea += detArea;
    if (areaRatio > maxAreaRatio) maxAreaRatio = areaRatio;
    return { ...pred, detArea, areaRatio };
  });

  const totalAreaRatio = imageArea > 0 ? totalDetArea / imageArea : 0;
  const avgAreaRatio = totalAreaRatio / predictions.length;

  return { totalAreaRatio, maxAreaRatio, avgAreaRatio, details };
}

/**
 * Determine severity using a composite score of quantity + size.
 *
 * Scoring: quantityScore (0-40) + sizeScore (0-60)
 * Thresholds: >= 60 → high, >= 30 → medium, > 0 → low
 */
export function getSeverityLevel(predictions, imageWidth = 0, imageHeight = 0) {
  if (!predictions || predictions.length === 0) return 'none';

  const total = predictions.length;
  const metrics = computeSizeMetrics(predictions, imageWidth, imageHeight);

  // Quantity score (max 40)
  let quantityScore = 0;
  if (total >= 5) quantityScore = 40;
  else if (total >= 3) quantityScore = 30;
  else if (total >= 2) quantityScore = 20;
  else quantityScore = 10;

  // Size score (max 60)
  let sizeScore = 0;

  // Max single detection area (max 35)
  if (metrics.maxAreaRatio >= 0.15) sizeScore += 35;
  else if (metrics.maxAreaRatio >= 0.08) sizeScore += 25;
  else if (metrics.maxAreaRatio >= 0.03) sizeScore += 15;
  else sizeScore += 5;

  // Total area coverage (max 25)
  if (metrics.totalAreaRatio >= 0.25) sizeScore += 25;
  else if (metrics.totalAreaRatio >= 0.12) sizeScore += 18;
  else if (metrics.totalAreaRatio >= 0.05) sizeScore += 10;
  else sizeScore += 3;

  const compositeScore = quantityScore + sizeScore;

  if (compositeScore >= 60) return 'high';
  if (compositeScore >= 30) return 'medium';
  return 'low';
}

// ─── Severity UI config ──────────────────────────────────────────────────────

export const SEVERITY_CONFIG = {
  none: { label: 'Tidak Ada Kerusakan', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  low: { label: 'Ringan', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  medium: { label: 'Sedang', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  high: { label: 'Berat', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

// ─── Core analysis function ──────────────────────────────────────────────────

/**
 * Download an image from a URL and convert it to a base64 string
 * suitable for the Roboflow API.
 */
async function urlToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Gagal mengunduh gambar: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip the "data:...;base64," prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Run AI detection on an image URL (e.g. from Supabase Storage).
 *
 * @param {string} photoUrl - Public URL of the image.
 * @param {object} [options]
 * @param {number} [options.confidence=25] - Confidence threshold (0-100).
 * @returns {Promise<{predictions, image, severity, summary}>}
 */
export async function analyzeImageFromUrl(photoUrl, options = {}) {
  const confidence = options.confidence ?? 25;

  const base64 = await urlToBase64(photoUrl);
  const result = await detectRoadDamage(base64, { confidence });

  const severity = getSeverityLevel(
    result.predictions,
    result.image?.width,
    result.image?.height,
  );

  const summary = summarizeDetections(result.predictions);

  return {
    predictions: result.predictions,
    image: result.image,
    severity,
    summary,
  };
}

// ─── Database persistence ────────────────────────────────────────────────────

/**
 * Save AI analysis result to the database.
 *
 * @param {string} reportId - UUID of the damage report.
 * @param {object} analysisResult - Output from `analyzeImageFromUrl`.
 * @param {number} confidenceThreshold - The threshold used during analysis.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveAnalysisResult(reportId, analysisResult, confidenceThreshold = 25) {
  try {
    const { error } = await supabase
      .from('ai_analysis_results')
      .upsert(
        {
          report_id: reportId,
          predictions: analysisResult.predictions || [],
          image_width: analysisResult.image?.width || 0,
          image_height: analysisResult.image?.height || 0,
          severity_level: analysisResult.severity || 'none',
          total_detections: analysisResult.summary?.total || 0,
          avg_confidence: analysisResult.summary?.avgConfidence || 0,
          confidence_threshold: confidenceThreshold,
          error_message: null,
          analyzed_at: new Date().toISOString(),
        },
        { onConflict: 'report_id' },
      );

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[AI Analysis] Gagal menyimpan hasil:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save an error state for a failed analysis attempt.
 */
export async function saveAnalysisError(reportId, errorMessage, confidenceThreshold = 25) {
  try {
    const { error } = await supabase
      .from('ai_analysis_results')
      .upsert(
        {
          report_id: reportId,
          predictions: [],
          severity_level: null,
          total_detections: 0,
          avg_confidence: 0,
          confidence_threshold: confidenceThreshold,
          error_message: String(errorMessage),
          analyzed_at: new Date().toISOString(),
        },
        { onConflict: 'report_id' },
      );

    if (error) throw error;
  } catch (err) {
    console.error('[AI Analysis] Gagal menyimpan error state:', err);
  }
}

/**
 * Retrieve the AI analysis result for a given damage report.
 *
 * @param {string} reportId - UUID of the damage report.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getAnalysisResult(reportId) {
  try {
    const { data, error } = await supabase
      .from('ai_analysis_results')
      .select('*')
      .eq('report_id', reportId)
      .maybeSingle();

    if (error) throw error;

    return { success: true, data };
  } catch (err) {
    console.error('[AI Analysis] Gagal mengambil hasil:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fire-and-forget: run AI analysis on a submitted report's photo.
 *
 * This is designed to be called after a successful damage report submission.
 * It does NOT throw — errors are logged and saved to the DB.
 *
 * @param {string} reportId - UUID of the newly created report.
 * @param {string} photoUrl - Public URL of the uploaded photo.
 * @param {number} [confidenceThreshold=25]
 */
export async function runAutoAnalysis(reportId, photoUrl, confidenceThreshold = 25) {
  try {
    if (!photoUrl) {
      console.warn('[AI Analysis] Tidak ada foto, melewati analisis otomatis.');
      return;
    }

    console.log('[AI Analysis] Memulai analisis otomatis untuk report:', reportId);

    const result = await analyzeImageFromUrl(photoUrl, {
      confidence: confidenceThreshold,
    });

    await saveAnalysisResult(reportId, result, confidenceThreshold);

    console.log(
      `[AI Analysis] Selesai — severity: ${result.severity}, deteksi: ${result.summary.total}`,
    );
  } catch (err) {
    console.error('[AI Analysis] Analisis otomatis gagal:', err);
    await saveAnalysisError(reportId, err.message, confidenceThreshold);
  }
}

/**
 * Analyze a File object directly (avoids CORS issues with URL fetching).
 *
 * @param {File} file - The image file to analyze.
 * @param {object} [options]
 * @param {number} [options.confidence=25] - Confidence threshold (0-100).
 * @returns {Promise<{predictions, image, severity, summary}>}
 */
export async function analyzeImageFromFile(file, options = {}) {
  const confidence = options.confidence ?? 25;

  const base64 = await fileToBase64(file);
  const result = await detectRoadDamage(base64, { confidence });

  const severity = getSeverityLevel(
    result.predictions,
    result.image?.width,
    result.image?.height,
  );

  const summary = summarizeDetections(result.predictions);

  return {
    predictions: result.predictions,
    image: result.image,
    severity,
    summary,
  };
}

/**
 * Fire-and-forget: run AI analysis using a File object directly.
 *
 * This avoids CORS issues that occur when fetching images from Supabase Storage URLs.
 * Designed to be called right after form submission while the file is still in memory.
 *
 * @param {string} reportId - UUID of the newly created report.
 * @param {File} photoFile - The original image File object.
 * @param {number} [confidenceThreshold=25]
 */
export async function runAutoAnalysisFromFile(reportId, photoFile, confidenceThreshold = 25) {
  try {
    if (!photoFile) {
      console.warn('[AI Analysis] Tidak ada file foto, melewati analisis otomatis.');
      return;
    }

    console.log('[AI Analysis] Memulai analisis otomatis dari file untuk report:', reportId);

    const result = await analyzeImageFromFile(photoFile, {
      confidence: confidenceThreshold,
    });

    await saveAnalysisResult(reportId, result, confidenceThreshold);

    console.log(
      `[AI Analysis] Selesai — severity: ${result.severity}, deteksi: ${result.summary.total}`,
    );
  } catch (err) {
    console.error('[AI Analysis] Analisis otomatis gagal:', err);
    await saveAnalysisError(reportId, err.message, confidenceThreshold);
  }
}
