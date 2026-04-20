import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react';
import { getDamageReportByTicket } from '../lib/damageReportService';

const getUrgencyColor = (level) => {
  const colors = {
    rendah: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    sedang: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    tinggi: 'bg-orange-100 text-orange-800 border border-orange-300',
    sangat_tinggi: 'bg-red-100 text-red-800 border border-red-300',
  };
  return colors[level] || 'bg-slate-100 text-slate-800 border border-slate-300';
};

const getUrgencyLabel = (level) => {
  const labels = {
    rendah: 'Rendah',
    sedang: 'Sedang',
    tinggi: 'Tinggi',
    sangat_tinggi: 'Sangat Tinggi',
  };
  return labels[level] || level;
};

const statusColors = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  terverifikasi: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  ditolak: 'border-rose-200 bg-rose-50 text-rose-800',
  sedang_dikerjakan: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  selesai: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const statusLabels = {
  pending: 'Menunggu Verifikasi',
  terverifikasi: 'Terverifikasi',
  ditolak: 'Ditolak',
  sedang_dikerjakan: 'Sedang Dikerjakan',
  selesai: 'Selesai',
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'selesai':
      return <CheckCircle className="w-5 h-5" />;
    case 'sedang_dikerjakan':
      return <Clock className="w-5 h-5" />;
    case 'ditolak':
      return <AlertCircle className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

export default function TrackDamageReportPage() {
  const [ticketCode, setTicketCode] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setReport(null);

    if (!ticketCode.trim()) {
      setError('Masukkan kode tiket');
      return;
    }

    setLoading(true);
    setSearched(true);

    const result = await getDamageReportByTicket(ticketCode);

    setLoading(false);

    if (result.success) {
      setReport(result.report);
    } else {
      setError(result.error || 'Laporan tidak ditemukan');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="surface-panel hero-rise rounded-3xl p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
            InfraTrack / Tracking Publik
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
            Lacak Status Laporan
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
            Gunakan kode tiket untuk melacak status laporan kerusakan Anda
          </p>
        </div>

        <div className="surface-card mx-auto mt-7 max-w-3xl rounded-2xl p-4 sm:p-5">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode tiket (mis: INF-20240101-XXXXX)"
              className="flex-1 rounded-xl border border-cyan-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
            >
              <Search className="w-5 h-5" />
              Cari
            </button>
          </form>

          <p className="mt-3 text-xs text-slate-500">
            Format contoh: <span className="font-semibold text-slate-700">INF-20260417-ABC12</span>
          </p>
        </div>

        {error && searched && (
          <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center">
            <div className="inline-flex rounded-full bg-cyan-50 p-4 text-cyan-700">
              <Clock className="h-8 w-8 animate-spin" />
            </div>
            <p className="mt-3 text-sm text-slate-600">Mencari laporan...</p>
          </div>
        )}

        {report && !loading && (
          <div className="mx-auto mt-7 max-w-4xl space-y-4">
            <section className={`rounded-2xl border p-5 ${statusColors[report.status]}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">Status Saat Ini</p>
                  <p className="mt-1 text-2xl font-extrabold">{statusLabels[report.status]}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-2">{getStatusIcon(report.status)}</div>
              </div>
            </section>

            <section className="surface-card rounded-2xl p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Kode Tiket</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">{report.ticket_code}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Jenis Kerusakan</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{report.damage_type_name}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tingkat Urgensi</p>
                  <div className="mt-1">
                    <span className={`inline-block rounded-lg px-3 py-1 text-sm font-semibold ${getUrgencyColor(report.urgency_level)}`}>
                      {getUrgencyLabel(report.urgency_level)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Lokasi</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-cyan-100 pt-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Deskripsi</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{report.description}</p>
              </div>

              {report.photo_url && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Foto Kerusakan</p>
                  <img
                    src={report.photo_url}
                    alt="Damage"
                    className="mt-2 w-full rounded-xl border border-cyan-100 object-cover"
                  />
                </div>
              )}

              <div className="mt-5 grid gap-4 border-t border-cyan-100 pt-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tanggal Dilaporkan</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(report.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Terakhir Diperbarui</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(report.updated_at)}</p>
                </div>
              </div>
            </section>

            <section className="surface-card rounded-2xl p-5 sm:p-6">
              <h3 className="text-base font-bold text-slate-800">Timeline Laporan</h3>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 h-3 w-3 rounded-full bg-cyan-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Laporan Dikirim</p>
                    <p className="text-xs text-slate-500">{formatDate(report.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div
                    className={`mt-1 h-3 w-3 rounded-full ${
                      report.status !== 'pending' ? 'bg-cyan-600' : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Verifikasi</p>
                    <p className="text-xs text-slate-500">
                      {report.status !== 'pending' ? 'Selesai' : 'Menunggu verifikasi'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div
                    className={`mt-1 h-3 w-3 rounded-full ${
                      ['sedang_dikerjakan', 'selesai'].includes(report.status)
                        ? 'bg-cyan-600'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Penanganan</p>
                    <p className="text-xs text-slate-500">
                      {['sedang_dikerjakan', 'selesai'].includes(report.status)
                        ? 'Dalam proses / selesai'
                        : 'Menunggu tindak lanjut'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {!loading && searched && !report && !error && (
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-3 text-sm text-slate-600">Laporan tidak ditemukan</p>
          </div>
        )}

        {!searched && (
          <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-800">Tips Tracking</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-cyan-900">
              <li>• Kode tiket didapat setelah laporan berhasil dikirim.</li>
              <li>• Simpan kode tiket untuk memantau progres kapan saja.</li>
              <li>• Status laporan akan diperbarui berkala oleh admin.</li>
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
