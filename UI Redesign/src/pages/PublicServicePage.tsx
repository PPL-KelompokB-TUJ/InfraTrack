import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

const PublicServicePage: React.FC = () => {
    const [ticketId, setTicketId] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const timeline = [
        { status: 'Menunggu', desc: 'Laporan diterima dan sedang diverifikasi sistem.', date: '12 Okt 2024, 09:15', current: false, completed: true },
        { status: 'Diproses', desc: 'Tim teknis sedang melakukan pengecekan lapangan.', date: '13 Okt 2024, 14:30', current: true, completed: false },
        { status: 'Selesai', desc: 'Perbaikan telah rampung dilaksanakan.', date: '', current: false, completed: false },
    ];

    return (
        <main className="flex-grow pt-28 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-on-surface tracking-tight">Pusat Layanan Publik</h1>
                    <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">Laporkan kerusakan infrastruktur fasilitas umum di sekitar Anda untuk penanganan cepat.</p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/30 overflow-hidden relative"
                >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl font-bold text-on-surface mb-8 border-b border-outline-variant/30 pb-4">Form Laporan Kerusakan</h2>
                        <form className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">person</span> Nama Lengkap
                                    </label>
                                    <input 
                                        className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-5 py-3.5 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                                        placeholder="Contoh: John Doe" 
                                        type="text" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">contact_mail</span> Info Kontak
                                    </label>
                                    <input 
                                        className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-5 py-3.5 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                                        placeholder="Email atau No. HP" 
                                        type="text" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Kategori Kerusakan</label>
                                <div className="relative">
                                    <select className="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-low px-5 py-3.5 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer">
                                        <option disabled selected value="">Pilih kategori infrastruktur</option>
                                        <option value="jalan">Jalan Rusak / Berlubang</option>
                                        <option value="penerangan">Penerangan Jalan Umum</option>
                                        <option value="drainase">Saluran Air / Drainase</option>
                                        <option value="fasilitas">Fasilitas Publik Lainnya</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Lokasi Kejadian</label>
                                <div className="w-full h-72 rounded-2xl bg-surface-container-low border border-outline-variant/50 flex flex-col items-center justify-center relative overflow-hidden group cursor-crosshair">
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
                                    <div className="z-10 flex flex-col items-center gap-3">
                                        <div className="bg-white/90 backdrop-blur shadow-lg px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant/30 group-hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined text-primary text-[20px] icon-fill">location_on</span>
                                            <span className="text-sm font-bold">Klik untuk Pilih Lokasi</span>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 right-4 text-[10px] bg-white/50 px-2 py-1 rounded text-outline font-black tracking-tighter">MAP_PLACEHOLDER_v2.1</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Deskripsi Detail</label>
                                <textarea 
                                    className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-5 py-4 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none min-h-[120px]" 
                                    placeholder="Jelaskan kondisi kerusakan secara detail..."
                                ></textarea>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Bukti Foto</label>
                                <div className="w-full rounded-2xl border-2 border-dashed border-outline-variant bg-surface-bright flex flex-col items-center justify-center p-12 hover:bg-surface-container hover:border-primary/50 transition-all cursor-pointer group">
                                    <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6 shadow-inner group-hover:bg-primary-fixed transition-colors">
                                        <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform">cloud_upload</span>
                                    </div>
                                    <p className="text-lg font-bold text-on-surface mb-1">Tarik & lepas foto di sini</p>
                                    <p className="text-sm text-on-surface-variant">atau klik untuk menelusuri file (Maks. 10MB)</p>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-lg py-5 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95">
                                    KIRIM LAPORAN
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>

            <aside className="lg:col-span-4 space-y-8">
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-sm space-y-8 sticky top-28">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-on-surface flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary p-2 bg-surface-container-low rounded-xl">search</span>
                            Lacak Laporan
                        </h2>
                        <p className="text-sm text-on-surface-variant leading-relaxed">Masukkan Kode Tiket yang Anda terima untuk memantau status.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <input 
                                value={ticketId}
                                onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                                className="w-full rounded-xl border border-outline-variant bg-surface-bright pl-5 pr-14 py-4 focus:bg-white focus:border-primary outline-none transition-all font-bold tracking-widest uppercase placeholder:font-normal placeholder:tracking-normal" 
                                placeholder="TKT-2024-XXXX" 
                                type="text" 
                            />
                            <button 
                                onClick={() => setIsSearching(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors shadow-md active:scale-90"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 space-y-8">
                        <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-white">
                            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status Saat Ini</span>
                            <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-lg border border-primary/20">TKT-2024-8821</span>
                        </div>

                        <div className="relative pl-8 space-y-10">
                            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-outline-variant/40"></div>
                            
                            {timeline.map((t, i) => (
                                <div key={t.status} className="relative">
                                    <div className={cn(
                                        "absolute -left-8 top-1 w-8 h-8 rounded-full border-4 border-surface-container-low flex items-center justify-center z-10",
                                        t.completed ? "bg-primary text-on-primary" : t.current ? "bg-white border-primary" : "bg-outline-variant/30"
                                    )}>
                                        {t.completed ? (
                                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                                        ) : t.current ? (
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-outline-variant/50"></div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className={cn("text-xs font-black uppercase tracking-widest", t.current ? "text-primary" : t.completed ? "text-on-surface" : "text-outline")}>
                                            {t.status}
                                        </h3>
                                        <p className="text-xs text-on-surface-variant leading-relaxed">{t.desc}</p>
                                        {t.date && <p className="text-[10px] text-outline font-bold mt-2 italic">Diterima pada: {t.date}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </main>
    );
};

export default PublicServicePage;
