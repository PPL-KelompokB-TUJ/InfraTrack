import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import {
  createDamageType,
  createInfrastructureCategory,
  createPriorityScale,
  deleteDamageType,
  deleteInfrastructureCategory,
  deletePriorityScale,
  getDamageTypes,
  getInfrastructureCategories,
  getPriorityScales,
  updateDamageType,
  updateInfrastructureCategory,
  updatePriorityScale,
} from '../lib/masterDataService';

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-100 text-slate-500'
      }`}
    >
      {active ? 'Aktif' : 'Non-aktif'}
    </span>
  );
}

function DefaultBadge({ isDefault }) {
  if (!isDefault) {
    return <span className="text-xs text-slate-400">-</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700">
      <CheckCircle2 size={12} />
      Default
    </span>
  );
}

export default function MasterDataPage() {
  const [categories, setCategories] = useState([]);
  const [damageTypes, setDamageTypes] = useState([]);
  const [priorityScales, setPriorityScales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newCategory, setNewCategory] = useState({ name: '', is_default: false, is_active: true });
  const [newDamageType, setNewDamageType] = useState({
    name: '',
    infrastructure_category_id: '',
    is_default: false,
    is_active: true,
  });
  const [newPriorityScale, setNewPriorityScale] = useState({
    name: '',
    level: 2,
    is_default: false,
    is_active: true,
  });

  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingDamageTypeId, setEditingDamageTypeId] = useState('');
  const [editingPriorityScaleId, setEditingPriorityScaleId] = useState('');

  const [categoryDraft, setCategoryDraft] = useState(null);
  const [damageTypeDraft, setDamageTypeDraft] = useState(null);
  const [priorityScaleDraft, setPriorityScaleDraft] = useState(null);

  const loadMasterData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [categoryRows, damageRows, priorityRows] = await Promise.all([
        getInfrastructureCategories(),
        getDamageTypes(),
        getPriorityScales(),
      ]);

      setCategories(categoryRows);
      setDamageTypes(damageRows);
      setPriorityScales(priorityRows);

      if (!newDamageType.infrastructure_category_id && categoryRows.length > 0) {
        const preferredCategory = categoryRows.find((item) => item.is_active) || categoryRows[0];
        setNewDamageType((prev) => ({
          ...prev,
          infrastructure_category_id: preferredCategory.id,
        }));
      }
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memuat master data.');
    } finally {
      setIsLoading(false);
    }
  }, [newDamageType.infrastructure_category_id]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  function clearNotices() {
    setErrorMessage('');
    setSuccessMessage('');
  }

  function hasCategoryNameConflict(name, excludedId = '') {
    const normalized = normalizeText(name);
    return categories.some(
      (item) => item.id !== excludedId && normalizeText(item.name) === normalized
    );
  }

  function hasDamageTypeNameConflict(name, categoryId, excludedId = '') {
    const normalized = normalizeText(name);
    return damageTypes.some(
      (item) =>
        item.id !== excludedId &&
        item.infrastructure_category_id === categoryId &&
        normalizeText(item.name) === normalized
    );
  }

  function hasPriorityScaleNameConflict(name, excludedId = '') {
    const normalized = normalizeText(name);
    return priorityScales.some(
      (item) => item.id !== excludedId && normalizeText(item.name) === normalized
    );
  }

  function hasPriorityLevelConflict(level, excludedId = '') {
    const parsedLevel = Number(level);
    return priorityScales.some(
      (item) => item.id !== excludedId && Number(item.level) === parsedLevel
    );
  }

  async function runAction(actionKey, action, successText) {
    clearNotices();
    setBusyAction(actionKey);

    try {
      await action();
      await loadMasterData();
      setSuccessMessage(successText);
    } catch (error) {
      setErrorMessage(error.message || 'Operasi gagal dilakukan.');
    } finally {
      setBusyAction('');
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();

    if (!newCategory.name.trim()) {
      setErrorMessage('Nama kategori wajib diisi.');
      return;
    }

    if (hasCategoryNameConflict(newCategory.name)) {
      setErrorMessage('Nama kategori sudah digunakan.');
      return;
    }

    await runAction(
      'create-category',
      () => createInfrastructureCategory(newCategory),
      'Kategori berhasil ditambahkan.'
    );

    setNewCategory({ name: '', is_default: false, is_active: true });
  }

  async function handleCreateDamageType(event) {
    event.preventDefault();

    if (!newDamageType.name.trim()) {
      setErrorMessage('Nama jenis kerusakan wajib diisi.');
      return;
    }

    if (!newDamageType.infrastructure_category_id) {
      setErrorMessage('Pilih kategori infrastruktur terlebih dahulu.');
      return;
    }

    if (
      hasDamageTypeNameConflict(
        newDamageType.name,
        newDamageType.infrastructure_category_id
      )
    ) {
      setErrorMessage('Nama jenis kerusakan sudah ada untuk kategori tersebut.');
      return;
    }

    await runAction(
      'create-damage-type',
      () => createDamageType(newDamageType),
      'Jenis kerusakan berhasil ditambahkan.'
    );

    setNewDamageType((prev) => ({
      ...prev,
      name: '',
      is_default: false,
      is_active: true,
    }));
  }

  async function handleCreatePriorityScale(event) {
    event.preventDefault();

    if (!newPriorityScale.name.trim()) {
      setErrorMessage('Nama skala prioritas wajib diisi.');
      return;
    }

    if (hasPriorityScaleNameConflict(newPriorityScale.name)) {
      setErrorMessage('Nama skala prioritas sudah digunakan.');
      return;
    }

    if (hasPriorityLevelConflict(newPriorityScale.level)) {
      setErrorMessage('Level prioritas sudah dipakai.');
      return;
    }

    await runAction(
      'create-priority-scale',
      () => createPriorityScale(newPriorityScale),
      'Skala prioritas berhasil ditambahkan.'
    );

    setNewPriorityScale({ name: '', level: 2, is_default: false, is_active: true });
  }

  function beginEditCategory(item) {
    setEditingCategoryId(item.id);
    setCategoryDraft({
      name: item.name,
      is_default: item.is_default,
      is_active: item.is_active,
    });
  }

  function beginEditDamageType(item) {
    setEditingDamageTypeId(item.id);
    setDamageTypeDraft({
      name: item.name,
      infrastructure_category_id: item.infrastructure_category_id,
      is_default: item.is_default,
      is_active: item.is_active,
    });
  }

  function beginEditPriorityScale(item) {
    setEditingPriorityScaleId(item.id);
    setPriorityScaleDraft({
      name: item.name,
      level: item.level,
      is_default: item.is_default,
      is_active: item.is_active,
    });
  }

  async function handleSaveCategory(itemId) {
    if (!categoryDraft || !categoryDraft.name.trim()) {
      setErrorMessage('Nama kategori wajib diisi.');
      return;
    }

    if (hasCategoryNameConflict(categoryDraft.name, itemId)) {
      setErrorMessage('Nama kategori sudah digunakan.');
      return;
    }

    await runAction(
      `update-category-${itemId}`,
      () => updateInfrastructureCategory(itemId, categoryDraft),
      'Kategori berhasil diperbarui.'
    );

    setEditingCategoryId('');
    setCategoryDraft(null);
  }

  async function handleSaveDamageType(itemId) {
    if (!damageTypeDraft || !damageTypeDraft.name.trim()) {
      setErrorMessage('Nama jenis kerusakan wajib diisi.');
      return;
    }

    if (
      hasDamageTypeNameConflict(
        damageTypeDraft.name,
        damageTypeDraft.infrastructure_category_id,
        itemId
      )
    ) {
      setErrorMessage('Nama jenis kerusakan sudah ada untuk kategori tersebut.');
      return;
    }

    await runAction(
      `update-damage-type-${itemId}`,
      () => updateDamageType(itemId, damageTypeDraft),
      'Jenis kerusakan berhasil diperbarui.'
    );

    setEditingDamageTypeId('');
    setDamageTypeDraft(null);
  }

  async function handleSavePriorityScale(itemId) {
    if (!priorityScaleDraft || !priorityScaleDraft.name.trim()) {
      setErrorMessage('Nama skala prioritas wajib diisi.');
      return;
    }

    if (hasPriorityScaleNameConflict(priorityScaleDraft.name, itemId)) {
      setErrorMessage('Nama skala prioritas sudah digunakan.');
      return;
    }

    if (hasPriorityLevelConflict(priorityScaleDraft.level, itemId)) {
      setErrorMessage('Level prioritas sudah dipakai.');
      return;
    }

    await runAction(
      `update-priority-scale-${itemId}`,
      () => updatePriorityScale(itemId, priorityScaleDraft),
      'Skala prioritas berhasil diperbarui.'
    );

    setEditingPriorityScaleId('');
    setPriorityScaleDraft(null);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="glass-panel fade-slide-in rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
            InfraTrack / Administrator
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Master Data Referensi
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Kelola kategori infrastruktur, jenis kerusakan, dan skala prioritas untuk
            dipakai lintas modul. Data non-aktif tidak dipakai sebagai pilihan default pada
            form lain.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {isLoading ? (
          <p className="rounded-xl border border-cyan-100 bg-white px-4 py-6 text-sm text-slate-500">
            Memuat master data...
          </p>
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-cyan-100 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Kategori Infrastruktur</h2>
                <span className="text-xs text-slate-500">{categories.length} entri</span>
              </div>

              <form onSubmit={handleCreateCategory} className="mb-4 grid gap-3 lg:grid-cols-4">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(event) =>
                    setNewCategory((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Tambah kategori baru"
                  className="rounded-xl border border-cyan-100 px-3 py-2 text-sm outline-none focus:border-cyan-400 lg:col-span-2"
                />
                <label className="inline-flex items-center gap-2 rounded-xl border border-cyan-100 px-3 py-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={newCategory.is_default}
                    onChange={(event) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        is_default: event.target.checked,
                      }))
                    }
                  />
                  Jadikan default
                </label>
                <button
                  type="submit"
                  disabled={busyAction === 'create-category'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
                >
                  <Plus size={15} />
                  Tambah
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cyan-100 text-sm">
                  <thead className="bg-cyan-50/70 text-left text-xs uppercase tracking-wide text-cyan-800">
                    <tr>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">Default</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-50">
                    {categories.map((item) => {
                      const isEditing = editingCategoryId === item.id;
                      const rowBusy = busyAction.includes(item.id);

                      return (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                value={categoryDraft?.name || ''}
                                onChange={(event) =>
                                  setCategoryDraft((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-cyan-100 px-2 py-1.5"
                              />
                            ) : (
                              <span className="font-semibold text-slate-700">{item.name}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={Boolean(categoryDraft?.is_default)}
                                  onChange={(event) =>
                                    setCategoryDraft((prev) => ({
                                      ...prev,
                                      is_default: event.target.checked,
                                    }))
                                  }
                                />
                                Default
                              </label>
                            ) : (
                              <DefaultBadge isDefault={item.is_default} />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={Boolean(categoryDraft?.is_active)}
                                  onChange={(event) =>
                                    setCategoryDraft((prev) => ({
                                      ...prev,
                                      is_active: event.target.checked,
                                    }))
                                  }
                                />
                                Aktif
                              </label>
                            ) : (
                              <StatusBadge active={item.is_active} />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCategory(item.id)}
                                    disabled={rowBusy}
                                    className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCategoryId('');
                                      setCategoryDraft(null);
                                    }}
                                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => beginEditCategory(item)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 px-2 py-1 text-xs font-semibold text-cyan-700"
                                  >
                                    <Pencil size={12} />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!window.confirm(`Hapus kategori "${item.name}"?`)) {
                                        return;
                                      }

                                      runAction(
                                        `delete-category-${item.id}`,
                                        () => deleteInfrastructureCategory(item.id),
                                        'Kategori berhasil dihapus.'
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                                  >
                                    <Trash2 size={12} />
                                    Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-cyan-100 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Jenis Kerusakan</h2>
                <span className="text-xs text-slate-500">{damageTypes.length} entri</span>
              </div>

              <form onSubmit={handleCreateDamageType} className="mb-4 grid gap-3 lg:grid-cols-5">
                <input
                  type="text"
                  value={newDamageType.name}
                  onChange={(event) =>
                    setNewDamageType((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Tambah jenis kerusakan"
                  className="rounded-xl border border-cyan-100 px-3 py-2 text-sm outline-none focus:border-cyan-400 lg:col-span-2"
                />

                <select
                  value={newDamageType.infrastructure_category_id}
                  onChange={(event) =>
                    setNewDamageType((prev) => ({
                      ...prev,
                      infrastructure_category_id: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-cyan-100 px-3 py-2 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <label className="inline-flex items-center gap-2 rounded-xl border border-cyan-100 px-3 py-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={newDamageType.is_default}
                    onChange={(event) =>
                      setNewDamageType((prev) => ({
                        ...prev,
                        is_default: event.target.checked,
                      }))
                    }
                  />
                  Jadikan default
                </label>

                <button
                  type="submit"
                  disabled={busyAction === 'create-damage-type' || categories.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
                >
                  <Plus size={15} />
                  Tambah
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cyan-100 text-sm">
                  <thead className="bg-cyan-50/70 text-left text-xs uppercase tracking-wide text-cyan-800">
                    <tr>
                      <th className="px-3 py-2">Jenis Kerusakan</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2">Default</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-50">
                    {damageTypes.map((item) => {
                      const isEditing = editingDamageTypeId === item.id;
                      const rowBusy = busyAction.includes(item.id);

                      return (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                value={damageTypeDraft?.name || ''}
                                onChange={(event) =>
                                  setDamageTypeDraft((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-cyan-100 px-2 py-1.5"
                              />
                            ) : (
                              <span className="font-semibold text-slate-700">{item.name}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {isEditing ? (
                              <select
                                value={damageTypeDraft?.infrastructure_category_id || ''}
                                onChange={(event) =>
                                  setDamageTypeDraft((prev) => ({
                                    ...prev,
                                    infrastructure_category_id: event.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-cyan-100 px-2 py-1.5"
                              >
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              item.category_name
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={Boolean(damageTypeDraft?.is_default)}
                                  onChange={(event) =>
                                    setDamageTypeDraft((prev) => ({
                                      ...prev,
                                      is_default: event.target.checked,
                                    }))
                                  }
                                />
                                Default
                              </label>
                            ) : (
                              <DefaultBadge isDefault={item.is_default} />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={Boolean(damageTypeDraft?.is_active)}
                                  onChange={(event) =>
                                    setDamageTypeDraft((prev) => ({
                                      ...prev,
                                      is_active: event.target.checked,
                                    }))
                                  }
                                />
                                Aktif
                              </label>
                            ) : (
                              <StatusBadge active={item.is_active} />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveDamageType(item.id)}
                                    disabled={rowBusy}
                                    className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingDamageTypeId('');
                                      setDamageTypeDraft(null);
                                    }}
                                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => beginEditDamageType(item)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 px-2 py-1 text-xs font-semibold text-cyan-700"
                                  >
                                    <Pencil size={12} />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!window.confirm(`Hapus jenis kerusakan "${item.name}"?`)) {
                                        return;
                                      }

                                      runAction(
                                        `delete-damage-type-${item.id}`,
                                        () => deleteDamageType(item.id),
                                        'Jenis kerusakan berhasil dihapus.'
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                                  >
                                    <Trash2 size={12} />
                                    Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-cyan-100 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Skala Prioritas</h2>
                <span className="text-xs text-slate-500">{priorityScales.length} entri</span>
              </div>

              <form onSubmit={handleCreatePriorityScale} className="mb-4 grid gap-3 lg:grid-cols-5">
                <input
                  type="text"
                  value={newPriorityScale.name}
                  onChange={(event) =>
                    setNewPriorityScale((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Nama skala prioritas"
                  className="rounded-xl border border-cyan-100 px-3 py-2 text-sm outline-none focus:border-cyan-400 lg:col-span-2"
                />

                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newPriorityScale.level}
                  onChange={(event) =>
                    setNewPriorityScale((prev) => ({
                      ...prev,
                      level: Number(event.target.value),
                    }))
                  }
                  className="rounded-xl border border-cyan-100 px-3 py-2 text-sm"
                />

                <label className="inline-flex items-center gap-2 rounded-xl border border-cyan-100 px-3 py-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={newPriorityScale.is_default}
                    onChange={(event) =>
                      setNewPriorityScale((prev) => ({
                        ...prev,
                        is_default: event.target.checked,
                      }))
                    }
                  />
                  Jadikan default
                </label>

                <button
                  type="submit"
                  disabled={busyAction === 'create-priority-scale'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
                >
                  <Plus size={15} />
                  Tambah
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cyan-100 text-sm">
                  <thead className="bg-cyan-50/70 text-left text-xs uppercase tracking-wide text-cyan-800">
                    <tr>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">Level</th>
                      <th className="px-3 py-2">Default</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-50">
                    {priorityScales.map((item) => {
                      const isEditing = editingPriorityScaleId === item.id;
                      const rowBusy = busyAction.includes(item.id);

                      return (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input
                                value={priorityScaleDraft?.name || ''}
                                onChange={(event) =>
                                  setPriorityScaleDraft((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-cyan-100 px-2 py-1.5"
                              />
                            ) : (
                              <span className="font-semibold text-slate-700">{item.name}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={priorityScaleDraft?.level || 1}
                                onChange={(event) =>
                                  setPriorityScaleDraft((prev) => ({
                                    ...prev,
                                    level: Number(event.target.value),
                                  }))
                                }
                                className="w-20 rounded-lg border border-cyan-100 px-2 py-1.5"
                              />
                            ) : (
                              item.level
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={Boolean(priorityScaleDraft?.is_default)}
                                  onChange={(event) =>
                                    setPriorityScaleDraft((prev) => ({
                                      ...prev,
                                      is_default: event.target.checked,
                                    }))
                                  }
                                />
                                Default
                              </label>
                            ) : (
                              <DefaultBadge isDefault={item.is_default} />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={Boolean(priorityScaleDraft?.is_active)}
                                  onChange={(event) =>
                                    setPriorityScaleDraft((prev) => ({
                                      ...prev,
                                      is_active: event.target.checked,
                                    }))
                                  }
                                />
                                Aktif
                              </label>
                            ) : (
                              <StatusBadge active={item.is_active} />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSavePriorityScale(item.id)}
                                    disabled={rowBusy}
                                    className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPriorityScaleId('');
                                      setPriorityScaleDraft(null);
                                    }}
                                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => beginEditPriorityScale(item)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 px-2 py-1 text-xs font-semibold text-cyan-700"
                                  >
                                    <Pencil size={12} />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!window.confirm(`Hapus skala prioritas "${item.name}"?`)) {
                                        return;
                                      }

                                      runAction(
                                        `delete-priority-scale-${item.id}`,
                                        () => deletePriorityScale(item.id),
                                        'Skala prioritas berhasil dihapus.'
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                                  >
                                    <Trash2 size={12} />
                                    Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm text-cyan-900">
              <p className="mb-1 inline-flex items-center gap-2 font-semibold">
                <ShieldCheck size={16} />
                Catatan Integritas Data
              </p>
              <p>
                Gunakan status non-aktif untuk menonaktifkan referensi tanpa merusak data
                historis. Hapus permanen hanya untuk data yang benar-benar belum dipakai.
              </p>
              <p className="mt-1">
                Pada form aset, hanya kategori dengan status aktif yang muncul sebagai opsi.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
