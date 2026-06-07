import { useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Briefcase,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  ArrowRightLeft,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from '../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function BudgetMonitoringPage() {
  const { addNotification } = useNotification();
  const [period, setPeriod] = useState('monthly');
  const [chartData, setChartData] = useState([]);
  const [budgetsList, setBudgetsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Table search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Format currency helper
  function formatCurrency(value) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  }

  // Format period display helper
  function formatPeriod(val) {
    if (!val) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      }
    }
    if (/^\d{4}-\d{2}$/.test(val)) {
      const [year, month] = val.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
    }
    return val;
  }

  // Load all budget details and aggregated periods
  const loadBudgetData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      // 1. Fetch budgets from Supabase
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (budgetsError) throw budgetsError;

      if (!budgets || budgets.length === 0) {
        setBudgetsList([]);
        setChartData([]);
        return;
      }

      // 2. Fetch corresponding maintenance tasks with relationships
      const taskIds = budgets.map(b => b.task_id);
      const { data: tasks, error: tasksError } = await supabase
        .from('maintenance_tasks')
        .select(`
          id,
          scheduled_date,
          status,
          instructions,
          asset:infrastructure_assets!maintenance_tasks_asset_id_fkey(id, name),
          report:damage_reports!maintenance_tasks_report_id_fkey(id, ticket_code)
        `)
        .in('id', taskIds);

      if (tasksError) throw tasksError;

      // 3. Map tasks by ID for quick access
      const tasksMap = new Map();
      if (tasks) {
        tasks.forEach(t => {
          tasksMap.set(t.id, t);
        });
      }

      // 4. Merge budgets with their task details
      const mergedBudgets = budgets.map(b => ({
        ...b,
        task: tasksMap.get(b.task_id) || null
      }));
      setBudgetsList(mergedBudgets);

      // 5. Aggregate costs per period (monthly/yearly)
      const periodsMap = {};
      mergedBudgets.forEach((b) => {
        const dateStr = b.task?.scheduled_date;
        if (!dateStr) return;

        const date = new Date(dateStr);
        let periodKey = '';

        if (period === 'yearly') {
          periodKey = `${date.getFullYear()}`;
        } else {
          // monthly: e.g. "2024-10"
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          periodKey = `${year}-${month}`;
        }

        if (!periodsMap[periodKey]) {
          periodsMap[periodKey] = {
            period: periodKey,
            estimated: 0,
            actual: 0,
          };
        }

        periodsMap[periodKey].estimated += Number(b.estimated_cost || 0);
        periodsMap[periodKey].actual += Number(b.actual_cost || 0);
      });

      const aggregatedItems = Object.values(periodsMap).sort((a, b) =>
        a.period.localeCompare(b.period)
      );
      setChartData(aggregatedItems);

    } catch (error) {
      console.error(error);
      addNotification(error.message || 'Gagal memuat data anggaran', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [period, addNotification]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  // Aggregate global stats from budgetsList
  const stats = budgetsList.reduce((acc, curr) => {
    const est = Number(curr.estimated_cost || 0);
    const act = curr.actual_cost !== null && curr.actual_cost !== undefined ? Number(curr.actual_cost) : null;
    
    acc.totalEstimated += est;
    if (act !== null) {
      acc.totalActual += act;
      acc.completedEstimated += est;
      acc.completedTaskCount += 1;
    }
    acc.totalTaskCount += 1;
    return acc;
  }, { totalEstimated: 0, totalActual: 0, totalTaskCount: 0, completedTaskCount: 0, completedEstimated: 0 });

  const variance = stats.completedEstimated - stats.totalActual;
  const absorptionRate = stats.totalEstimated > 0 
    ? (stats.totalActual / stats.totalEstimated) * 100 
    : 0;

  // Filter budgets list based on search and status
  const filteredBudgets = budgetsList.filter(b => {
    const ticketCode = b.task?.report?.ticket_code || '';
    const assetName = b.task?.asset?.name || '';
    const instructions = b.task?.instructions || '';
    
    const matchesSearch = 
      ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructions.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.task?.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="min-h-screen bg-slate-50/50 p-6">
      {/* Title Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Anggaran Pemeliharaan</h1>
          <p className="text-slate-500 text-sm">Monitor estimasi, realisasi, dan variansi anggaran pemeliharaan infrastruktur.</p>
        </div>
        <button 
          onClick={loadBudgetData} 
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Total Estimasi */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Estimasi</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{formatCurrency(stats.totalEstimated)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{stats.totalTaskCount} Kegiatan</p>
          </div>
        </div>

        {/* Total Realisasi */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Realisasi</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{formatCurrency(stats.totalActual)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{stats.completedTaskCount} Selesai</p>
          </div>
        </div>

        {/* Selisih / Varian */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className={`rounded-2xl p-3 ${variance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
            <ArrowRightLeft className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Selisih (Efisiensi)</p>
            <h3 className={`text-xl font-extrabold mt-1 ${variance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {formatCurrency(variance)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {variance >= 0 ? 'Sesuai / Hemat' : 'Melebihi Anggaran'}
            </p>
          </div>
        </div>

        {/* Penyerapan */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Penyerapan Anggaran</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">{absorptionRate.toFixed(1)}%</h3>
            <p className="text-xs text-slate-500 mt-0.5">Dari total estimasi</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Perbandingan Anggaran vs Realisasi</h2>
            <p className="text-slate-500 text-xs mt-0.5">Representasi grafis penyerapan anggaran pemeliharaan per periode.</p>
          </div>
          <div className="flex bg-slate-100 rounded-xl p-1 self-start">
            <button
              onClick={() => setPeriod('monthly')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${period === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${period === 'yearly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Tahunan
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
              <Briefcase className="h-10 w-10 mb-2 stroke-1" />
              <p className="text-sm">Belum ada data anggaran terdaftar pada periode ini</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="period" 
                  tickLine={false} 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickFormatter={formatPeriod}
                />
                <YAxis 
                  tickFormatter={(value) => `Rp ${(value / 1e6).toFixed(0)}jt`}
                  tickLine={false} 
                  axisLine={false}
                  stroke="#94a3b8" 
                  fontSize={12} 
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), '']}
                  labelFormatter={(label) => `Periode: ${formatPeriod(label)}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar name="Estimasi Biaya" dataKey="estimated" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                <Bar name="Realisasi Biaya" dataKey="actual" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Variance Aggregation Table */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Table 1: Period summary */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Analisis Penyerapan</h2>
          <p className="text-slate-500 text-xs mb-4">Rincian variansi dan penyerapan per periode.</p>

          <div className="flex-1 overflow-auto max-h-[350px] pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="py-2.5">Periode</th>
                  <th className="py-2.5 text-right">Estimasi</th>
                  <th className="py-2.5 text-right">Realisasi</th>
                  <th className="py-2.5 text-right">Penyerapan</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d, index) => {
                  const absorption = d.estimated > 0 ? (d.actual / d.estimated) * 100 : 0;
                  return (
                    <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-700">{formatPeriod(d.period)}</td>
                      <td className="py-3 text-right text-slate-600">{formatCurrency(d.estimated)}</td>
                      <td className="py-3 text-right text-slate-600">{formatCurrency(d.actual)}</td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${absorption > 100 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {absorption.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {chartData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Belum ada data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed tasks cost monitoring table */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Detail Anggaran per Kegiatan</h2>
              <p className="text-slate-500 text-xs mt-0.5">Pemantauan estimasi dan realisasi biaya per kegiatan pemeliharaan.</p>
            </div>
            
            {/* Table filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari tiket/aset..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs outline-none transition focus:border-cyan-400 focus:bg-white"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-600 outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="assigned">Ditugaskan</option>
                  <option value="in_progress">Dikerjakan</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Batal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Kode Tiket</th>
                  <th className="pb-3">Infrastruktur / Aset</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Estimasi (Rp)</th>
                  <th className="pb-3 text-right">Realisasi (Rp)</th>
                  <th className="pb-3 text-right">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {filteredBudgets.map((b) => {
                  const est = Number(b.estimated_cost || 0);
                  const act = b.actual_cost !== null && b.actual_cost !== undefined ? Number(b.actual_cost) : null;
                  const diff = act !== null ? est - act : null;

                  return (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 pl-2 font-mono font-bold text-cyan-600">
                        {b.task?.report?.ticket_code || 'N/A'}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-800">{b.task?.asset?.name || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{b.task?.instructions}</div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          b.task?.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                          b.task?.status === 'in_progress' ? 'bg-amber-50 text-amber-700' :
                          b.task?.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                          'bg-cyan-50 text-cyan-700'
                        }`}>
                          {b.task?.status === 'completed' ? 'Selesai' :
                           b.task?.status === 'in_progress' ? 'Dikerjakan' :
                           b.task?.status === 'cancelled' ? 'Batal' :
                           'Ditugaskan'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-slate-600">
                        {formatCurrency(est)}
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-800">
                        {act !== null ? formatCurrency(act) : <span className="text-slate-400 italic">Belum Selesai</span>}
                      </td>
                      <td className="py-3 text-right">
                        {diff !== null ? (
                          <span className={`font-bold ${diff >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            {diff >= 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredBudgets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Info className="h-8 w-8 mx-auto mb-2 text-slate-300 stroke-1" />
                      Tidak ada data anggaran pemeliharaan yang cocok dengan pencarian / filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
