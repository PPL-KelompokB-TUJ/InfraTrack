import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, MapPin, Camera } from 'lucide-react';
import { submitDamageReport } from '../lib/damageReportService';
import { getActiveDamageTypeNames } from '../lib/masterDataService';

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
    damageType: '',
    urgencyLevel: '',
    description: '',
    latitude: null,
    longitude: null,
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
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocationStatus(
          `Lokasi ditemukan: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        );
        setGpsLoading(false);
      },
      (error) => {
        console.error('GPS error:', error);
        setLocationStatus(`GPS Error: ${error.message}`);
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

    if (formData.latitude === null || formData.longitude === null) {
      setError('Lokasi tidak dapat ditentukan. Silakan aktifkan GPS dan coba lagi');
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
      latitude: formData.latitude,
      longitude: formData.longitude,
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
        damageType: '',
        urgencyLevel: '',
        description: '',
        latitude: null,
        longitude: null,
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
    <div className="max-w-2xl space-y-6">
      {/* Success Message */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Laporan Berhasil Dikirim!
            </h3>
            <p className="text-gray-600 mb-4">
              Terima kasih telah melaporkan kerusakan infrastruktur.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">Kode Tiket Laporan:</p>
              <p className="text-2xl font-bold text-blue-600">{ticketCode}</p>
              <p className="text-xs text-gray-500 mt-2">
                Simpan kode ini untuk melacak status laporan Anda
              </p>
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-5">
        <h2 className="text-2xl font-bold text-gray-800">Laporkan Kerusakan Infrastruktur</h2>
        <p className="text-gray-600 text-sm">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Lokasi GPS */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Lokasi (GPS) *
          </label>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {gpsLoading ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Mengakses GPS...</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">{locationStatus}</p>
                {formData.latitude && formData.longitude && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Latitude</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {formData.latitude.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Longitude</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {formData.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            <button
              type="button"
              onClick={getGPSLocation}
              className="mt-3 w-full text-sm bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200 font-semibold"
            >
              Perbarui Lokasi
            </button>
          </div>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Foto Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4" /> Foto Kerusakan *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition">
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
                    className="w-full max-h-64 object-cover rounded-lg mx-auto"
                  />
                  <p className="text-sm text-gray-600">Klik untuk ganti foto</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Klik atau drag foto ke sini
                  </p>
                  <p className="text-xs text-gray-500">
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
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition flex items-center justify-center gap-2"
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
