import React, { useState } from 'react';
import { Navigation } from 'lucide-react';
import AssetManagementPage from './pages/AssetManagementPage';
import ReportDamagePage from './pages/ReportDamagePage';
import TrackDamageReportPage from './pages/TrackDamageReportPage';
import MaintenanceTaskPage from './pages/MaintenanceTaskPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('assets');

  const renderPage = () => {
    switch (currentPage) {
      case 'report':
        return <ReportDamagePage />;
      case 'track':
        return <TrackDamageReportPage />;
      case 'maintenance':
        return <MaintenanceTaskPage />;
      case 'assets':
      default:
        return <AssetManagementPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('assets')}>
              <Navigation className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-blue-600">InfraTrack</h1>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentPage('assets')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currentPage === 'assets'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Manajemen Aset
              </button>
              <button
                onClick={() => setCurrentPage('report')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currentPage === 'report'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Lapor Kerusakan
              </button>
              <button
                onClick={() => setCurrentPage('track')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currentPage === 'track'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Lacak Laporan
              </button>
              <button
                onClick={() => setCurrentPage('maintenance')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currentPage === 'maintenance'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Penugasan Pemeliharaan
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {renderPage()}
    </div>
  );
}
