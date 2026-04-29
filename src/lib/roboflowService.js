/**
 * Roboflow Pothole Detection Service
 *
 * Integrates with the "pothole" model from Roboflow Universe.
 * Model: https://universe.roboflow.com/zouzo-ljtwj/pothole-ks92t/model/1
 *
 * Performance: mAP 99.1%, Precision 96.2%, Recall 98.1%
 *
 * Detects one class:
 *   - pothole (Lubang Jalan)
 */

const ROBOFLOW_API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY || '';
const MODEL_ID = 'pothole-ks92t';
const MODEL_VERSION = import.meta.env.VITE_ROBOFLOW_MODEL_VERSION || '1';
const API_BASE_URL = 'https://detect.roboflow.com';

/**
 * Class color mapping for bounding box rendering.
 */
export const CLASS_COLORS = {
  pothole: { fill: 'rgba(239, 68, 68, 0.25)', stroke: '#ef4444', label: '#fca5a5' },
};

/**
 * Default fallback color for unknown classes.
 */
const DEFAULT_COLOR = { fill: 'rgba(251, 146, 60, 0.25)', stroke: '#f97316', label: '#fdba74' };

/**
 * Get color config for a given class name.
 * @param {string} className
 * @returns {object}
 */
export function getClassColor(className) {
  return CLASS_COLORS[className] || DEFAULT_COLOR;
}

/**
 * Class label translations for UI display.
 */
export const CLASS_LABELS = {
  pothole: 'Lubang Jalan (Pothole)',
};

/**
 * Convert a File object to a base64 string (without the data URI prefix).
 * @param {File} file - The image file to convert.
 * @returns {Promise<string>} Base64-encoded image string.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip the "data:image/...;base64," prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Send an image to the Roboflow Hosted API for pothole detection.
 *
 * @param {string} base64Image - Base64-encoded image string (without data URI prefix).
 * @param {object} [options] - Optional query parameters.
 * @param {number} [options.confidence=25] - Confidence threshold (0-100).
 * @param {number} [options.overlap=30] - Overlap threshold (0-100).
 * @returns {Promise<{predictions: Array, image: {width: number, height: number}}>}
 */
export async function detectRoadDamage(base64Image, options = {}) {
  if (!ROBOFLOW_API_KEY) {
    throw new Error(
      'Roboflow API key belum dikonfigurasi. ' +
        'Tambahkan VITE_ROBOFLOW_API_KEY di file .env Anda.'
    );
  }

  const confidence = options.confidence ?? 1;
  const overlap = options.overlap ?? 30;

  const url = new URL(`${API_BASE_URL}/${MODEL_ID}/${MODEL_VERSION}`);
  url.searchParams.set('api_key', ROBOFLOW_API_KEY);
  url.searchParams.set('confidence', String(confidence));
  url.searchParams.set('overlap', String(overlap));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s timeout

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      body: base64Image,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      if (response.status === 401 || response.status === 403) {
        throw new Error('API key Roboflow tidak valid. Periksa kembali VITE_ROBOFLOW_API_KEY.');
      }
      if (response.status === 404) {
        throw new Error('Model tidak ditemukan. Periksa model ID dan versi.');
      }
      throw new Error(`Roboflow API error (${response.status}): ${errorBody || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      predictions: data.predictions || [],
      image: data.image || { width: 0, height: 0 },
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout — Roboflow API tidak merespon dalam 30 detik.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Summarize detection results for display.
 *
 * @param {Array} predictions - Array of prediction objects from Roboflow.
 * @returns {{total: number, byClass: Record<string, number>, avgConfidence: number}}
 */
export function summarizeDetections(predictions) {
  if (!predictions || predictions.length === 0) {
    return { total: 0, byClass: {}, avgConfidence: 0 };
  }

  const byClass = {};
  let totalConfidence = 0;

  for (const pred of predictions) {
    const cls = pred.class || 'Unknown';
    byClass[cls] = (byClass[cls] || 0) + 1;
    totalConfidence += pred.confidence || 0;
  }

  return {
    total: predictions.length,
    byClass,
    avgConfidence: totalConfidence / predictions.length,
  };
}
