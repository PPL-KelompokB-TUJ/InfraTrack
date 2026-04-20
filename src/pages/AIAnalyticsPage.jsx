import { BarChart, TrendingUp, AlertCircle } from 'lucide-react';

export default function AIAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Analitik AI</h1>
          <p className="mt-2 text-slate-600">
            Dapatkan insights mendalam tentang infrastruktur Anda menggunakan analitik berbasis AI
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Aset</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">1,248</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <BarChart className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Laporan Kerusakan</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">47</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Prediksi Kegagalan</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">12</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                <TrendingUp className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Akurasi Model</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">94.5%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Predictive Analytics */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 bg-white border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Prediksi Perawatan</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Model AI merekomendasikan jadwal perawatan berdasarkan pola kerusakan historis
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Jalan Raya Utama</p>
                  <p className="text-xs text-slate-600">Rekomendasi: Perawatan dalam 15 hari</p>
                </div>
                <span className="px-3 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded-full">
                  Tinggi
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Jembatan Sungai</p>
                  <p className="text-xs text-slate-600">Rekomendasi: Inspeksi dalam 30 hari</p>
                </div>
                <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">
                  Sedang
                </span>
              </div>
            </div>
          </div>

          {/* Model Performance */}
          <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Performa Model</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Presisi</span>
                  <span className="text-sm font-bold text-slate-900">92%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Recall</span>
                  <span className="text-sm font-bold text-slate-900">96%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">F1 Score</span>
                  <span className="text-sm font-bold text-slate-900">94%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Quality */}
        <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Kualitas Data Pelatihan</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 font-medium">Total Dataset</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">5,234</p>
              <p className="text-xs text-slate-500 mt-2">sample data</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 font-medium">Data Tervalidasi</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">4,890</p>
              <p className="text-xs text-slate-500 mt-2">93.4% lengkap</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 font-medium">Update Terakhir</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">2 jam</p>
              <p className="text-xs text-slate-500 mt-2">lalu</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 font-medium">Prediksi Aktif</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">348</p>
              <p className="text-xs text-slate-500 mt-2">aset terpantau</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
