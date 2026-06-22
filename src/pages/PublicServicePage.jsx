import { useState } from 'react';
import { motion } from 'framer-motion';
import DamageReportForm from '../components/DamageReportForm';
import TrackDamageReportPage from './TrackDamageReportPage';

function AnimatedLetters({ text, delayOffset = 0 }) {
  return (
    <>
      {Array.from(text).map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 + delayOffset, duration: 0.4 }}
        >
          {char}
        </motion.span>
      ))}
    </>
  );
}

export default function PublicServicePage() {
    const [activeTab, setActiveTab] = useState('report'); // 'report' | 'track'

    return (
        <main className="flex-grow pt-32 pb-20 px-6 md:px-8 max-w-7xl mx-auto w-full relative min-h-screen">
            {/* Background floating abstract shapes */}
            <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

            <div className="space-y-12">
                <div className="space-y-4 text-center md:text-left relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container font-bold text-xs border border-primary/20 mb-2"
                    >
                        <span className="material-symbols-outlined text-[14px]">support_agent</span>
                        Layanan Masyarakat
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-black text-on-background leading-tight tracking-tight">
                        <AnimatedLetters text="Pusat Layanan Publik" />
                    </h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg text-on-surface-variant max-w-2xl leading-relaxed"
                    >
                        Laporkan kerusakan infrastruktur fasilitas umum di sekitar Anda atau lacak status laporan yang sudah ada dengan mudah dan transparan.
                    </motion.p>
                </div>

                {/* Tab Selector */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap gap-2 bg-white/40 backdrop-blur-2xl rounded-3xl p-2 border border-white/60 w-fit shadow-xl shadow-primary/5 mx-auto md:mx-0 relative z-20"
                >
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-8 py-4 rounded-2xl font-bold text-sm md:text-base transition-all duration-300 flex items-center gap-3 relative overflow-hidden ${
                            activeTab === 'report'
                                ? 'text-white shadow-lg'
                                : 'text-on-surface hover:bg-white/50'
                        }`}
                    >
                        {activeTab === 'report' && (
                            <motion.div 
                                layoutId="activeTab" 
                                className="absolute inset-0 bg-gradient-to-br from-[#ce8093] to-[#8c3a56] rounded-2xl -z-10"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="material-symbols-outlined relative z-10">edit_note</span>
                        <span className="relative z-10 tracking-wide">Buat Laporan</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('track')}
                        className={`px-8 py-4 rounded-2xl font-bold text-sm md:text-base transition-all duration-300 flex items-center gap-3 relative overflow-hidden ${
                            activeTab === 'track'
                                ? 'text-white shadow-lg'
                                : 'text-on-surface hover:bg-white/50'
                        }`}
                    >
                        {activeTab === 'track' && (
                            <motion.div 
                                layoutId="activeTab" 
                                className="absolute inset-0 bg-gradient-to-br from-[#ce8093] to-[#8c3a56] rounded-2xl -z-10"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="material-symbols-outlined relative z-10">search</span>
                        <span className="relative z-10 tracking-wide">Lacak Laporan</span>
                    </button>
                </motion.div>

                {/* Content Area */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative z-10"
                >
                    <div className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-white overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-[#e8a0b0] via-[#ce8093] to-[#8c3a56]"></div>
                        <div className="p-6 md:p-12">
                            {activeTab === 'report' ? (
                                <DamageReportForm />
                            ) : (
                                <div className="-m-6 md:-m-12">
                                  <TrackDamageReportPage />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
