import { useState } from 'react';
import { motion } from 'framer-motion';
import DamageReportForm from '../components/DamageReportForm';
import TrackDamageReportPage from './TrackDamageReportPage';

export default function PublicServicePage() {
    const [activeTab, setActiveTab] = useState('report'); // 'report' | 'track'

    return (
        <main className="flex-grow pt-28 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full">
            <div className="space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-on-surface tracking-tight">Pusat Layanan Publik</h1>
                    <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                        Laporkan kerusakan infrastruktur fasilitas umum di sekitar Anda atau lacak status laporan yang sudah ada.
                    </p>
                </div>

                {/* Tab Selector */}
                <div className="flex gap-2 bg-surface-container-low rounded-2xl p-1.5 border border-outline-variant/30 w-fit">
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                            activeTab === 'report'
                                ? 'bg-primary text-on-primary shadow-lg'
                                : 'text-on-surface-variant hover:bg-surface-container-high/50'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">edit_note</span>
                        Buat Laporan
                    </button>
                    <button
                        onClick={() => setActiveTab('track')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                            activeTab === 'track'
                                ? 'bg-primary text-on-primary shadow-lg'
                                : 'text-on-surface-variant hover:bg-surface-container-high/50'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">search</span>
                        Lacak Laporan
                    </button>
                </div>

                {/* Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'report' ? (
                        <div className="bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/30 overflow-hidden relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                            <div className="p-8 md:p-10">
                                <DamageReportForm />
                            </div>
                        </div>
                    ) : (
                        <TrackDamageReportPage />
                    )}
                </motion.div>
            </div>
        </main>
    );
}
