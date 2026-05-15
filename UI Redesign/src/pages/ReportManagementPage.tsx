import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

const ReportManagementPage: React.FC = () => {
    const reports = [
        { 
            id: '#RPT-8821', 
            thumbnail: 'https://images.unsplash.com/photo-1510408543160-928509c2a939?auto=format&fit=crop&q=80&w=200', 
            date: '12 Okt 2024, 08:30', 
            category: 'Jalan Utama', 
            location: 'Jl. Sudirman KM 5.2, Jakarta', 
            severity: 'Tinggi', 
            status: 'Baru',
            color: 'border-error'
        },
        { 
            id: '#RPT-8820', 
            thumbnail: 'https://images.unsplash.com/photo-1545146591-a02e6019aa2a?auto=format&fit=crop&q=80&w=200', 
            date: '11 Okt 2024, 14:15', 
            category: 'Jembatan', 
            location: 'Jembatan Merah, Sektor Timur', 
            severity: 'Sedang', 
            status: 'Dalam Proses',
            color: 'border-tertiary'
        },
        { 
            id: '#RPT-8819', 
            thumbnail: null, 
            date: '10 Okt 2024, 09:00', 
            category: 'Drainase', 
            location: 'Saluran Pembuangan Blok C', 
            severity: 'Rendah', 
            status: 'Selesai',
            color: 'border-secondary'
        },
    ];

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">folder_open</span> Ruang Kerja
                    </p>
                    <h2 className="text-3xl font-black text-on-background tracking-tight">Manajemen Laporan Kerusakan</h2>
                </div>
                <div className="flex items-center text-sm font-bold text-on-surface-variant bg-surface-container px-5 py-2.5 rounded-full border border-outline-variant/30 shadow-sm">
                    <span className="material-symbols-outlined text-[20px] mr-2 animate-spin-slow">sync</span>
                    Pembaruan terakhir: 10 menit yang lalu
                </div>
            </header>

            <section className="bg-white/80 backdrop-blur-xl border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
                    <input 
                        className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface font-medium rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                        placeholder="Cari ID Laporan, Lokasi, atau Aset..." 
                        type="text" 
                    />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none">
                        <select className="w-full lg:w-48 appearance-none bg-surface-container-low border border-outline-variant/30 text-on-surface font-bold rounded-2xl pl-5 pr-12 py-4 focus:bg-white focus:border-primary outline-none transition-all cursor-pointer">
                            <option>Semua Kategori</option>
                            <option>Jalan Raya</option>
                            <option>Jembatan</option>
                            <option>Fasilitas Umum</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                    </div>
                    <div className="relative flex-1 lg:flex-none">
                        <select className="w-full lg:w-48 appearance-none bg-surface-container-low border border-outline-variant/30 text-on-surface font-bold rounded-2xl pl-5 pr-12 py-4 focus:bg-white focus:border-primary outline-none transition-all cursor-pointer">
                            <option>Semua Status</option>
                            <option>Baru</option>
                            <option>Dalam Proses</option>
                            <option>Selesai</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                    </div>
                    <button className="p-4 bg-surface-container hover:bg-surface-container-high rounded-2xl border border-outline-variant/30 flex items-center justify-center transition-all active:scale-95 shadow-sm">
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                </div>
            </section>

            <div className="bg-white border border-outline-variant/30 rounded-3xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-container-low/30 border-b border-outline-variant/30">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Foto</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">ID & Tanggal</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Kategori</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Lokasi</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Keparahan (AI)</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                            {reports.map((rpt) => (
                                <tr key={rpt.id} className="hover:bg-surface-bright/50 transition-colors group relative">
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "w-20 h-14 rounded-xl overflow-hidden border-2 shadow-sm bg-surface-container-low flex items-center justify-center transition-transform group-hover:scale-105",
                                            rpt.color
                                        )}>
                                            {rpt.thumbnail ? (
                                                <img src={rpt.thumbnail} alt={rpt.id} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-outline-variant">image_not_supported</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-black text-on-surface group-hover:text-primary transition-colors">{rpt.id}</div>
                                        <div className="text-[11px] font-bold text-outline mt-1">{rpt.date}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-outline text-[18px]">
                                                {rpt.category.includes('Jalan') ? 'add_road' : rpt.category.includes('Jembatan') ? 'architecture' : 'water_drop'}
                                            </span>
                                            <span className="text-sm font-bold text-on-surface-variant">{rpt.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 lg:max-w-xs">
                                        <p className="text-sm font-medium text-on-surface line-clamp-2">{rpt.location}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={cn(
                                            "inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                                            rpt.severity === 'Tinggi' ? "bg-error-container text-error" : 
                                            rpt.severity === 'Sedang' ? "bg-surface-variant text-on-surface-variant" : 
                                            "bg-secondary-container/50 text-secondary"
                                        )}>
                                            {rpt.severity}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full", 
                                                rpt.status === 'Baru' ? "bg-error" : 
                                                rpt.status === 'Dalam Proses' ? "bg-tertiary" : 
                                                "bg-secondary animate-pulse"
                                            )}></div>
                                            <span className="text-xs font-black text-on-surface-variant">{rpt.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-90">
                                                Tinjau
                                            </button>
                                            <button className="p-2.5 border border-outline-variant/50 hover:bg-surface-container rounded-xl transition-all">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-outline-variant/20 bg-surface-bright/30 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm font-bold text-on-surface-variant">Menampilkan 1 hingga 3 dari 124 laporan</p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 bg-white border border-outline-variant/30 rounded-lg hover:text-primary transition-colors hover:shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        {[1, 2, 3].map(n => (
                            <button 
                                key={n}
                                className={cn(
                                    "w-10 h-10 rounded-xl font-black text-sm transition-all",
                                    n === 1 ? "bg-primary text-on-primary shadow-lg scale-110" : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low"
                                )}
                            >
                                {n}
                            </button>
                        ))}
                        <button className="p-2 bg-white border border-outline-variant/30 rounded-lg hover:text-primary transition-colors hover:shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportManagementPage;
