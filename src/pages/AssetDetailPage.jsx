import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  History,
  Upload,
  Download,
  Trash2,
  Filter,
  AlertCircle,
  FileImage,
  FileBadge,
  FileCheck,
  File,
  ChevronRight,
  Wrench,
  ClipboardList,
  CalendarClock,
  TriangleAlert,
  Camera,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotification } from '../context/NotificationContext';
import { getInfrastructureAssets } from '../lib/infrastructureAssetsService';
import {
  uploadAssetDocument,
  getAssetDocuments,
  getDocumentDownloadUrl,
  deleteAssetDocument,
  DOC_TYPE_LABELS,
} from '../lib/assetDocumentService';
import { getAssetTimeline } from '../lib/assetTimelineService';

// ── constants ─────────────────────────────────────────────────────────────────

const DOC_TYPE_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'gambar_teknis', label: 'Gambar Teknis' },
  { value: 'spesifikasi', label: 'Spesifikasi' },
  { value: 'kontrak', label: 'Kontrak' },
  { value: 'lainnya', label: 'Lainnya' },
];

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Semua Aktivitas' },
  { value: 'damage_report', label: 'Laporan Kerusakan' },
  { value: 'maintenance_task', label: 'Penugasan' },
  { value: 'maintenance_log', label: 'Log Pekerjaan' },
  { value: 'preventive_schedule', label: 'Jadwal Preventif' },
];

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// ── helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── doc type icon ─────────────────────────────────────────────────────────────

function DocTypeIcon({ docType, size = 20 }) {
  const props = { size, className: 'shrink-0' };
  if (docType === 'gambar_teknis') return <FileImage {...props} className={cn(props.className, 'text-blue-500')} />;
  if (docType === 'spesifikasi') return <FileBadge {...props} className={cn(props.className, 'text-purple-500')} />;
  if (docType === 'kontrak') return <FileCheck {...props} className={cn(props.className, 'text-green-500')} />;
  return <File {...props} className={cn(props.className, 'text-slate-400')} />;
}

// ── event type config ─────────────────────────────────────────────────────────

const EVENT_CONFIG = {
  damage_report: {
    icon: TriangleAlert,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  maintenance_task: {
    icon: ClipboardList,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  maintenance_log: {
    icon: Wrench,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  preventive_schedule: {
    icon: CalendarClock,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    dot: 'bg-primary',
  },
};

// ── status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  pending: 'bg-slate-100 text-slate-600',
  terverifikasi: 'bg-blue-100 text-blue-700',
  ditolak: 'bg-rose-100 text-rose-700',
  sedang_dikerjakan: 'bg-amber-100 text-amber-700',
  selesai: 'bg-emerald-100 text-emerald-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  started: 'bg-slate-100 text-slate-600',
  aktif: 'bg-primary/10 text-primary',
  selesai_preventif: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-rose-100 text-rose-700',
};

function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize', STATUS_STYLE[status] || 'bg-slate-100 text-slate-600')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ── upload modal ──────────────────────────────────────────────────────────────

function UploadDocumentModal({ assetId, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('gambar_teknis');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Format file tidak didukung.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('Ukuran file maksimal 50 MB.');
      return;
    }
    setError('');
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError('Pilih file terlebih dahulu.'); return; }
    setIsUploading(true);
    setError('');
    try {
      await uploadAssetDocument({ assetId, file, docType, description });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center py-8 px-4">
        <div className="glass-panel fade-slide-in w-full max-w-md rounded-3xl p-6">
          <h2 className="text-2xl font-extrabold text-slate-800">Unggah Dokumen</h2>
          <p className="mt-1 text-sm text-slate-600">Tambahkan dokumen pendukung untuk aset ini</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="text-xs font-medium">{error}</span>
              </div>
            )}

            {/* File picker */}
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-primary/10 rounded-2xl p-4 text-center cursor-pointer hover:border-primary/80 hover:bg-primary/5/40 transition-all duration-200 bg-primary/5"
            >
              {file ? (
                <div className="flex items-center gap-3 text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/5 shrink-0">
                    <FileText size={20} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="py-2 space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100">
                    <Upload size={22} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Klik untuk memilih file</p>
                    <p className="text-xs text-slate-500">atau drag and drop di sini</p>
                  </div>
                  <p className="text-xs text-slate-400">PDF, JPEG, PNG, DOCX, XLSX — maks. 50 MB</p>
                </div>
              )}
              <input ref={inputRef} type="file" className="hidden" accept={ACCEPTED_TYPES.join(',')} onChange={handleFileChange} />
            </div>

            {/* Doc type */}
            <label className="block text-sm font-semibold text-slate-700">
              Jenis Dokumen
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-primary/10 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary/80"
              >
                {DOC_TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            {/* Description */}
            <label className="block text-sm font-semibold text-slate-700">
              Deskripsi <span className="font-normal text-slate-400">(opsional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Masukkan keterangan atau catatan tentang dokumen ini..."
                className="mt-1.5 w-full rounded-xl border border-primary/10 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary/80 resize-none"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="rounded-xl bg-gradient-to-r from-primary to-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Mengunggah…</>
                ) : (
                  <><Upload size={15} />Unggah Dokumen</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── document tab ──────────────────────────────────────────────────────────────

function DocumentsTab({ assetId }) {
  const { addNotification } = useNotification();
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // filters
  const [filterDocType, setFilterDocType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAssetDocuments(assetId, {
        docType: filterDocType || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      });
      setDocs(data);
    } catch (err) {
      addNotification(err.message, 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [assetId, filterDocType, filterDateFrom, filterDateTo, addNotification]);

  useEffect(() => { load(); }, [load]);

  async function handleDownload(doc) {
    setDownloadingId(doc.id);
    try {
      const url = await getDocumentDownloadUrl(doc.file_path);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.rel = 'noopener noreferrer';
      a.target = '_blank';
      a.click();
    } catch (err) {
      addNotification(err.message, 'error', 3000);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Hapus dokumen "${doc.name}"?`)) return;
    setDeletingId(doc.id);
    try {
      await deleteAssetDocument(doc.id, doc.file_path);
      addNotification('Dokumen berhasil dihapus.', 'success', 2500);
      load();
    } catch (err) {
      addNotification(err.message, 'error', 3000);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        {/* filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select
            value={filterDocType}
            onChange={(e) => setFilterDocType(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {DOC_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Dari"
          />
          <span className="text-xs text-slate-400 font-semibold">–</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Sampai"
          />
          {(filterDocType || filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setFilterDocType(''); setFilterDateFrom(''); setFilterDateTo(''); }}
              className="text-xs font-bold text-primary hover:text-primary transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>

        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary text-white text-xs font-bold shadow-lg hover:shadow-xl hover:brightness-110 shrink-0 transition-all"
        >
          <Upload size={16} />
          Unggah Dokumen
        </button>
      </div>

      {/* list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-24 text-slate-400 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100">
            <FileText size={48} className="text-slate-300" />
          </div>
          <p className="text-base font-semibold text-slate-600">Belum ada dokumen</p>
          <p className="text-sm text-slate-500">Mulai dengan mengupload dokumen menggunakan tombol di atas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-100 bg-white hover:border-primary/30 hover:shadow-md hover:bg-primary/5/30 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                <DocTypeIcon docType={doc.doc_type} size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{doc.name}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <span className="inline-block text-xs font-medium text-primary bg-primary/5 px-2.5 py-0.5 rounded-full">{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</span>
                  <span className="text-xs text-slate-500">{formatFileSize(doc.file_size)}</span>
                  <span className="text-xs text-slate-400">{formatDate(doc.created_at)}</span>
                  {doc.uploader?.name && (
                    <span className="text-xs text-slate-500">oleh <span className="font-medium text-slate-700">{doc.uploader.name}</span></span>
                  )}
                </div>
                {doc.description && (
                  <p className="text-xs text-slate-600 mt-2 truncate italic">{doc.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  title="Unduh"
                  className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                >
                  {downloadingId === doc.id
                    ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    : <Download size={18} />}
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  title="Hapus"
                  className="p-2 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors disabled:opacity-50"
                >
                  {deletingId === doc.id
                    ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadDocumentModal
          assetId={assetId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { load(); addNotification('Dokumen berhasil diunggah.', 'success', 2500); }}
        />
      )}
    </div>
  );
}

// ── timeline tab ──────────────────────────────────────────────────────────────

function TimelineTab({ assetId }) {
  const { addNotification } = useNotification();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterEventType, setFilterEventType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAssetTimeline(assetId, {
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
        eventTypes: filterEventType ? [filterEventType] : undefined,
      });
      setEvents(data);
    } catch (err) {
      addNotification(err.message, 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [assetId, filterEventType, filterDateFrom, filterDateTo, addNotification]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={16} className="text-slate-400 shrink-0" />
        <select
          value={filterEventType}
          onChange={(e) => setFilterEventType(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {EVENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-xs text-slate-400 font-semibold">–</span>
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {(filterEventType || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterEventType(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            className="text-xs font-bold text-primary hover:text-primary transition-colors"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-24 text-slate-400 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100">
            <History size={48} className="text-slate-300" />
          </div>
          <p className="text-base font-semibold text-slate-600">Belum ada riwayat aktivitas</p>
          <p className="text-sm text-slate-500">Aktivitas aset akan muncul di sini seiring waktu</p>
        </div>
      ) : (
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

          <div className="space-y-4">
            {events.map((event, idx) => {
              const cfg = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.maintenance_log;
              const Icon = cfg.icon;
              return (
                <div key={event.id} className="relative pl-14">
                  {/* dot */}
                  <div className={cn('absolute left-3.5 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow', cfg.dot)} />
                  {/* icon badge */}
                  <div className={cn('absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border', cfg.bg, cfg.border)}>
                    <Icon size={17} className={cfg.color} />
                  </div>

                  <div className={cn('rounded-xl border p-4 space-y-2', cfg.bg, cfg.border)}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{event.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{event.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={event.status} />
                        <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(event.occurred_at)}</span>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>
                    )}

                    {/* meta info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      {event.meta?.officer && (
                        <span className="text-xs text-slate-500">
                          <span className="font-medium">Petugas:</span> {event.meta.officer}
                        </span>
                      )}
                      {event.meta?.ticket_code && (
                        <span className="text-xs text-slate-500">
                          <span className="font-medium">Tiket:</span> {event.meta.ticket_code}
                        </span>
                      )}
                      {event.meta?.urgency_level && (
                        <span className="text-xs text-slate-500">
                          <span className="font-medium">Urgensi:</span> {event.meta.urgency_level}
                        </span>
                      )}
                      {event.meta?.reporter && (
                        <span className="text-xs text-slate-500">
                          <span className="font-medium">Pelapor:</span> {event.meta.reporter}
                        </span>
                      )}
                      {event.meta?.frequency && (
                        <span className="text-xs text-slate-500">
                          <span className="font-medium">Frekuensi:</span> {event.meta.frequency}
                        </span>
                      )}
                      {event.meta?.photo_url && (
                        <a
                          href={event.meta.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Camera size={12} /> Lihat Foto
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const CONDITION_STYLE = {
  baik: 'bg-emerald-100 text-emerald-700',
  'rusak ringan': 'bg-amber-100 text-amber-700',
  'rusak berat': 'bg-rose-100 text-rose-700',
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [asset, setAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const assets = await getInfrastructureAssets();
        const found = assets.find((a) => a.id === id);
        if (!found) throw new Error('Aset tidak ditemukan.');
        setAsset(found);
      } catch (err) {
        addNotification(err.message, 'error', 3000);
        navigate('/dashboard/assets', { replace: true });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, navigate, addNotification]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-on-surface-variant text-sm">Memuat detail aset…</p>
        </div>
      </div>
    );
  }

  if (!asset) return null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">

      {/* back button */}
      <button
        onClick={() => navigate('/dashboard/assets')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-8 transition-all duration-200 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Kembali ke Manajemen Aset
      </button>

      {/* asset header card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row gap-6 border border-primary/5 shadow-lg hover:shadow-xl transition-shadow">
        {asset.photo_url ? (
          <img
            src={asset.photo_url}
            alt={asset.name}
            className="w-full sm:w-40 h-40 object-cover rounded-2xl border-2 border-slate-200 shadow-md shrink-0 hover:shadow-lg transition-shadow"
          />
        ) : (
          <div className="w-full sm:w-40 h-40 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border-2 border-slate-200 shadow-md shrink-0">
            <span className="material-symbols-outlined text-6xl text-slate-300">domain</span>
          </div>
        )}

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-primary letter-spacing">
                {asset.category}
              </p>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-1.5">{asset.name}</h1>
            </div>
            <span className={cn('px-3 py-1.5 rounded-full text-xs font-bold shadow-sm', CONDITION_STYLE[asset.condition] || 'bg-slate-100 text-slate-600')}>
              {asset.condition}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600 pt-2">
            <span><span className="font-bold text-slate-800">Tahun:</span> <span className="text-slate-700">{asset.year_built}</span></span>
            {asset.lat && asset.lng && (
              <span><span className="font-bold text-slate-800">Koordinat:</span> <span className="text-slate-700">{Number(asset.lat).toFixed(5)}, {Number(asset.lng).toFixed(5)}</span></span>
            )}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-lg">
        {/* tab header */}
        <div className="flex border-b border-slate-100 bg-gradient-to-r from-white to-primary/5/30">
          {[
            { key: 'documents', label: 'Dokumen', icon: FileText },
            { key: 'timeline', label: 'Riwayat Aktivitas', icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-all duration-200',
                activeTab === key
                  ? 'border-primary text-primary bg-gradient-to-b from-primary/5/80 to-white'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-primary/5/60',
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="p-6 sm:p-8 bg-white min-h-[400px]">
          {activeTab === 'documents' && <DocumentsTab assetId={id} />}
          {activeTab === 'timeline' && <TimelineTab assetId={id} />}
        </div>
      </div>
    </main>
  );
}
