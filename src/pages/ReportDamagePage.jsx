import React from 'react';
import { AlertCircle, Clock3, MapPin, Phone } from 'lucide-react';
import DamageReportForm from '../components/DamageReportForm';

const highlights = [
  {
    icon: MapPin,
    title: 'Koordinat Presisi',
    description:
      'Gunakan GPS atau isi koordinat manual agar lokasi kerusakan tercatat dengan akurat.',
  },
  {
    icon: AlertCircle,
    title: 'Verifikasi Cepat',
    description:
      'Laporan tervalidasi untuk membantu tim menentukan prioritas penanganan lebih objektif.',
  },
  {
    icon: Clock3,
    title: 'Tracking Transparan',
    description:
      'Setiap laporan memiliki kode tiket agar masyarakat bisa memantau progres secara mandiri.',
  },
];

const faqs = [
  {
    question: 'Apakah perlu membuat akun untuk melaporkan?',
    answer:
      'Tidak perlu. Pelaporan bersifat publik agar warga dapat melapor dengan cepat tanpa proses registrasi.',
  },
  {
    question: 'Berapa lama proses verifikasi laporan?',
    answer:
      'Umumnya 1-3 hari kerja, tergantung kelengkapan data lokasi, foto, dan tingkat urgensi laporan.',
  },
  {
    question: 'Bagaimana cara melacak status laporan?',
    answer:
      'Setelah submit, Anda akan menerima kode tiket. Gunakan kode tersebut pada menu Lacak Laporan.',
  },
  {
    question: 'Apakah data pribadi saya aman?',
    answer:
      'Ya. Data kontak hanya dipakai untuk validasi dan komunikasi tindak lanjut laporan.',
  },
];

export default function ReportDamagePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="surface-panel hero-rise relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-teal-300/25 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              InfraTrack / Pelaporan Publik
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Lapor Kerusakan Infrastruktur
              <span className="block text-cyan-700">Lebih Cepat, Lebih Transparan</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Bantu pemerintah daerah menjaga kualitas infrastruktur publik. Kirim laporan
              lengkap dengan lokasi dan foto, lalu pantau status penanganan secara mandiri.
            </p>
          </div>

          <div className="surface-card rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Kenapa InfraTrack
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-cyan-50 px-2 py-3">
                <p className="text-lg font-extrabold text-cyan-800">24/7</p>
                <p className="mt-1 text-[11px] text-slate-600">Akses Pelaporan</p>
              </div>
              <div className="rounded-xl bg-teal-50 px-2 py-3">
                <p className="text-lg font-extrabold text-teal-800">Tanpa</p>
                <p className="mt-1 text-[11px] text-slate-600">Buat Akun</p>
              </div>
              <div className="rounded-xl bg-sky-50 px-2 py-3">
                <p className="text-lg font-extrabold text-sky-800">1</p>
                <p className="mt-1 text-[11px] text-slate-600">Kode Tiket</p>
              </div>
            </div>
          </div>
        </div>

        <div className="stagger-fade mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="surface-card rounded-2xl p-5">
                <div className="inline-flex rounded-xl bg-cyan-100 p-2.5 text-cyan-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-slate-800">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="surface-panel rounded-3xl p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Form Pelaporan
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-800">Kirim Laporan Anda</h2>
          <p className="mt-2 text-sm text-slate-600">
            Isi data dengan lengkap agar proses verifikasi dan penanganan dapat dilakukan lebih
            cepat.
          </p>

          <div className="mt-6 rounded-2xl border border-cyan-100 bg-white/90 p-3 sm:p-5">
            <DamageReportForm />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="surface-panel rounded-3xl p-5 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800">Pertanyaan Umum</h3>
            <div className="mt-4 space-y-3">
              {faqs.map((item) => (
                <article key={item.question} className="surface-card rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-800">{item.question}</h4>
                  <p className="mt-1.5 text-sm text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-3xl p-5 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800">Butuh Bantuan Cepat?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Hubungi kanal resmi untuk bantuan pelaporan dan kendala penggunaan aplikasi.
            </p>
            <div className="mt-4 space-y-3">
              <div className="surface-card flex items-center gap-3 rounded-xl p-4">
                <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Telepon</p>
                  <p className="text-sm font-semibold text-slate-800">1500-123 (Bebas Pulsa)</p>
                </div>
              </div>
              <div className="surface-card rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">laporan@infratrack.gov.id</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
