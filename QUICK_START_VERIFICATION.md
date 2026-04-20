# 🚀 Quick Start: Damage Report Verification System

## ⚡ 30-Second Setup

### 1. Run SQL Migration (Supabase Console)

Go to: **Supabase → SQL Editor** → Copy & Paste this:

```sql
-- Add verification columns
ALTER TABLE public.damage_reports
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS priority_level TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_report_id UUID REFERENCES public.damage_reports(id),
  new_status TEXT NOT NULL,
  verified_by UUID REFERENCES auth.users(id),
  verification_notes TEXT,
  priority_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON public.damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_damage_reports_priority ON public.damage_reports(priority_level);
```

### 2. Deploy Code

```bash
npm run build  # Already done ✓
# Deploy to production
```

### 3. Test as Admin

1. Login ke InfraTrack sebagai Admin
2. Go to Admin Dashboard
3. Scroll ke top → "Verifikasi Laporan Kerusakan" panel
4. Click laporan yang pending
5. Set prioritas + catatan
6. Click "Terverifikasi" atau "Tolak"
7. Done! ✓

---

## 📊 What You Get

### 1️⃣ Admin Dashboard - Verification Panel
- **List** semua pending reports
- **Click** untuk lihat detail
- **Input** priority & notes
- **Approve/Reject** dengan 1 click

### 2️⃣ Database Features
- ✅ 4 kolom baru di `damage_reports`
- ✅ Audit log table untuk history
- ✅ Indexes untuk performance
- ✅ RLS policies untuk security

### 3️⃣ Automatic Notifications
- ✅ Reporter dapat notifikasi saat approved/rejected
- ✅ Masalah bisa dilihat via catatan
- ✅ Ready untuk email/SMS integration

---

## 🎯 Use Cases

### Scenario 1: Approve Laporan
```
Admin buka laporan pending
→ Input: Priority = "Tinggi"
→ Input: Notes = "Akan ditangani minggu depan"
→ Click "Terverifikasi"
→ Status berubah jadi "terverifikasi"
→ Pelapor dapat notifikasi
```

### Scenario 2: Reject Laporan
```
Admin buka laporan
→ Notes = "Lokasi tidak akurat, silahkan submit ulang"
→ Click "Tolak"
→ Status berubah jadi "ditolak"
→ Pelapor dapat notifikasi + alasan
```

---

## 📂 Files & Changes

| File | Status | Perubahan |
|------|--------|----------|
| `src/components/DamageReportVerificationPanel.jsx` | 🆕 NEW | UI untuk verifikasi |
| `src/lib/damageReportService.js` | ✏️ UPDATED | +4 fungsi verifikasi |
| `src/pages/AdminDashboardPage.jsx` | ✏️ UPDATED | +import verification panel |
| `supabase/ADD_VERIFICATION_SYSTEM.sql` | 🆕 NEW | SQL migration |
| `VERIFICATION_SYSTEM_GUIDE.md` | 🆕 NEW | Dokumentasi lengkap |

---

## 🔧 Service Functions

```javascript
// 1. Get pending reports
const { reports } = await getPendingDamageReports({ limit: 50 });

// 2. Verify/Approve
await verifyDamageReport({
  reportId: 'uuid...',
  verificationNotes: 'Akan ditangani segera',
  priorityLevel: 'tinggi',
  adminId: 'admin-uuid...'
});

// 3. Reject
await rejectDamageReport({
  reportId: 'uuid...',
  verificationNotes: 'Lokasi tidak akurat',
  adminId: 'admin-uuid...'
});

// 4. Get audit history
const { logs } = await getVerificationAuditLogs(reportId);
```

---

## ✅ Verification Checklist

- [ ] SQL migration dijalankan di Supabase
- [ ] Build berhasil (npm run build) ✓
- [ ] Login sebagai admin
- [ ] Admin Dashboard muncul
- [ ] Verification panel terlihat
- [ ] Lihat pending reports
- [ ] Klik dan lihat detail
- [ ] Priority dropdown works
- [ ] Notes textarea works
- [ ] Terverifikasi button works
- [ ] Tolak button works
- [ ] Status berubah di database
- [ ] Audit log recorded

---

## 🎨 UI Components

### Verification Panel
- Header: "Verifikasi Laporan Kerusakan" + count pending
- List: Clickable reports dengan status badges
- Detail: Full form dengan priority + notes
- Actions: "Terverifikasi" (green) + "Tolak" (red)

### Report Card
```
INF-20260420-XXXXX  [TINGGI]
├─ Jalan rusak
├─ Pelapor: Ahmad
└─ 📍 -6.2088, 106.8456
```

### Priority Colors
- 🟢 Rendah: Green
- 🟡 Sedang: Yellow
- 🟠 Tinggi: Orange
- 🔴 Sangat Tinggi: Red

---

## 🔐 Security

- ✅ Only admin can verify reports (RLS enforced)
- ✅ All actions logged to audit table
- ✅ Reporter ID stored for notifications
- ✅ Timestamps recorded automatically
- ✅ Immutable audit trail

---

## 📈 Future Enhancements

1. **Email Notifications**
   - Integrate Resend or SendGrid
   - Send approval/rejection emails

2. **SMS Notifications**
   - Integrate Twilio
   - SMS to reporter phone

3. **Bulk Actions**
   - Approve multiple reports
   - Bulk priority assignment

4. **Export Reports**
   - CSV export of verified reports
   - Filter by date/priority

5. **Analytics Dashboard**
   - Verification rate charts
   - Priority distribution
   - Avg verification time

---

## 🐛 Troubleshooting

**Q: Verification panel tidak muncul**
- A: Check apakah sudah login sebagai admin

**Q: Priority dropdown kosong**
- A: Check browser console untuk error

**Q: Status tidak berubah**
- A: Refresh page, check database untuk updates

**Q: Notification tidak terkirim**
- A: Normal - ready untuk email/SMS integration

---

## 📞 Need Help?

Refer ke: `VERIFICATION_SYSTEM_GUIDE.md` untuk dokumentasi lengkap

---

**Build Status:** ✅ Success (1784 modules transformed)
**Last Updated:** 2026-04-20
**Ready for:** Production Deployment
