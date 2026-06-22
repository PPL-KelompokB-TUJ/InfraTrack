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
  const [aiRecommendations, setAiRecommendations] = useState([
    { id: 1, priority: 'urgent', location: 'Lubang Jalan Jend. Sudirman', score: 94 },
    { id: 2, priority: 'high', location: 'Drainase Mangga Jl. Thamrin', score: 82 },
    { id: 3, priority: 'medium', location: 'Retak Jembatan Cidadane', score: 78 },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const intervalRef = useRef(null);

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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Memuat dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 pb-12">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari aset, laporan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-sm pl-10 pr-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Settings size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header - Styled like mockup */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold font-serif text-slate-800 tracking-tight">Dashboard</h1>
          <p className="mt-2 text-slate-600 text-lg">Ringkasan vitalitas sistem dan metrik infrastruktur saat ini.</p>
        </div>

        {/* Top Section: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Left Column: Vitality Stream (Damage Trend) - takes 2 columns */}
          <div className="lg:col-span-2 glass-card petal-shape bg-white/60 border border-primary-container/20 p-8 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-bold text-slate-800">Tren Kerusakan</h2>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="glass-card border-none rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none w-32 focus:border-primary cursor-pointer relative z-20"
              >
                <option value="monthly">Bulanan</option>
                <option value="weekly">Mingguan</option>
              </select>
            </div>
            
            <div className="flex gap-12 mb-8 relative z-10">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">TOTAL ASET</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-primary">{stats.totalAssets}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">ANGGARAN</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-slate-800">{stats.budgetProgress}%</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">STATUS</p>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  <p className="text-sm font-medium text-slate-700">Optimal</p>
                </div>
              </div>
            </div>

            <div className="h-64 w-full relative z-10">
              {/* Existing Area Chart */}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.damageTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDamage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#805062" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#805062" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.2)" />
                  <XAxis 
                    dataKey="period" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#805062" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorDamage)" 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#805062', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Background Petal Decoration */}
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/5 rounded-[40%_60%_70%_30%] transform rotate-12 blur-xl pointer-events-none"></div>
          </div>

          {/* Right Column: Recent Whispers (Recent Reports) */}
          <div className="lg:col-span-1 glass-card petal-shape bg-white/60 border border-primary-container/20 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-slate-800">Laporan Terbaru</h2>
              <button className="text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">sort</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {recentReports.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Belum ada laporan.</div>
              ) : (
                recentReports.slice(0, 4).map(report => (
                  <div key={report.id} onClick={() => { setSelectedReport(report); setIsDetailModalOpen(true); }} className="group relative p-4 rounded-2xl bg-surface-container-lowest border border-primary-container/10 hover:border-primary-container/30 hover:shadow-md transition-all cursor-pointer overflow-hidden">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        {report.status === 'pending' ? (
                          <span className="material-symbols-outlined text-error">error</span>
                        ) : report.status === 'selesai' ? (
                          <span className="material-symbols-outlined text-tertiary">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-secondary">info</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                          {report.ticket_code} - {report.damage_type_name}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {report.location_description}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                          {new Date(report.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button onClick={() => navigate('/dashboard/reports')} className="mt-4 w-full py-3 text-xs font-bold text-slate-600 hover:text-primary uppercase tracking-widest border-t border-primary-container/10 transition-colors">
              Lihat Semua Laporan →
            </button>
          </div>
        </div>

        {/* Bottom Section: Orchard Distribution (Asset Condition & Status) */}
        <div className="glass-card petal-shape bg-white/60 border border-primary-container/20 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <h2 className="text-2xl font-serif font-bold text-slate-800">Distribusi Aset</h2>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f9bbd0' }}></div><span className="text-xs text-slate-600 font-medium uppercase tracking-wider">Baik</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ce8093' }}></div><span className="text-xs text-slate-600 font-medium uppercase tracking-wider">Rusak Ringan</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8c3a56' }}></div><span className="text-xs text-slate-600 font-medium uppercase tracking-wider">Rusak Berat</span></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Condition Pie Chart */}
            <div className="h-64 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Baik', value: dashboardData.assetCondition.good || 0, color: '#f9bbd0' },
                      { name: 'Rusak Ringan', value: dashboardData.assetCondition.light_damage || 0, color: '#ce8093' },
                      { name: 'Rusak Berat', value: dashboardData.assetCondition.heavy_damage || 0, color: '#8c3a56' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      if (percent === 0) return null;
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {
                      [
                        { name: 'Baik', value: dashboardData.assetCondition.good || 0, color: '#f9bbd0' },
                        { name: 'Rusak Ringan', value: dashboardData.assetCondition.light_damage || 0, color: '#ce8093' },
                        { name: 'Rusak Berat', value: dashboardData.assetCondition.heavy_damage || 0, color: '#8c3a56' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    }
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Reports Status Progress */}
             <div className="flex flex-col justify-center space-y-6">
                <div>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="font-medium text-slate-700">Laporan Pending</span>
                     <span className="font-bold text-slate-900">{dashboardData.damageReports.pending || 0}</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                     <div className="h-2 rounded-full" style={{ backgroundColor: '#8c3a56', width: `${Math.min(((dashboardData.damageReports.pending || 0) / Math.max(stats.totalReports, 1)) * 100, 100)}%` }}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="font-medium text-slate-700">Sedang Diverifikasi</span>
                     <span className="font-bold text-slate-900">{dashboardData.damageReports.terverifikasi || 0}</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                     <div className="h-2 rounded-full" style={{ backgroundColor: '#ce8093', width: `${Math.min(((dashboardData.damageReports.terverifikasi || 0) / Math.max(stats.totalReports, 1)) * 100, 100)}%` }}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="font-medium text-slate-700">Selesai</span>
                     <span className="font-bold text-slate-900">{dashboardData.damageReports.selesai || 0}</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                     <div className="h-2 rounded-full" style={{ backgroundColor: '#f9bbd0', width: `${Math.min(((dashboardData.damageReports.selesai || 0) / Math.max(stats.totalReports, 1)) * 100, 100)}%` }}></div>
                   </div>
                </div>
             </div>  
          </div>
        </div>

        {/* Detail Modal */}
              </div>
      {/* Detail Modal */}
      {isDetailModalOpen && selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={() => { setIsDetailModalOpen(false); setSelectedReport(null); }} />
      )}
    </main>
  );
}

/**
 * Asset Condition Chart Component
 */
function AssetConditionChart({ data }) {
  const total = data.good + data.light_damage + data.heavy_damage;
  const goodPercent = total > 0 ? (data.good / total) * 100 : 0;
  const lightPercent = total > 0 ? (data.light_damage / total) * 100 : 0;
  const heavyPercent = total > 0 ? (data.heavy_damage / total) * 100 : 0;

  return (
    <div className="glass-panel rounded-2xl p-6 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Kondisi Aset</h2>
      </div>

      <div className="space-y-4">
        {/* Pie Chart Visual */}
        <div className="flex items-center justify-center h-40">
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#374151" strokeWidth="20" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#10b981"
              strokeWidth="20"
              strokeDasharray={`${goodPercent * 2.51} 251`}
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="20"
              strokeDasharray={`${lightPercent * 2.51} 251`}
              strokeDashoffset={`${-goodPercent * 2.51}`}
              transform="rotate(-90 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#ef4444"
              strokeWidth="20"
              strokeDasharray={`${heavyPercent * 2.51} 251`}
              strokeDashoffset={`${-(goodPercent + lightPercent) * 2.51}`}
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">Baik</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{data.good} ({goodPercent.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">Rusak Ringan</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{data.light_damage} ({lightPercent.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">Rusak Berat</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{data.heavy_damage} ({heavyPercent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Report Status Summary Component
 */
function ReportStatusSummary({ data }) {
  const total = data.pending + data.terverifikasi + data.selesai + data.ditolak;

  return (
    <div className="glass-panel rounded-2xl p-6 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-blue-600" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Status Laporan</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-primary/5 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Pending</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.pending}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">{total > 0 ? ((data.pending / total) * 100).toFixed(0) : 0}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Terverifikasi</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.terverifikasi}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">{total > 0 ? ((data.terverifikasi / total) * 100).toFixed(0) : 0}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Selesai</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.selesai}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">{total > 0 ? ((data.selesai / total) * 100).toFixed(0) : 0}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Ditolak</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.ditolak}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">{total > 0 ? ((data.ditolak / total) * 100).toFixed(0) : 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Maintenance KPI Cards Component
 */
function MaintenanceKPICards({ kpis }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <div className="glass-panel rounded-2xl p-6 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900/40">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Rata-rata Waktu Penyelesaian</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{kpis.avgCompletionTime}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">hari</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Clock size={20} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-900/40">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Persentase Tepat Waktu</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{kpis.onTimePercentage}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">selesai tepat waktu</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900/40">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Total Selesai</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{kpis.totalCompleted}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">penugasan</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-900/40">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Total Penugasan</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{kpis.totalTasks}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">aktif & selesai</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Damage Trend Chart Component
 */
function TrendChart({ data, period, onPeriodChange }) {
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.total), 10) : 10;
  
  const generatePath = () => {
    if (!data || data.length === 0) return '';
    const points = data.map((d, i) => {
      const x = ((i + 0.5) / data.length) * 100;
      const y = 100 - (d.total / maxValue) * 100;
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1X = curr.x + (next.x - curr.x) / 2;
      const cp1Y = curr.y;
      const cp2X = curr.x + (next.x - curr.x) / 2;
      const cp2Y = next.y;
      path += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 glass-card border-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-slate-900">Tren Pelaporan Kerusakan</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPeriodChange('weekly')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              period === 'weekly'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Mingguan
          </button>
          <button
            onClick={() => onPeriodChange('monthly')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              period === 'monthly'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-8">Intensitas laporan berbasis AI analysis selama periode terpilih.</p>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          <p>Tidak ada data tren</p>
        </div>
      ) : (
        <div className="relative h-56 w-full rounded-xl border border-slate-200 bg-primary/5/50 overflow-hidden px-4">
          {/* Dotted Grid Background */}
          <div 
            className="absolute inset-0 z-0 opacity-50" 
            style={{ 
              backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)', 
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0'
            }}
          />

          <div className="relative h-40 mt-8 mb-8 w-full z-10">
            {/* SVG Line Overlay */}
            <svg 
              className="absolute inset-0 h-full w-full pointer-events-none overflow-visible" 
              preserveAspectRatio="none" 
              viewBox="0 0 100 100"
            >
              <path 
                d={generatePath()} 
                fill="none" 
                stroke="#805062" 
                strokeWidth="2" 
                vectorEffect="non-scaling-stroke" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {data.map((d, i) => {
                const x = ((i + 0.5) / data.length) * 100;
                const y = 100 - (d.total / maxValue) * 100;
                return (
                  <circle 
                    key={i} 
                    cx={x} 
                    cy={y} 
                    r="4" 
                    fill="#fff" 
                    stroke="#805062" 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke" 
                  />
                );
              })}
            </svg>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-around gap-2 z-20">
              {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col justify-end items-center group cursor-pointer h-full relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-30 pointer-events-none">
                    {item.total} laporan
                  </div>
                  
                  {/* Bar */}
                  <div
                    className="w-full max-w-[4.5rem] bg-primary/60 group-hover:bg-primary transition-all rounded-t-sm"
                    style={{
                      height: `${(item.total / maxValue) * 100}%`,
                      minHeight: item.total > 0 ? '4px' : '2px',
                    }}
                  />
                  
                  {/* Label */}
                  <span className="absolute -bottom-6 text-xs font-semibold text-slate-600 text-center w-full truncate">
                    {item.period}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div>
          <p className="text-xs text-slate-600 mb-1">Total Laporan</p>
          <p className="text-2xl font-black text-slate-900">
            {data.reduce((sum, item) => sum + item.total, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Selesai</p>
          <p className="text-2xl font-black text-primary">
            {data.reduce((sum, item) => sum + item.completed, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Pending</p>
          <p className="text-2xl font-black text-orange-600">
            {data.reduce((sum, item) => sum + item.pending, 0)}
          </p>
        </div>
      </div>
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
