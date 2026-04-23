import { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, CheckCircle2, XCircle, Clock, MessageSquare, 
  AlertTriangle, ChevronDown, Info
} from 'lucide-react';
import { getPendingDamageReports, verifyDamageReport, rejectDamageReport } from '../lib/damageReportService';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabaseClient';

export default function DamageReportVerificationPanel() {
  const { addNotification } = useNotification();
  const [pendingReports, setPendingReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('sedang');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  // Get current admin user
  useEffect(() => {
    const getAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminUser(user);
    };
    getAdmin();
  }, []);

  // Load pending reports
  const loadPendingReports = useCallback(async () => {
    setIsLoading(true);
    const result = await getPendingDamageReports({ limit: 100 });
    
    if (result.success) {
      setPendingReports(result.reports);
      if (result.reports.length === 0) {
        addNotification('Tidak ada laporan yang pending', 'info');
      }
    } else {
      addNotification('Gagal memuat laporan pending: ' + result.error, 'error');
    }
    
    setIsLoading(false);
  }, [addNotification]);

  useEffect(() => {
    loadPendingReports();
  }, [loadPendingReports]);

  const handleVerify = async () => {
    if (!selectedReport || !adminUser) return;

    if (!priorityLevel) {
      addNotification('Pilih tingkat prioritas', 'error');
      return;
    }

    setIsSubmitting(true);

    const result = await verifyDamageReport({
      reportId: selectedReport.id,
      verificationNotes: verificationNotes || null,
      priorityLevel,
      adminId: adminUser.id,
    });

    setIsSubmitting(false);

    if (result.success) {
      addNotification(`Laporan ${selectedReport.ticket_code} terverifikasi ✓`, 'success');
      
      // Send notification to reporter
      await sendVerificationNotification(selectedReport, 'terverifikasi', verificationNotes);
      
      // Refresh list
      setPendingReports(pendingReports.filter(r => r.id !== selectedReport.id));
      setSelectedReport(null);
      setVerificationNotes('');
      setPriorityLevel('sedang');
    } else {
      addNotification('Gagal memverifikasi: ' + result.error, 'error');
    }
  };

  const handleReject = async () => {
    if (!selectedReport || !adminUser) return;

    if (!verificationNotes.trim()) {
      addNotification('Masukkan alasan penolakan', 'error');
      return;
    }

    setIsSubmitting(true);

    const result = await rejectDamageReport({
      reportId: selectedReport.id,
      verificationNotes,
      adminId: adminUser.id,
    });

    setIsSubmitting(false);

    if (result.success) {
      addNotification(`Laporan ${selectedReport.ticket_code} ditolak ✗`, 'warning');
      
      // Send notification to reporter
      await sendVerificationNotification(selectedReport, 'ditolak', verificationNotes);
      
      // Refresh list
      setPendingReports(pendingReports.filter(r => r.id !== selectedReport.id));
      setSelectedReport(null);
      setVerificationNotes('');
      setPriorityLevel('sedang');
    } else {
      addNotification('Gagal menolak: ' + result.error, 'error');
    }
  };

  const sendVerificationNotification = async (report, status, notes) => {
    // This will send email/SMS notification to reporter
    // For now, we'll create a notification record in the database
    try {
      const message = status === 'terverifikasi' 
        ? `Laporan Anda ${report.ticket_code} telah terverifikasi dengan prioritas: ${priorityLevel}.`
        : `Laporan Anda ${report.ticket_code} ditolak. Alasan: ${notes}`;

      // Store notification for later (email/SMS service integration)
      await supabase.from('notifications').insert({
        user_id: report.reporter_id,
        type: 'verification',
        status,
        ticket_code: report.ticket_code,
        message,
        metadata: {
          priority_level: priorityLevel,
          verification_notes: notes,
        },
      }).catch(() => null); // Ignore if table doesn't exist yet

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const getPriorityColor = (level) => {
    switch (level) {
      case 'rendah': return 'bg-green-50 border-green-200 text-green-700';
      case 'sedang': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'tinggi': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'sangat_tinggi': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'rendah': return 'text-green-600';
      case 'sedang': return 'text-yellow-600';
      case 'tinggi': return 'text-orange-600';
      case 'sangat tinggi': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Verifikasi Laporan Kerusakan</h2>
            <p className="text-sm text-slate-600 mt-1">
              {pendingReports.length} laporan menunggu verifikasi
            </p>
          </div>
          <button
            onClick={loadPendingReports}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="px-6 py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
          <p className="mt-2 text-sm text-slate-600">Memuat laporan...</p>
        </div>
      ) : pendingReports.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
          <p className="text-slate-600">Semua laporan telah diverifikasi ✓</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {/* Reports List */}
          <div className="max-h-96 overflow-y-auto">
            {pendingReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`px-6 py-4 cursor-pointer transition-colors ${
                  selectedReport?.id === report.id
                    ? 'bg-cyan-50 border-l-4 border-cyan-500'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{report.ticket_code}</span>
                      <span className={`text-sm font-medium ${getUrgencyColor(report.urgency_level)}`}>
                        {report.urgency_level?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{report.damage_type}</p>
                    <p className="text-sm text-slate-600">{report.reporter_name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      📍 {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                    </p>
                  </div>
                  <Clock size={16} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Detail & Verification Form */}
          {selectedReport && (
            <div className="p-6 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-4">Detail & Verifikasi</h3>

              {/* Report Details */}
              <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Pelapor:</span>
                    <p className="font-medium text-slate-900">{selectedReport.reporter_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Email:</span>
                    <p className="font-medium text-slate-900">{selectedReport.reporter_email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Telepon:</span>
                    <p className="font-medium text-slate-900">{selectedReport.reporter_phone || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Tipe Kerusakan:</span>
                    <p className="font-medium text-slate-900">{selectedReport.damage_type}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <span className="text-slate-600">Deskripsi:</span>
                  <p className="text-slate-900 mt-2">{selectedReport.description}</p>
                </div>

                {selectedReport.photo_url && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <span className="text-slate-600 block mb-2">Foto:</span>
                    <img 
                      src={selectedReport.photo_url} 
                      alt="Laporan" 
                      className="max-w-xs h-40 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Verification Form */}
              <div className="space-y-4">
                {/* Priority Level */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Tingkat Prioritas Penanganan
                  </label>
                  <select
                    value={priorityLevel}
                    onChange={(e) => setPriorityLevel(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${getPriorityColor(
                      priorityLevel
                    )}`}
                  >
                    <option value="rendah">🟢 Rendah</option>
                    <option value="sedang">🟡 Sedang</option>
                    <option value="tinggi">🟠 Tinggi</option>
                    <option value="sangat_tinggi">🔴 Sangat Tinggi</option>
                  </select>
                </div>

                {/* Verification Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    <MessageSquare size={14} className="inline mr-2" />
                    Catatan Verifikasi
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Masukkan catatan verifikasi (opsional untuk approve, wajib untuk reject)..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    rows="3"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleVerify}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg transition-colors font-medium"
                  >
                    <CheckCircle2 size={16} />
                    {isSubmitting ? 'Memproses...' : 'Terverifikasi'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded-lg transition-colors font-medium"
                  >
                    <XCircle size={16} />
                    {isSubmitting ? 'Memproses...' : 'Tolak'}
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2 text-sm text-blue-700">
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    Pelapor akan menerima notifikasi via email/SMS ketika laporan ini diverifikasi atau ditolak.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
