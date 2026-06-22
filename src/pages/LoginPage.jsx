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
      <section className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e0f16 0%, #2d1520 100%)' }}>

        {/* Petals decoration */}
        {petals.map((p) => (
          <motion.div
            key={p.id}
            animate={{ 
              y: [0, -30, 0], 
              rotate: [p.rotate, p.rotate + 45, p.rotate - 45, p.rotate],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 6 + (p.id % 4), repeat: Infinity, ease: "easeInOut" }}
            className="absolute pointer-events-none text-[#ce8093]"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              opacity: p.opacity * 2,
            }}
          >
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 0C60 30 100 50 100 50C100 50 60 70 50 100C40 70 0 50 0 50C0 50 40 30 50 0Z" />
            </svg>
          </motion.div>
        ))}

        {/* Glow blobs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3], rotate: [0, 90, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-[#e8a0b0]/10 rounded-full blur-[100px] pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-[#8c3a56]/15 rounded-full blur-[120px] pointer-events-none" 
        />

        {/* Content */}
        <div className="relative z-10 max-w-md px-12 text-center flex flex-col items-center space-y-12">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div 
              animate={{ y: [0, -15, 0], dropShadow: ["0px 0px 0px rgba(232,160,176,0)", "0px 10px 20px rgba(232,160,176,0.3)", "0px 0px 0px rgba(232,160,176,0)"] }} 
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 flex items-center justify-center group hover:scale-105 transition-transform duration-500"
            >
              <img src="/yorushika-logo.png" alt="Logo" className="w-full h-full object-contain" />
            </motion.div>
            <div>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tighter">InfraTrack</p>
              <p className="text-[10px] text-[#e8a0b0]/60 font-bold tracking-[0.4em] mt-2">INFRASTRUCTURE MANAGEMENT</p>
            </div>
          </motion.div>

          {/* Yorushika lyric */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="space-y-3 relative"
          >
            <motion.div 
              animate={{ opacity: [0.3, 0.8, 0.3], width: ['2rem', '5rem', '2rem'] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="h-px bg-primary/60 mx-auto" 
            />
            <p className="text-2xl text-white/90 font-serif leading-relaxed italic">
              {YORUSHIKA_LYRICS[lyricIndex].jp}
            </p>
            <p className="text-sm text-white/40 font-medium">
              {YORUSHIKA_LYRICS[lyricIndex].en}
            </p>
            <motion.div 
              animate={{ opacity: [0.3, 0.8, 0.3], width: ['2rem', '5rem', '2rem'] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="h-px bg-primary/60 mx-auto" 
            />
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
          <motion.div 
            animate={{ y: [0, 40, 0], x: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-20 -right-20 w-80 h-80 bg-[#f9bbd0]/30 rounded-full blur-3xl" 
          />
          <motion.div 
            animate={{ y: [0, -50, 0], x: [0, 40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#ce8093]/20 rounded-full blur-3xl" 
          />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } }
          }}
          className="w-full max-w-md space-y-8 relative z-10"
        >
          {/* Back to landing */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors group mb-4"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Kembali ke Beranda
            </button>
          </motion.div>

          {/* Header */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="space-y-3">
            <div className="flex items-center gap-2 md:hidden mb-4">
              <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center overflow-hidden">
                <img src="/yorushika-logo.png" alt="Logo" className="w-full h-full object-contain" style={{ filter: 'invert(1)' }} />
              </div>
              <span className="text-xl font-black text-on-surface tracking-tight">InfraTrack</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-[#ce8093] leading-tight">
              Masuk ke Portal
            </h1>
            <p className="text-on-surface-variant leading-relaxed">
              Silakan masukkan kredensial resmi Anda untuk mengakses panel kendali infrastruktur.
            </p>
          </motion.div>

          {/* Role Selector */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-2 gap-4">
            {roleOptions.map((role) => (
              <motion.button
                key={role.key}
                type="button"
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -2 }}
                onClick={() => { setSelectedRole(role.key); setAuthError(''); }}
                className={`relative py-5 px-5 rounded-[2rem] text-left overflow-hidden transition-all duration-300 ${
                  selectedRole === role.key
                    ? 'shadow-xl shadow-primary/20'
                    : 'bg-[#fdf8f8] hover:bg-white hover:shadow-md'
                }`}
              >
                {/* Active Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br from-primary to-primary-container transition-opacity duration-300 ${selectedRole === role.key ? 'opacity-100' : 'opacity-0'}`} />
                
                <div className="relative z-10">
                  <span className={`material-symbols-outlined text-3xl block mb-3 transition-colors duration-300 ${selectedRole === role.key ? 'text-white' : 'text-primary/70'}`}>
                    {role.icon}
                  </span>
                  <p className={`font-black text-sm tracking-tight transition-colors duration-300 ${selectedRole === role.key ? 'text-white' : 'text-on-surface'}`}>{role.label}</p>
                  <p className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${selectedRole === role.key ? 'text-white/70' : 'text-on-surface-variant/60'}`}>
                    {role.desc}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Error Message */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="rounded-2xl border border-error/20 bg-error-container/20 px-4 py-3.5 text-sm text-error font-medium flex items-start gap-3 overflow-hidden"
                >
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">warning</span>
                  {authError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <motion.div variants={{ hidden: { opacity: 0, x: -15 }, visible: { opacity: 1, x: 0 } }} className="space-y-1.5">
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
            </motion.div>

            {/* Password */}
            <motion.div variants={{ hidden: { opacity: 0, x: 15 }, visible: { opacity: 1, x: 0 } }} className="space-y-1.5">
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
            </motion.div>

            {/* Submit */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.98 }}
                className="relative w-full bg-gradient-to-r from-[#ce8093] to-[#8c3a56] text-white font-black text-base py-5 rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group mt-4"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
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
            </motion.div>
          </form>

          {/* Public service link */}
          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-center pt-6 border-t border-outline-variant/15">
            <p className="text-sm text-on-surface-variant">
              Ingin melaporkan kerusakan?{' '}
              <button
                onClick={() => navigate('/layanan')}
                className="text-primary font-black hover:underline"
              >
                Klik di sini
              </button>
            </p>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
