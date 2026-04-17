import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react';
import { getDamageReportByTicket } from '../lib/damageReportService';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  terverifikasi: 'bg-blue-100 text-blue-800',
  ditolak: 'bg-red-100 text-red-800',
  sedang_dikerjakan: 'bg-purple-100 text-purple-800',
  selesai: 'bg-green-100 text-green-800',
};

const statusLabels = {
  pending: 'Menunggu Verifikasi',
  terverifikasi: 'Terverifikasi',
  ditolak: 'Ditolak',
  sedang_dikerjakan: 'Sedang Dikerjakan',
  selesai: 'Selesai',
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'selesai':
      return <CheckCircle className="w-5 h-5" />;
    case 'sedang_dikerjakan':
      return <Clock className="w-5 h-5" />;
    case 'ditolak':
      return <AlertCircle className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

export default function TrackDamageReportPage() {
  const [ticketCode, setTicketCode] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setReport(null);

    if (!ticketCode.trim()) {
      setError('Masukkan kode tiket');
      return;
    }

    setLoading(true);
    setSearched(true);

    const result = await getDamageReportByTicket(ticketCode);

    setLoading(false);

    if (result.success) {
      setReport(result.report);
    } else {
      setError(result.error || 'Laporan tidak ditemukan');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Lacak Status Laporan
          </h1>
          <p className="text-gray-600">
            Gunakan kode tiket untuk melacak status laporan kerusakan Anda
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode tiket (mis: INF-20240101-XXXXX)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold flex items-center gap-2 transition"
            >
              <Search className="w-5 h-5" />
              Cari
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && searched && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
            <p className="text-gray-600 mt-4">Mencari laporan...</p>
          </div>
        )}

        {/* Report Details */}
        {report && !loading && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className={`rounded-lg p-6 ${statusColors[report.status]}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">Status Laporan</h3>
                {getStatusIcon(report.status)}
              </div>
              <p className="text-2xl font-bold">
                {statusLabels[report.status]}
              </p>
            </div>

            {/* Report Information */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Kode Tiket
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {report.ticket_code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Jenis Kerusakan
                  </p>
                  <p className="text-gray-800">{report.damage_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Tingkat Urgensi
                  </p>
                  <p className="text-gray-800 capitalize">
                    {report.urgency_level}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Deskripsi
                </p>
                <p className="text-gray-800">{report.description}</p>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Lokasi
                  </p>
                  <p className="text-gray-800">
                    {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              {report.photo_url && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Foto Kerusakan
                  </p>
                  <img
                    src={report.photo_url}
                    alt="Damage"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Tanggal Dilaporkan
                  </p>
                  <p className="text-sm text-gray-800">
                    {formatDate(report.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Terakhir Diperbarui
                  </p>
                  <p className="text-sm text-gray-800">
                    {formatDate(report.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Timeline Laporan</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div className="w-1 h-12 bg-gray-300"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Laporan Dikirim
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        report.status !== 'pending'
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    ></div>
                    <div className="w-1 h-12 bg-gray-300"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Verifikasi
                    </p>
                    <p className="text-sm text-gray-600">
                      {report.status !== 'pending'
                        ? 'Selesai'
                        : 'Menunggu verifikasi'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ['sedang_dikerjakan', 'selesai'].includes(
                          report.status
                        )
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    ></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Penanganan
                    </p>
                    <p className="text-sm text-gray-600">
                      {['sedang_dikerjakan', 'selesai'].includes(
                        report.status
                      )
                        ? 'Dalam Proses'
                        : 'Menunggu'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && searched && !report && !error && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Laporan tidak ditemukan</p>
          </div>
        )}

        {/* Info Box */}
        {!searched && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-2">Tips:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Kode tiket diberikan setelah Anda berhasil mengirim laporan</li>
              <li>• Gunakan kode tiket untuk melacak status laporan kapan saja</li>
              <li>• Status laporan akan diperbarui secara berkala</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
