import { useState } from 'react';
import AssetManagementPage from './pages/AssetManagementPage';
import MasterDataPage from './pages/MasterDataPage';

export default function App() {
  const [activeModule, setActiveModule] = useState('asset-management');

  return (
    <div>
      <header className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveModule('asset-management')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeModule === 'asset-management'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-glow'
                  : 'border border-cyan-100 bg-white text-cyan-800 hover:bg-cyan-50'
              }`}
            >
              Manajemen Aset
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('master-data')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeModule === 'master-data'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-glow'
                  : 'border border-cyan-100 bg-white text-cyan-800 hover:bg-cyan-50'
              }`}
            >
              Master Data Referensi
            </button>
          </div>
        </div>
      </header>

      {activeModule === 'asset-management' ? <AssetManagementPage /> : <MasterDataPage />}
    </div>
  );
}
