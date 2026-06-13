# Panduan Super Detail: Setup NGINX Load Balancing di Azure (Untuk Pemula)

Panduan ini dibuat khusus untuk Anda yang belum pernah menggunakan Microsoft Azure sebelumnya. Ikuti langkah-langkah ini secara perlahan dan berurutan.

---

## Tahap 1: Membuat Virtual Machine (VM) di Azure Portal

Kita membutuhkan 3 server (VM). Proses ini akan kita ulangi 3 kali, dengan sedikit perbedaan pada bagian port untuk server NGINX (Load Balancer).

### Langkah-langkah (Lakukan 3 Kali):
1. **Login ke Azure Portal:** Buka [portal.azure.com](https://portal.azure.com/) dan login menggunakan akun email kampus/Azure for Students Anda.
2. Di halaman utama pencarian (atas tengah), ketik **Virtual machines** lalu klik layanannya.
3. Klik tombol **+ Create** lalu pilih **Azure virtual machine**.

**Di Tab "Basics":**
- **Subscription:** Pastikan memilih *Azure for Students*.
- **Resource group:** Klik "Create new" di bawah kotak teks, beri nama (misalnya: `RG-InfraTrack`), lalu klik OK. (Untuk VM ke-2 dan ke-3, pilih nama ini dari *dropdown*).
- **Virtual machine name:**
  - Pembuatan ke-1: `VM-LoadBalancer`
  - Pembuatan ke-2: `VM-AppServer1`
  - Pembuatan ke-3: `VM-AppServer2`
- **Region:** Pilih **East Asia** (Hong Kong). *(Ini lebih baik dan lebih cepat ping/koneksinya ke Indonesia dibandingkan Australia East).*
- **Image:** Pilih **Ubuntu Server 24.04 LTS - ARM64** *(Tidak masalah sama sekali menggunakan versi 24.04, yang terpenting adalah ada tulisan ARM64).*
- **Size:** Klik "See all sizes" dan pilih **Standard_B2ls_v2**. *(Ini juga merupakan varian prosesor ARM yang sangat murah dan sangat sanggup menjalankan tugas ini).*
- **Administrator account:**
  - Pilih **Password** (agar lebih mudah jika Anda belum paham SSH Key).
  - Masukkan *Username* (misal: `azureuser`)
  - Masukkan *Password* (harus panjang & rumit, lalu catat baik-baik!).
- **Inbound port rules:**
  - Untuk `VM-LoadBalancer`: Pilih **Allow selected ports**, lalu centang **HTTP (80)** dan **SSH (22)**.
  - Untuk `VM-AppServer1` & `VM-AppServer2`: Centang **SSH (22)** saja.

**Menyelesaikan Pembuatan:**
- Klik tombol biru **Review + create** di bagian bawah.
- Tunggu validasi selesai, lalu klik **Create**.
- Tunggu 2-5 menit hingga muncul tulisan *“Your deployment is complete”*, lalu klik **Go to resource**.
- **SANGAT PENTING:** Catat **Public IP address** dan **Private IP address** dari ketiga VM tersebut di Notepad Anda.

---

## Tahap 2: Remote / Masuk ke dalam Server (SSH)

Anda akan mengontrol server menggunakan CMD / Terminal di laptop Windows Anda.

1. Buka **Command Prompt (CMD)** atau **PowerShell** di Windows Anda.
2. Ketik perintah berikut untuk masuk ke server:
   ```bash
   ssh azureuser@<MASUKKAN_PUBLIC_IP_VM_ANDA>
   ```
   *(Contoh: `ssh azureuser@20.123.45.67`)*
3. Jika muncul pertanyaan *"Are you sure you want to continue connecting (yes/no/[fingerprint])?"*, ketik **yes** lalu tekan Enter.
4. Masukkan password yang Anda buat tadi. *(Catatan: Saat mengetik password, teks memang tidak akan terlihat/kosong, ini normal. Ketik saja lalu Enter)*.
5. Anda sekarang sudah masuk ke dalam komputer server Azure!

---

## Tahap 3: Setup Aplikasi di `VM-AppServer1` & `VM-AppServer2`

Lakukan langkah ini secara bergantian dengan me-remote ke IP Public `VM-AppServer1`, dan setelah selesai ulangi lagi untuk `VM-AppServer2`.

**1. Install Node.js dan PM2:**
Setelah berhasil masuk (SSH) ke dalam server, jalankan (copy-paste) perintah ini satu per satu:
```bash
sudo apt update
sudo apt install curl -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
sudo npm install -g pm2
```

**2. Download Kode Aplikasi (Clone):**
*(Pastikan repo Github Anda bersifat Public, atau gunakan Personal Access Token jika Private)*
```bash
git clone https://github.com/nicodemusbenaya/InfraTrack-CC.git
cd InfraTrack-CC
```

**3. Install Dependencies dan Jalankan:**
```bash
npm install
pm2 start server.js --name "infratrack-backend"
```
Jika Anda mengetik `pm2 list`, Anda akan melihat aplikasi berstatus *online*. Sekarang Anda boleh menutup CMD / keluar dari server ini.

---

## Tahap 4: Setup NGINX di `VM-LoadBalancer`

Sekarang, buka CMD baru, dan remote (SSH) ke Public IP dari **`VM-LoadBalancer`**.

**1. Install NGINX:**
```bash
sudo apt update
sudo apt install nginx -y
```

**2. Mengubah Konfigurasi NGINX:**
Kita perlu mengedit file default NGINX. Ketik:
```bash
sudo nano /etc/nginx/sites-available/default
```

Layar editor akan terbuka. **Hapus SEMUA isi file tersebut** (tahan tombol Backspace/Delete), lalu Copy-Paste kode di bawah ini:

> [!WARNING]
> **PENTING SEBELUM COPY-PASTE:** 
> Karena Private IP Anda semuanya sama (berarti mereka terpisah jalurnya), Anda **HARUS menggunakan Public IP** dari `VM-AppServer1` dan `VM-AppServer2` di bawah ini agar Load Balancer bisa menghubungi mereka. 

```nginx
upstream infratrack_backend {
    # Public IP dari AppServer 1
    server 20.255.59.42:5000; 
    
    # Public IP dari AppServer 2
    server 20.2.233.165:5000; 
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://infratrack_backend;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**3. Menyimpan dan Menutup Editor (NANO):**
- Tekan **Ctrl + X** di keyboard Anda.
- Ketik **Y** (untuk menyimpan).
- Tekan **Enter**.

**4. Restart NGINX:**
Jalankan perintah ini agar NGINX membaca file yang baru Anda edit:
```bash
sudo systemctl restart nginx
```

---

## Tahap 5: Pengujian Akhir (Sukses!)

1. Buka browser (Chrome/Edge) di laptop Anda.
2. Ketikkan **Public IP address dari `VM-LoadBalancer`** di *address bar* (misal: `http://20.123.45.67`).
3. Anda seharusnya bisa melihat aplikasi backend InfraTrack merespon (kemungkinan berupa JSON *health check* jika rutenya adalah API, atau halaman aplikasi jika ini adalah *full-stack* web).
4. **Pembuktian Load Balancing:** NGINX kini bertugas membagi pengunjung secara bergantian: pengunjung pertama dilempar ke `VM-AppServer1`, pengunjung kedua ke `VM-AppServer2`, pengunjung ketiga kembali ke `VM-AppServer1`, dan seterusnya.

Selamat! Anda telah berhasil membangun arsitektur sistem *Load Balancing* di Cloud menggunakan Microsoft Azure!
