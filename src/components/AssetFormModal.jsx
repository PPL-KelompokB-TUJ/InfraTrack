import { useEffect, useMemo, useState } from 'react';
import { MapPin, Upload } from 'lucide-react';
import MapPicker from './MapPicker';

const FALLBACK_CATEGORY_OPTIONS = ['Jalan', 'Jembatan', 'Saluran Drainase', 'Air Bersih', 'Listrik'];
const CONDITION_OPTIONS = ['baik', 'rusak ringan', 'rusak berat'];

const currentYear = new Date().getFullYear();
const DEFAULT_POSITION = { lat: -6.2, lng: 106.816666 };

function buildDefaultForm(categoryOptions) {
  const firstCategory = categoryOptions[0] || '';

  return {
    name: '',
    category: firstCategory,
    condition: CONDITION_OPTIONS[0],
    year_built: currentYear,
    lat: DEFAULT_POSITION.lat,
    lng: DEFAULT_POSITION.lng,
    photo_url: '',
  };
}

export default function AssetFormModal({
  isOpen,
  isSubmitting,
  initialAsset,
  categoryOptions,
  onClose,
  onSubmit,
}) {
  const resolvedCategoryOptions = useMemo(() => {
    const options =
      Array.isArray(categoryOptions) && categoryOptions.length > 0
        ? categoryOptions
        : FALLBACK_CATEGORY_OPTIONS;

    if (initialAsset?.category && !options.includes(initialAsset.category)) {
      return [initialAsset.category, ...options];
    }

    return options;
  }, [categoryOptions, initialAsset]);

  const [form, setForm] = useState(() => buildDefaultForm(resolvedCategoryOptions));
  const [photoFile, setPhotoFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialAsset) {
      setForm({
        name: initialAsset.name,
        category: initialAsset.category,
        condition: initialAsset.condition,
        year_built: initialAsset.year_built,
        lat: initialAsset.lat,
        lng: initialAsset.lng,
        photo_url: initialAsset.photo_url || '',
      });
    } else {
      setForm(buildDefaultForm(resolvedCategoryOptions));
    }

    setPhotoFile(null);
    setErrorMessage('');
  }, [isOpen, initialAsset, resolvedCategoryOptions]);

  const photoPreview = useMemo(() => {
    if (photoFile) {
      return URL.createObjectURL(photoFile);
    }

    return form.photo_url || '';
  }, [photoFile, form.photo_url]);

  useEffect(() => {
    return () => {
      if (photoFile && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoFile, photoPreview]);

  if (!isOpen) {
    return null;
  }

  const isEditMode = Boolean(initialAsset);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setErrorMessage('Nama aset wajib diisi.');
      return;
    }

    if (!Number.isFinite(Number(form.lat)) || !Number.isFinite(Number(form.lng))) {
      setErrorMessage('Koordinat belum valid. Klik peta untuk memilih titik.');
      return;
    }

    setErrorMessage('');

    await onSubmit(
      {
        ...form,
        year_built: Number(form.year_built),
        lat: Number(form.lat),
        lng: Number(form.lng),
      },
      photoFile
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
      <div className="glass-panel fade-slide-in max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isEditMode ? 'Edit Aset Infrastruktur' : 'Tambah Aset Infrastruktur'}
            </h2>
            <p className="text-sm text-slate-500">
              Isi data aset, pilih titik lokasi di peta, lalu simpan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
            disabled={isSubmitting}
          >
            Tutup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            Nama Aset
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-400"
              placeholder="Contoh: Jembatan Cempaka"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            Kategori
            <select
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
              className="rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-400"
            >
              {resolvedCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            Kondisi
            <select
              value={form.condition}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, condition: event.target.value }))
              }
              className="rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-400"
            >
              {CONDITION_OPTIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            Tahun Pembangunan
            <input
              type="number"
              min={1800}
              max={currentYear}
              value={form.year_built}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, year_built: event.target.value }))
              }
              className="rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-400"
              required
            />
          </label>

          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin size={16} className="text-cyan-600" />
              Lokasi Aset (klik peta)
            </div>
            <MapPicker
              value={{ lat: Number(form.lat), lng: Number(form.lng) }}
              onChange={(coord) =>
                setForm((prev) => ({ ...prev, lat: coord.lat, lng: coord.lng }))
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Latitude
                <input
                  value={form.lat}
                  readOnly
                  className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-sm text-slate-700"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Longitude
                <input
                  value={form.lng}
                  readOnly
                  className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-sm text-slate-700"
                />
              </label>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Upload size={16} className="text-cyan-600" />
              Upload Foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-dashed border-cyan-200 bg-cyan-50/70 px-4 py-3 text-sm text-slate-700"
            />
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview aset"
                className="mt-3 h-40 w-full rounded-2xl border border-cyan-100 object-cover sm:w-72"
              />
            ) : null}
          </div>

          {errorMessage ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 lg:col-span-2">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 lg:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan Aset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
