import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen w-full flex flex-col md:flex-row">
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

                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">mail</span> Alamat Email / ID Petugas
                            </label>
                            <input 
                                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 py-4 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium" 
                                placeholder="petugas@infratrack.id" 
                                required 
                                type="email" 
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
                                    type="password" 
                                />
                                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">visibility</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 rounded-lg border-outline-variant text-primary focus:ring-primary/10 transition-all bg-surface-container-low" />
                                <span className="text-on-surface-variant font-bold group-hover:text-primary">Ingat Sesi Saya</span>
                            </label>
                            <a href="#" className="font-black text-primary hover:underline">Lupa Kata Sandi?</a>
                        </div>

                        <button className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-lg py-5 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95">
                            MASUK SISTEM
                        </button>
                    </form>

                    <div className="text-center pt-8 border-t border-outline-variant/30">
                        <p className="text-sm text-on-surface-variant font-medium">
                            Mengalami kendala teknis? <a href="#" className="text-primary font-black hover:underline">Hubungi Pusat Bantuan IT</a>
                        </p>
                    </div>
                </div>
            </section>

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
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter">Selamat Datang Kembali,<br/><span className="text-secondary-fixed italic underline decoration-secondary-fixed/30 text-3xl lg:text-4xl">Pahlawan Infrastruktur!</span></h2>
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
};

export default LoginPage;
