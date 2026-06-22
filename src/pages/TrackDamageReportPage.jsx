import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, MapPin, Printer, Share2, Star } from 'lucide-react';
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
  terverifikasi: 'border-primary/20 bg-primary/5 text-primary',
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
  const [isCopied, setIsCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleSubmitFeedback = async () => {
    setIsSubmittingFeedback(true);
    // Simulasi pengiriman data ke server (Mock API)
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmittingFeedback(false);
    setFeedbackSubmitted(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketParam = params.get('ticket');

    if (ticketParam) {
      setTicketCode(ticketParam);

      const fetchInitialReport = async () => {
        setLoading(true);
        setSearched(true);
        const result = await getDamageReportByTicket(ticketParam);
        setLoading(false);
        if (result.success) {
          setReport(result.report);
        } else {
          setError(result.error || 'Laporan tidak ditemukan');
        }
      };

      fetchInitialReport();
    }
  }, []);

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

  const handleShare = () => {
    if (!report) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?ticket=${report.ticket_code}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="surface-panel hero-rise rounded-3xl p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            InfraTrack / Tracking Publik
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
            Lacak Status Laporan
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
            Gunakan kode tiket untuk melacak status laporan kerusakan Anda
          </p>
        </div>

        <div className="surface-card mx-auto mt-7 max-w-3xl rounded-2xl p-4 sm:p-5 print:hidden">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode tiket (mis: INF-20240101-XXXXX)"
              className="flex-1 rounded-xl border border-primary/10 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary/80"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
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
            <div className="inline-flex rounded-full bg-primary/5 p-4 text-primary">
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

            {/* Action Buttons Section */}
            <div className="flex justify-end gap-3 px-2 print:hidden">
              <button
                type="button"
                onClick={handleShare}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm border transition ${isCopied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-primary/5'
                  }`}
              >
                {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-primary" />}
                {isCopied ? 'Tersalin!' : 'Bagikan'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-primary/5 transition"
              >
                <Printer className="w-4 h-4 text-primary" />
                Cetak Bukti
              </button>
            </div>

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

              <div className="mt-5 border-t border-primary/10 pt-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Deskripsi</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{report.description}</p>
              </div>

              {report.photo_url && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Foto Kerusakan</p>
                  <img
                    src={report.photo_url}
                    alt="Damage"
                    className="mt-2 w-full rounded-xl border border-primary/10 object-cover"
                  />
                </div>
              )}

              <div className="mt-5 grid gap-4 border-t border-primary/10 pt-4 sm:grid-cols-2">
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
                  <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Laporan Dikirim</p>
                    <p className="text-xs text-slate-500">{formatDate(report.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div
                    className={`mt-1 h-3 w-3 rounded-full ${report.status !== 'pending' ? 'bg-primary' : 'bg-slate-300'
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
                    className={`mt-1 h-3 w-3 rounded-full ${['sedang_dikerjakan', 'selesai'].includes(report.status)
                      ? 'bg-primary'
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

            {/* Rating Section UI */}
            {report.status === 'selesai' && (
              <section className="surface-card rounded-2xl p-5 sm:p-6 print:hidden">
                <h3 className="text-base font-bold text-slate-800">Berikan Penilaian</h3>
                <p className="mt-1 text-sm text-slate-500">Seberapa puas Anda dengan penanganan laporan ini?</p>
                <div className="mt-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className={`transition ${star <= (hoveredRating || rating)
                          ? 'text-amber-400'
                          : 'text-slate-300'
                        }`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>

                {rating > 0 && !feedbackSubmitted && (
                  <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea
                      rows="3"
                      placeholder="Bagaimana hasil perbaikannya? (Opsional)"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full rounded-xl border border-primary/10 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-primary/80"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSubmitFeedback}
                        disabled={isSubmittingFeedback}
                        className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary disabled:opacity-70"
                      >
                        {isSubmittingFeedback && <Clock className="w-4 h-4 animate-spin" />}
                        {isSubmittingFeedback ? 'Mengirim...' : 'Kirim Penilaian'}
                      </button>
                    </div>
                  </div>
                )}

                {feedbackSubmitted && (
                  <div className="mt-5 animate-in fade-in rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center text-emerald-700">
                    <CheckCircle className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
                    <p className="text-sm font-semibold">Terima kasih atas ulasan Anda!</p>
                    <p className="mt-1 text-xs opacity-80">Feedback Anda sangat berarti untuk peningkatan layanan kami.</p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {!loading && searched && !report && !error && (
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-3 text-sm text-slate-600">Laporan tidak ditemukan</p>
          </div>
        )}

        {!searched && (
          <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-primary/10 bg-primary/5/70 p-5 print:hidden">
            <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Tips Tracking</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-primary">
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
