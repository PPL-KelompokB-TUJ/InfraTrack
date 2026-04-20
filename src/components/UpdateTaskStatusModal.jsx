import { useState } from 'react';
import { Camera, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

export default function UpdateTaskStatusForm({ task, onClose, onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    status: 'in_progress',
    notes: '',
    photo: null,
    photoPreview: null,
  });
  const [error, setError] = useState('');

  const handleStatusChange = (e) => {
    setFormData({ ...formData, status: e.target.value });
  };

  const handleNotesChange = (e) => {
    setFormData({ ...formData, notes: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file terlalu besar. Maksimal 5MB.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar.');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          photo: file,
          photoPreview: e.target.result,
        });
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleRemovePhoto = () => {
    setFormData({
      ...formData,
      photo: null,
      photoPreview: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.status) {
      setError('Pilih status pekerjaan');
      return;
    }

    if (formData.status === 'completed' && !formData.notes.trim()) {
      setError('Catatan wajib diisi saat menyelesaikan pekerjaan');
      return;
    }

    try {
      await onSubmit({
        status: formData.status,
        notes: formData.notes,
        photo: formData.photo,
      });
    } catch (err) {
      setError(err.message || 'Gagal memperbarui status');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Update Status Pekerjaan</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Task Info */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-sm text-slate-600">Aset: {task?.asset?.name}</div>
            <div className="text-sm text-slate-600">Tiket: {task?.report?.ticket_code}</div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status Pekerjaan
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="status"
                  value="started"
                  checked={formData.status === 'started'}
                  onChange={handleStatusChange}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-sm text-slate-700">Mulai Dikerjakan</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="status"
                  value="in_progress"
                  checked={formData.status === 'in_progress'}
                  onChange={handleStatusChange}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-sm text-slate-700">Dalam Progres</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={formData.status === 'completed'}
                  onChange={handleStatusChange}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-sm text-slate-700">Selesai</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
              Catatan Lapangan
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={handleNotesChange}
              disabled={isLoading}
              placeholder="Jelaskan kondisi pekerjaan, masalah yang dihadapi, atau hasil perbaikan..."
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Foto Progress
            </label>

            {formData.photoPreview ? (
              <div className="relative">
                <img
                  src={formData.photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isLoading}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 disabled:opacity-50">
                <Camera className="text-slate-400 mb-2" size={24} />
                <span className="text-sm text-slate-600">Klik untuk unggah foto</span>
                <span className="text-xs text-slate-500 mt-1">Maksimal 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Indicator */}
          {formData.photo && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 size={18} className="text-green-600" />
              <p className="text-sm text-green-600">Foto siap diunggah</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
