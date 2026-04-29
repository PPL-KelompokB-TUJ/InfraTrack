import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  getActiveFieldOfficers,
  createFieldOfficer,
  updateFieldOfficer,
  deleteFieldOfficer,
} from '../lib/maintenanceTaskService';

export default function FieldOfficersPage() {
  const { addNotification } = useNotification();
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    officerId: null,
    officerName: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    work_area: '',
  });

  const [createdCredentials, setCreatedCredentials] = useState({ email: '', password: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Load officers
  useEffect(() => {
    loadOfficers();
  }, []);

  const loadOfficers = async () => {
    setIsLoading(true);
    try {
      const data = await getActiveFieldOfficers();
      setOfficers(data);
    } catch (error) {
      addNotification(error.message || 'Gagal memuat data petugas', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (officer = null) => {
    if (officer) {
      setEditingId(officer.id);
      setFormData({
        name: officer.name,
        email: officer.email,
        phone: officer.phone || '',
        specialization: officer.specialization || '',
        work_area: officer.work_area || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        work_area: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      work_area: '',
    });
  };

  // Auto-generate email from name
  const generateDefaultEmail = (name) => {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return sanitized ? `${sanitized}@gmail.com` : '';
  };

  const handleNameChange = (value) => {
    setFormData((prev) => {
      const updated = { ...prev, name: value };
      // Auto-generate email only when adding new officer (not editing)
      if (!editingId) {
        updated.email = generateDefaultEmail(value);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateFieldOfficer(editingId, formData);
        addNotification('Petugas berhasil diperbarui', 'success', 3000);
      } else {
        const result = await createFieldOfficer(formData);
        if (result) {
          setCreatedCredentials({
            email: result.defaultEmail || formData.email,
            password: result.defaultPassword || '1234',
          });
          setShowPasswordModal(true);
        }
        addNotification('Petugas berhasil ditambahkan', 'success', 3000);
      }
      handleCloseForm();
      await loadOfficers();
    } catch (error) {
      addNotification(error.message || 'Gagal menyimpan petugas', 'error', 3000);
    }
  };

  const handleDelete = (officer) => {
    setConfirmationModal({
      isOpen: true,
      officerId: officer.id,
      officerName: officer.name,
    });
  };

  const confirmDeleteOfficer = async () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));

    try {
      await deleteFieldOfficer(confirmationModal.officerId);
      addNotification(`Petugas "${confirmationModal.officerName}" berhasil dihapus`, 'success', 3000);
      await loadOfficers();
    } catch (error) {
      addNotification(error.message || 'Gagal menghapus petugas', 'error', 3000);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Manajemen Petugas Lapangan</h1>
            <p className="mt-2 text-sm text-slate-600">
              Kelola data petugas lapangan yang bertugas untuk penugasan pemeliharaan infrastruktur
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
          >
            <Plus size={18} />
            Tambah Petugas
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-cyan-600" />
              </div>
              <p className="mt-2 text-sm text-slate-600">Memuat data petugas...</p>
            </div>
          </div>
        ) : officers.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-slate-600">Tidak ada data petugas</p>
              <button
                type="button"
                onClick={() => handleOpenForm()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50"
              >
                <Plus size={14} />
                Tambah Petugas
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Telepon</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                    Spesialisasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Area Kerja</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((officer, idx) => (
                  <tr
                    key={officer.id}
                    className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{officer.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{officer.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{officer.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {officer.specialization || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{officer.work_area || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenForm(officer)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(officer)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="glass-panel fade-slide-in w-full max-w-md rounded-3xl p-6">
            <h2 className="text-2xl font-extrabold text-slate-800">
              {editingId ? 'Edit Petugas' : 'Tambah Petugas Baru'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {editingId
                ? 'Perbarui informasi petugas lapangan'
                : 'Tambahkan petugas lapangan baru ke sistem'}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Nama Petugas *
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="Contoh: Ahmad Sutrisno"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Email {editingId ? '*' : '(auto-generate)'}
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className={`mt-1.5 w-full rounded-xl border border-cyan-100 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 ${
                    !editingId ? 'bg-slate-50 text-slate-500' : 'bg-white'
                  }`}
                  placeholder="ahmad@example.com"
                  readOnly={!editingId}
                  required
                />
                {!editingId && formData.email && (
                  <p className="mt-1 text-xs text-cyan-600">
                    📧 Email otomatis: {formData.email}
                  </p>
                )}
              </label>

              {!editingId && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700">🔑 Password Default</p>
                  <p className="mt-1 font-mono text-sm font-bold text-amber-900">1234</p>
                  <p className="mt-1 text-xs text-amber-600">
                    Petugas bisa login dengan email dan password ini.
                  </p>
                </div>
              )}

              <label className="block text-sm font-semibold text-slate-700">
                Telepon
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="08123456789"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Spesialisasi
                <select
                  value={formData.specialization}
                  onChange={(e) => handleFormChange('specialization', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                >
                  <option value="">- Pilih Spesialisasi -</option>
                  <option value="Perbaikan Jalan">Perbaikan Jalan</option>
                  <option value="Pemeliharaan Air">Pemeliharaan Air</option>
                  <option value="Listrik">Listrik</option>
                  <option value="Umum">Umum</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Area Kerja
                <input
                  type="text"
                  value={formData.work_area}
                  onChange={(e) => handleFormChange('work_area', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="Contoh: Kelurahan Cikini, Jakarta Pusat"
                />
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-xl border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
                >
                  {editingId ? 'Perbarui' : 'Tambah'} Petugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credential Display Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="glass-panel fade-slide-in w-full max-w-md rounded-3xl p-6">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              ✓
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">Petugas Berhasil Dibuat!</h2>
            <p className="mt-2 text-sm text-slate-600">
              Berikut adalah kredensial default untuk login petugas.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="block text-xs font-semibold text-slate-600">Email</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="font-mono text-sm text-slate-800">{createdCredentials.email}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.email);
                      addNotification('Email berhasil disalin!', 'success', 2000);
                    }}
                    className="rounded-lg bg-slate-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                  >
                    Salin
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <label className="block text-xs font-semibold text-emerald-700">Password Default</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="font-mono text-sm font-bold text-emerald-900">{createdCredentials.password}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.password);
                      addNotification('Password berhasil disalin!', 'success', 2000);
                    }}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Salin
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold text-blue-700">💡 Tips:</p>
              <p className="mt-1 text-xs text-blue-600">
                Bagikan email dan password ini kepada petugas. Disarankan untuk mengubah password setelah login pertama.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false);
                setCreatedCredentials({ email: '', password: '' });
              }}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title="Hapus Petugas?"
        message={`Hapus petugas "${confirmationModal.officerName}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDeleteOfficer}
        onCancel={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}
