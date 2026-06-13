# Laporan Dokumentasi Infrastruktur Cloud: InfraTrack

Dokumen ini disusun untuk memenuhi kewajiban dokumentasi tugas mata kuliah Cloud Computing. Berikut adalah penjabaran dari arsitektur, konfigurasi, proses *deployment*, hingga bukti pengujian aplikasi InfraTrack.

---

## 1. Arsitektur Cloud yang Digunakan

Sistem InfraTrack dirancang menggunakan arsitektur *Microservices* dengan pemisahan antara *Frontend*, *Backend*, dan *Database*, serta mengimplementasikan **Layer 7 Load Balancing**.

* **Frontend:** Di- *host* menggunakan **Vercel**. Dibangun dengan React/Vite, bertugas sebagai antarmuka pengguna yang terhubung langsung ke internet publik secara aman (HTTPS).
* **Load Balancer (Pintu Masuk Backend):** Menggunakan **Microsoft Azure Virtual Machine (VM)** bersistem operasi Ubuntu 24.04. Menjalankan **NGINX** sebagai *Reverse Proxy* dan *Load Balancer* untuk mendistribusikan trafik secara adil (*Round Robin*) ke server-server pekerja.
* **App Servers (Backend Pekerja):** Menggunakan **2 Microsoft Azure Virtual Machines (VM-AppServer1 & VM-AppServer2)**. Menjalankan *runtime* Node.js yang dikelola oleh proses manajer **PM2**. Kedua server ini bertugas memproses logika bisnis seperti pembuatan laporan PDF dan Excel.
* **Database & Auth:** Menggunakan **Supabase (PostgreSQL)** sebagai basis data terpusat (*Database as a Service*) yang dapat diakses secara sinkron oleh kedua AppServer.
* **Keamanan (SSL/TLS):** Menggunakan **Let's Encrypt (Certbot)** dan *wildcard DNS* **nip.io** untuk melakukan *SSL Offloading* di Load Balancer, sehingga komunikasi dari Vercel ke Azure dijamin aman (HTTPS).

---

## 2. Konfigurasi Layanan

### A. Konfigurasi Jaringan Azure (Network Security Group / NSG)
* **VM-LoadBalancer:** Membuka Port `22` (SSH), Port `80` (HTTP), dan Port `443` (HTTPS) agar dapat diakses oleh publik dan Vercel.
* **VM-AppServer 1 & 2:** Membuka Port `22` (SSH) dan Port `5000` (Port aplikasi Node.js).

### B. Konfigurasi NGINX (Load Balancer)
NGINX dikonfigurasi untuk menerima permintaan (HTTPS) dan meneruskannya (*proxy_pass*) ke blok *upstream* yang berisi daftar Public IP dari AppServer 1 dan 2.
```nginx
upstream infratrack_backend {
    server 20.255.59.42:5000; # Public IP AppServer1
    server 20.2.233.165:5000; # Public IP AppServer2
}
```

### C. Konfigurasi Lingkungan (Environment Variables)
* **Vercel (Frontend):** 
  Menambahkan variabel `VITE_API_URL = https://20.2.140.252.nip.io` agar Vercel tahu arah komunikasi ke Load Balancer Azure.
* **Azure AppServers (Backend):**
  Mengonfigurasi file `.env` dengan mengatur `NODE_ENV=production` dan menetapkan `PUBLIC_BACKEND_URL` agar tautan unduhan dokumen (PDF/Excel) merujuk ke domain Load Balancer, bukan localhost.

### D. Konfigurasi Sistem Operasi (Dependensi)
* Menginstal `fonts-liberation` dan `fonts-dejavu` pada kedua AppServer agar modul pembuat PDF (Puppeteer) dapat merender teks dokumen dengan sempurna di lingkungan Linux tanpa antarmuka grafis (Headless).

---

## 3. Proses Deployment

Proses *deployment* dilakukan secara terdistribusi pada masing-masing komponen layanan:

1. **Deployment Database:** Membuat *project* baru di Supabase, menjalankan skrip migrasi SQL untuk tabel, dan mendapatkan kredensial (URL & API Key).
2. **Deployment Backend (AppServers):**
   * Mengakses VM melalui SSH.
   * Melakukan *cloning repository* kode dari GitHub.
   * Menginstal *dependencies* menggunakan `npm install`.
   * Menyiapkan file `.env` dengan kredensial Supabase.
   * Menjalankan aplikasi secara *background* dan permanen menggunakan perintah `pm2 start server.js --name infratrack-backend` dan `pm2 save`.
3. **Deployment Load Balancer:**
   * Menginstal paket NGINX dan Certbot di VM-LoadBalancer.
   * Mengubah file `/etc/nginx/sites-available/default` untuk mengatur sistem *upstream routing*.
   * Mengamankan koneksi dengan *generate* sertifikat SSL: `sudo certbot --nginx -d 20.2.140.252.nip.io`.
4. **Deployment Frontend:**
   * Menghubungkan *repository* GitHub Frontend langsung ke Vercel. Vercel akan secara otomatis melakukan *build* dan merilis aplikasi web ke publik setiap kali ada perubahan kode.

---

## 4. Bukti Aplikasi Berhasil Diakses Secara Online

*(CATATAN UNTUK MAHASISWA: Bagian ini harus Anda isi sendiri dengan melakukan tangkapan layar / screenshot. Hapus tulisan instruksi ini sebelum dikumpulkan).*

Silakan ambil dan sisipkan *screenshot* berikut ke dalam dokumen laporan Word Anda:

1. **Bukti Frontend Online:** *Screenshot* halaman web Vercel Anda di *browser* (pastikan alamat URL `https://...vercel.app` terlihat).
2. **Bukti Fitur Berjalan (Export):** *Screenshot* saat Anda mengeklik tombol "Ekspor Sekarang", serta *screenshot* tabel riwayat ekspor yang menunjukkan status "Selesai".
3. **Bukti Load Balancer & Hasil Ekspor:** *Screenshot* dokumen PDF dan Excel yang sudah berhasil diunduh.
4. *(Opsional untuk nilai tambah)* **Bukti Azure:** *Screenshot* halaman *Virtual Machines* di Azure Portal yang menampilkan ketiga VM Anda sedang dalam status *Running*.
