import { useState } from 'react';
import AssetManagementPage from './pages/AssetManagementPage';
import MasterDataPage from './pages/MasterDataPage';
import ReportDamagePage from './pages/ReportDamagePage';
import TrackDamageReportPage from './pages/TrackDamageReportPage';

const modules = [
  { key: 'asset-management', label: 'Manajemen Aset' },
  { key: 'master-data', label: 'Master Data Referensi' },
  { key: 'report-damage', label: 'Lapor Kerusakan' },
  { key: 'track-damage', label: 'Lacak Laporan' },
];

export default function App() {
  const [activeModule, setActiveModule] = useState('asset-management');

  const renderPage = () => {
    switch (activeModule) {
      case 'master-data':
        return <MasterDataPage />;
      case 'report-damage':
        return <ReportDamagePage />;
      case 'track-damage':
        return <TrackDamageReportPage />;
      case 'asset-management':
      default:
        return <AssetManagementPage />;
    }
  };

  return (
    <div>
      <header className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-2">
          <div className="flex flex-wrap gap-2">
            {modules.map((module) => (
              <button
                key={module.key}
                type="button"
                onClick={() => setActiveModule(module.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeModule === module.key
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-glow'
                    : 'border border-cyan-100 bg-white text-cyan-800 hover:bg-cyan-50'
                }`}
              >
                {module.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {renderPage()}
    </div>
  );
}
