import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  signIn,
  signInAdmin,
  extractUserRole,
  signOutCurrentUser,
} from '../lib/authService';

const YORUSHIKA_LYRICS = [
  { jp: '春の風に乗って', en: 'Riding the spring breeze' },
  { jp: '花びらが舞い落ちる', en: 'Petals drift and fall' },
  { jp: '君の声が聞こえる', en: 'I can hear your voice' },
  { jp: 'この瞬間が永遠になれば', en: 'If only this moment could last forever' },
];

function FloatingPetal({ style }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute pointer-events-none"
      style={style}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 0C60 30 100 50 100 50C100 50 60 70 50 100C40 70 0 50 0 50C0 50 40 30 50 0Z" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [lyricIndex] = useState(Math.floor(Math.random() * YORUSHIKA_LYRICS.length));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError('');

    try {
      const credentials = { email, password };
      let user;

      if (selectedRole === 'admin') {
        user = await signInAdmin(credentials);
      } else {
        user = await signIn(credentials);
        const userRole = extractUserRole(user);

        if (userRole !== selectedRole) {
          await signOutCurrentUser();
          throw new Error(
            `Akun ini memiliki role "${userRole}", bukan "${selectedRole}". Pastikan Anda memilih role yang benar.`
          );
        }
      }

      if (selectedRole === 'field_officer') {
        navigate('/dashboard/my-tasks');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { key: 'admin', label: 'Administrator', icon: 'admin_panel_settings', desc: 'Panel kontrol penuh' },
    { key: 'field_officer', label: 'Petugas Lapangan', icon: 'engineering', desc: 'Manajemen tugas lapangan' },
  ];

  // Generate petal positions (deterministic to avoid hydration issues)
  const petals = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${(i * 8.33) % 100}%`,
    top: `${(i * 13.7) % 100}%`,
    size: 10 + (i % 3) * 6,
    opacity: 0.04 + (i % 3) * 0.03,
    rotate: i * 30,
  }));

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden">

      {/* ── LEFT: Yorushika Visual Panel ─────────────────────────── */}
      <section className="hidden md:flex md:w-1/2 lg:w-[55%] relative bg-on-background overflow-hidden items-center justify-center">

        {/* Petals decoration */}
        {petals.map((p) => (
          <FloatingPetal
            key={p.id}
            style={{
              left: p.left,
              top: p.top,
              width: p.size + 'px',
              height: p.size + 'px',
              color: '#f8bbd0',
              opacity: p.opacity,
              transform: `rotate(${p.rotate}deg)`,
            }}
          />
        ))}

        {/* Glow blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        {/* Giant kanji */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[300px] font-black text-white/[0.02] font-serif leading-none">春</span>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md px-12 text-center flex flex-col items-center space-y-12">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/15 shadow-2xl">
              <span className="material-symbols-outlined text-5xl text-white icon-fill">engineering</span>
            </div>
            <div>
              <p className="text-4xl font-black text-white tracking-tighter">InfraTrack</p>
              <p className="text-[10px] text-white/40 font-bold tracking-[0.3em] mt-1">INFRASTRUCTURE MANAGEMENT</p>
            </div>
          </motion.div>

          {/* Yorushika lyric */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="space-y-3"
          >
            <div className="w-8 h-px bg-primary/40 mx-auto" />
            <p className="text-2xl text-white/90 font-serif leading-relaxed italic">
              {YORUSHIKA_LYRICS[lyricIndex].jp}
            </p>
            <p className="text-sm text-white/40 font-medium">
              {YORUSHIKA_LYRICS[lyricIndex].en}
            </p>
            <div className="w-8 h-px bg-primary/40 mx-auto" />
            <p className="text-[10px] text-primary/50 font-bold tracking-[0.3em]">— YORUSHIKA</p>
          </motion.div>

          {/* Feature bullets */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-4 text-left w-full"
          >
            {[
              { icon: 'shield_with_heart', text: 'Koneksi SSL Terenkripsi' },
              { icon: 'sync', text: 'Data Real-time dari Supabase' },
              { icon: 'smart_toy', text: 'Analisis AI Terintegrasi' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 opacity-60">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px] text-white">{item.icon}</span>
                </div>
                <span className="text-sm text-white/70 font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── RIGHT: Login Form ─────────────────────────────────────── */}
      <section className="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-center items-center px-6 md:px-12 bg-white relative min-h-screen">

        {/* Subtle petal background on form side */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-secondary/3 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-10 relative z-10"
        >
          {/* Back to landing */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Kembali ke Beranda
          </button>

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 md:hidden mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg icon-fill">verified_user</span>
              </div>
              <span className="text-xl font-black text-on-surface tracking-tight">InfraTrack</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-on-surface leading-tight">
              Masuk ke Portal
            </h1>
            <p className="text-on-surface-variant leading-relaxed">
              Silakan masukkan kredensial resmi Anda untuk mengakses panel kendali infrastruktur.
            </p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((role) => (
              <motion.button
                key={role.key}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedRole(role.key); setAuthError(''); }}
                className={`py-4 px-4 rounded-2xl text-left transition-all border-2 ${
                  selectedRole === role.key
                    ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:border-primary/30 hover:bg-white'
                }`}
              >
                <span className={`material-symbols-outlined text-2xl block mb-2 ${selectedRole === role.key ? 'text-on-primary' : 'text-primary'}`}>
                  {role.icon}
                </span>
                <p className="font-bold text-sm">{role.label}</p>
                <p className={`text-[11px] mt-0.5 ${selectedRole === role.key ? 'text-on-primary/70' : 'text-on-surface-variant/70'}`}>
                  {role.desc}
                </p>
              </motion.button>
            ))}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-error/20 bg-error-container/20 px-4 py-3.5 text-sm text-error font-medium flex items-start gap-3"
              >
                <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">warning</span>
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px]">mail</span>
                Alamat Email
              </label>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl px-5 py-4 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-sm"
                  placeholder="petugas@infratrack.id"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px]">lock</span>
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl px-5 py-4 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium pr-14 text-sm"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="relative w-full bg-primary text-on-primary font-black text-base py-5 rounded-2xl shadow-xl shadow-primary/20 hover:brightness-90 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    MEMPROSES...
                  </>
                ) : (
                  <>
                    MASUK SISTEM
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">login</span>
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Public service link */}
          <div className="text-center pt-4 border-t border-outline-variant/15">
            <p className="text-sm text-on-surface-variant">
              Ingin melaporkan kerusakan?{' '}
              <button
                onClick={() => navigate('/layanan')}
                className="text-primary font-black hover:underline"
              >
                Klik di sini
              </button>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
