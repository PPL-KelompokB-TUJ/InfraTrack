import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const YORUSHIKA_QUOTES = [
  { text: "雨とカプチーノ", romanji: "Ame to Cappuccino", meaning: "Rain and Cappuccino" },
  { text: "花人局", romanji: "Hanabitayasumi", meaning: "Fireworks Holiday" },
  { text: "だから僕は音楽を辞めた", romanji: "Dakara Boku wa Ongaku wo Yameta", meaning: "So I Quit Music" },
  { text: "春泥棒", romanji: "Haru Dorobou", meaning: "Spring Thief" },
];

const FLOATING_NOTES = ['♩', '♪', '♫', '♬', '𝄞', '𝄢'];

function MusicNote({ note, style }) {
  return (
    <span
      className="absolute text-primary/20 pointer-events-none select-none yorushika-note"
      style={style}
    >
      {note}
    </span>
  );
}

function CherryBlossomDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Large soft blobs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-blob" />
      <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl animate-blob-delay" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-primary-container/10 rounded-full blur-2xl animate-blob-slow" />

      {/* Floating music notes */}
      {FLOATING_NOTES.map((note, i) => (
        <MusicNote
          key={i}
          note={note}
          style={{
            left: `${8 + i * 15}%`,
            top: `${10 + (i % 3) * 25}%`,
            fontSize: `${20 + (i % 3) * 12}px`,
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}

      {/* Thin horizontal line accents (ink brush strokes) */}
      <div className="absolute top-1/4 right-0 w-48 h-px bg-gradient-to-l from-primary/20 to-transparent" />
      <div className="absolute top-2/3 left-0 w-32 h-px bg-gradient-to-r from-primary/15 to-transparent" />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const stats = [
    { value: '15.4K+', label: 'Laporan Diselesaikan', icon: 'task_alt' },
    { value: '42', label: 'Kota Terintegrasi', icon: 'location_city' },
    { value: '24/7', label: 'Pemantauan Aktif', icon: 'monitor_heart' },
    { value: '98%', label: 'Tingkat Kepuasan', icon: 'sentiment_very_satisfied' },
  ];

  const features = [
    {
      title: 'Pelaporan Instan',
      desc: 'Laporkan kerusakan jalan, fasilitas umum, atau masalah infrastruktur lainnya hanya dengan mengunggah foto dan lokasi.',
      icon: 'add_a_photo',
      accent: 'from-primary to-primary-container',
    },
    {
      title: 'Analisis AI',
      desc: 'Sistem kecerdasan buatan kami secara otomatis mengkategorikan, menilai tingkat keparahan, dan mendistribusikan laporan.',
      icon: 'smart_toy',
      accent: 'from-secondary to-secondary-container',
    },
    {
      title: 'Pelacakan Real-time',
      desc: 'Pantau progres perbaikan infrastruktur yang Anda laporkan secara real-time. Dapatkan notifikasi transparan.',
      icon: 'timeline',
      accent: 'from-tertiary to-tertiary-container',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fdf8f8] overflow-x-hidden">

      {/* ── TOP NAV ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-white/80 backdrop-blur-xl border-b border-primary/10"
      >
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg icon-fill">verified_user</span>
          </div>
          <span className="text-xl font-black text-on-surface tracking-tight">InfraTrack</span>
        </div>

        {/* Yorushika lyric badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/15">
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase">春泥棒</span>
          <span className="text-[10px] text-on-surface-variant">— Yorushika</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/layanan')}
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            Layanan
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold px-5 py-2 rounded-full bg-primary text-on-primary hover:brightness-90 transition-all shadow-sm"
          >
            Masuk
          </button>
        </div>
      </motion.nav>

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <header ref={heroRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <CherryBlossomDecor />

        {/* Background: subtle washi-paper grain texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9InRyYW5zcGFyZW50Ii8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgwLDAsMCwwLjAxKSIvPjwvc3ZnPg==')] opacity-50" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20"
        >
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Yorushika season tag */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <div className="flex gap-1">
                {['bg-[#f9bbd0]', 'bg-[#f48fb1]', 'bg-[#ce8093]'].map((c, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${c} opacity-80`} />
                ))}
              </div>
              <span className="text-xs font-bold text-primary tracking-[0.2em] uppercase">Haru — 春 — Spring</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-black text-on-background leading-[1.05] tracking-tighter"
            >
              Membangun{' '}
              <span className="relative inline-block">
                <span className="text-primary italic font-serif">Kota</span>
                {/* Underline brush stroke */}
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0 6 Q50 2 100 5 Q150 8 200 4" stroke="#805062" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
                </svg>
              </span>
              {' '}yang{' '}
              <br />
              Lebih Baik
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg text-on-surface-variant max-w-lg leading-relaxed font-medium"
            >
              Platform cerdas untuk pelaporan, pemantauan, dan pemeliharaan infrastruktur publik.
              Seperti musim semi yang memperbarui bumi — satu laporan mengubah segalanya.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate('/layanan')}
                className="group relative inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-8 py-4 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Buat Laporan</span>
                <span className="material-symbols-outlined text-lg relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              <button
                onClick={() => navigate('/layanan')}
                className="inline-flex items-center gap-2 border-2 border-primary/30 text-primary hover:bg-primary/5 font-bold px-8 py-4 rounded-full transition-all duration-300 hover:-translate-y-1"
              >
                <span className="material-symbols-outlined text-lg">manage_search</span>
                Lacak Laporan
              </button>
            </motion.div>

            {/* Small trust signals */}
            <motion.div variants={itemVariants} className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {['bg-primary-container', 'bg-secondary-container', 'bg-tertiary-container', 'bg-primary/20'].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${c} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-on-surface-variant">
                <span className="font-bold text-on-surface">10,000+</span> laporan terselesaikan
              </p>
            </motion.div>
          </motion.div>

          {/* Right: Yorushika-themed visual card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Main card */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl h-[520px] border border-primary/10">
              <img
                alt="Smart City"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/d/17V6O371r_4SKPz3Dx1Oz4TqxwbBwCxbY"
                referrerPolicy="no-referrer"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2d0f1a]/80 via-[#2d0f1a]/20 to-transparent" />

              {/* Bottom info strip */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-container mb-1">Status Sistem</p>
                      <p className="text-lg font-bold text-white">Pemantauan Aktif Seluruh Sektor</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary-container animate-pulse icon-fill">radar</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Yorushika lyric card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-8 top-12 bg-white rounded-2xl shadow-xl border border-primary/10 p-4 max-w-[180px]"
            >
              <p className="text-2xl font-bold text-primary leading-none mb-1">春泥棒</p>
              <p className="text-[10px] text-on-surface-variant font-medium">Haru Dorobou</p>
              <p className="text-[9px] text-on-surface-variant/60 italic mt-0.5">Spring Thief — Yorushika</p>
            </motion.div>

            {/* Floating stat card */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -right-6 bottom-28 bg-white rounded-2xl shadow-xl border border-primary/10 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary icon-fill">bolt</span>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Respons</p>
                  <p className="text-sm font-black text-on-surface">&lt; 24 Jam</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">Gulir</p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 border-2 border-primary/30 rounded-full flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 bg-primary rounded-full" />
          </motion.div>
        </motion.div>
      </header>

      {/* ── YORUSHIKA INTERLUDE ───────────────────────────────────── */}
      <section className="py-16 px-6 bg-gradient-to-r from-primary/5 via-white to-secondary/5 border-y border-primary/10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-12 items-center overflow-x-auto pb-2 scrollbar-hide">
            {YORUSHIKA_QUOTES.concat(YORUSHIKA_QUOTES).map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.1 }}
                className="flex-shrink-0 text-center"
              >
                <p className="text-3xl font-black text-primary/40 leading-none font-serif">{q.text}</p>
                <p className="text-[10px] text-on-surface-variant mt-1 tracking-widest">{q.romanji}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ─────────────────────────────────────── */}
      <section className="py-28 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container font-bold text-xs mb-6 border border-primary/20">
              <span className="material-symbols-outlined text-[14px]">star</span>
              Fitur Unggulan
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-on-background leading-tight">
              Solusi Cerdas untuk<br/>
              <span className="text-primary italic font-serif">Infrastruktur</span> Modern
            </h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mt-4 leading-relaxed">
              Sistem terintegrasi yang dirancang khusus untuk mempercepat penanganan masalah fasilitas umum.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="group relative bg-white rounded-3xl p-8 border border-primary/10 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-400 overflow-hidden cursor-default"
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-5 transition-opacity duration-400 rounded-3xl`} />

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-3xl text-white icon-fill">{f.icon}</span>
                </div>

                {/* Number accent */}
                <p className="text-[10px] font-black text-primary/30 tracking-[0.3em] mb-2">0{i + 1}</p>

                <h3 className="text-xl font-black text-on-background mb-3">{f.title}</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">{f.desc}</p>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION ────────────────────────────────────────── */}
      <section className="py-28 px-6 md:px-12 bg-gradient-to-br from-[#fdf2f5] to-[#fff8fa]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container font-bold text-xs border border-primary/20">
              Tentang InfraTrack
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-on-background leading-tight">
              Dedikasi untuk<br/>
              <span className="text-primary italic font-serif">Publik</span> yang Lebih Baik
            </h2>
            <p className="text-on-surface-variant leading-relaxed text-lg">
              InfraTrack lahir dari kebutuhan akan sistem manajemen infrastruktur yang transparan, cepat, dan terukur.
              Seperti melodi Yorushika yang menyentuh, kami percaya bahwa setiap laporan dari masyarakat adalah langkah awal untuk kota yang lebih aman dan nyaman.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              Melalui pemanfaatan teknologi kecerdasan buatan (AI) dan pelacakan real-time, kami menjembatani komunikasi antara masyarakat dan pemerintah daerah.
            </p>

            <div className="flex gap-8 pt-4">
              {[
                { icon: 'groups', value: '100+', label: 'Petugas Lapangan' },
                { icon: 'thumb_up', value: 'Transparan', label: 'Lacak Prosesnya' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-container/30 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  </div>
                  <div>
                    <p className="font-black text-lg text-on-surface">{item.value}</p>
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-[3rem] transform translate-x-4 translate-y-4" />
            <img
              src="https://lh3.googleusercontent.com/d/1X7lQ7fy9QTVxc02bw63QtPvKQn6VflX_"
              alt="Tim Pekerja Infrastruktur"
              className="relative z-10 rounded-[3rem] shadow-2xl w-full h-[480px] object-cover border border-primary/10"
              referrerPolicy="no-referrer"
            />

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute z-20 -bottom-8 -left-8 bg-white rounded-2xl shadow-xl border border-primary/10 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined icon-fill">gavel</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">Respons Cepat</p>
                  <p className="text-xs text-on-surface-variant">Penanganan &lt; 24 Jam</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATISTICS SECTION ───────────────────────────────────── */}
      <section className="py-28 px-6 md:px-12 bg-on-background relative overflow-hidden">
        {/* Yorushika-inspired radial glow */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/15 rounded-full blur-3xl" />
        </div>

        {/* Japanese character decoration */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-white/5 text-[200px] font-black leading-none pointer-events-none select-none font-serif">
          春
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-white/5 text-[200px] font-black leading-none pointer-events-none select-none font-serif">
          夢
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary-container text-sm font-bold tracking-[0.3em] uppercase mb-2">Pencapaian Kami</p>
            <h2 className="text-4xl font-black text-white">Angka Berbicara</h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group text-center p-8 rounded-3xl border border-white/10 hover:bg-white/5 transition-colors"
              >
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors">
                  <span className="material-symbols-outlined text-primary-container icon-fill">{s.icon}</span>
                </div>
                <p className="text-5xl font-black text-white mb-2">{s.value}</p>
                <p className="text-sm font-bold text-white/50 uppercase tracking-widest">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────────── */}
      <section className="py-28 px-6 md:px-12 bg-gradient-to-br from-primary/5 via-white to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 text-primary/5 text-8xl font-black font-serif">花</div>
          <div className="absolute bottom-10 left-10 text-primary/5 text-8xl font-black font-serif">雨</div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <p className="text-primary/60 text-sm font-bold tracking-[0.3em] uppercase mb-4">Bergabunglah Sekarang</p>
          <h2 className="text-4xl md:text-5xl font-black text-on-background leading-tight mb-6">
            Jadilah Bagian dari<br/>
            <span className="text-primary italic font-serif">Perubahan</span>
          </h2>
          <p className="text-lg text-on-surface-variant mb-10 leading-relaxed">
            Seperti kelopak bunga sakura yang jatuh satu per satu membentuk hamparan keindahan — setiap laporan Anda adalah kontribusi nyata untuk kota yang lebih baik.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/layanan')}
              className="group relative inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-10 py-5 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden text-lg"
            >
              <span className="relative z-10">Mulai Laporan</span>
              <span className="material-symbols-outlined relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 border-2 border-primary/30 text-primary hover:bg-primary/5 font-bold px-10 py-5 rounded-full transition-all duration-300 hover:-translate-y-1 text-lg"
            >
              Portal Admin
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-on-background text-white py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg icon-fill">verified_user</span>
                </div>
                <span className="text-xl font-black tracking-tight">InfraTrack</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Platform manajemen infrastruktur terdepan untuk pemerintahan yang tanggap dan transparan.
              </p>
              <p className="text-[10px] text-primary/40 font-bold tracking-[0.2em]">春泥棒 — SPRING THIEF</p>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-x-12 gap-y-4 items-start">
              {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Kontak Kami', 'Pusat Bantuan'].map(link => (
                <a key={link} href="#" className="text-sm font-semibold text-white/50 hover:text-white transition-colors">
                  {link}
                </a>
              ))}
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-white/30 italic">
                © 2026 InfraTrack Systems.<br />All rights reserved.
              </p>
            </div>
          </div>

          {/* Bottom Yorushika tribute */}
          <div className="pt-8 flex items-center justify-center gap-3 opacity-20">
            {['♪', '春', '♫', '泥', '♩', '棒'].map((c, i) => (
              <span key={i} className="text-sm font-bold">{c}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
