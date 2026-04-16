# Panduan Pengerjaan InfraTrack MVP (PBI-01 Fokus)

Dokumen ini berisi langkah-langkah teknis dan prompt AI untuk memulai pengembangan project InfraTrack dengan strategi "yang penting jalan".

## I. Prasyarat (Sebelum Menulis Kode)

Sebelum meminta AI membuat kode, lakukan setup berikut untuk mempermudah pengerjaan:

1.  **Backend & Database (Supabase)**:
    * Buat project baru di [Supabase](https://supabase.com/).
    * Aktifkan ekstensi **PostGIS** di menu Database -> Extensions.
    * Buat tabel `infrastructure_assets` dengan struktur:
        * `id`: uuid (primary key)
        * `name`: text
        * `category_id`: uuid (foreign key ke tabel categories)
        * `location`: geography(POINT, 4326)
        * `condition`: text (baik/rusak ringan/rusak berat)
        * `year_built`: int
        * `photo_url`: text
        * `description`: text
    * Buat **Storage Bucket** publik bernama `assets-photos` untuk menyimpan foto dokumentasi.

2.  **Frontend Setup**:
    * Inisialisasi project React/Vite dengan Tailwind CSS.
    * Install library pendukung: `@supabase/supabase-js`, `leaflet`, `react-leaflet`, `lucide-react`.

---

## II. Prompt AI Agent (PBI-01: Manajemen Aset)

Gunakan prompt berikut secara berurutan pada AI coding agent (seperti Cursor, Bolt.new, atau Lovable).

### Prompt 1: Setup Koneksi & Schema
> "Saya sedang membangun aplikasi InfraTrack (Sistem Manajemen Infrastruktur). Gunakan React, Tailwind, dan Supabase. Buatlah file konfigurasi `supabaseClient.js` dan buatkan interface TypeScript untuk tabel `infrastructure_assets` berdasarkan schema: id, name, category, location (lat/lng), condition, year_built, dan photo_url."

### Prompt 2: Form CRUD Aset (Lengkap dengan Upload & Map)
> "Buatlah halaman 'Manajemen Aset' untuk peran Administrator. Halaman ini harus berisi:
> 1. Tabel daftar aset yang mengambil data dari tabel `infrastructure_assets` di Supabase.
> 2. Tombol 'Tambah Aset' yang membuka modal/form.
> 3. Di dalam form, tambahkan input untuk: Nama Aset, Dropdown Kategori (Jalan, Jembatan, Fasum), Dropdown Kondisi, dan Tahun Pembangunan.
> 4. Implementasikan fitur integrasi Map menggunakan Leaflet.js di dalam form: user bisa klik di peta untuk mendapatkan koordinat lat/lng secara otomatis.
> 5. Implementasikan fitur Upload Foto: foto harus diunggah ke Supabase Storage bucket 'assets-photos' dan URL-nya disimpan ke kolom photo_url di database.
> 6. Pastikan UI menggunakan Tailwind CSS dengan tema profesional (bersih, font sans-serif, aksen warna teal/cyan)."

---

## III. Daftar Ceklis Keberhasilan (Condition of Satisfaction)

Berdasarkan proposal, PBI-01 dianggap selesai jika:
* [ ] Form CRUD menampilkan semua field wajib (nama, kategori, koordinat, kondisi, tahun, foto).
* [ ] Koordinat GPS tersimpan dalam format yang valid.
* [ ] Foto dokumentasi berhasil diunggah dan muncul di daftar aset melalui URL.
* [ ] Administrator bisa melakukan edit dan hapus data yang sudah ada.
