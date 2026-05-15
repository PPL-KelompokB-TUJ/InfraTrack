import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function LandingPage() {
    const navigate = useNavigate();

    const stats = [
        { value: '15.4K+', label: 'Laporan Diselesaikan' },
        { value: '42', label: 'Kota Terintegrasi' },
        { value: '24/7', label: 'Pemantauan Aktif' },
        { value: '98%', label: 'Tingkat Kepuasan' },
    ];

    const features = [
        {
            title: 'Pelaporan Instan',
            desc: 'Laporkan kerusakan jalan, fasilitas umum, atau masalah infrastruktur lainnya hanya dengan mengunggah foto dan lokasi.',
            icon: 'add_a_photo',
            accent: 'bg-secondary'
        },
        {
            title: 'Analisis AI',
            desc: 'Sistem kecerdasan buatan kami secara otomatis mengkategorikan, menilai tingkat keparahan, dan mendistribusikan laporan.',
            icon: 'smart_toy',
            accent: 'bg-primary-container'
        },
        {
            title: 'Pelacakan Real-time',
            desc: 'Pantau progres perbaikan infrastruktur yang Anda laporkan secara real-time. Dapatkan notifikasi transparan.',
            icon: 'timeline',
            accent: 'bg-secondary-container'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <header className="pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[85vh]">
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                >
                    <h1 className="text-5xl md:text-6xl font-black text-on-background leading-tight tracking-tight">
                        Membangun Masa Depan <span className="text-primary italic">Infrastruktur</span> yang Lebih Baik
                    </h1>
                    <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
                        Platform cerdas untuk pelaporan, pemantauan, dan pemeliharaan infrastruktur publik. Laporkan masalah dengan mudah, pantau perbaikan secara real-time.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <button 
                            onClick={() => navigate('/layanan')}
                            className="bg-gradient-to-b from-primary-container to-primary text-on-primary font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
                        >
                            Buat Laporan
                        </button>
                        <button 
                            onClick={() => navigate('/layanan')}
                            className="border-2 border-primary text-primary hover:bg-surface-container-high/50 font-bold px-10 py-4 rounded-full transition-all duration-300 hover:-translate-y-1"
                        >
                            Lacak Laporan
                        </button>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px] border border-outline-variant/30"
                >
                    <img 
                        alt="Smart City" 
                        className="w-full h-full object-cover"
                        src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=1200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-transparent to-transparent flex items-end p-8">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl w-full flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-secondary-fixed mb-1">Status Sistem</p>
                                <p className="text-xl font-bold text-white">Pemantauan Aktif Seluruh Sektor</p>
                            </div>
                            <div className="w-12 h-12 bg-secondary-fixed/20 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-secondary-fixed animate-pulse icon-fill">radar</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Features Section */}
            <section className="py-24 bg-surface-container-low px-6 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-on-background">Solusi Cerdas untuk Infrastruktur</h2>
                        <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">Sistem terintegrasi yang dirancang khusus untuk mempercepat penanganan masalah fasilitas umum.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <motion.div 
                                key={f.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group"
                            >
                                <div className={cn("absolute top-0 left-0 w-1.5 h-full", f.accent)}></div>
                                <div className="w-16 h-16 bg-surface-bright rounded-2xl flex items-center justify-center mb-8 text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                    <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold text-on-background mb-4">{f.title}</h3>
                                <p className="text-on-surface-variant leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-24 px-6 md:px-8 bg-inverse-surface text-on-primary relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-on-background to-on-background"></div>
                <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                    {stats.map((s) => (
                        <div key={s.label} className="space-y-3">
                            <motion.p 
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                className="text-5xl font-black text-secondary-fixed"
                            >
                                {s.value}
                            </motion.p>
                            <p className="text-sm font-bold uppercase tracking-widest text-surface-variant opacity-70">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-surface-container-lowest py-16 px-6 md:px-8 border-t border-outline-variant/30">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24">
                    <div className="md:col-span-1 space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl text-outline-variant">verified_user</span>
                            <span className="text-2xl font-bold text-on-surface">InfraTrack</span>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                            Platform manajemen infrastruktur terdepan untuk pemerintahan yang tanggap dan transparan.
                        </p>
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-8 justify-start md:justify-center items-start">
                        <a href="#" className="font-bold text-sm text-on-surface-variant hover:text-primary transition-colors">Kebijakan Privasi</a>
                        <a href="#" className="font-bold text-sm text-on-surface-variant hover:text-primary transition-colors">Syarat & Ketentuan</a>
                        <a href="#" className="font-bold text-sm text-on-surface-variant hover:text-primary transition-colors">Kontak Kami</a>
                        <a href="#" className="font-bold text-sm text-on-surface-variant hover:text-primary transition-colors">Pusat Bantuan</a>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-sm font-medium text-on-surface-variant/60 italic">
                            &copy; 2026 InfraTrack Systems.<br/>All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
