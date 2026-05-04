import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Filter } from 'lucide-react';
import { getDamageReportsForMap, getDamageCategories, getInfrastructureAssetsForMap, calculatePriorityScore, getPriorityLevel } from '../lib/mapService';
import { useNotification } from '../context/NotificationContext';

// Leaflet library - loaded via CDN in index.html
const L = window.L;

export default function MapVisualization() {
  const { addNotification } = useNotification();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerGroupRef = useRef(null);
  const filterButtonRef = useRef(null);
  
  const [reports, setReports] = useState([]);
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]); // Multi-select for report categories
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMapItem, setSelectedMapItem] = useState(null);

  // Initialize map on mount
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && L) {
      // Default center: Jakarta
      mapInstanceRef.current = L.map(mapRef.current).setView([-6.2, 106.8], 11);

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    loadData();
  }, []);

  // Update markers when data or filters change
  useEffect(() => {
    updateMapMarkers();
  }, [reports, assets, selectedCategories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterButtonRef.current && !filterButtonRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reportsResult, categoriesResult, assetsResult] = await Promise.all([
        getDamageReportsForMap(),
        getDamageCategories(),
        getInfrastructureAssetsForMap(),
      ]);

      if (reportsResult.success) {
        setReports(reportsResult.reports);
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.categories);
      }

      if (assetsResult.success) {
        setAssets(assetsResult.assets);
      }
    } catch (error) {
      addNotification('Gagal memuat data peta', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !L) return;

    if (!markerGroupRef.current) {
      markerGroupRef.current = L.markerClusterGroup
        ? L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 })
        : L.layerGroup();
      markerGroupRef.current.addTo(mapInstanceRef.current);
    } else {
      markerGroupRef.current.clearLayers();
    }

    const filteredReports = selectedCategories.length > 0
      ? reports.filter((r) => selectedCategories.includes(r.damage_type_id.toString()))
      : reports;

    let bounds = null;

    const addMarker = (marker, lat, lng) => {
      marker.addTo(markerGroupRef.current);

      if (bounds === null) {
        bounds = L.latLngBounds([[lat, lng], [lat, lng]]);
      } else {
        bounds.extend([lat, lng]);
      }
    };

    assets.forEach((asset) => {
      const lat = Number(asset.lat);
      const lng = Number(asset.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      let markerColor = '#22c55e';
      if (asset.condition === 'rusak ringan') markerColor = '#eab308';
      else if (asset.condition === 'rusak berat') markerColor = '#ef4444';

      const markerHtml = `
        <div style="
          background-color: ${markerColor};
          border: 3px solid white;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
        ">
          A
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        iconSize: [26, 26],
        className: 'custom-marker',
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindPopup(`
          <div style="width: 260px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">${asset.name}</h4>
            <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Kategori:</strong> ${asset.category_name || '-'}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Kondisi:</strong> ${asset.condition || '-'}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Tahun:</strong> ${asset.year_built || '-'}</p>
            ${asset.description ? `<p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Deskripsi:</strong> ${asset.description}</p>` : ''}
          </div>
        `, { maxWidth: 260 });

      marker.on('click', () => {
        setSelectedMapItem({ type: 'asset', data: asset });
      });

      addMarker(marker, lat, lng);
    });

    filteredReports.forEach((report) => {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      // Determine marker color based on status
      let markerColor = '#f97316'; // orange for pending
      if (report.status === 'terverifikasi') markerColor = '#3b82f6'; // blue for verified

      const markerHtml = `
        <div style="
          background-color: ${markerColor};
          border: 3px solid white;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
        ">
          R
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        iconSize: [26, 26],
        className: 'custom-marker',
      });

      const priorityLevel = getPriorityLevel(calculatePriorityScore(report));
      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindPopup(`
          <div style="width: 260px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">${report.ticket_code}</h4>
            <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Jenis:</strong> ${report.damage_type_name}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Status:</strong> ${report.status}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Lokasi:</strong> ${report.location_description}</p>
            ${report.description ? `<p style="margin: 4px 0; font-size: 12px; color: #475569;"><strong>Keterangan:</strong> ${report.description}</p>` : ''}
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
              <span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: ${markerColor}; color: white;">
                ${report.status.toUpperCase()}
              </span>
            </div>
          </div>
        `, { maxWidth: 260 });

      marker.on('click', () => {
        setSelectedMapItem({ type: 'report', data: report });
      });

      addMarker(marker, lat, lng);
    });

    if (bounds) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Get category counts
  const getCategoryCount = (categoryId) => {
    return reports.filter(r => r.damage_type_id === parseInt(categoryId)).length;
  };

  // Filter categories by search query
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReports = selectedCategories.length > 0
    ? reports.filter(r => selectedCategories.includes(r.damage_type_id.toString()))
    : reports;

  const pendingCount = filteredReports.filter(r => r.status === 'pending').length;
  const verifiedCount = filteredReports.filter(r => r.status === 'terverifikasi').length;

  console.log('MapVisualization Debug:', {
    totalReports: reports.length,
    filteredReports: filteredReports.length,
    pendingCount,
    verifiedCount,
    sampleReport: reports[0],
  });

  return (
    <div className="glass-panel rounded-2xl p-6 bg-white border border-slate-200 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Peta Aset & Laporan Aktif</h2>
          <p className="text-xs text-slate-500 mt-1">Tampilkan aset infrastruktur dan laporan kerusakan masyarakat yang masih aktif.</p>
        </div>
        <div className="relative">
          <button
            ref={filterButtonRef}
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-sm"
          >
            <Filter size={16} />
            Filter Kategori
            {selectedCategories.length > 0 && (
              <span className="bg-cyan-500 text-white text-xs rounded-full px-2 py-0.5">
                {selectedCategories.length}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Portal */}
          {showDropdown && filterButtonRef.current && ReactDOM.createPortal(
            <div 
              className="fixed bg-white rounded-lg shadow-2xl border border-slate-200 z-[9999] max-h-96 overflow-hidden flex flex-col w-80"
              style={{
                top: filterButtonRef.current.getBoundingClientRect().bottom + 8,
                right: window.innerWidth - filterButtonRef.current.getBoundingClientRect().right,
              }}
            >
              {/* Search Box */}
              <div className="p-3 border-b border-slate-200">
                <input
                  type="text"
                  placeholder="Cari kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Clear All Button */}
              {selectedCategories.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 border-b border-slate-200"
                >
                  ✕ Hapus Semua Filter
                </button>
              )}

              {/* Categories List */}
              <div className="overflow-y-auto flex-1">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map(cat => {
                    const count = getCategoryCount(cat.id);
                    const isSelected = selectedCategories.includes(cat.id.toString());
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id.toString())}
                        className={`w-full text-left px-4 py-3 transition-colors border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 ${
                          isSelected
                            ? 'bg-cyan-50'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-cyan-500 border-cyan-500'
                                : 'border-slate-300 hover:border-cyan-500'
                            }`}
                          >
                            {isSelected && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`font-medium ${isSelected ? 'text-cyan-700' : 'text-slate-900'}`}>
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                          {count}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Kategori tidak ditemukan
                  </div>
                )}
              </div>

              {/* Footer Info */}
              {selectedCategories.length > 0 && (
                <div className="px-4 py-2 text-xs text-slate-600 border-t border-slate-200 bg-slate-50">
                  {filteredReports.length} laporan ditampilkan
                </div>
              )}
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          height: '350px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px',
        }}
      />

      {/* Legend */}
      <div className="grid gap-4 pt-4 border-t border-slate-200 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aset</p>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-700 font-medium">Aset Baik</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
              <span className="text-xs text-slate-700 font-medium">Aset Rusak Ringan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-700 font-medium">Aset Rusak Berat</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Laporan Aktif</p>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-xs text-slate-700 font-medium">Pending ({pendingCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-xs text-slate-700 font-medium">Terverifikasi ({verifiedCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Item Info */}
      {selectedMapItem && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              {selectedMapItem.type === 'asset' ? (
                <>
                  <p className="text-sm font-semibold text-slate-900">{selectedMapItem.data.name}</p>
                  <p className="text-xs text-slate-600 mt-1">Kategori: {selectedMapItem.data.category_name || '-'}</p>
                  <p className="text-xs text-slate-600 mt-1">Kondisi: {selectedMapItem.data.condition || '-'}</p>
                  <p className="text-xs text-slate-600 mt-1">Tahun: {selectedMapItem.data.year_built || '-'}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-900">{selectedMapItem.data.ticket_code}</p>
                  <p className="text-xs text-slate-600 mt-1">Jenis: {selectedMapItem.data.damage_type_name}</p>
                  <p className="text-xs text-slate-600 mt-1">Status: {selectedMapItem.data.status}</p>
                  <p className="text-xs text-slate-600 mt-1">📍 {selectedMapItem.data.location_description}</p>
                </>
              )}
              {selectedMapItem.data.description && (
                <p className="text-xs text-slate-600 mt-2">{selectedMapItem.data.description}</p>
              )}
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {selectedMapItem.type === 'asset' ? 'Aset' : 'Laporan'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
