import { useEffect, useState } from 'react';
import { Package, Plus, Pencil, ArrowUpCircle, Trash2, Search, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  restockMaterial,
  deleteMaterial
} from '../lib/materialService';
import ConfirmationModal from '../components/ConfirmationModal';

export default function InventoryPage() {
  const { addNotification } = useNotification();
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ id: null, name: '', unit: '', stock: '', unit_price: '', is_active: true });
  const [restockData, setRestockData] = useState({ id: null, name: '', currentStock: 0, additionalStock: '', referenceNote: '' });

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemId: null,
    itemName: ''
  });

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      addNotification('Gagal memuat data inventaris: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleOpenForm = (material = null) => {
    if (material) {
      setFormData({
        ...material,
        stock: material.stock === 0 ? '' : material.stock,
        unit_price: material.unit_price === 0 ? '' : material.unit_price
      });
    } else {
      setFormData({ id: null, name: '', unit: '', stock: '', unit_price: '', is_active: true });
    }
    setIsFormModalOpen(true);
  };

  const handleOpenRestock = (material) => {
    setRestockData({ id: material.id, name: material.name, currentStock: material.stock, additionalStock: '', referenceNote: '' });
    setIsRestockModalOpen(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateMaterial(formData.id, {
          name: formData.name,
          unit: formData.unit,
          unit_price: Number(formData.unit_price) || 0,
          is_active: formData.is_active
        });
        addNotification(`Material ${formData.name} berhasil diperbarui`, 'success');
      } else {
        await createMaterial({
          name: formData.name,
          unit: formData.unit,
          stock: Number(formData.stock) || 0,
          unit_price: Number(formData.unit_price) || 0,
          is_active: formData.is_active
        });
        addNotification(`Material ${formData.name} berhasil ditambahkan`, 'success');
      }
      setIsFormModalOpen(false);
      loadMaterials();
    } catch (error) {
      addNotification('Gagal menyimpan material: ' + error.message, 'error');
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    try {
      const newStock = Number(restockData.currentStock) + (Number(restockData.additionalStock) || 0);
      const note = restockData.referenceNote || 'Restok manual';
      await restockMaterial(restockData.id, newStock, note);
      addNotification(`Stok ${restockData.name} berhasil ditambah`, 'success');
      setIsRestockModalOpen(false);
      loadMaterials();
    } catch (error) {
      addNotification('Gagal menambah stok: ' + error.message, 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteMaterial(confirmationModal.itemId);
      addNotification(`Material ${confirmationModal.itemName} berhasil dihapus`, 'success');
      setConfirmationModal({ isOpen: false, itemId: null, itemName: '' });
      loadMaterials();
    } catch (error) {
      addNotification('Gagal menghapus material. Mungkin sedang digunakan di laporan.', 'error');
      setConfirmationModal({ isOpen: false, itemId: null, itemName: '' });
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
      <section className="glass-panel fade-slide-in rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              InfraTrack / Administrator
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
              Manajemen Inventaris
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Kelola daftar material pemeliharaan, stok, dan harga satuan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/inventory/history"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-primary/20 px-4 py-2.5 text-sm font-bold text-primary shadow-sm hover:bg-primary/5"
            >
              <History size={18} />
              Riwayat Inventaris
            </Link>
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary px-4 py-2.5 text-sm font-bold text-white shadow hover:brightness-110"
            >
              <Plus size={18} />
              Tambah Material
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-primary/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-slate-500">Memuat inventaris...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-white">
            <table className="min-w-full divide-y divide-primary/20 text-sm">
              <thead className="bg-primary/5/70 text-left text-xs uppercase tracking-wide text-primary">
                <tr>
                  <th className="px-4 py-3">Nama Material</th>
                  <th className="px-4 py-3">Stok Saat Ini</th>
                  <th className="px-4 py-3">Satuan</th>
                  <th className="px-4 py-3">Harga Satuan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {filteredMaterials.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5/30">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-primary" />
                        {item.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        item.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.unit}</td>
                    <td className="px-4 py-3 text-slate-600">
                      Rp {Number(item.unit_price).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        item.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
                      }`}>
                        {item.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenRestock(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                          title="Restock"
                        >
                          <ArrowUpCircle size={14} />
                          Restock
                        </button>
                        <button
                          onClick={() => handleOpenForm(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary/20 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/5"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmationModal({ isOpen: true, itemId: item.id, itemName: item.name })}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMaterials.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                      Tidak ada data material ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-slate-800">
              {formData.id ? 'Edit Material' : 'Tambah Material Baru'}
            </h3>
            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Nama Material</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Satuan</label>
                  <input
                    required
                    type="text"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="cth: sak, kg, buah"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                {!formData.id && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Stok Awal</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Harga Satuan (Rp)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.unit_price}
                  onChange={e => setFormData({ ...formData, unit_price: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Aktif digunakan</label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-xl font-bold text-slate-800">Restock Material</h3>
            <p className="mb-4 text-sm text-slate-600">
              Tambahkan stok untuk <strong>{restockData.name}</strong>. Stok saat ini: {restockData.currentStock}.
            </p>
            <form onSubmit={handleRestock} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Jumlah Tambahan</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={restockData.additionalStock}
                  onChange={e => setRestockData({ ...restockData, additionalStock: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Catatan / Alasan Restok</label>
                <input
                  type="text"
                  placeholder="Opsional (misal: No. Invoice / Pemasok)"
                  value={restockData.referenceNote}
                  onChange={e => setRestockData({ ...restockData, referenceNote: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
                >
                  Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title="Hapus Material"
        message={`Apakah Anda yakin ingin menghapus material "${confirmationModal.itemName}"? Operasi ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmationModal({ isOpen: false, itemId: null, itemName: '' })}
      />
    </main>
  );
}
