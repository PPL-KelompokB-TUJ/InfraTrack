import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, animate, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

function AnimatedLetters({ text, delayOffset = 0 }) {
  return (
    <>
      {Array.from(text).map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: index * 0.04 + delayOffset, duration: 0.4 }}
        >
          {char}
        </motion.span>
      ))}
    </>
  );
}

function CountUp({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  
  useEffect(() => {
    if (!inView) return;
    
    const hasK = value.includes('K');
    const hasPlus = value.includes('+');
    const hasPercent = value.includes('%');
    const hasSlash = value.includes('/7');
    
    const numMatch = value.match(/[\d.]+/);
    if (!numMatch) {
      if (ref.current) ref.current.textContent = value;
      return;
    }
    const target = parseFloat(numMatch[0]);
    const isDecimal = target % 1 !== 0;
    
    const controls = animate(0, target, {
      duration: 2.5,
      ease: "easeOut",
      onUpdate(v) {
        if (ref.current) {
          let formatted = isDecimal ? v.toFixed(1) : Math.round(v).toString();
          if (hasK) formatted += 'K';
          if (hasPlus) formatted += '+';
          if (hasPercent) formatted += '%';
          if (hasSlash) formatted += '/7';
          ref.current.textContent = formatted;
        }
      }
    });
    return controls.stop;
  }, [value, inView]);

  return <span ref={ref}>0</span>;
}

function FadeSection({ children, className, style }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className={`relative ${className || ''}`} style={style}>
      <motion.div style={{ y, opacity }} className="w-full h-full relative z-10">
        {children}
      </motion.div>
    </section>
  );
}

function YorushikaMarquee({ reverse = false, fadeColor = "#fdf8f8", theme = "light" }) {
  const x = reverse ? ["-50%", "0%"] : ["0%", "-50%"];
  const isDark = theme === "dark";
  const textColor = isDark ? "text-white/30" : "text-primary/30";
  const subTextColor = isDark ? "text-white/40" : "text-primary/40";
  const iconColor = isDark ? "text-white/20" : "text-primary/20";
  
  return (
    <section className={`py-6 border-y ${isDark ? 'border-white/5' : 'border-primary/5'} overflow-hidden relative`} style={{ background: `linear-gradient(90deg, rgba(253,248,248,0) 0%, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(206,128,147,0.03)'} 50%, rgba(253,248,248,0) 100%)` }}>
      <div className="absolute inset-y-0 left-0 w-32 z-10" style={{ background: `linear-gradient(to right, ${fadeColor}, transparent)` }} />
      <div className="absolute inset-y-0 right-0 w-32 z-10" style={{ background: `linear-gradient(to left, ${fadeColor}, transparent)` }} />
      
      <motion.div 
        className="flex gap-12 items-center whitespace-nowrap w-max"
        animate={{ x }}
        transition={{ ease: "linear", duration: 40, repeat: Infinity }}
      >
        {[...YORUSHIKA_QUOTES, ...YORUSHIKA_QUOTES, ...YORUSHIKA_QUOTES, ...YORUSHIKA_QUOTES, ...YORUSHIKA_QUOTES].map((q, i) => (
          <div key={i} className="flex items-center gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
            <div className="text-center">
              <p className={`text-xl md:text-2xl font-black ${textColor} leading-none font-serif`}>{q.text}</p>
              <p className={`text-[8px] md:text-[9px] ${subTextColor} mt-1 tracking-[0.4em] uppercase`}>{q.romanji}</p>
            </div>
            <span className={`text-sm ${iconColor}`}>🌸</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

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

function CherryBlossomDecor({ scrollYProgress }) {
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '80%']);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-80%']);
  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Parallax soft blobs */}
      <motion.div style={{ y: y1 }} className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <motion.div style={{ y: y2 }} className="absolute -bottom-40 -left-20 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
      <motion.div style={{ y: y3 }} className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-primary-container/10 rounded-full blur-2xl" />

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
      <YorushikaMusicPlayer />
      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <header ref={heroRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <CherryBlossomDecor scrollYProgress={scrollYProgress} />

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
              <motion.span 
                animate={{ 
                  color: ['#ce8093', '#8c3a56', '#ce8093'],
                  textShadow: ['0px 0px 0px rgba(206,128,147,0)', '0px 0px 8px rgba(206,128,147,0.5)', '0px 0px 0px rgba(206,128,147,0)']
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xs font-bold text-primary tracking-[0.2em] uppercase"
              >
                Haru — 春 — Spring
              </motion.span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-black text-on-background leading-[1.05] tracking-tighter"
            >
              {Array.from("Membangun ").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
                >
                  {char}
                </motion.span>
              ))}
              <span className="relative inline-block">
                <span className="text-primary italic font-serif">Kota</span>
                {/* Animated underline brush stroke */}
                <motion.svg 
                  initial={{ pathLength: 0 }} 
                  animate={{ pathLength: 1 }} 
                  transition={{ duration: 1, delay: 1, ease: "easeOut" }}
                  className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none"
                >
                  <motion.path d="M0 6 Q50 2 100 5 Q150 8 200 4" stroke="#805062" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
                </motion.svg>
              </span>
              <br />
              {Array.from("yang Lebih Baik").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.8, duration: 0.5 }}
                >
                  {char}
                </motion.span>
              ))}
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
                className="group relative inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-8 py-4 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-visible"
              >
                {/* Animated ripple ping */}
                <span className="absolute inset-0 rounded-full border-2 border-primary/50 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none" />
                <span className="relative z-10">Buat Laporan</span>
                <span className="material-symbols-outlined text-lg relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                <div className="absolute inset-0 bg-white/10 rounded-full translate-y-full group-hover:translate-y-0 transition-transform duration-300 overflow-hidden" />
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
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl h-[520px] border border-white/50 group">
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                alt="Smart City"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/d/1X7lQ7fy9QTVxc02bw63QtPvKQn6VflX_"
                referrerPolicy="no-referrer"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2d0f1a]/90 via-[#2d0f1a]/20 to-transparent pointer-events-none" />

              {/* Bottom info strip */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-0 left-0 right-0 p-6"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl hover:bg-white/20 transition-colors duration-500">
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
              </motion.div>
            </div>

            {/* Floating Yorushika lyric card */}
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-8 top-12 bg-white/90 backdrop-blur-md rounded-[2rem] shadow-2xl border border-white/60 p-5 max-w-[200px] hover:scale-105 transition-transform"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-sm">music_note</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary leading-none mb-1 font-serif">春泥棒</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Haru Dorobou</p>
                  <p className="text-[9px] text-on-surface-variant/60 italic mt-1 leading-tight">Mencuri musim semi, membawa harapan baru.</p>
                </div>
              </div>
            </motion.div>

            {/* Floating stat card */}
            <motion.div
              animate={{ y: [0, 10, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -right-6 bottom-32 bg-white/90 backdrop-blur-md rounded-[2rem] shadow-2xl border border-white/60 p-5 hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 bg-gradient-to-br from-[#e8a0b0] to-[#8c3a56] rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30"
                >
                  <span className="material-symbols-outlined text-white icon-fill">bolt</span>
                </motion.div>
                <div>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-0.5">Respons</p>
                  <p className="text-lg font-black text-on-surface">&lt; 24 Jam</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </header>

      {/* ── YORUSHIKA INTERLUDE 1 ───────────────────────────────────── */}
      <YorushikaMarquee fadeColor="#fdf8f8" />

      {/* ── FEATURES SECTION ─────────────────────────────────────── */}
      <FadeSection className="py-28 px-6 md:px-12">
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
              <AnimatedLetters text="Solusi Cerdas untuk" delayOffset={0.2} /><br/>
              <span className="text-primary italic font-serif">Infrastruktur</span> <AnimatedLetters text="Modern" delayOffset={0.8} />
            </h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mt-4 leading-relaxed">
              Sistem terintegrasi yang dirancang khusus untuk mempercepat penanganan masalah fasilitas umum.
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-16 md:gap-12 relative">
            {/* Background floating abstract shapes to replace boxes */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
            
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.8, ease: "easeOut" }}
                className="relative flex-1 group text-center md:text-left"
              >
                {/* Organic huge number instead of boxes */}
                <motion.div 
                  animate={{ y: [0, -15, 0], rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-12 -left-4 md:-left-8 text-[140px] font-black text-primary/5 pointer-events-none select-none font-serif transition-transform group-hover:scale-105 duration-700"
                >
                  {i + 1}
                </motion.div>
                
                <div className={`w-20 h-20 rounded-[2rem] bg-gradient-to-br ${f.accent} flex items-center justify-center mb-8 shadow-xl shadow-primary/20 group-hover:-translate-y-2 group-hover:rotate-6 transition-all duration-500 relative z-10 mx-auto md:mx-0`}>
                  <span className="material-symbols-outlined text-4xl text-white icon-fill">{f.icon}</span>
                </div>

                <h3 className="text-2xl font-black text-on-background mb-4 relative z-10 tracking-tight">{f.title}</h3>
                <p className="text-on-surface-variant leading-relaxed text-base relative z-10">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── ABOUT SECTION ────────────────────────────────────────── */}
      <FadeSection className="py-28 px-6 md:px-12 bg-gradient-to-br from-[#fdf2f5] to-[#fff8fa]">
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
              <AnimatedLetters text="Dedikasi untuk" delayOffset={0.2} /><br/>
              <span className="text-primary italic font-serif">Publik</span> <AnimatedLetters text="yang Lebih Baik" delayOffset={0.7} />
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
              src="https://lh3.googleusercontent.com/d/17V6O371r_4SKPz3Dx1Oz4TqxwbBwCxbY"
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
      </FadeSection>

      {/* ── YORUSHIKA INTERLUDE 3 ───────────────────────────────────── */}
      <YorushikaMarquee reverse={true} fadeColor="#fff8fa" />

      {/* ── STATISTICS SECTION ───────────────────────────────────── */}
      <FadeSection className="py-32 px-6 md:px-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e0f16 0%, #2d1520 100%)' }}>
        {/* Yorushika-inspired radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ce8093]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8c3a56]/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-[#e8a0b0] text-sm font-bold tracking-[0.4em] uppercase mb-3">Pencapaian Kami</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              <AnimatedLetters text="Angka Berbicara" delayOffset={0.2} />
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.8, ease: "easeOut" }}
                className="group relative text-center flex-1"
              >
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-32 h-32 bg-[#ce8093]/0 rounded-full blur-2xl group-hover:bg-[#ce8093]/20 transition-all duration-700" />
                <p className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-[#e8a0b0] mb-4 relative z-10 drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
                  <CountUp value={s.value} />
                </p>
                <p className="text-sm font-bold text-white/60 uppercase tracking-widest relative z-10">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── YORUSHIKA INTERLUDE 4 ───────────────────────────────────── */}
      <YorushikaMarquee fadeColor="#1e0f16" theme="dark" />

      {/* ── CTA SECTION ──────────────────────────────────────────── */}
      <FadeSection className="py-28 px-6 md:px-12 bg-gradient-to-br from-primary/5 via-white to-secondary/5 overflow-hidden">
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
            <AnimatedLetters text="Jadilah Bagian dari" delayOffset={0.2} /><br/>
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
      </FadeSection>

      {/* ── YORUSHIKA INTERLUDE 5 ───────────────────────────────────── */}
      <YorushikaMarquee reverse={true} fadeColor="#fdf8f8" />

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-on-background text-white py-16 px-6 md:px-12 overflow-hidden">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
          className="max-w-7xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
            <motion.div variants={itemVariants} className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2 group cursor-pointer">
                <motion.div whileHover={{ rotate: 15 }} className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center transition-colors overflow-hidden">
                  <img src="/yorushika-logo.png" alt="Logo" className="w-full h-full object-contain" />
                </motion.div>
                <span className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">InfraTrack</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Platform manajemen infrastruktur terdepan untuk pemerintahan yang tanggap dan transparan.
              </p>
              <p className="text-[10px] text-primary/40 font-bold tracking-[0.2em]">春泥棒 — SPRING THIEF</p>
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-2 flex flex-wrap gap-x-12 gap-y-4 items-start">
              {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Kontak Kami', 'Pusat Bantuan'].map(link => (
                <motion.a 
                  key={link} 
                  href="#" 
                  whileHover={{ x: 5, color: '#e8a0b0' }}
                  className="text-sm font-semibold text-white/50 transition-colors"
                >
                  {link}
                </motion.a>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="text-left md:text-right">
              <p className="text-sm text-white/30 italic">
                © 2026 InfraTrack Systems.<br />All rights reserved.
              </p>
            </motion.div>
          </div>

          {/* Bottom Yorushika tribute */}
          <motion.div variants={itemVariants} className="pt-8 flex items-center justify-center gap-4 opacity-20">
            {['♪', '春', '♫', '泥', '♩', '棒'].map((c, i) => (
              <motion.span 
                key={i} 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                className="text-sm font-bold"
              >
                {c}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </footer>
    </div>
  );
}

function YorushikaMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef(null);

  const playlist = ['/track1.mp3', '/track2.mp3'];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
    }
  }, []);

  const handleEnded = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
    }
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <audio 
        ref={audioRef} 
        src={playlist[currentTrackIndex]} 
        onEnded={handleEnded}
      />
      <div className={`transition-all duration-500 overflow-hidden bg-white/80 backdrop-blur-md rounded-full px-4 py-2 border border-primary/20 shadow-lg flex flex-col justify-center ${isPlaying ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
        <p className="text-[10px] font-bold text-primary tracking-widest uppercase mb-0.5">Sedang Memutar ({currentTrackIndex + 1}/2)</p>
        <p className="text-xs font-serif text-on-surface whitespace-nowrap">Yorushika — 春泥棒</p>
      </div>
      <button 
        onClick={togglePlay}
        className="w-12 h-12 bg-gradient-to-br from-[#ce8093] to-[#8c3a56] rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300 relative group"
      >
        {isPlaying && <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-50" />}
        <span className="material-symbols-outlined icon-fill">
          {isPlaying ? 'pause' : 'music_note'}
        </span>
      </button>
    </div>
  );
}
