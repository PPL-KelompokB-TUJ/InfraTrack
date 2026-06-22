# 📋 Panduan Lengkap Dokumentasi Tugas Besar Cloud Computing
## Proyek: InfraTrack | Platform: Azure + Vercel + Supabase

Dokumen ini adalah checklist lengkap **apa saja yang perlu di-screenshot dan didokumentasikan** untuk memenuhi setiap poin dalam format laporan tugas besar.  
Setiap item diberi label:  
- 📸 = Perlu screenshot  
- 📝 = Perlu teks/penjelasan tertulis  
- 🌐 = Dilakukan di browser  
- 🖥️ = Dilakukan di terminal SSH  
- ☁️ = Dilakukan di portal Azure  
- 🟢 = Dilakukan di dashboard Supabase  
- 🟣 = Dilakukan di dashboard Vercel  

---

## BAB II — PERANCANGAN ARSITEKTUR CLOUD

### 2.2 Diagram Arsitektur Sistem
> Format laporan meminta **gambar diagram arsitektur**.

📝 **Apa yang perlu dibuat:**
Buat diagram yang memuat komponen berikut (bisa menggunakan draw.io, Canva, atau Lucidchart secara gratis):

```
[User/Browser]
      │ HTTPS
      ▼
[Vercel — Frontend React/Vite]
      │ HTTPS (VITE_API_URL)
      ▼
[VM-LoadBalancer Azure — NGINX + SSL (nip.io)]
      │ HTTP Round-Robin
     ┌┴─────────────────┐
     ▼                   ▼
[VM-AppServer1]    [VM-AppServer2]
  Node.js + PM2      Node.js + PM2
     └─────────────────┘
              │ PostgreSQL (REST API)
              ▼
     [Supabase — Database & Auth]
```

📸 **Screenshot yang diperlukan:**
- Export diagram sebagai gambar (PNG/JPG) lalu sisipkan ke laporan

---

### 2.3 Spesifikasi Infrastruktur
> Isi tabel spesifikasi di laporan dengan data berikut:

📝 **Isi tabel ini di laporan:**

| Komponen | Deskripsi |
|----------|-----------|
| Web Server | Node.js v20 + PM2, dijalankan di 2 VM Azure (VM-AppServer1 & VM-AppServer2), Port 5000 |
| Load Balancer | NGINX (Reverse Proxy + Round Robin), berjalan di VM-LoadBalancer Azure, Port 80 & 443 |
| Database Server | Supabase (PostgreSQL) — Database as a Service, terpusat dan diakses oleh kedua AppServer |
| Operating System | Ubuntu Server 24.04 LTS (ARM64) di ketiga VM |
| Cloud Provider | Microsoft Azure (Frontend: Vercel, Database: Supabase) |
| SSL/TLS | Let's Encrypt via Certbot, domain wildcard nip.io |

---

## BAB III — IMPLEMENTASI

---

### 3.1 Screenshot: Konfigurasi Web Server (VM-AppServer)

Lakukan SSH ke VM-AppServer1 dan VM-AppServer2, lalu ambil screenshot untuk hal berikut:

#### ☁️ A. Halaman Virtual Machines di Azure Portal
📸 Buka [portal.azure.com](https://portal.azure.com) → "Virtual Machines" → ambil screenshot halaman daftar VM.  
**Yang harus terlihat:** Ketiga VM (`VM-LoadBalancer`, `VM-AppServer1`, `VM-AppServer2`) dengan status **Running** (hijau).

---

#### ☁️ B. Detail Spesifikasi salah satu VM AppServer
📸 Klik VM-AppServer1 → lihat halaman "Overview".  
**Yang harus terlihat:** Nama VM, Region (East Asia), Size (Standard_B2ls_v2), Status Running, Public IP address.

---

#### 🖥️ C. PM2 Running di AppServer (Aplikasi Berjalan)
SSH ke masing-masing AppServer, lalu jalankan:
```bash
pm2 list
```
📸 Screenshot output terminal.  
**Yang harus terlihat:** Proses `infratrack-backend` dengan status **online** (hijau), uptime, dan PID.

---

#### 🖥️ D. Node.js Terinstall
Di terminal SSH, jalankan:
```bash
node --version
npm --version
```
📸 Screenshot output (misal: `v20.x.x`).

---

#### 🖥️ E. Kode Aplikasi Berhasil Di-clone
Di terminal SSH, jalankan:
```bash
ls -la ~/InfraTrack-CC/
```
📸 Screenshot daftar file di dalam folder proyek (tampil `server.js`, `package.json`, dll).

---

### 3.2 Screenshot: Konfigurasi Database Server (Supabase)

#### 🟢 A. Dashboard Supabase — Project Overview
📸 Buka [app.supabase.com](https://app.supabase.com) → buka project InfraTrack → halaman **Home/Overview**.  
**Yang harus terlihat:** Nama project, status database (Active/Healthy), region.

---

#### 🟢 B. Daftar Tabel Database
📸 Di sidebar Supabase → klik **Table Editor** atau **Database** → **Tables**.  
**Yang harus terlihat:** Daftar tabel yang ada (damage_reports, users, infrastructure_assets, dll).

---

#### 🟢 C. Isi Data Salah Satu Tabel (Bukti Data Tersimpan)
📸 Klik tabel `damage_reports` → tampilkan beberapa baris data.  
**Yang harus terlihat:** Data laporan kerusakan yang telah dimasukkan melalui aplikasi.

---

#### 🟢 D. Konfigurasi API Key / Connection String (Disamarkan)
📸 Di Supabase → **Project Settings** → **API** → tampilkan bagian URL dan `anon key`.  
> ⚠️ **PENTING:** Samarkan/blur bagian tengah key sebelum screenshot. Jangan tampilkan key lengkap.  
**Yang harus terlihat:** Format URL `https://[project-id].supabase.co` dan format key (tidak penuh).

---

### 3.3 Screenshot: Konfigurasi Load Balancer (NGINX di Azure)

#### ☁️ A. Network Security Group (NSG) — Aturan Port
📸 Di Azure Portal → buka VM-LoadBalancer → klik **Networking** atau **Network Security Group**.  
**Yang harus terlihat:** Inbound rules yang membuka Port **22 (SSH)**, **80 (HTTP)**, **443 (HTTPS)**.

📸 Ulangi untuk VM-AppServer → tampilkan NSG yang hanya membuka Port **22** dan **5000**.

---

#### 🖥️ B. File Konfigurasi NGINX
SSH ke VM-LoadBalancer, lalu jalankan:
```bash
cat /etc/nginx/sites-available/default
```
📸 Screenshot output yang menampilkan konfigurasi `upstream infratrack_backend` beserta kedua IP AppServer.

---

#### 🖥️ C. Status NGINX Berjalan
Di terminal SSH VM-LoadBalancer, jalankan:
```bash
sudo systemctl status nginx
```
📸 Screenshot output.  
**Yang harus terlihat:** Status `active (running)` berwarna hijau.

---

#### 🖥️ D. Sertifikat SSL (HTTPS dengan Certbot)
Di terminal SSH VM-LoadBalancer, jalankan:
```bash
sudo certbot certificates
```
📸 Screenshot output.  
**Yang harus terlihat:** Domain `20.2.140.252.nip.io` dengan tanggal expiry sertifikat.

---

### 3.4 Screenshot: Deployment Aplikasi

#### 🟣 A. Dashboard Vercel — Deployment Berhasil
📸 Buka [vercel.com/dashboard](https://vercel.com/dashboard) → pilih project InfraTrack.  
**Yang harus terlihat:** Status deployment terbaru **Ready** (hijau), URL deployment (`.vercel.app`), dan branch/commit yang di-deploy.

---

#### 🟣 B. Environment Variables di Vercel
📸 Vercel → project → **Settings** → **Environment Variables**.  
**Yang harus terlihat:** Variable `VITE_API_URL` dengan nilai yang mengarah ke IP Load Balancer Azure (bisa disamarkan sebagian nilainya).

---

#### 🖥️ C. File .env di AppServer (Disamarkan)
SSH ke AppServer1, jalankan:
```bash
cat ~/InfraTrack-CC/.env
```
📸 Screenshot, tapi **blur/hapus semua nilai setelah tanda `=`** untuk keamanan.  
**Yang harus terlihat:** Nama variabel seperti `SUPABASE_URL=`, `SUPABASE_SERVICE_KEY=`, `NODE_ENV=production`, dll.

---

## BAB IV — PENGUJIAN DAN HASIL

---

### 4.1 Screenshot: Pengujian Akses Aplikasi (Frontend Online)

#### 🌐 A. Halaman Utama Aplikasi di Browser
📸 Buka URL Vercel di browser (misal: `https://infra-track.vercel.app` atau URL spesifik kalian).  
**Yang harus terlihat:** Halaman Landing Page atau Login Page InfraTrack dengan URL HTTPS terlihat jelas di address bar.

---

#### 🌐 B. Halaman Setelah Login (Dashboard Admin)
📸 Login sebagai admin → ambil screenshot halaman Dashboard.  
**Yang harus terlihat:** URL aplikasi dan konten dashboard (statistik, grafik, dll).

---

#### 🌐 C. Fitur Utama Berjalan — Laporan Kerusakan
📸 Navigasi ke halaman laporan → ambil screenshot tabel laporan yang berisi data.  
**Yang harus terlihat:** Daftar laporan kerusakan dengan status dan skor prioritas.

---

### 4.2 Screenshot: Pengujian Database (Penyimpanan & Pengambilan Data)

#### 🌐 A. Submit Laporan Baru dari Aplikasi
📸 Buka halaman publik laporan kerusakan → isi formulir → klik Kirim.  
📸 Ambil screenshot halaman konfirmasi yang menampilkan **kode tiket** (misal: `INF-20260613-XXXXX`).

---

#### 🟢 B. Data Muncul di Supabase Setelah Submit
📸 Langsung setelah submit → buka Supabase → **Table Editor** → `damage_reports`.  
**Yang harus terlihat:** Baris data baru dengan kode tiket yang sama dengan yang muncul di aplikasi.  
*(Ini membuktikan koneksi aplikasi → database berhasil)*

---

### 4.3 Screenshot: Pengujian Load Balancer

#### 🖥️ A. Log Akses NGINX (Request Masuk ke Load Balancer)
SSH ke VM-LoadBalancer, jalankan:
```bash
sudo tail -f /var/log/nginx/access.log
```
📸 Screenshot saat Anda membuka aplikasi dari browser — akan muncul log request HTTP.  
**Yang harus terlihat:** Baris log berisi IP client, request path, response code `200`.

---

#### 🌐 B. Fitur Export Berjalan Melalui Load Balancer
📸 Di aplikasi → navigasi ke halaman **Export** → klik "Ekspor Sekarang".  
📸 Screenshot saat proses berjalan (status "Diproses").  
📸 Screenshot saat status berubah menjadi **"Selesai"** dan tombol unduh tersedia.  
📸 Screenshot file PDF atau Excel yang berhasil diunduh (tampilkan isi dokumennya).  
> Ini adalah bukti kuat bahwa request berhasil melewati Load Balancer → AppServer → menghasilkan file → dikirim kembali ke client.

---

#### 🖥️ C. (Opsional Nilai Tambah) Pembuktian Round-Robin
Jalankan perintah ini **dua kali berturut-turut** dari laptop lokal (bukan dari SSH):
```bash
curl -s https://20.2.140.252.nip.io/health
curl -s https://20.2.140.252.nip.io/health
```
📸 Screenshot jika response menunjukkan perbedaan server (misal hostname berbeda).  

Atau, lihat log di **kedua** AppServer secara bersamaan:
```bash
# Di AppServer1
pm2 logs infratrack-backend --lines 5

# Di AppServer2 (buka terminal baru)
pm2 logs infratrack-backend --lines 5
```
📸 Screenshot kedua terminal — tunjukkan request masuk ke masing-masing server.

---

## LAMPIRAN

### Lampiran A — Link GitHub Repository
📝 Tuliskan URL: `https://github.com/PPL-KelompokB-TUJ/InfraTrack`

### Lampiran B — Link Aplikasi Online
📝 Tuliskan URL Vercel kalian (frontend)  
📝 Tuliskan URL Load Balancer: `https://20.2.140.252.nip.io` (backend)

### Lampiran C — Screenshot Tambahan (Opsional tapi Poin Plus)
📸 Halaman Azure Portal → **Cost Management** (membuktikan resource yang digunakan)  
📸 Monitoring PM2: `pm2 monit` — tampilkan penggunaan CPU dan RAM real-time  
📸 Sertifikat HTTPS valid di browser (klik ikon gembok di address bar → "Certificate is valid")

---

## ✅ CHECKLIST RINGKASAN SCREENSHOT

### BAB II (Arsitektur)
- [ ] 🖼️ Diagram arsitektur sistem (dibuat manual, export jadi gambar)

### BAB III (Implementasi)
**Web Server:**
- [ ] ☁️ Daftar 3 VM di Azure Portal (status Running)
- [ ] ☁️ Detail spesifikasi VM-AppServer1
- [ ] 🖥️ Output `pm2 list` di AppServer1
- [ ] 🖥️ Output `pm2 list` di AppServer2
- [ ] 🖥️ Output `node --version` di salah satu AppServer
- [ ] 🖥️ Isi folder kode aplikasi (`ls -la`)

**Database:**
- [ ] 🟢 Dashboard Supabase project overview
- [ ] 🟢 Daftar tabel di Table Editor
- [ ] 🟢 Isi data tabel `damage_reports`
- [ ] 🟢 Halaman API Settings (URL + key disamarkan)

**Load Balancer:**
- [ ] ☁️ NSG rules VM-LoadBalancer (port 80, 443, 22)
- [ ] ☁️ NSG rules VM-AppServer (port 5000, 22)
- [ ] 🖥️ Konfigurasi NGINX (`cat /etc/nginx/sites-available/default`)
- [ ] 🖥️ Status NGINX (`systemctl status nginx`)
- [ ] 🖥️ Sertifikat SSL (`certbot certificates`)

**Deployment:**
- [ ] 🟣 Dashboard Vercel — status deployment Ready
- [ ] 🟣 Environment Variables di Vercel
- [ ] 🖥️ File .env di AppServer (disamarkan)

### BAB IV (Pengujian)
- [ ] 🌐 Halaman utama aplikasi di browser (URL HTTPS terlihat)
- [ ] 🌐 Halaman dashboard setelah login
- [ ] 🌐 Halaman laporan aktif berisi data
- [ ] 🌐 Form laporan kerusakan diisi dan dikonfirmasi (kode tiket muncul)
- [ ] 🟢 Data baru muncul di Supabase setelah submit
- [ ] 🖥️ Log NGINX saat request masuk
- [ ] 🌐 Proses Export berjalan → status "Selesai"
- [ ] 🌐 File PDF/Excel hasil export berhasil diunduh

---

## ⚠️ Tips Penting Sebelum Screenshot

1. **Pastikan URL selalu terlihat** di setiap screenshot browser — ini bukti bahwa aplikasi online.
2. **Samarkan informasi sensitif:** API Key, password, IP address internal (bisa gunakan mosaic/blur).
3. **Gunakan mode fullscreen** saat screenshot untuk tampilan yang lebih rapi.
4. **Berikan nama file screenshot yang deskriptif**, misal: `03_nginx_status.png`, `04_pm2_list_server1.png` — memudahkan pengelolaan.
5. **Screenshot dalam resolusi tinggi** agar teks dalam gambar terbaca jelas di laporan.
6. **Urutkan screenshot sesuai alur** di laporan agar mudah dipahami dosen penguji.
