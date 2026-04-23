# 🧪 Field Officer Login - Test Guide

**Status**: ✅ Siap ditest

## Test Credentials (Kredensial Test)

| Role | Email | Password |
|------|-------|----------|
| Petugas 1 | ahmad.sutrisno@example.com | Ahmad123!@# |
| Petugas 2 | budi.santoso@example.com | Budi123!@# |
| Petugas 3 | citra.dewi@example.com | Citra123!@# |

## Ada 2 Cara Login sebagai Petugas

### ✅ CARA 1: Menggunakan Admin Modal (RECOMMENDED)

1. **Buka aplikasi** di browser
2. **Di halaman login modal**, klik tombol **"🚗 Petugas"**
3. **Masukkan** email dan password dari tabel di atas
4. **Klik** "Masuk"

**Expected Result:**
- Login berhasil
- Redirect ke dashboard/page petugas
- Sidebar menampilkan menu petugas

### ✅ CARA 2: Field Officer Login Page (Alternative)

Jika ada menu "Login Petugas" di sidebar:
1. Klik "Login Petugas"
2. Masukkan email dan password
3. Klik "Masuk sebagai Petugas"

## Apa yang Sudah Diperbaiki

✅ **Supabase Auth Setup**
- 3 petugas memiliki akun Supabase Auth
- Setiap akun memiliki `app_metadata.role = 'field_officer'`

✅ **Database Setup**
- Semua 3 petugas ada di `public.users` table
- Role setting di database sesuai dengan Auth

✅ **Login Logic Improvements**
- authService.js: Improved user metadata fetching
- App.jsx: Better error messages dengan console logging
- FieldOfficerLoginPage: Now uses Supabase Auth (not custom login)

## Debugging Tips

Jika masih error, buka **Browser Developer Console** (F12) dan:

1. **Login attempt**
2. **Buka Console tab**
3. **Cari "Login verification" message** - akan menunjukkan:
   - `selectedRole`: Role yang dipilih
   - `userRole`: Role dari Supabase Auth
   - Metadata status

**Contoh output yang benar:**
```
Login verification: {
  selectedRole: "field_officer",
  userRole: "field_officer",
  hasAppMetadata: true,
  hasUserMetadata: true
}
```

## Manual Verification

Jika ingin verify data di Supabase console:

### 1. Check Supabase Auth
- Buka Supabase Dashboard
- Authentication → Users
- Cari `ahmad.sutrisno@example.com`
- Verify `app_metadata.role = "field_officer"`

### 2. Check public.users
- SQL Editor
- Run:
```sql
SELECT email, role, is_active 
FROM public.users 
WHERE role = 'field_officer'
ORDER BY email;
```

Should show:
```
ahmad.sutrisno@example.com | field_officer | true
budi.santoso@example.com   | field_officer | true
citra.dewi@example.com     | field_officer | true
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Email atau password salah" | Periksa typo di email/password, gunakan tabel di atas |
| "Akun ini memiliki role citizen..." | Role belum di-set di Supabase Auth, jalankan `node fix-field-officer-roles.js` lagi |
| "Akun belum ada di public.users" | Jalankan `node add-citra-to-users.js` untuk tambah yang missing |
| Browser cache issue | Hard refresh: Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac) |

## Next Steps

Setelah field officer login berhasil:
1. ✅ Test Petugas can see their tasks/assignments
2. ✅ Test Petugas can update task status
3. ✅ Test Petugas can see notifications
4. ✅ Test Petugas can view damage reports assigned to them

---

**Last Updated**: April 21, 2026
**Status**: Ready for QA testing
