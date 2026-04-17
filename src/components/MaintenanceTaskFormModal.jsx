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
      // Set default scheduled_date ke esok hari
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        scheduled_date: tomorrow.toISOString().split('T')[0],
      }));
    }
  }, [isOpen]);

  async function loadFieldOfficers() {
    setIsLoadingOfficers(true);
    setErrorMessage('');
    try {
      const officers = await getActiveFieldOfficers();
      setFieldOfficers(officers);
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memuat daftar petugas');
    } finally {
      setIsLoadingOfficers(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
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

  if (!isOpen) return null;

  const selectedOfficer = fieldOfficers.find(o => o.id === formData.assigned_to);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Buat Penugasan Pemeliharaan</h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Report Info */}
          {report && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                Laporan: <span className="font-mono text-blue-700">{report.ticket_code}</span>
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Jenis: <span className="font-medium">{report.damage_type}</span>
              </p>
              <p className="text-sm text-blue-800">
                Urgensi: <span className="font-medium text-amber-600">{report.urgency_level}</span>
              </p>
            </div>
          )}

          {/* Asset Info */}
          {asset && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm font-medium text-emerald-900">
                Aset: <span className="font-medium">{asset.name}</span>
              </p>
              <p className="text-sm text-emerald-800">
                Lokasi: <span className="font-mono">{asset.latitude}, {asset.longitude}</span>
              </p>
            </div>
          )}

          {/* Assigned Officer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">-- Pilih Petugas --</option>
              {fieldOfficers.map(officer => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} {officer.specialization ? `(${officer.specialization})` : ''}
                </option>
              ))}
            </select>
            {selectedOfficer && (
              <p className="text-xs text-gray-500 mt-1">
                Email: {selectedOfficer.email}
              </p>
            )}
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Dalam Rupiah</p>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.instructions.length}/500 karakter
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition"
          >
            {isSaving ? 'Menyimpan...' : 'Buat Penugasan'}
          </button>
        </div>
      </div>
    </div>
  );
}
