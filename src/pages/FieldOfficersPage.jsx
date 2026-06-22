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
    
    <main className="mx-auto w-full max-w-full px-4 py-8 sm:px-6 lg:px-8 relative z-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold font-serif text-slate-800 tracking-tight">Manajemen Petugas</h1>
        <p className="mt-2 text-slate-600 text-lg">Kelola entitas dan peran petugas yang tersebar di infrastruktur saat ini.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-white/50 border border-primary-container/20 text-slate-600 font-bold text-sm tracking-widest uppercase rounded-full hover:bg-white/80 transition-colors shadow-sm whitespace-nowrap">
            Filter Peran
          </button>
          <button className="px-6 py-2 bg-white/50 border border-primary-container/20 text-slate-600 font-bold text-sm tracking-widest uppercase rounded-full hover:bg-white/80 transition-colors shadow-sm whitespace-nowrap">
            Urut Status
          </button>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="px-6 py-2 bg-primary/20 text-primary-dark font-bold text-sm tracking-widest uppercase rounded-full hover:bg-primary/30 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
        >
          <span>+ Tambah Petugas</span>
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="mb-8">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </div>
        ) : officers.length === 0 ? (
          <div className="glass-card bg-white/50 border border-primary-container/20 rounded-3xl p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">group_off</span>
            <p className="text-slate-500 text-lg">Tidak ada data petugas yang ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officers.map((officer) => {
              const initials = officer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div key={officer.id} className="glass-card bg-white/70 border border-primary-container/20 rounded-3xl p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                  {/* Action Menu (dots) */}
                  <div className="absolute top-6 right-6 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenForm(officer)} className="p-1.5 text-slate-400 hover:text-blue-500 bg-white/80 rounded-full shadow-sm"><span className="material-symbols-outlined text-[18px] block">edit</span></button>
                    <button onClick={() => handleDelete(officer)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white/80 rounded-full shadow-sm"><span className="material-symbols-outlined text-[18px] block">delete</span></button>
                  </div>
                  
                  {/* Header: Avatar + Info */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/80 to-primary-container/80 flex items-center justify-center text-white font-serif font-bold text-xl shadow-inner">
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-serif text-slate-800 tracking-tight leading-tight">{officer.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{officer.email}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-primary-container/10 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PERAN</span>
                      <span className="text-sm font-semibold text-slate-800">{officer.specialization || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-primary-container/10 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DEPARTEMEN</span>
                      <span className="text-sm font-semibold text-slate-800">{officer.work_area || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STATUS</span>
                      <span className="text-xs font-bold text-emerald-600 tracking-wider">Aktif</span>
                    </div>
                  </div>
                  
                  {/* Background Petal Decoration */}
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-[40%_60%_70%_30%] transform rotate-45 blur-xl pointer-events-none"></div>
                </div>
              );
            })}
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
                  className="mt-1.5 w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary/60"
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
                  className={`mt-1.5 w-full rounded-xl border border-primary/20 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 ${
                    !editingId ? 'bg-primary/5 text-slate-500' : 'bg-white'
                  }`}
                  placeholder="ahmad@example.com"
                  readOnly={!editingId}
                  required
                />
                {!editingId && formData.email && (
                  <p className="mt-1 text-xs text-primary">
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
                  className="mt-1.5 w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary/60"
                  placeholder="08123456789"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Spesialisasi
                <select
                  value={formData.specialization}
                  onChange={(e) => handleFormChange('specialization', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary/60"
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
                  className="mt-1.5 w-full rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary/60"
                  placeholder="Contoh: Kelurahan Cikini, Jakarta Pusat"
                />
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary-dark transition hover:bg-primary/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
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
              <div className="rounded-xl border border-slate-200 bg-primary/5 p-4">
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
              className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
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
