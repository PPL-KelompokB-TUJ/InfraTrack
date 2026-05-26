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
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
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
  aktif: 'bg-teal-100 text-teal-700',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Upload size={18} className="text-cyan-600" />
            Unggah Dokumen
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-sm">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File picker */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/40 transition-colors"
          >
            {file ? (
              <div className="space-y-1">
                <FileText size={28} className="mx-auto text-cyan-600" />
                <p className="text-sm font-semibold text-slate-700 truncate max-w-xs mx-auto">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload size={28} className="mx-auto text-slate-300" />
                <p className="text-sm text-slate-500">Klik untuk pilih file</p>
                <p className="text-xs text-slate-400">PDF, JPEG, PNG, DOCX, XLSX — maks. 50 MB</p>
              </div>
            )}
            <input ref={inputRef} type="file" className="hidden" accept={ACCEPTED_TYPES.join(',')} onChange={handleFileChange} />
          </div>

          {/* Doc type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Dokumen</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              {DOC_TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi <span className="font-normal text-slate-400">(opsional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Keterangan tambahan..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-bold shadow-sm hover:brightness-110 disabled:opacity-60 flex items-center gap-2"
            >
              {isUploading ? (
                <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Mengunggah…</>
              ) : (
                <><Upload size={15} />Unggah</>
              )}
            </button>
          </div>
        </form>
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
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={filterDocType}
            onChange={(e) => setFilterDocType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            {DOC_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            placeholder="Dari"
          />
          <span className="text-xs text-slate-400">–</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            placeholder="Sampai"
          />
          {(filterDocType || filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setFilterDocType(''); setFilterDateFrom(''); setFilterDateTo(''); }}
              className="text-xs text-rose-500 hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-bold shadow-sm hover:brightness-110 shrink-0"
        >
          <Upload size={13} />
          Unggah Dokumen
        </button>
      </div>

      {/* list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 space-y-2">
          <FileText size={36} className="mx-auto opacity-40" />
          <p className="text-sm font-medium">Belum ada dokumen</p>
          <p className="text-xs">Unggah dokumen menggunakan tombol di atas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 bg-white hover:border-cyan-200 hover:bg-cyan-50/30 transition-colors group"
            >
              <DocTypeIcon docType={doc.doc_type} size={22} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="text-xs text-slate-500">{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</span>
                  <span className="text-xs text-slate-400">{formatFileSize(doc.file_size)}</span>
                  <span className="text-xs text-slate-400">{formatDate(doc.created_at)}</span>
                  {doc.uploader?.name && (
                    <span className="text-xs text-slate-400">oleh {doc.uploader.name}</span>
                  )}
                </div>
                {doc.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  title="Unduh"
                  className="p-2 rounded-lg hover:bg-cyan-100 text-cyan-600 transition-colors disabled:opacity-50"
                >
                  {downloadingId === doc.id
                    ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    : <Download size={16} />}
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
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-slate-400 shrink-0" />
        <select
          value={filterEventType}
          onChange={(e) => setFilterEventType(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        >
          {EVENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        />
        <span className="text-xs text-slate-400">–</span>
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        />
        {(filterEventType || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterEventType(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            className="text-xs text-rose-500 hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-slate-400 space-y-2">
          <History size={36} className="mx-auto opacity-40" />
          <p className="text-sm font-medium">Belum ada riwayat aktivitas</p>
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
                          className="text-xs text-cyan-600 hover:underline flex items-center gap-1"
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
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Kembali ke Manajemen Aset
      </button>

      {/* asset header card */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row gap-4">
        {asset.photo_url ? (
          <img
            src={asset.photo_url}
            alt={asset.name}
            className="w-full sm:w-32 h-32 object-cover rounded-xl border border-slate-200 shrink-0"
          />
        ) : (
          <div className="w-full sm:w-32 h-32 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
            <span className="material-symbols-outlined text-4xl text-slate-300">domain</span>
          </div>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">
                {asset.category}
              </p>
              <h1 className="text-xl font-extrabold text-slate-800 mt-0.5">{asset.name}</h1>
            </div>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', CONDITION_STYLE[asset.condition] || 'bg-slate-100 text-slate-600')}>
              {asset.condition}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
            <span><span className="font-semibold text-slate-700">Tahun:</span> {asset.year_built}</span>
            {asset.lat && asset.lng && (
              <span><span className="font-semibold text-slate-700">Koordinat:</span> {Number(asset.lat).toFixed(5)}, {Number(asset.lng).toFixed(5)}</span>
            )}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* tab header */}
        <div className="flex border-b border-slate-200 bg-white">
          {[
            { key: 'documents', label: 'Dokumen', icon: FileText },
            { key: 'timeline', label: 'Riwayat Aktivitas', icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors',
                activeTab === key
                  ? 'border-cyan-500 text-cyan-700 bg-cyan-50/60'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="p-5 sm:p-6 bg-white min-h-[400px]">
          {activeTab === 'documents' && <DocumentsTab assetId={id} />}
          {activeTab === 'timeline' && <TimelineTab assetId={id} />}
        </div>
      </div>
    </main>
  );
}
