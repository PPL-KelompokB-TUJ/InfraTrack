import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Loader, Save } from 'lucide-react';
import { getMaterials, getMaterialUsages, addMaterialUsage } from '../lib/materialService';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabaseClient';

export default function MaterialUsagePanel({ taskId, taskStatus, userRole, taskActualCost, taskAdditionalCostDesc }) {
  const { addNotification } = useNotification();
  const [usages, setUsages] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState([{ materialId: '', quantity: '', notes: '' }]);

  const canEdit = taskStatus === 'in_progress' && userRole === 'officer';

  const handleAddRow = () => {
    setFormData([...formData, { materialId: '', quantity: '', notes: '' }]);
  };

  const handleRemoveRow = (index) => {
    const newForm = [...formData];
    newForm.splice(index, 1);
    setFormData(newForm);
  };

  const handleChangeRow = (index, field, value) => {
    const newForm = [...formData];
    newForm[index][field] = value;
    setFormData(newForm);
  };

  useEffect(() => {
    if (taskId) {
      loadData();
    }
  }, [taskId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usagesData, materialsData] = await Promise.all([
        getMaterialUsages(taskId),
        getMaterials(true) // only active
      ]);
      setUsages(usagesData);
      setMaterials(materialsData);
    } catch (error) {
      addNotification('Gagal memuat data material', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUsage = async (e) => {
    e.preventDefault();
    
    // Validasi kosong
    for (let i = 0; i < formData.length; i++) {
      if (!formData[i].materialId || !formData[i].quantity) {
        addNotification(`Baris ${i + 1}: Material dan jumlah harus diisi`, 'error');
        return;
      }
    }

    // Hitung total quantity per material untuk cek stok
    const materialCounts = {};
    for (const row of formData) {
      materialCounts[row.materialId] = (materialCounts[row.materialId] || 0) + Number(row.quantity);
    }

    // Cek stok
    for (const [mId, totalQty] of Object.entries(materialCounts)) {
      const material = materials.find(m => m.id === mId);
      if (material && totalQty > Number(material.stock)) {
        addNotification(`Stok ${material.name} tidak cukup. Dibutuhkan: ${totalQty}, Sisa stok: ${material.stock}`, 'error');
        return;
      }
    }

    try {
      setSubmitting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const officerId = sessionData.session.user.id;

      // Submit all rows
      const bulkData = formData.map(row => {
        const material = materials.find(m => m.id === row.materialId);
        const q = Number(row.quantity);
        const price = Number(material.unit_price);
        const totalCost = q * price;

        return {
          task_id: taskId,
          material_id: material.id,
          quantity_used: q,
          unit_price_at_usage: price,
          additional_cost: 0,
          total_cost: totalCost,
          notes: row.notes,
          reported_by: officerId
        };
      });

      await addMaterialUsage(bulkData);

      addNotification('Pemakaian material berhasil dicatat', 'success');
      
      // Reset form
      setShowForm(false);
      setFormData([{ materialId: '', quantity: '', notes: '' }]);
      
      // Reload data
      loadData();
    } catch (error) {
      addNotification('Gagal mencatat pemakaian: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const grandTotal = usages.reduce((sum, usage) => sum + Number(usage.total_cost), 0);

  return (
    <div className="mt-6">
      {/* 1. Daftar Material yang Tersedia (Tanpa Harga) - Hanya untuk Petugas */}
      {userRole === 'officer' && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-primary/5 p-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Stok Material Tersedia</h4>
          <div className="flex flex-wrap gap-2">
            {materials.map((m) => (
              <div key={m.id} className="flex flex-col justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm min-w-[140px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700">{m.name}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600">
                    {m.stock} {m.unit}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                  Rp {Number(m.unit_price).toLocaleString('id-ID')} / {m.unit}
                </span>
              </div>
            ))}
            {materials.length === 0 && (
              <span className="text-sm text-slate-500">Tidak ada data material aktif.</span>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Riwayat Pemakaian Material</h3>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setFormData([{ materialId: '', quantity: '', notes: '' }]);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-primary"
          >
            <Plus size={14} />
            Catat Material
          </button>
        )}
      </div>

      {/* 2. Form Pemakaian Material (Inline) */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-primary/10 bg-primary/5/50 p-5 shadow-inner">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Catat Pemakaian Baru</h3>
            <button
              type="button"
              onClick={handleAddRow}
              className="rounded-full bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition shadow-sm"
              title="Tambah Baris Material"
            >
              <Plus size={18} />
            </button>
          </div>
          <form onSubmit={handleAddUsage}>
            <div className="space-y-4">
              {formData.map((row, index) => (
                <div key={index} className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  {formData.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="absolute right-2 top-2 rounded-lg p-1 text-rose-500 hover:bg-rose-50 transition"
                      title="Hapus baris"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Pilih Material</label>
                      <select
                        required
                        value={row.materialId}
                        onChange={(e) => handleChangeRow(index, 'materialId', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary/80"
                      >
                        <option value="">-- Pilih Material --</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id} disabled={m.stock <= 0}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Jumlah Dipakai</label>
                      <input
                        required
                        type="number"
                        min="0.1"
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleChangeRow(index, 'quantity', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary/80"
                        placeholder="Contoh: 2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Catatan (Opsional)</label>
                      <input
                        type="text"
                        value={row.notes}
                        onChange={(e) => handleChangeRow(index, 'notes', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary/80"
                        placeholder="Keterangan material ini..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex gap-3 justify-end border-t border-primary/10/50 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData([{ materialId: '', quantity: '', notes: '' }]);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-primary/5 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-primary transition disabled:opacity-70"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Material'}
              </button>
            </div>
          </form>
        </div>
      )}

      {usages.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-primary/5 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2">Material</th>
                  <th className="px-4 py-2">Jumlah</th>
                  <th className="px-4 py-2">Total Biaya</th>
                  <th className="px-4 py-2">Tanggal</th>
                  {userRole === 'admin' && <th className="px-4 py-2">Catatan</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usages.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2 font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-primary" />
                        {u.materials?.name}
                      </div>
                      <span className="text-[10px] text-slate-400">@ Rp {Number(u.unit_price_at_usage).toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-4 py-2">
                      {u.quantity_used} <span className="text-xs text-slate-500">{u.materials?.unit}</span>
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-800">
                      Rp {Number(u.total_cost).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    {userRole === 'admin' && (
                      <td className="px-4 py-2 text-xs text-slate-600 max-w-[150px] truncate">
                        {u.notes || '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-primary/5 font-semibold">
                <tr>
                  <td colSpan="2" className="px-4 py-2 text-right text-slate-600">Total Biaya Material:</td>
                  <td colSpan={userRole === 'admin' ? "3" : "2"} className="px-4 py-2 text-primary">Rp {grandTotal.toLocaleString('id-ID')}</td>
                </tr>
                {taskStatus === 'completed' && taskActualCost !== undefined && taskActualCost !== null && (
                  <>
                    <tr>
                      <td colSpan="2" className="px-4 py-2 text-right text-slate-600">
                        Biaya Lainnya:
                      </td>
                      <td colSpan={userRole === 'admin' ? "2" : "2"} className="px-4 py-2 text-primary">
                        Rp {Math.max(0, Number(taskActualCost) - grandTotal).toLocaleString('id-ID')}
                      </td>
                      {userRole === 'admin' && (
                        <td className="px-4 py-2 text-xs font-normal text-slate-500">
                          {taskAdditionalCostDesc || '-'}
                        </td>
                      )}
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td colSpan="2" className="px-4 py-2 text-right text-slate-800 font-bold">Total Realisasi:</td>
                      <td colSpan={userRole === 'admin' ? "3" : "2"} className="px-4 py-2 text-emerald-600 font-bold">Rp {Number(taskActualCost).toLocaleString('id-ID')}</td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-primary/5 p-4 text-center text-sm text-slate-500">
          Belum ada material yang dicatat untuk tugas ini.
        </div>
      )}
    </div>
  );
}
