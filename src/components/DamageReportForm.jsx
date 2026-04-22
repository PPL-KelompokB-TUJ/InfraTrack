import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, MapPin, Camera } from 'lucide-react';
import { submitDamageReport } from '../lib/damageReportService';
import {
  getActiveDamageTypeNames,
  getActiveInfrastructureCategories,
} from '../lib/masterDataService';

const urgency_levels = [
  { value: 'rendah', label: 'Rendah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'tinggi', label: 'Tinggi' },
  { value: 'sangat tinggi', label: 'Sangat Tinggi' },
];

export default function DamageReportForm() {
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterEmail: '',
    reporterPhone: '',
    infrastructureCategory: '',
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
  const [infrastructureCategoryOptions, setInfrastructureCategoryOptions] = useState([]);

  // Get GPS location on component mount
  useEffect(() => {
    getGPSLocation();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInfrastructureCategories() {
      try {
        const options = await getActiveInfrastructureCategories();

        if (isMounted) {
          setInfrastructureCategoryOptions(options);
          setFormData((prev) => {
            if (prev.infrastructureCategory) {
              return prev;
            }

            const preferredCategory = options.find((item) => item.is_default) || options[0];
            return {
              ...prev,
              infrastructureCategory: preferredCategory?.name || '',
            };
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Gagal memuat kategori infrastruktur referensi');
        }
      }
    }

    loadInfrastructureCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDamageTypeOptions() {
      try {
        const options = await getActiveDamageTypeNames(formData.infrastructureCategory);

        if (isMounted) {
          setDamageTypeOptions(options);
          setFormData((prev) => {
            if (!prev.damageType || options.includes(prev.damageType)) {
              return prev;
            }

            return {
              ...prev,
              damageType: '',
            };
          });
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
  }, [formData.infrastructureCategory]);

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
        setError('Ukuran foto tidak boleh lebih dari 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar');
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

    if (!formData.infrastructureCategory) {
      setError('Kategori infrastruktur harus dipilih');
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
      infrastructureCategory: formData.infrastructureCategory,
      damageType: formData.damageType,
      urgencyLevel: formData.urgencyLevel,
      description: formData.description,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      photoFile,
    });

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTicketCode(result.ticketCode);
      // Reset form
      setFormData({
        reporterName: '',
        reporterEmail: '',
        reporterPhone: '',
        infrastructureCategory:
          infrastructureCategoryOptions.find((item) => item.is_default)?.name ||
          infrastructureCategoryOptions[0]?.name ||
          '',
        damageType: '',
        urgencyLevel: '',
        description: '',
        latitude: '',
        longitude: '',
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      // Reset GPS
      getGPSLocation();
    } else {
      setError(result.error || 'Terjadi kesalahan saat mengirim laporan');
    }
  };

  return (
    <div className="space-y-5">
      {/* Success Message */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="surface-panel w-full max-w-md rounded-3xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="mb-2 text-xl font-bold text-slate-800">
              Laporan Berhasil Dikirim!
            </h3>
            <p className="mb-4 text-sm text-slate-600">
              Terima kasih telah melaporkan kerusakan infrastruktur.
            </p>
            <div className="mb-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Kode Tiket Laporan</p>
              <p className="mt-1 text-2xl font-bold text-cyan-700">{ticketCode}</p>
              <p className="mt-2 text-xs text-slate-500">
                Simpan kode ini untuk melacak status laporan Anda
              </p>
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-2">
        <h2 className="text-xl font-bold text-slate-800">Form Laporan Kerusakan</h2>
        <p className="text-sm text-slate-600">
          Bantu kami menjaga kelestarian infrastruktur publik dengan melaporkan kerusakan yang Anda temukan.
        </p>

        {/* Nama Pelapor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nama Pelapor *
          </label>
          <input
            type="text"
            name="reporterName"
            value={formData.reporterName}
            onChange={handleInputChange}
            placeholder="Masukkan nama Anda"
            className="w-full rounded-xl border border-cyan-100 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="reporterEmail"
            value={formData.reporterEmail}
            onChange={handleInputChange}
            placeholder="email@example.com"
            className="w-full rounded-xl border border-cyan-100 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
            required
          />
        </div>

        {/* Nomor Telepon */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nomor Telepon *
          </label>
          <input
            type="tel"
            name="reporterPhone"
            value={formData.reporterPhone}
            onChange={handleInputChange}
            placeholder="08123456789"
            className="w-full rounded-xl border border-cyan-100 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
            required
          />
        </div>

        {/* Lokasi GPS */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin className="w-4 h-4" /> Lokasi (GPS) *
          </label>
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
            {gpsLoading ? (
              <div className="flex items-center gap-2 text-cyan-700">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Mengakses GPS...</span>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-slate-600">{locationStatus || 'Belum ada koordinat.'}</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Latitude</p>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(event) =>
                        handleCoordinateChange('latitude', event.target.value)
                      }
                      placeholder="-6.200000"
                      className="mt-1.5 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Longitude</p>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(event) =>
                        handleCoordinateChange('longitude', event.target.value)
                      }
                      placeholder="106.816666"
                      className="mt-1.5 w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={getGPSLocation}
              className="mt-3 w-full rounded-lg border border-cyan-200 bg-white py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
            >
              Perbarui Lokasi
            </button>
          </div>
        </div>

        {/* Kategori Infrastruktur */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Kategori Infrastruktur *
          </label>
          <select
            name="infrastructureCategory"
            value={formData.infrastructureCategory}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-cyan-100 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
            required
          >
            <option value="">-- Pilih Kategori Infrastruktur --</option>
            {infrastructureCategoryOptions.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Jenis Kerusakan */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Jenis Kerusakan *
          </label>
          <select
            name="damageType"
            value={formData.damageType}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-cyan-100 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tingkat Urgensi *
          </label>
          <select
            name="urgencyLevel"
            value={formData.urgencyLevel}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-cyan-100 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Deskripsi Kerusakan *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Jelaskan detail kerusakan yang Anda temukan..."
            rows="4"
            className="w-full rounded-xl border border-cyan-100 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
            required
          />
        </div>

        {/* Foto Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4" /> Foto Kerusakan *
          </label>
          <div className="cursor-pointer rounded-xl border-2 border-dashed border-cyan-200 p-6 text-center transition hover:border-cyan-500 hover:bg-cyan-50">
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
                  <p className="text-sm text-slate-600">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Mengirim Laporan...
            </>
          ) : (
            'Kirim Laporan'
          )}
        </button>
      </form>
    </div>
  );
}
