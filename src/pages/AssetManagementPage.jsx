import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react';
import AssetFormModal from '../components/AssetFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNotification } from '../context/NotificationContext';
import {
  createInfrastructureAsset,
  deleteInfrastructureAsset,
  getInfrastructureAssets,
  updateInfrastructureAsset,
  uploadInfrastructureAssetPhoto,
} from '../lib/infrastructureAssetsService';
import { getActiveInfrastructureCategoryNames } from '../lib/masterDataService';

const conditionLabelStyles = {
  baik: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'rusak ringan': 'bg-amber-100 text-amber-700 border-amber-200',
  'rusak berat': 'bg-rose-100 text-rose-700 border-rose-200',
};

function formatCoordinate(lat, lng) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function AssetManagementPage() {
  const { addNotification } = useNotification();
  const [categoryOptions, setCategoryOptions] = useState(['Jalan', 'Jembatan', 'Saluran Drainase', 'Air Bersih', 'Listrik']);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    assetId: null,
    assetName: '',
  });

  const loadAssets = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getInfrastructureAssets();
      setAssets(data);
    } catch (error) {
      addNotification(error.message || 'Gagal memuat data aset.', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    async function loadCategoryOptions() {
      try {
        const options = await getActiveInfrastructureCategoryNames();
        if (options.length > 0) {
          setCategoryOptions(options);
        }
      } catch (error) {
        addNotification(error.message || 'Gagal memuat kategori referensi.', 'error', 3000);
      }
    }

    loadCategoryOptions();
  }, []);

  const totalAssets = useMemo(() => assets.length, [assets]);

  function handleOpenCreate() {
    setEditingAsset(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(asset) {
    setEditingAsset(asset);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingAsset(null);
  }

  async function handleSubmitAsset(formValues, photoFile) {
    setIsSaving(true);

    try {
      let photoUrl = formValues.photo_url || null;

      if (photoFile) {
        photoUrl = await uploadInfrastructureAssetPhoto(photoFile);
      }

      const payload = {
        ...formValues,
        photo_url: photoUrl,
      };

      if (editingAsset) {
        await updateInfrastructureAsset(editingAsset.id, payload);
      } else {
        await createInfrastructureAsset(payload);
      }

      setIsModalOpen(false);
      setEditingAsset(null);
      await loadAssets();
    } catch (error) {
      addNotification(error.message || 'Gagal menyimpan aset.', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAsset(asset) {
    setConfirmationModal({
      isOpen: true,
      assetId: asset.id,
      assetName: asset.name,
    });
  }

  async function confirmDeleteAsset() {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));

    try {
      await deleteInfrastructureAsset(confirmationModal.assetId);
      addNotification(`Aset "${confirmationModal.assetName}" berhasil dihapus`, 'success', 3000);
      await loadAssets();
    } catch (error) {
      addNotification(error.message || 'Gagal menghapus aset.', 'error', 3000);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="glass-panel fade-slide-in rounded-3xl p-6 sm:p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              InfraTrack / Administrator
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-800">
              Manajemen Aset Infrastruktur
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Kelola data aset, koordinat peta, dan dokumentasi foto infrastruktur secara
              terpusat.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-cyan-700">Total Aset</p>
              <p className="text-2xl font-bold text-cyan-900">{totalAssets}</p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
            >
              <Plus size={16} />
              Tambah Aset
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-cyan-100 text-sm">
              <thead className="bg-cyan-50/70 text-left text-xs uppercase tracking-wide text-cyan-800">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Kondisi</th>
                  <th className="px-4 py-3">Tahun</th>
                  <th className="px-4 py-3">Koordinat</th>
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-50">
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-7 text-center text-slate-500" colSpan={7}>
                      Memuat data aset...
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td className="px-4 py-7 text-center text-slate-500" colSpan={7}>
                      Belum ada data aset. Klik "Tambah Aset" untuk mulai.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="transition hover:bg-cyan-50/30">
                      <td className="px-4 py-3 font-semibold text-slate-800">{asset.name}</td>
                      <td className="px-4 py-3 text-slate-600">{asset.category}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${conditionLabelStyles[asset.condition]}`}
                        >
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{asset.year_built}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {formatCoordinate(asset.lat, asset.lng)}
                      </td>
                      <td className="px-4 py-3">
                        {asset.photo_url ? (
                          <img
                            src={asset.photo_url}
                            alt={asset.name}
                            className="h-12 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">
                            <ImageOff size={13} />
                            Tanpa foto
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(asset)}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            <Trash2 size={13} />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <AssetFormModal
        isOpen={isModalOpen}
        isSubmitting={isSaving}
        initialAsset={editingAsset}
        categoryOptions={categoryOptions}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAsset}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title="Hapus Aset?"
        message={`Hapus aset "${confirmationModal.assetName}"? Data yang dihapus tidak bisa dikembalikan.`}
        onConfirm={confirmDeleteAsset}
        onCancel={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}
