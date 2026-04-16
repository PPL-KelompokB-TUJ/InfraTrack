\# Task Brief: Pengembangan PBI-01 \- CRUD Data Aset Infrastruktur

\*\*Proyek:\*\* InfraTrack (Sistem Informasi Manajemen Infrastruktur Publik)  
\[cite\_start\]\*\*Assignee:\*\* Nicodemus Benaya (PBI-01, PBI-09, PBI-16, PBI-17) \[cite: 102, 219\]  
\[cite\_start\]\*\*Role / Target User:\*\* Administrator \[cite: 98\]  
\[cite\_start\]\*\*Prioritas:\*\* Tinggi \[cite: 98\]

\---

\#\# 🛠️ Tahap 0: Prasyarat (Pre-requisites)  
Sebelum memulai implementasi PBI-01, pastikan \*environment\* dan fondasi sistem berikut telah disiapkan:

\#\#\# 1\. Persiapan Infrastruktur & Tech Stack  
\* \[cite\_start\]\*\*Database:\*\* Setup PostgreSQL (versi 15+) dan aktifkan ekstensi PostGIS untuk menangani data geospasial (koordinat aset)\[cite: 108\].  
\* \[cite\_start\]\*\*Object Storage:\*\* Setup MinIO atau AWS S3 yang akan digunakan untuk menyimpan file \*upload\* foto dokumentasi\[cite: 108\].  
\* \[cite\_start\]\*\*Backend Server:\*\* Inisiasi proyek menggunakan Node.js (Express.js) atau PHP 8+ (Laravel)\[cite: 108\].   
\* \[cite\_start\]\*\*Frontend SPA:\*\* Inisiasi proyek React.js (versi 18+) dengan TypeScript dan Tailwind CSS\[cite: 108\].

\#\#\# 2\. Sistem Autentikasi & Otorisasi  
\* \[cite\_start\]Implementasi sistem autentikasi berbasis JWT (\*JSON Web Token\*)\[cite: 106\].  
\* \[cite\_start\]Buat tabel \`users\` untuk menyimpan kredensial\[cite: 144\].  
\* \[cite\_start\]Pastikan \*route\* API dan halaman \*frontend\* untuk PBI-01 diproteksi dan hanya dapat diakses oleh \*user\* dengan \*role\* \*\*Administrator\*\*\[cite: 98, 104\].

\#\#\# 3\. Pembuatan Tabel Dependensi  
\* \[cite\_start\]Tabel \`AssetCategory\` \*\*wajib\*\* dibuat terlebih dahulu sebelum \`InfrastructureAsset\` karena adanya relasi (\*foreign key\*) \`category\_id\`\[cite: 145\].  
\* \[cite\_start\]\*\*Skema \`AssetCategory\`:\*\* \`id\`, \`name\`, \`description\`, \`is\_active\`\[cite: 146\].

\---

\#\# 🚀 Tahap 1: Spesifikasi PBI-01

\#\#\# User Story  
\[cite\_start\]"Sebagai administrator, saya ingin melakukan CRUD data aset infrastruktur (jalan, jembatan, fasilitas umum) dengan form lengkap berisi nama, kategori, lokasi (koordinat GPS), kondisi awal, tahun pembangunan, dan upload foto dokumentasi aset, sehingga saya dapat membangun basis data aset infrastruktur yang terpusat dan terstruktur." \[cite: 98\]

\#\#\# Target Skema Database (Tabel \`InfrastructureAsset\`)  
Pastikan skema database dibuat dengan \*field\* berikut:  
\* \[cite\_start\]\`id\` (Primary Key) \[cite: 145\]  
\* \[cite\_start\]\`name\` (VARCHAR) \[cite: 145\]  
\* \[cite\_start\]\`category\_id\` (Foreign Key ke tabel \`AssetCategory\`) \[cite: 145\]  
\* \[cite\_start\]\`latitude\` (DECIMAL/Geospasial) \[cite: 145\]  
\* \[cite\_start\]\`longitude\` (DECIMAL/Geospasial) \[cite: 145\]  
\* \[cite\_start\]\`condition\` (VARCHAR) \[cite: 145\]  
\* \[cite\_start\]\`year\_built\` (YEAR/Date) \[cite: 145\]  
\* \[cite\_start\]\`description\` (TEXT) \[cite: 145\]  
\* \[cite\_start\]\`photo\_url\` (VARCHAR) \[cite: 145\]  
\* \[cite\_start\]\`status\` (VARCHAR) \[cite: 145\]  
\* \[cite\_start\]\`created\_at\` (TIMESTAMP) \[cite: 145\]  
\* \[cite\_start\]\`updated\_at\` (TIMESTAMP) \[cite: 145\]

\#\#\# Sub-Task Implementasi (Checklist)  
\- \[ \] \[cite\_start\]\*\*DB-1:\*\* Buat skema database/migrasi untuk tabel \`InfrastructureAsset\` dan \`AssetCategory\`\[cite: 100\].  
\- \[ \] \[cite\_start\]\*\*API-1:\*\* Buat \*REST API endpoint\* CRUD untuk aset (metode GET, POST, PUT, DELETE)\[cite: 100\].  
\- \[ \] \[cite\_start\]\*\*API-2:\*\* Implementasi layanan \*upload\* foto dari backend ke \*Object Storage\* (MinIO/S3), dan simpan URL-nya ke dalam database\[cite: 100\].  
\- \[ \] \[cite\_start\]\*\*UI-1:\*\* Buat halaman form Tambah/Edit aset di \*frontend\* dengan validasi input (field wajib tidak boleh kosong, format GPS valid)\[cite: 100\].  
\- \[ \] \[cite\_start\]\*\*UI-2:\*\* Buat halaman "Daftar Aset" untuk Administrator yang memuat fitur tabel, \*filter\* kategori, dan pencarian (\*search bar\*)\[cite: 100, 208\].

\#\#\# Conditions of Satisfaction (Kriteria Penerimaan)  
1\. \[cite\_start\]Form CRUD aset berhasil merender semua input \*field\*: nama, kategori, koordinat GPS, kondisi awal, tahun pembangunan, dan fungsi \*upload\* foto\[cite: 100\].  
2\. \[cite\_start\]Validasi antarmuka berfungsi: sistem menolak pengiriman data jika \*field\* wajib kosong atau format koordinat GPS tidak valid\[cite: 100\].  
3\. \[cite\_start\]Foto dokumentasi berhasil diunggah ke \*storage\* dan dapat diakses/dirender melalui URL yang tersimpan\[cite: 100\].  
4\. \[cite\_start\]Data aset tersimpan secara akurat ke database relasional dan muncul di halaman daftar aset\[cite: 100\].  
5\. \[cite\_start\]Administrator dapat melakukan proses pengubahan (\*edit\*) dan penghapusan (\*delete\*) pada data aset yang sudah terdaftar\[cite: 100\].  
