import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  signIn,
  signInAdmin,
  extractUserRole,
  signOutCurrentUser,
} from '../lib/authService';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState('admin');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState('');

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

            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setAuthError(error.message || 'Login gagal. Periksa email dan password Anda.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleOptions = [
        { key: 'admin', label: '👤 Admin', icon: 'admin_panel_settings' },
        { key: 'field_officer', label: '🚗 Petugas', icon: 'engineering' },
    ];

    return (
        <main className="min-h-screen w-full flex flex-col md:flex-row">
            {/* Left: Login Form */}
            <section className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 bg-white relative z-10 min-h-screen">
                <div className="w-full max-w-md space-y-12">
                    <div className="flex flex-col items-center md:items-start space-y-6">
                        <div 
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <span className="material-symbols-outlined text-4xl text-primary p-2 bg-surface-container-low rounded-2xl group-hover:scale-110 transition-transform">verified_user</span>
                            <span className="text-3xl font-black text-primary tracking-tighter">InfraTrack</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-black text-on-surface">Masuk ke Portal</h1>
                            <p className="text-on-surface-variant leading-relaxed">Silakan masukkan kredensial resmi Anda untuk mengakses panel kendali infrastruktur.</p>
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div className="grid grid-cols-2 gap-3">
                        {roleOptions.map((role) => (
                            <button
                                key={role.key}
                                type="button"
                                onClick={() => { setSelectedRole(role.key); setAuthError(''); }}
                                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${
                                    selectedRole === role.key
                                        ? 'bg-primary text-on-primary border-primary shadow-lg'
                                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                                }`}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>

                    {authError && (
                        <div className="rounded-xl border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error font-medium">
                            {authError}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">mail</span> Alamat Email / ID Petugas
                            </label>
                            <input 
                                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 py-4 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" 
                                placeholder="petugas@infratrack.id" 
                                required 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">lock</span> Kata Sandi
                            </label>
                            <div className="relative">
                                <input 
                                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 py-4 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium pr-14" 
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

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-lg py-5 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'MEMPROSES...' : 'MASUK SISTEM'}
                        </button>
                    </form>

                    <div className="text-center pt-8 border-t border-outline-variant/30">
                        <p className="text-sm text-on-surface-variant font-medium">
                            Ingin melaporkan kerusakan?{' '}
                            <button onClick={() => navigate('/layanan')} className="text-primary font-black hover:underline">
                                Klik di sini
                            </button>
                        </p>
                    </div>
                </div>
            </section>

            {/* Right: Decorative Panel */}
            <section className="hidden md:flex w-1/2 relative bg-inverse-surface overflow-hidden items-center justify-center p-12 lg:p-24">
                <div 
                    className="absolute inset-0 opacity-40 bg-cover bg-center grayscale"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1545146591-a02e6019aa2a?auto=format&fit=crop&q=80&w=1200')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/95 to-on-primary-fixed-variant/90 backdrop-blur-[1px]"></div>
                
                <div className="relative z-10 max-w-md text-center flex flex-col items-center space-y-10">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 rounded-[32px] bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl"
                    >
                        <span className="material-symbols-outlined text-5xl text-on-primary icon-fill">engineering</span>
                    </motion.div>
                    <div className="space-y-6">
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter">
                            Selamat Datang Kembali,<br/>
                            <span className="text-secondary-fixed italic underline decoration-secondary-fixed/30 text-3xl lg:text-4xl">Pahlawan Infrastruktur!</span>
                        </h2>
                        <p className="text-lg text-white/70 font-medium leading-relaxed">
                            Platform pengawasan dan manajemen aset sipil terpadu. Pastikan keamanan dan keandalan struktur demi masa depan kota.
                        </p>
                    </div>
                    <div className="flex gap-8 pt-8 opacity-60">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary-container">shield_with_heart</span>
                            <span className="text-xs font-black uppercase tracking-widest text-on-primary">Koneksi Aman</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary-container">sync</span>
                            <span className="text-xs font-black uppercase tracking-widest text-on-primary">Real-time Data</span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
