# PBI-04: Implementasi Penugasan Pekerjaan Pemeliharaan

## Overview
Fitur ini memungkinkan administrator untuk menugaskan pekerjaan pemeliharaan kepada petugas lapangan berdasarkan laporan kerusakan yang telah diverifikasi, dengan penetapan estimasi waktu, instruksi kerja, dan pengiriman notifikasi otomatis.

## Setup Database

### 1. Jalankan SQL Script
Jalankan file `supabase/create_maintenance_tasks.sql` di Supabase SQL Editor untuk membuat:
- Tabel `maintenance_tasks`
- Tabel `notifications` (jika belum ada)
- Triggers untuk `updated_at`
- Indexes untuk performa query

**Tables yang dibuat:**

#### maintenance_tasks
```sql
- id: UUID (primary key)
- report_id: UUID (FK to damage_reports)
- asset_id: UUID (FK to infrastructure_assets)
- assigned_to: UUID (FK to users - petugas lapangan)
- assigned_by: UUID (FK to users - administrator)
- scheduled_date: TIMESTAMP
- estimated_cost: DECIMAL(12,2)
- status: TEXT (pending, assigned, in_progress, completed, cancelled)
- instructions: TEXT
- notes: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### notifications
```sql
- id: UUID (primary key)
- user_id: UUID (FK to users)
- type: TEXT
- title: TEXT
- message: TEXT
- related_id: UUID
- is_read: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## File Structure

```
src/
├── components/
│   └── MaintenanceTaskFormModal.jsx      # Form untuk membuat penugasan
├── lib/
│   └── maintenanceTaskService.js         # Service layer untuk CRUD
├── pages/
│   └── MaintenanceTaskPage.jsx           # Halaman daftar penugasan
└── App.jsx                               # Updated dengan routing

supabase/
└── create_maintenance_tasks.sql          # SQL migration
```

## Fitur yang Diimplementasikan

### 1. **Service Layer** (`maintenanceTaskService.js`)
Menyediakan fungsi-fungsi untuk:
- `getMaintenanceTasks(filters)` - Dapatkan semua penugasan dengan filter
- `getMaintenanceTaskById(id)` - Dapatkan detail penugasan
- `createMaintenanceTask(taskData, userId)` - Buat penugasan baru + notifikasi
- `updateMaintenanceTask(id, taskData)` - Update penugasan
- `updateMaintenanceTaskStatus(id, status, notes)` - Update status
- `deleteMaintenanceTask(id)` - Hapus penugasan
- `getMaintenanceTasksByOfficer(officerId)` - Dapatkan penugasan untuk petugas
- `getActiveFieldOfficers()` - Dapatkan daftar petugas aktif
- `createNotification(data)` - Buat notifikasi
- `getUserNotifications(userId, limit)` - Dapatkan notifikasi user
- `markNotificationAsRead(notificationId)` - Tandai notifikasi dibaca

### 2. **Component Modal** (`MaintenanceTaskFormModal.jsx`)
Form untuk membuat penugasan dengan:
- **Validasi form**: Memastikan semua field wajib terisi
- **Info laporan & aset**: Menampilkan detail laporan dan aset terkait
- **Dropdown petugas**: Daftar petugas lapangan aktif
- **Tanggal terjadwal**: Dengan validasi minimal hari ini
- **Estimasi biaya**: Field opsional
- **Instruksi kerja**: Area teks dengan counter karakter
- **Error handling**: Pesan error yang jelas

### 3. **Page** (`MaintenanceTaskPage.jsx`)
Halaman manajemen penugasan dengan:
- **Dashboard statistik**: Total, pending, ditugaskan, sedang dikerjakan, selesai
- **Search & filter**: Pencarian dan filter by status
- **Daftar penugasan**: Tabel dengan informasi lengkap
- **Aksi**: Lihat detail, hapus penugasan
- **Detail modal**: Popup untuk melihat informasi lengkap penugasan

### 4. **Notifikasi Otomatis**
Otomatis mengirim notifikasi ke petugas ketika:
- Penugasan baru dibuat
- Status penugasan berubah
- Reminder jadwal mendekati (implementasi future)

## Cara Menggunakan

### Administrator

1. **Buka halaman Penugasan Pemeliharaan**
   - Klik menu "Penugasan Pemeliharaan" di navigation bar

2. **Buat penugasan baru**
   - Klik tombol "+ Buat Penugasan"
   - Modal form terbuka dengan penawaran laporan yang belum ditugaskan
   - Isi semua field yang wajib:
     - Pilih petugas lapangan
     - Tentukan tanggal terjadwal (minimal besok)
     - Isi instruksi kerja detail
     - (Opsional) Masukkan estimasi biaya
   - Klik "Buat Penugasan"
   - Notifikasi otomatis terkirim ke petugas

3. **Lihat daftar penugasan**
   - Halaman menampilkan semua penugasan dengan status
   - Gunakan search untuk cari berdasarkan tiket/aset/petugas
   - Gunakan filter status untuk menyaring

4. **Lihat detail penugasan**
   - Klik ikon "Lihat detail" pada baris penugasan
   - Popup menampilkan informasi lengkap

5. **Hapus penugasan**
   - Klik ikon "Hapus" pada baris penugasan
   - Konfirmasi penghapusan
   - Penugasan dihapus dari sistem

## Kondisi Kepuasan yang Dicapai

✅ **1. Administrator dapat membuat penugasan dari laporan terverifikasi**
- Dapat membuat penugasan dari laporan yang status-nya "terverifikasi"
- Form memandu admin memilih laporan yang belum ditugaskan

✅ **2. Form penugasan mencakup pilihan petugas, estimasi waktu, instruksi kerja**
- Dropdown petugas dengan data real-time dari database
- Input tanggal dengan validasi
- Input estimasi biaya (opsional)
- Textarea untuk instruksi kerja detail

✅ **3. Notifikasi penugasan otomatis terkirim ke petugas**
- Saat penugasan dibuat, notifikasi in-app dibuat otomatis
- Petugas menerima notifikasi dengan informasi penugasan
- Sistem siap untuk integrasi email (dengan third-party service)

✅ **4. Penugasan tercatat di database dan terhubung dengan laporan asal**
- Foreign key `report_id` menghubungkan ke tabel damage_reports
- Foreign key `asset_id` menghubungkan ke aset infrastruktur
- Foreign key `assigned_to` mereferensikan petugas

✅ **5. Administrator dapat melihat daftar semua penugasan beserta statusnya**
- Halaman MaintenanceTaskPage menampilkan tabel dengan semua penugasan
- Status ditampilkan dengan color-coding dan icon
- Filter by status tersedia

## Integrasi dengan PBI Lain

### PBI-03: Verifikasi Laporan
- Penugasan hanya bisa dibuat dari laporan yang sudah terverifikasi
- Linked via `report_id` FK

### PBI-05: Update Status Pekerjaan
- Petugas akan menggunakan `updateMaintenanceTaskStatus()` untuk update progress
- Mengubah status dari `assigned` → `in_progress` → `completed`

### PBI-11: Sistem Notifikasi Otomatis
- `createNotification()` dipanggil otomatis saat penugasan dibuat
- Bisa di-extend untuk notifikasi email via third-party service

## Teknologi & Dependencies

- **Frontend**: React 18.3.1, Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **UI Components**: Custom modal, form, table components

## Testing Checklist

- [ ] Database migration berhasil (check Supabase)
- [ ] Service functions bisa dipanggil tanpa error
- [ ] Modal form terbuka ketika tombol "Buat Penugasan" diklik
- [ ] Dropdown petugas populated dengan data
- [ ] Validasi form bekerja (error message tampil)
- [ ] Penugasan berhasil dibuat dan disimpan ke DB
- [ ] Notifikasi otomatis terkirim ke petugas
- [ ] Daftar penugasan tampil dengan data benar
- [ ] Filter & search bekerja
- [ ] Detail modal menampilkan informasi lengkap
- [ ] Delete penugasan bekerja dengan konfirmasi

## Future Enhancements

1. **Email Notifications**
   - Integrasi dengan SendGrid/Mailgun untuk email notifikasi
   - Template email yang dapat dikustomisasi

2. **SMS Notifications**
   - Integrasi Twilio untuk SMS reminder

3. **Bulk Operations**
   - Buat multiple penugasan sekaligus
   - Export penugasan ke PDF/Excel

4. **Performance Tracking**
   - Dashboard KPI untuk melihat kinerja petugas
   - Metrics: average completion time, completion rate, etc.

5. **Work Allocation Algorithm**
   - Auto-assign berdasarkan workload, specialization, location
   - Machine learning untuk optimal allocation

6. **Mobile App**
   - Mobile-native app untuk petugas lapangan
   - Real-time tracking GPS
   - Offline mode untuk form input

## Troubleshooting

**Q: Dropdown petugas tidak terisi**
A: Pastikan ada user dengan role 'field_officer' dan is_active=true di database

**Q: Notifikasi tidak terkirim**
A: Check notifications table di Supabase, pastikan user_id valid

**Q: Error saat membuat penugasan**
A: Check browser console untuk error message, validasi input form

**Q: Data penugasan tidak update**
A: Pastikan pagination/limit di getMaintenanceTasks() sudah correct

## Support & Contact

Untuk pertanyaan atau masalah, hubungi tim development atau buat issue di GitHub repository.
