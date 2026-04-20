import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, MapPin, Camera, Copy, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { submitDamageReport } from '../lib/damageReportService';
import { getActiveDamageTypeNames } from '../lib/masterDataService';
import MapPicker from './MapPicker';

const urgency_levels = [
  { value: 'rendah', label: 'Rendah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'tinggi', label: 'Tinggi' },
  { value: 'sangat tinggi', label: 'Sangat Tinggi' },
];

export default function DamageReportForm() {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterEmail: '',
    reporterPhone: '',
    damageType: '',
    urgencyLevel: '',
    description: '',
    latitude: '',
    longitude: '',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [damageTypeOptions, setDamageTypeOptions] = useState([]);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Get GPS location on component mount
  useEffect(() => {
    getGPSLocation();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDamageTypeOptions() {
      try {
        const options = await getActiveDamageTypeNames();

        if (isMounted) {
          setDamageTypeOptions(options);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Gagal memuat jenis kerusakan referensi');
        }
      }
    }

    loadDamageTypeOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const getGPSLocation = () => {
    setGpsLoading(true);
    setLocationStatus('Mencari lokasi...');

    if (!navigator.geolocation) {
      setLocationStatus('Geolocation tidak didukung oleh browser');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setLocationStatus(
          `Lokasi ditemukan: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        );
        setGpsLoading(false);
      },
      (error) => {
        console.error('GPS error:', error);
        setLocationStatus(
          `Akses GPS ditolak atau gagal (${error.message}). Silakan isi koordinat manual.`
        );
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification('Ukuran foto tidak boleh lebih dari 5MB', 'error', 3000);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        addNotification('File harus berupa gambar', 'error', 3000);
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCoordinateChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(ticketCode).then(() => {
      setCopiedToClipboard(true);
      // Reset after 2 seconds
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }).catch(() => {
      addNotification('Gagal menyalin kode. Silakan coba lagi.', 'error', 3000);
    });
  };

  const validateForm = () => {
    if (!formData.reporterName.trim()) {
      setError('Nama pelapor harus diisi');
      return false;
    }

    if (!formData.reporterEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reporterEmail)) {
      setError('Email tidak valid');
      return false;
    }

    if (!formData.reporterPhone.trim()) {
      setError('Nomor telepon harus diisi');
      return false;
    }

    if (!formData.damageType) {
      setError('Jenis kerusakan harus dipilih');
      return false;
    }

    if (!formData.urgencyLevel) {
      setError('Tingkat urgensi harus dipilih');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Deskripsi kerusakan harus diisi');
      return false;
    }

    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('Koordinat tidak valid. Gunakan GPS atau isi koordinat manual dengan benar.');
      return false;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('Rentang koordinat tidak valid (lat: -90..90, lng: -180..180).');
      return false;
    }

    if (!photoFile) {
      setError('Foto kerusakan harus diunggah');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await submitDamageReport({
      reporterName: formData.reporterName,
      reporterEmail: formData.reporterEmail,
      reporterPhone: formData.reporterPhone,
      damageType: formData.damageType,
      urgencyLevel: formData.urgencyLevel,
      description: formData.description,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      photoFile,
    });

    setLoading(false);

    if (result.success) {
      setTicketCode(result.ticketCode);
      addNotification(`Laporan berhasil dikirim! Kode: ${result.ticketCode}`, 'success', 5000);
      
      // Reset form
      setFormData({
        reporterName: '',
        reporterEmail: '',
        reporterPhone: '',
        damageType: '',
        urgencyLevel: '',
        description: '',
        latitude: '',
        longitude: '',
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccess(true);
      // Reset GPS
      getGPSLocation();
    } else {
      addNotification(result.error || 'Terjadi kesalahan saat mengirim laporan', 'error', 3000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Success Message */}
      {success && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="surface-panel w-full max-w-md rounded-2xl p-8 text-center bg-white border border-slate-200 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <h3 className="mb-2 text-2xl font-bold text-slate-900">
              ✨ Laporan Berhasil Dikirim!
            </h3>
            <p className="mb-6 text-sm text-slate-600">
              Terima kasih telah melaporkan kerusakan infrastruktur. Kami akan segera meninjau laporan Anda.
            </p>
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Kode Tiket Laporan</p>
              <p className="mt-3 text-3xl font-bold text-cyan-600 font-mono">{ticketCode}</p>
              <p className="mt-3 text-xs text-slate-600">
                Simpan kode ini untuk melacak status laporan Anda
              </p>
              
              {/* Copy Button */}
              <button
                onClick={handleCopyToClipboard}
                className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  copiedToClipboard
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                }`}
              >
                {copiedToClipboard ? (
                  <>
                    <Check size={18} />
                    Kode Sudah Disalin!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Salin Kode
                  </>
                )}
              </button>
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:brightness-95"
            >
              Tutup & Kembali
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">📋 Form Laporan Kerusakan</h2>
          <p className="text-sm text-slate-600 mt-2">
            Bantu kami menjaga kelestarian infrastruktur publik dengan melaporkan kerusakan yang Anda temukan.
          </p>
        </div>

        {/* Nama Pelapor */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800 uppercase tracking-wider">
            Nama Pelapor *
          </label>
          <input
            type="text"
            name="reporterName"
            value={formData.reporterName}
            onChange={handleInputChange}
            placeholder="Masukkan nama Anda"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800 uppercase tracking-wider">
            Email *
          </label>
          <input
            type="email"
            name="reporterEmail"
            value={formData.reporterEmail}
            onChange={handleInputChange}
            placeholder="email@example.com"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            required
          />
        </div>

        {/* Nomor Telepon */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800 uppercase tracking-wider">
            Nomor Telepon *
          </label>
          <input
            type="tel"
            name="reporterPhone"
            value={formData.reporterPhone}
            onChange={handleInputChange}
            placeholder="08123456789"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            required
          />
        </div>

        {/* Lokasi GPS */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-cyan-600" /> Lokasi (GPS) *
          </label>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            {gpsLoading ? (
              <div className="flex items-center justify-center gap-3 py-8 text-cyan-700">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Mencari lokasi GPS Anda...</span>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">{locationStatus || 'Belum ada koordinat ditemukan.'}</p>
                </div>

                {/* Map Display */}
                <div className="w-full">
                  <MapPicker
                    value={
                      formData.latitude && formData.longitude
                        ? {
                            lat: Number(formData.latitude),
                            lng: Number(formData.longitude),
                          }
                        : null
                    }
                    onChange={(coords) => {
                      handleCoordinateChange('latitude', coords.lat);
                      handleCoordinateChange('longitude', coords.lng);
                    }}
                  />
                </div>

                {/* Coordinate Inputs */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(event) =>
                        handleCoordinateChange('latitude', event.target.value)
                      }
                      placeholder="-6.213373"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-mono outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(event) =>
                        handleCoordinateChange('longitude', event.target.value)
                      }
                      placeholder="106.843184"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-mono outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </div>
                </div>

                {/* Update Button */}
                <button
                  type="button"
                  onClick={getGPSLocation}
                  className="w-full rounded-lg border-2 border-cyan-300 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 active:bg-cyan-100"
                >
                  Perbarui Lokasi GPS
                </button>
              </>
            )}
          </div>
        </div>

        {/* Jenis Kerusakan */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800 uppercase tracking-wider">
            Jenis Kerusakan *
          </label>
          <select
            name="damageType"
            value={formData.damageType}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            required
          >
            <option value="">-- Pilih Jenis Kerusakan --</option>
            {damageTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Tingkat Urgensi */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800 uppercase tracking-wider">
            Tingkat Urgensi *
          </label>
          <select
            name="urgencyLevel"
            value={formData.urgencyLevel}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            required
          >
            <option value="">-- Pilih Tingkat Urgensi --</option>
            {urgency_levels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800 uppercase tracking-wider">
            Deskripsi Kerusakan *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Jelaskan detail kerusakan yang Anda temukan..."
            rows="4"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 resize-none"
            required
          />
        </div>

        {/* Foto Upload */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4" /> Foto Kerusakan *
          </label>
          <div className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-cyan-500 hover:bg-cyan-50 active:bg-cyan-100">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-input"
              required
            />
            <label htmlFor="photo-input" className="cursor-pointer">
              {photoPreview ? (
                <div className="space-y-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="mx-auto w-full max-h-64 rounded-lg object-cover"
                  />
                  <p className="text-sm text-slate-600">Klik untuk ganti foto</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Camera className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">
                    Klik atau drag foto ke sini
                  </p>
                  <p className="text-xs text-slate-500">
                    Format: JPG, PNG, GIF (Maks 5MB)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-bold text-white transition hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Mengirim Laporan...
            </>
          ) : (
            '✓ Kirim Laporan'
          )}
        </button>
      </form>
    </div>
  );
}
