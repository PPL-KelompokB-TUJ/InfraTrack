import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

const DashboardOverview: React.FC = () => {
    const summaryCards = [
        { label: 'Total Laporan', value: '1,248', delta: '+12%', icon: 'assignment', color: 'bg-primary' },
        { label: 'Sedang Dikerjakan', value: '342', delta: '+5%', icon: 'construction', color: 'bg-tertiary' },
        { label: 'Masalah Terselesaikan', value: '891', delta: '+24%', icon: 'check_circle', color: 'bg-secondary' },
    ];

    const reports = [
        { id: '#RPT-8892', location: 'Jembatan Merah, Sektor B', analysis: 'Retak Struktural (Tinggi)', status: 'Urgent', date: 'Hari ini, 10:42', type: 'error' },
        { id: '#RPT-8891', location: 'Pompa Air Unit 4, Bendungan', analysis: 'Getaran Anomali (Sedang)', status: 'In Progress', date: 'Kemarin, 15:20', type: 'warning' },
        { id: '#RPT-8889', location: 'Jalan Tol Km 12A', analysis: 'Lubang Permukaan (Rendah)', status: 'Solved', date: '24 Okt 2024', type: 'success' },
    ];

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-on-surface tracking-tight">Dashboard Overview</h2>
                    <p className="text-on-surface-variant font-medium">Pantau status infrastruktur dan laporan terkini secara real-time.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white border border-outline-variant/50 rounded-xl px-5 py-2.5 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-surface-bright transition-colors">
                        <span className="material-symbols-outlined text-outline">calendar_today</span>
                        <span className="text-sm font-bold text-on-surface">30 Hari Terakhir</span>
                        <span className="material-symbols-outlined text-outline">expand_more</span>
                    </div>
                    <button className="w-11 h-11 rounded-full bg-white border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary shadow-sm relative transition-all active:scale-90">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
                    </button>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summaryCards.map((card, i) => (
                    <motion.div 
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
                    >
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", card.color)}></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-2xl icon-fill">{card.icon}</span>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary text-[10px] font-black tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] font-black">trending_up</span> {card.delta}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">{card.label}</p>
                            <p className="text-4xl font-black text-on-surface tracking-tighter">{card.value}</p>
                        </div>
                    </motion.div>
                ))}
            </section>

            <section className="bg-white border border-outline-variant/30 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 border-b border-outline-variant/20 flex justify-between items-center bg-surface-bright/30">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-on-surface">Tren Pelaporan Kerusakan</h3>
                        <p className="text-sm text-on-surface-variant font-medium">Intensitas laporan berbasis AI analysis selama 30 hari terakhir.</p>
                    </div>
                    <button className="p-2.5 text-outline-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
                <div className="w-full h-[320px] relative bg-surface-bright/20 p-8 flex items-end gap-3" style={{ backgroundImage: 'radial-gradient(var(--color-outline-variant) 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                    {[40, 65, 30, 85, 55, 75, 45].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/10 rounded-t-lg relative group hover:bg-primary/20 transition-all cursor-guide" style={{ height: `${h}%` }}>
                            <div className="absolute inset-x-0 -top-10 scale-0 group-hover:scale-100 transition-transform bg-on-background text-white text-[10px] py-1.5 rounded-lg font-black text-center shadow-lg">
                                {Math.round(h * 15.4)}
                            </div>
                        </div>
                    ))}
                    <svg className="absolute inset-0 w-full h-full p-8 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,60 Q15,35 30,75 T60,15 T100,50" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="drop-shadow-lg opacity-40"></path>
                    </svg>
                </div>
            </section>

            <section className="bg-white border border-outline-variant/30 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-8 border-b border-outline-variant/20 flex justify-between items-center">
                    <h3 className="text-xl font-black text-on-surface">Laporan Terbaru</h3>
                    <button className="text-primary font-black text-sm flex items-center gap-2 hover:translate-x-1 transition-transform">
                        LIHAT SEMUA <span className="material-symbols-outlined text-[18px]">east</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-container-low/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">ID Laporan</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Lokasi / Aset</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Analisis AI</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                            {reports.map((rpt) => (
                                <tr key={rpt.id} className="hover:bg-surface-bright transition-colors cursor-pointer group">
                                    <td className="px-8 py-6 text-sm font-black text-primary">{rpt.id}</td>
                                    <td className="px-8 py-6 text-sm font-bold text-on-surface">{rpt.location}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className={cn("material-symbols-outlined text-[20px]", 
                                                rpt.type === 'error' ? "text-error" : rpt.type === 'warning' ? "text-tertiary" : "text-secondary"
                                            )}>psychology</span>
                                            <span className="text-sm font-medium text-on-surface-variant">{rpt.analysis}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "inline-block px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                            rpt.status === 'Urgent' ? "bg-error-container/40 text-error" : 
                                            rpt.status === 'Solved' ? "bg-secondary-container/40 text-secondary" : 
                                            "bg-surface-variant text-on-surface-variant"
                                        )}>
                                            {rpt.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-medium text-outline">{rpt.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default DashboardOverview;
