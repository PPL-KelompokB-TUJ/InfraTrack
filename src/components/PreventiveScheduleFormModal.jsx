import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const FREQUENCY_PRESETS = [
  { label: 'Mingguan (7 hari)', value: 7 },
  { label: 'Bulanan (30 hari)', value: 30 },
  { label: '3 Bulan (90 hari)', value: 90 },
  { label: '6 Bulan (180 hari)', value: 180 },
  { label: 'Tahunan (365 hari)', value: 365 },
  { label: 'Kustom', value: 0 },
];

const emptyForm = {
  asset_id: '',
  title: '',
  frequency_days: 30,
  last_done: '',
  next_due: '',
  description: '',
};

export default function PreventiveScheduleFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  assets = [],
  editData = null,
}) {
  const [form, setForm] = useState(emptyForm);
  const [useCustomFreq, setUseCustomFreq] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      const isPreset = FREQUENCY_PRESETS.some((p) => p.value === editData.frequency_days);
      setUseCustomFreq(!isPreset);
      setForm({
        asset_id: editData.asset_id || '',
        title: editData.title || '',
        frequency_days: editData.frequency_days || 30,
        last_done: editData.last_done || '',
        next_due: editData.next_due || '',
        description: editData.description || '',
      });
    } else {
      setForm(emptyForm);
      setUseCustomFreq(false);
    }
  }, [isOpen, editData]);

  useEffect(() => {
    if (form.last_done && form.frequency_days > 0) {
      const d = new Date(form.last_done);
      d.setDate(d.getDate() + Number(form.frequency_days));
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setForm((prev) => ({ ...prev, next_due: `${y}-${m}-${day}` }));
    }
  }, [form.last_done, form.frequency_days]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFrequencyPreset = (val) => {
    if (val === 0) {
      setUseCustomFreq(true);
    } else {
      setUseCustomFreq(false);
      handleChange('frequency_days', val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-6">
      <div className="glass-panel fade-slide-in w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-cyan-100 px-6 py-4">
          <h2 className="text-xl font-extrabold text-slate-800">
            {editData ? 'Edit Jadwal Preventif' : 'Buat Jadwal Preventif'}
          </h2>
          <button type="button" onClick={onClose} disabled={isSaving}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-cyan-50 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Asset */}
          <label className="block text-sm font-semibold text-slate-700">
            Aset
            <select value={form.asset_id} onChange={(e) => handleChange('asset_id', e.target.value)}
              required className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100">
              <option value="">Pilih Aset...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>

          {/* Title */}
          <label className="block text-sm font-semibold text-slate-700">
            Judul Jadwal
            <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)}
              required placeholder="Contoh: Inspeksi Rutin Jembatan"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
          </label>

          {/* Frequency */}
          <label className="block text-sm font-semibold text-slate-700">
            Frekuensi
            <div className="mt-1.5 flex flex-wrap gap-2">
              {FREQUENCY_PRESETS.map((p) => (
                <button type="button" key={p.value}
                  onClick={() => handleFrequencyPreset(p.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    (!useCustomFreq && form.frequency_days === p.value) || (useCustomFreq && p.value === 0)
                      ? 'bg-cyan-500 text-white ring-2 ring-cyan-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </label>

          {useCustomFreq && (
            <label className="block text-sm font-semibold text-slate-700">
              Jumlah Hari (Kustom)
              <input type="number" min="1" value={form.frequency_days}
                onChange={(e) => handleChange('frequency_days', Number(e.target.value))}
                required className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
            </label>
          )}

          {/* Last Done */}
          <label className="block text-sm font-semibold text-slate-700">
            Terakhir Dilakukan
            <input type="date" value={form.last_done} onChange={(e) => handleChange('last_done', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
          </label>

          {/* Next Due */}
          <label className="block text-sm font-semibold text-slate-700">
            Jatuh Tempo Berikutnya
            <input type="date" value={form.next_due} onChange={(e) => handleChange('next_due', e.target.value)}
              required className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
          </label>

          {/* Description */}
          <label className="block text-sm font-semibold text-slate-700">
            Deskripsi
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)}
              rows={3} placeholder="Deskripsi pekerjaan pemeliharaan..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 resize-none" />
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-70">
              Batal
            </button>
            <button type="submit" disabled={isSaving}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70">
              {isSaving ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Buat Jadwal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
