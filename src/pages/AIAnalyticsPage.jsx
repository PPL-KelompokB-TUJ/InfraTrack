import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ImageIcon,
  Trash2,
  RotateCcw,
  ZoomIn,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Ruler,
  Maximize2,
} from 'lucide-react';
import {
  detectRoadDamage,
  fileToBase64,
  summarizeDetections,
  getClassColor,
  CLASS_LABELS,
} from '../lib/roboflowService';

// ─── Severity helpers ────────────────────────────────────────────────────────

/**
 * Classify a single detection's size relative to the image.
 * Returns 'kecil', 'sedang', or 'besar' and an area ratio.
 */
function getSizeCategory(pred, imageWidth, imageHeight) {
  const imageArea = imageWidth * imageHeight;
  if (imageArea === 0) return { category: 'sedang', areaRatio: 0 };
  const detArea = pred.width * pred.height;
  const areaRatio = detArea / imageArea;

  if (areaRatio >= 0.10) return { category: 'besar', areaRatio };
  if (areaRatio >= 0.03) return { category: 'sedang', areaRatio };
  return { category: 'kecil', areaRatio };
}

/**
 * Compute detailed size metrics for all predictions.
 */
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
    const sizeInfo = getSizeCategory(pred, imageWidth, imageHeight);
    return {
      ...pred,
      detArea,
      areaRatio,
      sizeCategory: sizeInfo.category,
    };
  });

  const totalAreaRatio = imageArea > 0 ? totalDetArea / imageArea : 0;
  const avgAreaRatio = totalAreaRatio / predictions.length;

  return { totalAreaRatio, maxAreaRatio, avgAreaRatio, details };
}

const SIZE_CATEGORY_CONFIG = {
  kecil:  { label: 'Kecil',  color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  sedang: { label: 'Sedang', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  besar:  { label: 'Besar',  color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
};

/**
 * Determine severity using a composite score of:
 *   - quantity (number of detections)
 *   - size (total + max bounding box area relative to image)
 *
 * Scoring:
 *   quantityScore: 0-40 points
 *   sizeScore:     0-60 points
 *
 * Thresholds:
 *   >= 60 → high (Berat)
 *   >= 30 → medium (Sedang)
 *   >  0  → low (Ringan)
 */
function getSeverityLevel(predictions, imageWidth = 0, imageHeight = 0) {
  if (!predictions || predictions.length === 0) return 'none';

  const total = predictions.length;
  const metrics = computeSizeMetrics(predictions, imageWidth, imageHeight);

  // ── Quantity score (max 40) ────────────────────────────────────────
  let quantityScore = 0;
  if (total >= 5)      quantityScore = 40;
  else if (total >= 3) quantityScore = 30;
  else if (total >= 2) quantityScore = 20;
  else                 quantityScore = 10;

  // ── Size score (max 60) ────────────────────────────────────────────
  //    Based on largest detection and total area coverage
  let sizeScore = 0;

  // Max single detection area contribution (max 35)
  if (metrics.maxAreaRatio >= 0.15)      sizeScore += 35;
  else if (metrics.maxAreaRatio >= 0.08) sizeScore += 25;
  else if (metrics.maxAreaRatio >= 0.03) sizeScore += 15;
  else                                   sizeScore += 5;

  // Total area coverage contribution (max 25)
  if (metrics.totalAreaRatio >= 0.25)      sizeScore += 25;
  else if (metrics.totalAreaRatio >= 0.12) sizeScore += 18;
  else if (metrics.totalAreaRatio >= 0.05) sizeScore += 10;
  else                                     sizeScore += 3;

  const compositeScore = quantityScore + sizeScore;

  if (compositeScore >= 60) return 'high';
  if (compositeScore >= 30) return 'medium';
  return 'low';
}

const SEVERITY_CONFIG = {
  none: { label: 'Tidak Ada Kerusakan', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 },
  low: { label: 'Ringan', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Info },
  medium: { label: 'Sedang', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle },
  high: { label: 'Berat', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
};

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function AIAnalyticsPage() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(25);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // ── Handle file selection ────────────────────────────────────────────
  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10MB.');
      return;
    }

    setError(null);
    setDetectionResult(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── Drag & drop handlers ─────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── Draw bounding boxes on canvas ────────────────────────────────────
  const drawDetections = useCallback((predictions, imageEl) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageEl) return;

    const ctx = canvas.getContext('2d');
    const displayWidth = imageEl.clientWidth;
    const displayHeight = imageEl.clientHeight;
    const naturalWidth = imageEl.naturalWidth;
    const naturalHeight = imageEl.naturalHeight;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const scaleX = displayWidth / naturalWidth;
    const scaleY = displayHeight / naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const pred of predictions) {
      const colors = getClassColor(pred.class);
      const x1 = (pred.x - pred.width / 2) * scaleX;
      const y1 = (pred.y - pred.height / 2) * scaleY;
      const w = pred.width * scaleX;
      const h = pred.height * scaleY;

      // Fill
      ctx.fillStyle = colors.fill;
      ctx.fillRect(x1, y1, w, h);

      // Border
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.strokeRect(x1, y1, w, h);

      // Label background
      const labelText = `${pred.class} ${(pred.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 13px Manrope, sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const labelPadX = 8;
      const labelPadY = 4;
      const labelH = 22;
      const labelY = y1 > labelH + 4 ? y1 - labelH - 2 : y1 + 2;

      ctx.fillStyle = colors.stroke;
      ctx.beginPath();
      const cornerR = 4;
      ctx.roundRect(x1, labelY, textWidth + labelPadX * 2, labelH, [cornerR]);
      ctx.fill();

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, x1 + labelPadX, labelY + labelH / 2 + 1);
    }
  }, []);

  // ── Run detection ────────────────────────────────────────────────────
  const runDetection = async () => {
    if (!imageFile) return;

    setIsDetecting(true);
    setError(null);
    setDetectionResult(null);

    try {
      const base64 = await fileToBase64(imageFile);
      const result = await detectRoadDamage(base64, {
        confidence: confidenceThreshold,
      });

      setDetectionResult(result);

      // Draw bounding boxes after image renders
      requestAnimationFrame(() => {
        const imageEl = imageRef.current;
        if (imageEl) {
          drawDetections(result.predictions, imageEl);
        }
      });

      // Add to history
      const summary = summarizeDetections(result.predictions);
      setHistory((prev) => [
        {
          id: Date.now(),
          fileName: imageFile.name,
          timestamp: new Date(),
          thumbnail: imagePreview,
          predictions: result.predictions,
          summary,
          severity: getSeverityLevel(result.predictions, result.image?.width, result.image?.height),
        },
        ...prev.slice(0, 9), // Keep last 10
      ]);
    } catch (err) {
      setError(err.message || 'Gagal menjalankan deteksi. Coba lagi.');
    } finally {
      setIsDetecting(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────
  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setDetectionResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const summary = detectionResult ? summarizeDetections(detectionResult.predictions) : null;
  const severity = detectionResult
    ? getSeverityLevel(detectionResult.predictions, detectionResult.image?.width, detectionResult.image?.height)
    : null;
  const severityConfig = severity ? SEVERITY_CONFIG[severity] : null;
  const sizeMetrics = detectionResult
    ? computeSizeMetrics(detectionResult.predictions, detectionResult.image?.width, detectionResult.image?.height)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-8 fade-slide-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Camera className="text-white" size={22} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Deteksi Kerusakan Jalan AI
            </h1>
          </div>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Upload foto jalan untuk mendeteksi kerusakan secara otomatis menggunakan model AI.
            Model ini mendeteksi <strong className="text-red-600">lubang jalan (pothole)</strong> dengan
            akurasi tinggi (mAP 99.1%, Recall 98.1%).
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* ── Left Column: Upload + Preview ─────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Upload Zone */}
            {!imagePreview && (
              <div
                className={`glass-panel rounded-2xl p-8 transition-all duration-200 cursor-pointer fade-slide-in ${
                  dragOver
                    ? 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-50/50'
                    : 'hover:border-cyan-300 hover:shadow-lg'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleInputChange}
                  className="hidden"
                  id="image-upload"
                />
                <div className="flex flex-col items-center text-center py-8">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center mb-4">
                    <Upload className="text-cyan-600" size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    Upload Foto Jalan
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 max-w-sm">
                    Drag & drop foto di sini, atau klik untuk browse.
                    Mendukung JPEG, PNG, WebP (maks. 10MB)
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 hover:shadow-lg"
                  >
                    <ImageIcon size={16} />
                    Pilih Gambar
                  </button>
                </div>
              </div>
            )}

            {/* Preview + Canvas */}
            {imagePreview && (
              <div className="glass-panel rounded-2xl overflow-hidden fade-slide-in">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon size={16} className="text-slate-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {imageFile?.name || 'Gambar'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      <RotateCcw size={14} />
                      Ganti
                    </button>
                  </div>
                </div>

                {/* Image + Canvas overlay */}
                <div className="relative bg-slate-900">
                  <img
                    ref={imageRef}
                    src={imagePreview}
                    alt="Preview jalan"
                    className="w-full h-auto max-h-[520px] object-contain mx-auto"
                    onLoad={() => {
                      // Redraw if there are existing detections
                      if (detectionResult?.predictions && imageRef.current) {
                        requestAnimationFrame(() => {
                          drawDetections(detectionResult.predictions, imageRef.current);
                        });
                      }
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />
                </div>

                {/* Action bar */}
                <div className="px-4 py-4 border-t border-slate-200 bg-white">
                  {/* Confidence slider */}
                  <div className="flex items-center gap-4 mb-4">
                    <label className="text-xs font-semibold text-slate-600 shrink-0">
                      Confidence: {confidenceThreshold}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="90"
                      step="1"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 rounded-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={runDetection}
                    disabled={isDetecting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Menganalisis Gambar...
                      </>
                    ) : (
                      <>
                        <ZoomIn size={18} />
                        Jalankan Deteksi AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Hidden file input for "Ganti" */}
            {imagePreview && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInputChange}
                className="hidden"
              />
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-2 fade-slide-in">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ── Right Column: Results ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Waiting state */}
            {!detectionResult && !isDetecting && (
              <div className="glass-panel rounded-2xl p-8 text-center fade-slide-in">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Target className="text-slate-400" size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-1">
                  Hasil Deteksi
                </h3>
                <p className="text-sm text-slate-500">
                  Upload gambar dan jalankan deteksi untuk melihat hasil analisis AI di sini.
                </p>
              </div>
            )}

            {/* Loading state */}
            {isDetecting && (
              <div className="glass-panel rounded-2xl p-8 text-center fade-slide-in">
                <Loader2 size={36} className="text-cyan-500 animate-spin mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-700 mb-1">
                  Menganalisis Gambar...
                </h3>
                <p className="text-sm text-slate-500">
                  Model AI sedang mendeteksi kerusakan jalan. Mohon tunggu beberapa detik.
                </p>
              </div>
            )}

            {/* Detection Results */}
            {detectionResult && summary && (
              <div className="space-y-4 stagger-fade">
                {/* Severity Badge */}
                <div className={`glass-panel rounded-2xl p-5 ${severityConfig?.bg} ${severityConfig?.border}`}>
                  <div className="flex items-center gap-3">
                    {severityConfig && <severityConfig.icon size={24} className={severityConfig.color} />}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Tingkat Kerusakan
                      </p>
                      <p className={`text-lg font-extrabold ${severityConfig?.color}`}>
                        {severityConfig?.label}
                      </p>
                    </div>
                  </div>
                  {/* Severity Factors */}
                  {sizeMetrics && detectionResult.predictions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1">
                      <p className="text-xs font-semibold text-slate-500">Faktor Penilaian:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-600">
                          📊 Jumlah: {detectionResult.predictions.length} deteksi
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-600">
                          📐 Area: {(sizeMetrics.totalAreaRatio * 100).toFixed(1)}% dari gambar
                        </span>
                        {sizeMetrics.details.length > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            SIZE_CATEGORY_CONFIG[sizeMetrics.details.reduce((max, d) => d.areaRatio > max.areaRatio ? d : max).sizeCategory]?.bg
                          } ${
                            SIZE_CATEGORY_CONFIG[sizeMetrics.details.reduce((max, d) => d.areaRatio > max.areaRatio ? d : max).sizeCategory]?.border
                          } ${
                            SIZE_CATEGORY_CONFIG[sizeMetrics.details.reduce((max, d) => d.areaRatio > max.areaRatio ? d : max).sizeCategory]?.color
                          }`}>
                            🔍 Terbesar: {SIZE_CATEGORY_CONFIG[sizeMetrics.details.reduce((max, d) => d.areaRatio > max.areaRatio ? d : max).sizeCategory]?.label}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="glass-panel rounded-2xl p-5 bg-white border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target size={16} className="text-cyan-600" />
                    Ringkasan Deteksi
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Total Deteksi</p>
                      <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.total}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Avg. Confidence</p>
                      <p className="text-2xl font-extrabold text-slate-900 mt-1">
                        {summary.total > 0 ? `${(summary.avgConfidence * 100).toFixed(0)}%` : '-'}
                      </p>
                    </div>
                    {Object.entries(summary.byClass).map(([cls, count]) => (
                      <div key={cls} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: getClassColor(cls).stroke }}
                          />
                          <p className="text-xs text-slate-500 font-medium">{cls}</p>
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900 mt-1">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size Metrics */}
                {sizeMetrics && sizeMetrics.details.length > 0 && (
                  <div className="glass-panel rounded-2xl p-5 bg-white border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Ruler size={16} className="text-cyan-600" />
                      Metrik Ukuran Kerusakan
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">Total Area Kerusakan</p>
                        <p className="text-2xl font-extrabold text-slate-900 mt-1">
                          {(sizeMetrics.totalAreaRatio * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">dari total gambar</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">Area Terbesar</p>
                        <p className="text-2xl font-extrabold text-slate-900 mt-1">
                          {(sizeMetrics.maxAreaRatio * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">deteksi terbesar</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {sizeMetrics.details.map((d, idx) => {
                        const sizeCfg = SIZE_CATEGORY_CONFIG[d.sizeCategory];
                        return (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                            <div className="flex items-center gap-2">
                              <Maximize2 size={14} className="text-slate-400" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {CLASS_LABELS[d.class] || d.class} #{idx + 1}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {Math.round(d.width)}×{Math.round(d.height)}px — {(d.areaRatio * 100).toFixed(2)}% area
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${sizeCfg.bg} ${sizeCfg.color} ${sizeCfg.border}`}>
                              {sizeCfg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detail list */}
                {detectionResult.predictions.length > 0 && (
                  <div className="glass-panel rounded-2xl p-5 bg-white border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Detail Deteksi</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {detectionResult.predictions.map((pred, idx) => {
                        const colors = getClassColor(pred.class);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="h-3 w-3 rounded-full ring-2 ring-white shadow-sm"
                                style={{ backgroundColor: colors.stroke }}
                              />
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {CLASS_LABELS[pred.class] || pred.class}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Posisi: ({Math.round(pred.x)}, {Math.round(pred.y)}) — {Math.round(pred.width)}×{Math.round(pred.height)}px
                                </p>
                                {detectionResult?.image && (
                                  <p className="text-xs text-slate-400">
                                    Area: {((pred.width * pred.height) / (detectionResult.image.width * detectionResult.image.height) * 100).toFixed(2)}% dari gambar
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{
                                backgroundColor: colors.fill,
                                color: colors.stroke,
                              }}
                            >
                              {(pred.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Model Info */}
                <div className="glass-panel rounded-2xl p-4 bg-slate-50/50 border border-slate-200">
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <p>
                      Model: <strong>Pothole Detection</strong> (Roboflow) — mAP 99.1%, Precision 96.2%, Recall 98.1%.
                      Resolusi input: {detectionResult.image.width}×{detectionResult.image.height}px.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Detection History ──────────────────────────────── */}
            {history.length > 0 && (
              <div className="glass-panel rounded-2xl bg-white border border-slate-200 overflow-hidden fade-slide-in">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-500" />
                    Riwayat Deteksi ({history.length})
                  </span>
                  {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showHistory && (
                  <div className="border-t border-slate-100 max-h-80 overflow-y-auto">
                    {history.map((item) => {
                      const itemSeverity = SEVERITY_CONFIG[item.severity];
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition"
                        >
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {item.fileName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.timestamp.toLocaleTimeString('id-ID')} — {item.summary.total} deteksi
                            </p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${itemSeverity.bg} ${itemSeverity.color} ${itemSeverity.border} border`}>
                            {itemSeverity.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
