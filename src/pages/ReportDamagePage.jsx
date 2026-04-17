import React, { useState } from 'react';
import { MapPin, AlertCircle, Phone } from 'lucide-react';
import DamageReportForm from '../components/DamageReportForm';

export default function ReportDamagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Lapor Kerusakan Infrastruktur</h1>
          <p className="text-blue-100 text-lg">
            Membantu pemerintah menjaga kelestarian infrastruktur publik dengan pelaporan yang mudah dan transparan
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Info Card 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Lokasi Otomatis</h3>
            <p className="text-gray-600 text-sm">
              Gunakan GPS perangkat Anda untuk menentukan lokasi kerusakan secara akurat
            </p>
          </div>

          {/* Info Card 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Verifikasi Cepat</h3>
            <p className="text-gray-600 text-sm">
              Tim kami akan memverifikasi laporan dan menentukan prioritas penanganan
            </p>
          </div>

          {/* Info Card 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Lacak Status</h3>
            <p className="text-gray-600 text-sm">
              Gunakan kode tiket untuk melacak status laporan Anda kapan saja
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <DamageReportForm />
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Pertanyaan Umum</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FAQ Item 1 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-2">
                Apakah perlu membuat akun untuk melaporkan?
              </h3>
              <p className="text-gray-600 text-sm">
                Tidak perlu. Anda dapat melaporkan kerusakan tanpa membuat akun. Data kontak Anda akan digunakan
                untuk verifikasi laporan.
              </p>
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-2">
                Berapa lama waktu proses verifikasi?
              </h3>
              <p className="text-gray-600 text-sm">
                Tim kami biasanya memverifikasi laporan dalam 1-3 hari kerja. Status laporan akan diperbarui
                secara berkala.
              </p>
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-2">
                Bagaimana cara melacak status laporan?
              </h3>
              <p className="text-gray-600 text-sm">
                Setelah laporan dikirim, Anda akan menerima kode tiket. Gunakan kode ini di halaman "Lacak
                Laporan" untuk melihat status terbaru.
              </p>
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-2">
                Apakah data pribadi saya aman?
              </h3>
              <p className="text-gray-600 text-sm">
                Ya. Data pribadi Anda dienkripsi dan hanya digunakan untuk keperluan verifikasi dan komunikasi
                terkait laporan Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-blue-900 mb-4">Butuh Bantuan?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800">
            <div>
              <p className="font-semibold mb-1">Telepon</p>
              <p>1500-123 (Bebas Pulsa)</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Email</p>
              <p>laporan@infratrack.gov.id</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
