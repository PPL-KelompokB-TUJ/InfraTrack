import { useCallback, useEffect, useState, useRef } from 'react';
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

export default function DashboardPage({ onNavigateToModule }) {
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
        .eq('status', 'selesai');

      if (tasksError) throw tasksError;

      const reportsResult = await getRecentDamageReports(10);
      
      // Load comprehensive dashboard data
      const dashResult = await getComprehensiveDashboardData(selectedPeriod);

      setStats(prev => ({
        ...prev,
        totalAssets: totalAssets || 0,
        totalReports: totalReports || 0,
        completedTasks: completedTasks || 0,
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

    // Set up auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      loadStats();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
            <p className="mt-4 text-slate-600">Memuat dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari aset, laporan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-sm pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell size={20} className="text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Settings size={20} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-600">Infratrack / Dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Assets */}
          <div className="glass-panel rounded-2xl p-6 border border-cyan-100 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">TOTAL ASET</p>
                <p className="text-4xl font-bold text-slate-900">{stats.totalAssets.toLocaleString('id-ID')}</p>
                <p className="text-xs text-slate-500 mt-2">+{stats.assetsChange} bulan ini</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-50 text-cyan-600">
                <Building2 size={24} />
              </div>
            </div>
          </div>

          {/* Damage Reports - Clickable */}
          <button
            onClick={() => onNavigateToModule?.('active-reports')}
            className="glass-panel rounded-2xl p-6 border border-red-100 bg-white hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-600 mb-1">LAPORAN AKTIF</p>
                <p className="text-4xl font-bold text-slate-900">{stats.totalReports}</p>
                <p className="text-xs text-slate-500 mt-2">{stats.reportsChange} terlaksanakan</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-red-100 to-red-50 text-red-600">
                <AlertCircle size={24} />
              </div>
            </div>
          </button>

          {/* Maintenance Done */}
          <div className="glass-panel rounded-2xl p-6 border border-emerald-100 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">MAINTENANCE DONE</p>
                <p className="text-4xl font-bold text-slate-900">{stats.completedTasks}</p>
                <p className="text-xs text-emerald-600 font-semibold mt-2">+{stats.tasksChange}% vs target</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="glass-panel rounded-2xl p-6 border border-amber-100 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">ANGGARAN TERPAKSI</p>
                <p className="text-2xl font-bold text-slate-900">Rp {(stats.budgetAllocated / 1000000).toFixed(1)}M</p>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: `${stats.budgetProgress}%`}}></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">{stats.budgetProgress}% rencana tahunan</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600">
                <DollarSign size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section - Asset Condition & Report Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Asset Condition Chart */}
          <AssetConditionChart data={dashboardData.assetCondition} />
          {/* Report Status Summary */}
          <ReportStatusSummary data={dashboardData.damageReports} />
        </div>

        {/* Maintenance KPIs */}
        <MaintenanceKPICards kpis={dashboardData.maintenanceKPIs} />

        {/* Damage Trend Chart */}
        <div className="mb-8">
          <TrendChart 
            data={dashboardData.damageTrend} 
            period={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Map Section */}
          <MapVisualization />

          {/* AI Recommendations */}
          <div className="glass-panel rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-white border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">AI Recommendation</h2>
            </div>
            
            <p className="text-xs text-slate-600 mb-4">
              Berdasarkan skor urgensi & efisiensi, 3 laporan terbaik dijadwalkan minggu depan
            </p>

            <div className="space-y-3">
              {aiRecommendations.map((rec, index) => (
                <div key={rec.id} className="bg-white rounded-lg p-3 border border-purple-100 hover:border-purple-300 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <span className="text-lg font-bold text-slate-900">{rec.score}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{rec.location}</p>
                  <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                    rec.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {rec.priority === 'urgent' ? 'Urgent' : 
                     rec.priority === 'high' ? 'High' : 'Medium'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Reports */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Laporan Terbaru</h2>
              <button className="text-sm text-cyan-600 hover:text-cyan-700 font-semibold">
                Lihat Semua →
              </button>
            </div>

            {recentReports.length === 0 ? (
              <p className="text-slate-600 text-center py-8">Belum ada laporan kerusakan terbaru</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-3 font-bold text-slate-700">ID</th>
                      <th className="text-left py-3 px-3 font-bold text-slate-700">KATEGORI</th>
                      <th className="text-left py-3 px-3 font-bold text-slate-700">LOKASI</th>
                      <th className="text-left py-3 px-3 font-bold text-slate-700">SKOR AI</th>
                      <th className="text-left py-3 px-3 font-bold text-slate-700">STATUS</th>
                      <th className="text-left py-3 px-3 font-bold text-slate-700">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.slice(0, 5).map((report) => (
                      <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-cyan-700 text-xs">{report.ticket_code}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-700 font-medium text-xs">{report.damage_type_name}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-600 text-xs truncate max-w-xs">{report.location_description}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-900 font-bold text-sm">{Math.floor(Math.random() * 40) + 60}</span>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleViewDetail(report)}
                            className="text-cyan-600 hover:text-cyan-700 font-semibold text-xs"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly Statistics */}
          <div className="glass-panel rounded-2xl p-6 bg-white">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Statistik Penanganan Bulanan</h2>
            
            <div className="space-y-4">
              {/* Chart */}
              <div className="h-40 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-end justify-around p-4 border border-slate-200">
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-cyan-500 rounded" style={{height: '80px', width: '28px'}}></div>
                  <span className="text-xs text-slate-600 font-semibold">Jan</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-cyan-500 rounded" style={{height: '60px', width: '28px'}}></div>
                  <span className="text-xs text-slate-600 font-semibold">Feb</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-cyan-500 rounded" style={{height: '100px', width: '28px'}}></div>
                  <span className="text-xs text-slate-600 font-semibold">Mar</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-cyan-400 rounded opacity-50" style={{height: '45px', width: '28px'}}></div>
                  <span className="text-xs text-slate-600 font-semibold">Apr</span>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">Total Laporan</span>
                  <span className="font-bold text-slate-900">{stats.totalReports}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">Tertangani</span>
                  <span className="font-bold text-emerald-600">{stats.completedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">Pending</span>
                  <span className="font-bold text-orange-600">{stats.totalReports - stats.completedTasks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReport && (
        <ReportDetailModal 
          report={selectedReport} 
          onClose={handleCloseModal}
        />
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
    <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={20} className="text-cyan-600" />
        <h2 className="text-lg font-bold text-slate-900">Kondisi Aset</h2>
      </div>

      <div className="space-y-4">
        {/* Pie Chart Visual */}
        <div className="flex items-center justify-center h-40">
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20" />
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
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-700">Baik</span>
            </div>
            <span className="font-bold text-slate-900">{data.good} ({goodPercent.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-slate-700">Rusak Ringan</span>
            </div>
            <span className="font-bold text-slate-900">{data.light_damage} ({lightPercent.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-700">Rusak Berat</span>
            </div>
            <span className="font-bold text-slate-900">{data.heavy_damage} ({heavyPercent.toFixed(1)}%)</span>
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
    <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-blue-600" />
        <h2 className="text-lg font-bold text-slate-900">Status Laporan</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span className="text-sm text-slate-700 font-medium">Pending</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900">{data.pending}</span>
            <p className="text-xs text-slate-500">{total > 0 ? ((data.pending / total) * 100).toFixed(0) : 0}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-slate-700 font-medium">Terverifikasi</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900">{data.terverifikasi}</span>
            <p className="text-xs text-slate-500">{total > 0 ? ((data.terverifikasi / total) * 100).toFixed(0) : 0}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-700 font-medium">Selesai</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900">{data.selesai}</span>
            <p className="text-xs text-slate-500">{total > 0 ? ((data.selesai / total) * 100).toFixed(0) : 0}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-slate-700 font-medium">Ditolak</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900">{data.ditolak}</span>
            <p className="text-xs text-slate-500">{total > 0 ? ((data.ditolak / total) * 100).toFixed(0) : 0}%</p>
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
      <div className="glass-panel rounded-2xl p-6 bg-white border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Rata-rata Waktu Penyelesaian</p>
            <p className="text-4xl font-bold text-slate-900">{kpis.avgCompletionTime}</p>
            <p className="text-xs text-slate-500 mt-2">hari</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Clock size={20} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 bg-white border border-emerald-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Persentase Tepat Waktu</p>
            <p className="text-4xl font-bold text-slate-900">{kpis.onTimePercentage}%</p>
            <p className="text-xs text-slate-500 mt-2">selesai tepat waktu</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 bg-white border border-purple-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Total Selesai</p>
            <p className="text-4xl font-bold text-slate-900">{kpis.totalCompleted}</p>
            <p className="text-xs text-slate-500 mt-2">penugasan</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 bg-white border border-orange-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Total Penugasan</p>
            <p className="text-4xl font-bold text-slate-900">{kpis.totalTasks}</p>
            <p className="text-xs text-slate-500 mt-2">aktif & selesai</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
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
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.total)) : 10;
  const chartHeight = 200;

  return (
    <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-purple-600" />
          <h2 className="text-lg font-bold text-slate-900">Tren Kerusakan</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPeriodChange('weekly')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              period === 'weekly'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Mingguan
          </button>
          <button
            onClick={() => onPeriodChange('monthly')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              period === 'monthly'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          <p>Tidak ada data tren</p>
        </div>
      ) : (
        <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
          <div className="flex items-end justify-around h-full gap-1">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="relative w-full h-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t opacity-70 hover:opacity-100 transition-opacity group-hover:shadow-lg"
                    style={{
                      height: `${(item.total / maxValue) * 100}%`,
                      minHeight: item.total > 0 ? '4px' : '2px',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 text-center truncate w-full">
                  {item.period}
                </span>
                <div className="hidden group-hover:flex absolute -top-12 bg-slate-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                  {item.total} laporan
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div>
          <p className="text-xs text-slate-600 mb-1">Total Laporan</p>
          <p className="text-2xl font-bold text-slate-900">
            {data.reduce((sum, item) => sum + item.total, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Selesai</p>
          <p className="text-2xl font-bold text-emerald-600">
            {data.reduce((sum, item) => sum + item.completed, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Detail Laporan</h2>
            <p className="text-cyan-100 text-sm mt-1">{report.ticket_code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-2">Status</p>
            <StatusBadge status={report.status} />
          </div>

          {/* Informasi Pelapor */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Informasi Pelapor</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Nama:</span>
                <span className="font-semibold text-slate-800">{report.reporter_name || '-'}</span>
              </div>
            </div>
          </div>

          {/* Kerusakan */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
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
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
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
