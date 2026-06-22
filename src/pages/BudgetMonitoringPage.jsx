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
    <div className="min-h-screen pb-12" style={{ background: '#fdf8f8' }}>
      
      {/* ── TOP BAR ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(253,248,248,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(206,128,147,0.1)', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px', color: '#ce8093' }}>account_balance_wallet</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2d1520' }}>Keuangan</span>
            <span style={{ color: 'rgba(206,128,147,0.4)', fontSize: '14px' }}>›</span>
            <span style={{ fontSize: '13px', color: '#6b3a4a', opacity: 0.6 }}>Anggaran Pemeliharaan</span>
          </div>
          <button onClick={loadBudgetData} disabled={isLoading} style={{ background: 'rgba(206,128,147,0.08)', border: 'none', borderRadius: '100px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
            <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`} style={{ fontSize: '16px', color: '#ce8093' }}>refresh</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#8c3a56' }}>Refresh</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '28px 24px' }}>
        
        {/* ── HEADER ── */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.25em', color: '#ce8093', opacity: 0.6, textTransform: 'uppercase', marginBottom: '6px' }}>Manajemen Finansial</p>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#1e0f16', letterSpacing: '-0.03em', lineHeight: 1 }}>Monitor Anggaran</h1>
            <p style={{ fontSize: '14px', color: '#6b3a4a', opacity: 0.6, marginTop: '6px' }}>Monitor estimasi, realisasi, dan variansi anggaran pemeliharaan infrastruktur.</p>
          </div>
        </div>

        {/* ── STATS SECTION ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Estimasi', value: formatCurrency(stats.totalEstimated), sub: `${stats.totalTaskCount} Kegiatan`, icon: 'request_quote', color: '#ce8093', bg: 'rgba(206,128,147,0.06)' },
            { label: 'Total Realisasi', value: formatCurrency(stats.totalActual), sub: `${stats.completedTaskCount} Selesai`, icon: 'payments', color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
            { label: 'Selisih (Efisiensi)', value: formatCurrency(variance), sub: variance >= 0 ? 'Sesuai / Hemat' : 'Melebihi Anggaran', icon: 'currency_exchange', color: variance >= 0 ? '#6366f1' : '#f43f5e', bg: variance >= 0 ? 'rgba(99,102,241,0.06)' : 'rgba(244,63,94,0.06)' },
            { label: 'Penyerapan Anggaran', value: `${absorptionRate.toFixed(1)}%`, sub: 'Dari total estimasi', icon: 'pie_chart', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' }
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 20px rgba(206,128,147,0.03)', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: s.color }}>{s.icon}</span>
              </div>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</p>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: s.color === '#ce8093' ? '#1e0f16' : s.color, lineHeight: 1 }}>{s.value}</h3>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontWeight: 600 }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS AND TABLES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
          
          {/* Chart Section */}
          <div style={{ gridColumn: 'span 2', background: 'white', borderRadius: '24px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.03)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#1e0f16' }}>Perbandingan Anggaran vs Realisasi</h2>
              </div>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(206,128,147,0.06)', borderRadius: '12px', padding: '4px' }}>
                <button onClick={() => setPeriod('monthly')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: period === 'monthly' ? 'white' : 'transparent', color: period === 'monthly' ? '#8c3a56' : '#94a3b8', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: period === 'monthly' ? '0 2px 8px rgba(206,128,147,0.1)' : 'none' }}>Bulanan</button>
                <button onClick={() => setPeriod('yearly')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: period === 'yearly' ? 'white' : 'transparent', color: period === 'yearly' ? '#8c3a56' : '#94a3b8', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: period === 'yearly' ? '0 2px 8px rgba(206,128,147,0.1)' : 'none' }}>Tahunan</button>
              </div>
            </div>

            <div style={{ height: '320px', width: '100%' }}>
              {isLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px', color: '#ce8093', opacity: 0.5 }}>progress_activity</span>
                </div>
              ) : chartData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#ce8093', opacity: 0.4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '8px' }}>analytics</span>
                  <p style={{ fontSize: '14px', fontWeight: 700 }}>Belum ada data anggaran terdaftar pada periode ini</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" tickLine={false} stroke="#94a3b8" fontSize={11} fontWeight={600} tickFormatter={formatPeriod} />
                    <YAxis tickFormatter={(value) => `Rp ${(value / 1e6).toFixed(0)}jt`} tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} fontWeight={600} />
                    <Tooltip formatter={(value) => [formatCurrency(value), '']} labelFormatter={(label) => `Periode: ${formatPeriod(label)}`} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid rgba(206,128,147,0.2)', boxShadow: '0 4px 12px rgba(206,128,147,0.1)', fontWeight: 700, fontSize: '12px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                    <Bar name="Estimasi Biaya" dataKey="estimated" fill="#8c3a56" radius={[6, 6, 0, 0]} />
                    <Bar name="Realisasi Biaya" dataKey="actual" fill="#f2b6cb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Analysis Table */}
          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.03)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#1e0f16', marginBottom: '4px' }}>Analisis Penyerapan</h2>
            <p style={{ fontSize: '11px', color: '#6b3a4a', opacity: 0.6, marginBottom: '16px' }}>Rincian variansi dan penyerapan per periode.</p>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 800, color: '#94a3b8', borderBottom: '1.5px solid rgba(206,128,147,0.1)' }}>Periode</th>
                    <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, color: '#94a3b8', borderBottom: '1.5px solid rgba(206,128,147,0.1)' }}>Estimasi</th>
                    <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, color: '#94a3b8', borderBottom: '1.5px solid rgba(206,128,147,0.1)' }}>Realisasi</th>
                    <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, color: '#94a3b8', borderBottom: '1.5px solid rgba(206,128,147,0.1)' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((d, index) => {
                    const absorption = d.estimated > 0 ? (d.actual / d.estimated) * 100 : 0;
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(206,128,147,0.05)' }}>
                        <td style={{ padding: '12px 0', fontWeight: 800, color: '#1e0f16' }}>{formatPeriod(d.period)}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#6b3a4a' }}>{formatCurrency(d.estimated)}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#6b3a4a' }}>{formatCurrency(d.actual)}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, color: absorption > 100 ? '#f43f5e' : '#10b981' }}>{absorption.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                  {chartData.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Belum ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── DETAILED TASKS TABLE ── */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.03)', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1.5px solid rgba(206,128,147,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#1e0f16' }}>Detail Anggaran per Kegiatan</h2>
              <p style={{ fontSize: '12px', color: '#6b3a4a', opacity: 0.6 }}>Pemantauan estimasi dan realisasi biaya per kegiatan pemeliharaan.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#ce8093' }}>search</span>
                <input type="text" placeholder="Cari tiket/aset..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px 16px 8px 36px', borderRadius: '12px', border: '1.5px solid rgba(206,128,147,0.15)', background: 'rgba(206,128,147,0.04)', outline: 'none', fontSize: '12px', fontWeight: 600, width: '200px' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#ce8093' }}>filter_list</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '8px 16px 8px 36px', borderRadius: '12px', border: '1.5px solid rgba(206,128,147,0.15)', background: 'rgba(206,128,147,0.04)', outline: 'none', fontSize: '12px', fontWeight: 600, appearance: 'none', paddingRight: '32px' }}>
                  <option value="all">Semua Status</option>
                  <option value="assigned">Ditugaskan</option>
                  <option value="in_progress">Dikerjakan</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Batal</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ background: 'rgba(206,128,147,0.03)' }}>
                <tr>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Kode Tiket</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Infrastruktur / Aset</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Status</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Estimasi (Rp)</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Realisasi (Rp)</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: '#ce8093', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Selisih</th>
                </tr>
              </thead>
              <tbody>
                {filteredBudgets.map((b) => {
                  const est = Number(b.estimated_cost || 0);
                  const act = b.actual_cost !== null && b.actual_cost !== undefined ? Number(b.actual_cost) : null;
                  const diff = act !== null ? est - act : null;
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(206,128,147,0.06)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 800, fontFamily: 'monospace', fontSize: '13px', color: '#1e0f16' }}>{b.task?.report?.ticket_code || 'N/A'}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 800, color: '#6b3a4a', fontSize: '13px' }}>{b.task?.asset?.name || 'N/A'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{b.task?.instructions}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                          background: b.task?.status === 'completed' ? 'rgba(16,185,129,0.1)' : b.task?.status === 'in_progress' ? 'rgba(245,158,11,0.1)' : b.task?.status === 'cancelled' ? 'rgba(244,63,94,0.1)' : 'rgba(206,128,147,0.1)',
                          color: b.task?.status === 'completed' ? '#10b981' : b.task?.status === 'in_progress' ? '#f59e0b' : b.task?.status === 'cancelled' ? '#f43f5e' : '#ce8093' }}>
                          {b.task?.status === 'completed' ? 'Selesai' : b.task?.status === 'in_progress' ? 'Dikerjakan' : b.task?.status === 'cancelled' ? 'Batal' : 'Ditugaskan'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: '#6b3a4a' }}>{formatCurrency(est)}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: act !== null ? '#1e0f16' : '#94a3b8' }}>{act !== null ? formatCurrency(act) : <span style={{ fontStyle: 'italic' }}>Belum Selesai</span>}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: diff !== null ? (diff >= 0 ? '#6366f1' : '#f43f5e') : '#94a3b8' }}>
                        {diff !== null ? (diff >= 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)) : '-'}
                      </td>
                    </tr>
                  );
                })}
                {filteredBudgets.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#ce8093', opacity: 0.5 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px' }}>search_off</span>
                    <p style={{ fontWeight: 700 }}>Tidak ada data anggaran pemeliharaan yang cocok</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
