import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, DollarSign, User, FileText, X } from 'lucide-react';
import { getActiveFieldOfficers } from '../lib/maintenanceTaskService';

export default function MaintenanceTaskFormModal({ isOpen, onClose, report, asset, onSubmit, isSaving }) {
  const [formData, setFormData] = useState({
    scheduled_date: '',
    estimated_cost: '',
    assigned_to: '',
    instructions: '',
  });

  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFieldOfficers();

      // Set default scheduled_date ke esok hari.
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData((prev) => ({
        ...prev,
        scheduled_date: tomorrow.toISOString().split('T')[0],
      }));
      setErrorMessage('');
    }
  }, [isOpen]);

  async function loadFieldOfficers() {
    setIsLoadingOfficers(true);
    setErrorMessage('');
    try {
      const officers = await getActiveFieldOfficers();
      setFieldOfficers(officers);

      if (officers.length > 0) {
        setFormData((prev) => ({
          ...prev,
          assigned_to: prev.assigned_to || officers[0].id,
        }));
      }
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memuat daftar petugas');
    } finally {
      setIsLoadingOfficers(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage('');
  }

  function validateForm() {
    if (!formData.assigned_to) {
      setErrorMessage('Pilih petugas lapangan');
      return false;
    }
    if (!formData.scheduled_date) {
      setErrorMessage('Tentukan tanggal terjadwal');
      return false;
    }
    if (!formData.instructions.trim()) {
      setErrorMessage('Instruksi kerja tidak boleh kosong');
      return false;
    }

    const scheduledDate = new Date(formData.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduledDate < today) {
      setErrorMessage('Tanggal terjadwal tidak boleh lebih awal dari hari ini');
      return false;
    }

    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
    });
  }

  if (!isOpen) {
    return null;
  }

  const selectedOfficer = fieldOfficers.find((officer) => officer.id === formData.assigned_to);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
      <div className="glass-panel fade-slide-in max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-100 px-6 py-5">
          <h2 className="text-xl font-extrabold text-slate-800">Buat Penugasan Pemeliharaan</h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-cyan-50 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form id="maintenance-task-form" onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Report Info */}
          {report && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/80 p-4">
              <p className="text-sm font-semibold text-cyan-900">
                Laporan: <span className="font-mono text-cyan-700">{report.ticket_code}</span>
              </p>
              <p className="mt-1 text-sm text-cyan-800">
                Jenis: <span className="font-medium">{report.damage_type}</span>
              </p>
              <p className="text-sm text-cyan-800">
                Urgensi: <span className="font-medium capitalize text-amber-700">{report.urgency_level}</span>
              </p>
            </div>
          )}

          {/* Asset Info */}
          {asset && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4">
              <p className="text-sm font-semibold text-emerald-900">
                Aset: <span className="font-medium">{asset.name}</span>
              </p>
              <p className="text-sm text-emerald-800">
                Lokasi:{' '}
                <span className="font-mono text-xs">
                  {asset.lat ?? asset.latitude}, {asset.lng ?? asset.longitude}
                </span>
              </p>
            </div>
          )}

          {/* Assigned Officer */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Petugas Lapangan *
              </div>
            </label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleInputChange}
              disabled={isLoadingOfficers || isSaving}
              className="w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 disabled:bg-slate-100"
            >
              <option value="">-- Pilih Petugas --</option>
              {fieldOfficers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} {officer.specialization ? `(${officer.specialization})` : ''}
                </option>
              ))}
            </select>
            {selectedOfficer && (
              <p className="mt-1 text-xs text-slate-500">
                Email: {selectedOfficer.email}
              </p>
            )}
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tanggal Terjadwal *
              </div>
            </label>
            <input
              type="date"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleInputChange}
              disabled={isSaving}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 disabled:bg-slate-100"
            />
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Estimasi Biaya (Opsional)
              </div>
            </label>
            <input
              type="number"
              name="estimated_cost"
              placeholder="0"
              value={formData.estimated_cost}
              onChange={handleInputChange}
              disabled={isSaving}
              min="0"
              step="1000"
              className="w-full rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 disabled:bg-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">Dalam Rupiah</p>
          </div>

          {/* Instructions */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Instruksi Kerja *
              </div>
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="Jelaskan detail pekerjaan yang harus dilakukan petugas..."
              rows="4"
              maxLength={500}
              className="w-full resize-none rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 disabled:bg-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              {formData.instructions.length}/500 karakter
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 border-t border-cyan-100 bg-white/80 px-6 py-5">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="maintenance-task-form"
            disabled={isSaving}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60"
          >
            {isSaving ? 'Menyimpan...' : 'Buat Penugasan'}
          </button>
        </div>
      </div>
    </div>
  );
}
