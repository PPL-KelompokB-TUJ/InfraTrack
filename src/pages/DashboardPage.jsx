import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart, Pie, Cell } from 'recharts';
import { 
  Building2, FileText, CheckCircle2, DollarSign,
  AlertCircle, Clock, Eye, X, Filter, Sparkles, MapIcon, Search, Bell, Settings,
  TrendingUp, BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getRecentDamageReports } from '../lib/damageReportService';
import { 
  getAssetConditionStats,
  getDamageReportStats,
  getMaintenanceKPIs,
  getDamageTrend,
  getComprehensiveDashboardData
} from '../lib/dashboardService';
import MapVisualization from '../components/MapVisualization';
import { useNotification } from '../context/NotificationContext';
import NotificationBell from '../components/layout/NotificationBell';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState({
    totalAssets: 0,
    assetsChange: 19,
    totalReports: 0,
    reportsChange: -5,
    completedTasks: 0,
    tasksChange: 8,
    budgetAllocated: 2400000,
    budgetProgress: 49,
  });

  // New dashboard data
  const [dashboardData, setDashboardData] = useState({
    assetCondition: { good: 0, light_damage: 0, heavy_damage: 0 },
    damageReports: { pending: 0, terverifikasi: 0, selesai: 0, ditolak: 0 },
    maintenanceKPIs: { avgCompletionTime: 0, onTimePercentage: 0, totalCompleted: 0, totalTasks: 0 },
    damageTrend: [],
  });

  const [recentReports, setRecentReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const loadStats = useCallback(async () => {
    setIsLoading(true);

    try {
      // Load basic stats
      const { count: totalAssets, error: assetsError } = await supabase
        .from('infrastructure_assets')
        .select('*', { count: 'exact', head: true });

      if (assetsError) throw assetsError;

      const { count: totalReports, error: reportsError } = await supabase
        .from('damage_reports')
        .select('*', { count: 'exact', head: true });

      if (reportsError) throw reportsError;

      const { count: completedTasks, error: tasksError } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (tasksError) throw tasksError;

      // Load budget data
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('estimated_cost, actual_cost');

      if (budgetError && budgetError.code !== 'PGRST116') throw budgetError;

      // Calculate budget stats
      let budgetAllocated = 0;
      let budgetProgress = 0;
      
      if (budgetData && budgetData.length > 0) {
        const totalEstimated = budgetData.reduce((sum, b) => sum + (b.estimated_cost || 0), 0);
        const totalActual = budgetData.reduce((sum, b) => sum + (b.actual_cost || 0), 0);
        budgetAllocated = totalEstimated;
        budgetProgress = totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0;
      }

      const reportsResult = await getRecentDamageReports(10);
      
      // Load comprehensive dashboard data
      const dashResult = await getComprehensiveDashboardData(selectedPeriod);

      setStats(prev => ({
        ...prev,
        totalAssets: totalAssets || 0,
        totalReports: totalReports || 0,
        completedTasks: completedTasks || 0,
        budgetAllocated: budgetAllocated,
        budgetProgress: budgetProgress,
      }));

      if (dashResult.success) {
        setDashboardData(dashResult.data);
      }

      if (reportsResult.success) {
        setRecentReports(reportsResult.reports);
      }
    } catch (error) {
      addNotification(error.message || 'Gagal memuat statistik dashboard.', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, selectedPeriod]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleViewDetail = (report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReport(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf8f8' }}>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: 'linear-gradient(135deg,#ce8093,#8c3a56)' }}>
            <span className="material-symbols-outlined text-white animate-spin" style={{ fontSize: '28px' }}>progress_activity</span>
          </div>
          <p className="font-semibold" style={{ color: '#6b3a4a' }}>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Aset', value: stats.totalAssets, icon: 'apartment', color: '#ce8093', bg: 'rgba(206,128,147,0.08)', border: 'rgba(206,128,147,0.18)', change: `+${stats.assetsChange}%`, changeColor: '#4ade80' },
    { label: 'Total Laporan', value: stats.totalReports, icon: 'report_problem', color: '#b39ad4', bg: 'rgba(179,154,212,0.08)', border: 'rgba(179,154,212,0.18)', change: `${stats.reportsChange > 0 ? '+' : ''}${stats.reportsChange}%`, changeColor: stats.reportsChange >= 0 ? '#4ade80' : '#f87171' },
    { label: 'Tugas Selesai', value: stats.completedTasks, icon: 'check_circle', color: '#7fa8d4', bg: 'rgba(127,168,212,0.08)', border: 'rgba(127,168,212,0.18)', change: `+${stats.tasksChange}%`, changeColor: '#4ade80' },
    { label: 'Anggaran Terpakai', value: `${stats.budgetProgress}%`, icon: 'payments', color: '#d4b39a', bg: 'rgba(212,179,154,0.08)', border: 'rgba(212,179,154,0.18)', change: 'dari alokasi', changeColor: '#94a3b8' },
  ];

  return (
    <div className="min-h-screen pb-12" style={{ background: '#fdf8f8' }}>

      {/* ── TOP BAR ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(253,248,248,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(206,128,147,0.1)', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '16px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px', color: '#ce8093' }}>dashboard</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2d1520' }}>Dashboard</span>
            <span style={{ color: 'rgba(206,128,147,0.4)', fontSize: '14px' }}>›</span>
            <span style={{ fontSize: '13px', color: '#6b3a4a', opacity: 0.6 }}>Ringkasan</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'rgba(107,58,74,0.4)' }}>search</span>
              <input type="text" placeholder="Cari aset, laporan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '12px', fontSize: '13px', outline: 'none', width: '220px', background: 'rgba(206,128,147,0.06)', border: '1.5px solid rgba(206,128,147,0.15)', color: '#2d1520' }}
                onFocus={e => { e.target.style.borderColor = '#ce8093'; e.target.style.background = 'white'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(206,128,147,0.15)'; e.target.style.background = 'rgba(206,128,147,0.06)'; }}
              />
            </div>
            <NotificationBell />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '28px 24px' }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.25em', color: '#ce8093', opacity: 0.6, textTransform: 'uppercase', marginBottom: '6px' }}>Panel Administrasi</p>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#1e0f16', letterSpacing: '-0.03em', lineHeight: 1 }}>Dashboard</h1>
            <p style={{ fontSize: '14px', color: '#6b3a4a', opacity: 0.6, marginTop: '6px' }}>Ringkasan vitalitas sistem dan metrik infrastruktur saat ini.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', color: '#16a34a' }}>LIVE</span>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {statCards.map((card, i) => (
            <div key={i} style={{ background: 'white', border: `1.5px solid ${card.border}`, borderRadius: '20px', padding: '20px 22px', position: 'relative', overflow: 'hidden', boxShadow: `0 4px 20px ${card.bg}` }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: `radial-gradient(circle, ${card.bg} 0%, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: card.bg, border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined icon-fill" style={{ fontSize: '18px', color: card.color }}>{card.icon}</span>
                </div>
                <div style={{ padding: '3px 8px', borderRadius: '100px', background: 'rgba(74,222,128,0.08)', fontSize: '10px', fontWeight: 700, color: card.changeColor }}>{card.change}</div>
              </div>
              <p style={{ fontSize: '28px', fontWeight: 900, color: '#1e0f16', lineHeight: 1, marginBottom: '4px' }}>{card.value}</p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b3a4a', opacity: 0.55, letterSpacing: '0.05em' }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Tren Kerusakan */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.06)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(206,128,147,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', color: '#ce8093', opacity: 0.55, textTransform: 'uppercase', marginBottom: '4px' }}>Analitik</p>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1e0f16' }}>Tren Kerusakan</h2>
              </div>
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, border: '1.5px solid rgba(206,128,147,0.2)', background: 'rgba(206,128,147,0.05)', color: '#6b3a4a', outline: 'none', cursor: 'pointer' }}>
                <option value="monthly">Bulanan</option>
                <option value="weekly">Mingguan</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(206,128,147,0.08)' }}>
              {[{ label: 'Total Aset', value: stats.totalAssets, color: '#ce8093' }, { label: 'Anggaran', value: `${stats.budgetProgress}%`, color: '#8c3a56' }, { label: 'Status', value: 'Optimal', color: '#4ade80', dot: true }].map((kpi, i) => (
                <div key={i}>
                  <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{kpi.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {kpi.dot && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: kpi.color, boxShadow: `0 0 6px ${kpi.color}` }} />}
                    <p style={{ fontSize: '22px', fontWeight: 900, color: kpi.dot ? '#1e0f16' : kpi.color, lineHeight: 1 }}>{kpi.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.damageTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDamage2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ce8093" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ce8093" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(206,128,147,0.08)" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid rgba(206,128,147,0.2)', boxShadow: '0 8px 24px rgba(140,58,86,0.12)', background: 'white' }} />
                  <Area type="monotone" dataKey="total" stroke="#ce8093" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDamage2)" activeDot={{ r: 5, fill: '#fff', stroke: '#ce8093', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Laporan Terbaru */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.06)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', color: '#ce8093', opacity: 0.55, textTransform: 'uppercase', marginBottom: '4px' }}>Terbaru</p>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#1e0f16' }}>Laporan Masuk</h2>
              </div>
              <button style={{ padding: '6px', borderRadius: '8px', border: '1px solid rgba(206,128,147,0.15)', background: 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(206,128,147,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ce8093', opacity: 0.6 }}>sort</span>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b3a4a', opacity: 0.4, fontSize: '13px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>inbox</span>
                  Belum ada laporan.
                </div>
              ) : (
                recentReports.slice(0, 5).map(report => {
                  const isPending = report.status === 'pending';
                  const isDone = report.status === 'selesai';
                  return (
                    <div key={report.id} onClick={() => { setSelectedReport(report); setIsDetailModalOpen(true); }}
                      style={{ padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', border: '1.5px solid rgba(206,128,147,0.08)', background: 'rgba(253,248,248,0.6)', transition: 'all 0.15s', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(206,128,147,0.25)'; e.currentTarget.style.background = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(206,128,147,0.08)'; e.currentTarget.style.background = 'rgba(253,248,248,0.6)'; }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPending ? 'rgba(248,113,113,0.1)' : isDone ? 'rgba(74,222,128,0.1)' : 'rgba(179,154,212,0.1)' }}>
                        <span className="material-symbols-outlined icon-fill" style={{ fontSize: '16px', color: isPending ? '#f87171' : isDone ? '#4ade80' : '#b39ad4' }}>{isPending ? 'error' : isDone ? 'check_circle' : 'info'}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#1e0f16', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.ticket_code} · {report.damage_type_name}</p>
                        <p style={{ fontSize: '11px', color: '#6b3a4a', opacity: 0.65, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{report.location_description}</p>
                        <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{new Date(report.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={() => navigate('/dashboard/reports')}
              style={{ marginTop: '14px', width: '100%', padding: '10px', borderRadius: '12px', background: 'rgba(206,128,147,0.06)', border: '1.5px solid rgba(206,128,147,0.15)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#8c3a56', letterSpacing: '0.05em', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(206,128,147,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(206,128,147,0.06)'}>
              Lihat Semua Laporan →
            </button>
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Distribusi Aset */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.06)' }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', color: '#ce8093', opacity: 0.55, textTransform: 'uppercase', marginBottom: '4px' }}>Kondisi</p>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#1e0f16' }}>Distribusi Aset</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              {[{ label: 'Baik', color: '#4ade80' }, { label: 'Rusak Ringan', color: '#fcd34d' }, { label: 'Rusak Berat', color: '#f87171' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: l.color }} />
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b3a4a', opacity: 0.65 }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: 'Baik', value: dashboardData.assetCondition.good || 0 }, { name: 'Rusak Ringan', value: dashboardData.assetCondition.light_damage || 0 }, { name: 'Rusak Berat', value: dashboardData.assetCondition.heavy_damage || 0 }]}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {['#4ade80', '#fcd34d', '#f87171'].map((color, idx) => <Cell key={idx} fill={color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(206,128,147,0.2)', background: 'white', boxShadow: '0 8px 24px rgba(140,58,86,0.12)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Laporan */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: '1.5px solid rgba(206,128,147,0.12)', boxShadow: '0 4px 24px rgba(206,128,147,0.06)' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', color: '#ce8093', opacity: 0.55, textTransform: 'uppercase', marginBottom: '4px' }}>Laporan</p>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#1e0f16' }}>Status Laporan</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {[
                { label: 'Laporan Pending', value: dashboardData.damageReports.pending || 0, color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
                { label: 'Sedang Diverifikasi', value: dashboardData.damageReports.terverifikasi || 0, color: '#7fa8d4', bg: 'rgba(127,168,212,0.12)' },
                { label: 'Selesai', value: dashboardData.damageReports.selesai || 0, color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
                { label: 'Ditolak', value: dashboardData.damageReports.ditolak || 0, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
              ].map((item) => {
                const pct = Math.min((item.value / Math.max(stats.totalReports, 1)) * 100, 100);
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e0f16', opacity: 0.8 }}>{item.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: item.color }}>{item.value}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '100px', background: item.bg, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '100px', background: item.color, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={handleCloseModal} />
      )}
    </div>
  );
}

/**
 * Urgency Color Helper
 */
function getUrgencyColor(level) {
  const colors = {
    rendah: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    sedang: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    tinggi: 'bg-orange-100 text-orange-800 border border-orange-300',
    sangat_tinggi: 'bg-red-100 text-red-800 border border-red-300',
  };
  return colors[level] || 'bg-slate-100 text-slate-800 border border-slate-300';
}

function getUrgencyLabel(level) {
  const labels = {
    rendah: 'Rendah',
    sedang: 'Sedang',
    tinggi: 'Tinggi',
    sangat_tinggi: 'Sangat Tinggi',
  };
  return labels[level] || level;
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Pending' },
    terverifikasi: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terverifikasi' },
    ditolak: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
    sedang_dikerjakan: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Sedang Dikerjakan' },
    selesai: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Selesai' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.text}`}>
      <Clock size={12} />
      {config.label}
    </span>
  );
}

/**
 * Report Detail Modal
 */
function ReportDetailModal({ report, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-primary px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Detail Laporan</h2>
            <p className="text-primary-container text-sm mt-1">{report.ticket_code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status */}
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-2">Status</p>
            <StatusBadge status={report.status} />
          </div>

          {/* Informasi Pelapor */}
          <div className="bg-primary/5 rounded-xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Informasi Pelapor</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Nama:</span>
                <span className="font-semibold text-slate-800">{report.reporter_name || '-'}</span>
              </div>
            </div>
          </div>

          {/* Kerusakan */}
          <div className="bg-primary/5 rounded-xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Informasi Kerusakan</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Jenis Kerusakan:</span>
                <span className="font-semibold text-slate-800">
                  {report.damage_type_name || report.damage_type || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tingkat Urgensi:</span>
                <span className={`inline-block rounded-lg px-3 py-1 text-sm font-semibold ${getUrgencyColor(report.urgency_level)}`}>
                  {getUrgencyLabel(report.urgency_level)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lokasi:</span>
                <span className="font-mono text-sm font-semibold text-slate-800">
                  {report.location_description || `${report.latitude?.toFixed(6)}, ${report.longitude?.toFixed(6)}` || '-'}
                </span>
              </div>
              {report.description && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-600 text-sm font-semibold mb-2">Deskripsi:</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{report.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Aset */}
          {report.asset_name && report.asset_name !== '-' && (
            <div className="bg-primary/5 rounded-xl p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Aset Terkait</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Nama Aset:</span>
                  <span className="font-semibold text-slate-800">{report.asset_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tanggal */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">Dilaporkan:</span>
              <span className="text-slate-800 font-semibold">
                {new Date(report.created_at).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Action */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
