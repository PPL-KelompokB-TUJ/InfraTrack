# PBI-05 IMPLEMENTATION - Update Status Pekerjaan oleh Petugas

## Overview
PBI-05 mengimplementasikan fitur untuk petugas lapangan memperbarui status pekerjaan pemeliharaan secara real-time dengan kemampuan upload foto dokumentasi progress.

## Conditions of Satisfaction ✓

### 1. Petugas lapangan dapat melihat daftar penugasan yang ditugaskan kepadanya ✓
- **File**: `src/pages/FieldOfficerTasksPage.jsx`
- **Implementasi**: 
  - Function `getMaintenanceTasksByOfficer()` mengambil task dari database berdasarkan user ID
  - Filter otomatis untuk status 'assigned' dan 'in_progress'
  - Menampilkan daftar task dengan informasi aset, tiket, dan jadwal

### 2. Petugas dapat mengubah status pekerjaan: mulai dikerjakan, dalam progres, selesai ✓
- **File**: 
  - `src/components/UpdateTaskStatusModal.jsx` - Form untuk mengupdate status
  - `src/lib/maintenanceTaskService.js` - Function `updateTaskStatusWithLog()`
- **Implementasi**:
  - Radio button untuk memilih status: 'started', 'in_progress', 'completed'
  - Update status di table `maintenance_tasks`
  - Automatic notification ke admin saat task selesai

### 3. Petugas dapat menambahkan catatan lapangan pada setiap update status ✓
- **File**: `src/components/UpdateTaskStatusModal.jsx`
- **Implementasi**:
  - Textarea untuk catatan lapangan
  - Validasi: catatan wajib saat menyelesaikan pekerjaan
  - Catatan disimpan di table `maintenance_logs`

### 4. Foto progress pekerjaan dapat diunggah dan tersimpan dengan timestamp ✓
- **File**: 
  - `src/components/UpdateTaskStatusModal.jsx` - Upload UI
  - `src/lib/maintenanceTaskService.js` - Function `uploadMaintenanceProgressPhoto()`
- **Implementasi**:
  - File upload dengan preview
  - Validasi: file size max 5MB, harus gambar
  - Upload ke Supabase storage: `maintenance-progress-photos` bucket
  - Unique filename: `{userId}/{taskId}/{timestamp}_{filename}`
  - Timestamp otomatis disimpan saat log dibuat

### 5. Administrator dapat melihat update status secara real-time di halaman penugasan ✓
- **File**: `src/pages/MaintenanceTaskPage.jsx` (already exists)
- **Implementasi**:
  - Table `maintenance_logs` menyimpan semua update dengan timestamp
  - Admin dapat melihat timeline aktivitas
  - Real-time update melalui refresh mechanism

## Database Schema

### New Table: `maintenance_logs`
```sql
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES maintenance_tasks(id),
  officer_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('started', 'in_progress', 'completed')),
  notes TEXT,
  photo_url TEXT,
  logged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Indexes:**
- `maintenance_logs_task_id_idx` - Query logs untuk task tertentu
- `maintenance_logs_officer_id_idx` - Query logs untuk officer tertentu
- `maintenance_logs_logged_at_idx` - Query logs berdasarkan waktu

**RLS Policies:**
- Admin dan officer yang di-assign dapat melihat logs
- Only creator dapat update logs

### Storage Bucket: `maintenance-progress-photos`
- Public read access untuk menampilkan foto
- Authenticated users dapat upload
- Users dapat delete file mereka sendiri

## New API Functions

### 1. `getMaintenanceLogsForTask(taskId)`
Mengambil semua log aktivitas untuk task tertentu, sorted by timestamp

### 2. `createMaintenanceLog(logData)`
Membuat entry baru di table maintenance_logs dengan:
- task_id, officer_id, status, notes, photo_url, logged_at

### 3. `uploadMaintenanceProgressPhoto(file, taskId, userId)`
Upload file ke storage dan return public URL

### 4. `updateTaskStatusWithLog(taskId, newStatus, officerId, logData)`
Atomic operation yang:
1. Update status di table maintenance_tasks
2. Create entry di table maintenance_logs
3. Create notification untuk admin jika task selesai

## New Components

### 1. UpdateTaskStatusModal.jsx
Modal form untuk update status dengan:
- Status selection (radio buttons)
- Notes textarea
- Photo upload dengan preview
- Validasi input
- Loading state

### 2. MaintenanceLogsTimeline.jsx
Timeline view untuk menampilkan:
- Chronological log entries
- Status icons dan badges
- Officer name dan timestamp
- Notes dan photo
- Click-to-view full photo

## New Page

### FieldOfficerTasksPage.jsx
Halaman khusus petugas lapangan untuk:
- Melihat semua penugasan mereka
- Filter berdasarkan status
- Open detail modal untuk melihat timeline
- Update status pekerjaan
- Upload foto progress

**Features:**
- Real-time task list
- Quick status update buttons
- Detail modal dengan activity timeline
- Responsive design untuk mobile

## User Flow

### Petugas Lapangan:
1. Login atau akses halaman "Penugasan Saya"
2. Melihat daftar penugasan yang ditugaskan ke mereka
3. Klik "Detail" untuk melihat timeline aktivitas
4. Klik "Update Status" untuk membuka form update
5. Pilih status, tambahkan catatan, upload foto
6. Submit - sistem mencatat log dan notifikasi admin
7. Admin dapat melihat update di halaman penugasan

### Administrator:
1. Dapat melihat status task di halaman "Penugasan Pemeliharaan"
2. Melihat timeline aktivitas dari setiap petugas
3. Lihat foto progress yang diunggah
4. Monitor KPI penyelesaian task

## Testing Checklist

- [ ] Database migration: `create_maintenance_logs.sql` sudah dijalankan
- [ ] Storage bucket `maintenance-progress-photos` sudah dibuat
- [ ] RLS policies untuk maintenance_logs sudah aktif
- [ ] Petugas dapat logout dan login kembali
- [ ] Petugas dapat melihat penugasan yang ditugaskan ke mereka
- [ ] Petugas dapat membuka modal update status
- [ ] Petugas dapat upload foto (test max size validation)
- [ ] Sistem membuat log entry dengan timestamp
- [ ] Admin notifikasi ketika task selesai
- [ ] Timeline menampilkan semua log dalam urutan kronologis
- [ ] Foto dapat dilihat dalam fullscreen
- [ ] Mobile responsiveness OK

## Deployment Steps

1. **Database Migration:**
   ```bash
   # Run di Supabase SQL Editor
   supabase/create_maintenance_logs.sql
   ```

2. **Update App.jsx** (sudah dilakukan)
   - Import FieldOfficerTasksPage
   - Tambah module untuk field-officer-tasks
   - Tambah case di renderPage()

3. **Test:**
   - Create test user dengan role 'field_officer'
   - Assign maintenance task ke test user
   - Update status dengan foto
   - Verify logs di database
   - Verify admin notifications

## Notes

- Photo upload menggunakan async upload ke storage
- Unique filename mencegah collision
- Timestamp captured saat log creation
- Admin notifications automatic saat task completed
- Timeline sorted chronologically ascending
- Mobile-friendly UI dengan responsive design

## Future Enhancements

- Real-time sync dengan WebSockets
- Batch photo upload
- Photo gallery view
- Analytics untuk performance metrics
- Export log history ke PDF
- GPS location capture saat update status
