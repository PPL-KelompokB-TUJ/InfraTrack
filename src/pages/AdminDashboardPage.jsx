import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Building2, FileText, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalReports: 0,
    pendingReports: 0,
    completedTasks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Get total assets
      const { count: totalAssets, error: assetsError } = await supabase
        .from('infrastructure_assets')
        .select('*', { count: 'exact', head: true });

      if (assetsError) throw assetsError;

      // Get total reports
      const { count: totalReports, error: reportsError } = await supabase
        .from('damage_reports')
        .select('*', { count: 'exact', head: true });

      if (reportsError) throw reportsError;

      // Get pending reports (status not 'selesai')
      const { count: pendingReports, error: pendingError } = await supabase
        .from('damage_reports')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'selesai');

      if (pendingError) throw pendingError;

      // Get completed maintenance tasks
      const { count: completedTasks, error: tasksError } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'selesai');

      if (tasksError) throw tasksError;

      setStats({
        totalAssets: totalAssets || 0,
        totalReports: totalReports || 0,
        pendingReports: pendingReports || 0,
        completedTasks: completedTasks || 0,
      });
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memuat statistik dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
          <p className="mt-2 text-sm text-slate-600">Memuat dashboard...</p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-rose-700">{errorMessage}</p>
          <button
            onClick={loadStats}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Coba Lagi
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Dashboard Admin</h1>
        <p className="mt-2 text-slate-600">
          Ringkasan aktivitas dan statistik sistem InfraTrack
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Assets */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.totalAssets}</p>
              <p className="text-sm text-slate-600">Total Aset</p>
            </div>
          </div>
        </div>

        {/* Total Reports */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.totalReports}</p>
              <p className="text-sm text-slate-600">Total Laporan</p>
            </div>
          </div>
        </div>

        {/* Pending Reports */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.pendingReports}</p>
              <p className="text-sm text-slate-600">Laporan Pending</p>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Users size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.completedTasks}</p>
              <p className="text-sm text-slate-600">Tugas Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for future interactive elements */}
      <div className="mt-8 glass-panel rounded-3xl p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Aktivitas Terbaru</h2>
        <p className="text-slate-600">Fitur interaktif akan ditambahkan di sini (charts, filters, dll.)</p>
      </div>
    </main>
  );
}