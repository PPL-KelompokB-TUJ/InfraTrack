import { useEffect, useState } from 'react';
import { Clock, Search, ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { getInventoryHistory } from '../lib/materialService';

export default function InventoryHistoryPage() {
  const { addNotification } = useNotification();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('Semua');

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getInventoryHistory();
      setHistory(data);
    } catch (error) {
      addNotification('Gagal memuat riwayat inventaris: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.materials?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.reference_note?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterAction === 'Semua' || item.action_type === filterAction;
    return matchesSearch && matchesFilter;
  });

  const getActionColor = (action) => {
    switch (action) {
      case 'Pemakaian': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Restok': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Material Baru': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Edit Data': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-emerald-600 font-bold';
    if (change < 0) return 'text-rose-600 font-bold';
    return 'text-slate-500';
  };

  return (
    <main className="mx-auto w-full max-w-full px-4 py-10 sm:px-6 lg:px-8">
      <section className="glass-panel fade-slide-in rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link to="/dashboard/inventory" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary">
              <ArrowLeft size={16} />
              Kembali ke Inventaris
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
              Riwayat Inventaris
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Pantau seluruh aktivitas pergerakan stok dan perubahan data material.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama material atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-primary/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full appearance-none rounded-xl border border-primary/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
            >
              <option value="Semua">Semua Aktivitas</option>
              <option value="Pemakaian">Pemakaian</option>
              <option value="Restok">Restok</option>
              <option value="Material Baru">Material Baru</option>
              <option value="Edit Data">Edit Data</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-slate-500">Memuat riwayat...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-white">
            <table className="min-w-full divide-y divide-primary/20 text-sm">
              <thead className="bg-primary/5/70 text-left text-xs uppercase tracking-wide text-primary">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Aktivitas</th>
                  <th className="px-4 py-3 text-right">Perubahan</th>
                  <th className="px-4 py-3 text-right">Sisa Stok</th>
                  <th className="px-4 py-3">Pelaku</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5/30">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(item.created_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.materials?.name || 'Material Dihapus'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getActionColor(item.action_type)}`}>
                        {item.action_type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right ${getChangeColor(item.quantity_change)}`}>
                      {item.quantity_change > 0 ? '+' : ''}{item.quantity_change}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {item.stock_after} <span className="text-xs font-normal text-slate-500">{item.materials?.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.users?.name || 'Sistem'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={item.reference_note}>
                      {item.reference_note || '-'}
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                      Tidak ada riwayat aktivitas ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
