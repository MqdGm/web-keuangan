# Keuangan — Personal Finance Command Center 💰

Aplikasi manajemen finansial pribadi modern, elegan, dan siap produksi (*production-ready*). Dirancang khusus untuk mempermudah pelacakan arus kas, pencatatan transaksi harian, manajemen saldo multi-rekening & e-wallet Indonesia (BCA, Mandiri, GoPay, DANA, dll.), perencanaan anggaran bulanan, target tabungan, pelacakan hutang-piutang, serta integrasi pencadangan data ke Google Sheets dan Google Drive.

---

## 🌟 Fitur Utama

- 💳 **Manajemen Rekening & Dompet Multi-Akun**: Lacak saldo Bank (BCA, Mandiri, BNI, BRI, Bank Jago), E-Wallet (GoPay, DANA, OVO, ShopeePay), dan Uang Tunai fisik secara terpadu.
- ⚡ **Pencatatan Transaksi Cepat (Quick Add)**: Form transaksi kilat dengan chip nominal instan (+10rb, +50rb, +100rb, +500rb, +1jt) dan input format Rupiah otomatis.
- 🔁 **Transfer Antar Rekening**: Pindahkan saldo antar bank/e-wallet dengan otomatisasi mutasi berpasangan tanpa merusak total kekayaan bersih (*Net Worth*).
- 📊 **Dashboard Analitik Interaktif**: Dilengkapi grafik tren arus kas bulanan (*Cash Flow Area/Bar Chart*), visualisasi donat pengeluaran per kategori, dan metrik rasio tabungan (*Savings Rate*).
- 🎯 **Target Tabungan & Rencana Masa Depan**: Hitung persentase ketercapaian, sisa target, rekomendasi tabungan bulanan otomatis, dan catat setoran langsung dari rekening.
- 🛡️ **Kesehatan Anggaran (Budgeting)**: Atur pagu total bulanan dan limit per kategori pengeluaran dengan indikator visual *Aman* (<75%), *Waspada* (75-99%), dan *Melebihi Anggaran* (>=100%).
- 🤝 **Pelacakan Hutang & Piutang**: Pantau kewajiban pinjaman yang harus dibayar maupun tagihan piutang pihak lain lengkap dengan tanggal jatuh tempo dan pencatatan cicilan.
- ⏰ **Transaksi Berulang & Pengingat Tagihan**: Jadwalkan pengeluaran rutin (Wifi, Netflix, Spotify, Token Listrik, BPJS) dengan tombol 1-klik bayar langsung.
- 📁 **Pusat Ekspor & Impor Cadangan**: Ekspor transaksi ke CSV (kompatibel Excel), unduh cadangan lengkap seluruh basis data dalam format JSON, dan pulihkan data kapan saja.
- ☁️ **Arsitektur Integrasi Google Sheets & Google Drive**: Format multi-tab 5 lembar kerja otomatis (*Transactions, Accounts, Categories, Budgets, Monthly Summary*) dan pencadangan terenkripsi ke Google Drive.
- 🌓 **Tema Terang & Gelap Elegan**: Palet warna modern disesuaikan dengan kontras optimal dan dukungan otomatis tema sistem.
- 📱 **Desain Mobile-First & PWA**: Navigasi bawah ramah sentuhan satu tangan, floating action button, dan manifest PWA agar dapat dipasang di layar utama Android/iOS seperti aplikasi natif.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js 14+ (App Router), TypeScript, React, Tailwind CSS
- **Komponen UI**: Radix UI Primitives, Lucide React Icons, Class Variance Authority
- **Grafik & Visualisasi**: Recharts
- **Formulir & Validasi**: React Hook Form, Zod
- **Penanganan Tanggal**: date-fns (dengan lokalisasi Bahasa Indonesia)
- **Basis Data & Autentikasi**: Supabase PostgreSQL dengan Row Level Security (RLS) & Auth
- **Penyimpanan Lokal**: Dual-Mode Reactive Persistence (Supabase Cloud + Local Demo Storage Fallback)

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Prasyarat Sistem
- Node.js versi 18+ atau 20+
- npm atau pnpm

### 2. Pemasangan Dependensi
Buka terminal di direktori proyek dan jalankan:
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan (.env.local)
Salin berkas `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi variabel lingkungan berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

> **Catatan Demo Mode**: Jika kredensial Supabase belum diisi, aplikasi akan otomatis berjalan dalam **Mode Demo Stateful Indonesia** yang telah diisi data realistis (BCA, Mandiri, GoPay, Gaji, Belanja Supermarket, dll.) sehingga Anda dapat langsung mencoba seluruh fitur aplikasi secara instan tanpa hambatan konfigurasi!

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Konfigurasi Supabase PostgreSQL & Migrasi Skema

### 1. Buat Proyek di Supabase
1. Masuk ke [Supabase Console](https://supabase.com).
2. Buat proyek baru (*New Project*).
3. Salin `Project URL` dan `anon / public key` dari menu **Project Settings -> API** ke dalam `.env.local`.

### 2. Jalankan Migrasi Basis Data
1. Di dasbor Supabase, buka menu **SQL Editor**.
2. Buka berkas `supabase/migrations/20260918000000_init_schema.sql` pada repositori ini.
3. Tempel seluruh isi skrip SQL dan klik **Run**.
4. Skrip ini akan secara otomatis:
   - Membuat seluruh tabel (`profiles`, `accounts`, `categories`, `transactions`, `budgets`, `budget_categories`, `savings_goals`, `goal_contributions`, `debts`, `debt_payments`, `recurring_transactions`, `notifications`, `user_settings`).
   - Mengaktifkan **Row Level Security (RLS)** pada setiap tabel agar pengguna hanya dapat membaca dan memodifikasi data miliknya sendiri.
   - Membuat trigger PostgreSQL otomatis untuk membuat profil dan kategori bawaan saat ada pengguna baru yang mendaftar.
   - Mengaktifkan trigger fungsi kalkulasi saldo otomatis (`handle_transaction_balance_change`) untuk menjamin konsistensi saldo rekening saat transaksi ditambah, diedit, atau dihapus.

### 3. (Opsional) Mengisi Data Seed ke Supabase
Buka menu **SQL Editor** di Supabase, buka berkas `supabase/seed.sql`, ganti nilai `v_user_id` dengan UUID pengguna Anda dari tabel `auth.users`, lalu jalankan skrip.

---

## 🌐 Panduan Konfigurasi Google Sheets & Google Drive API

Untuk menghubungkan sinkronisasi Google Sheets dan Google Drive:

1. Buka [Google Cloud Console](https://console.cloud.google.com).
2. Buat project baru (misal: `Keuangan Personal App`).
3. Buka **APIs & Services -> Library**, cari dan aktifkan:
   - **Google Sheets API**
   - **Google Drive API**
4. Buka **APIs & Services -> OAuth consent screen**:
   - Pilih *External* dan isi informasi aplikasi.
   - Tambahkan scope: `.../auth/spreadsheets` dan `.../auth/drive.file`.
5. Buka **APIs & Services -> Credentials**:
   - Klik **Create Credentials -> OAuth client ID**.
   - Pilih Application type: **Web Application**.
   - Tambahkan **Authorized redirect URIs**:
     - Pengembangan lokal: `http://localhost:3000/api/google/callback`
     - Produksi Vercel: `https://<your-app>.vercel.app/api/google/callback`
6. Salin **Client ID** dan **Client Secret** ke dalam berkas `.env.local` dan *Environment Variables* di Vercel.

---

## 🚢 Panduan Penerapan ke Vercel (Production Deployment)

Aplikasi ini 100% siap di-*deploy* ke Vercel:

1. Dorong (*push*) kode sumber ke repositori GitHub/GitLab pribadi Anda:
   ```bash
   git add .
   git commit -m "feat: production-ready personal finance app"
   git push origin main
   ```
2. Buka [Vercel Dashboard](https://vercel.com) dan klik **Add New Project**.
3. Hubungkan repositori Git Anda.
4. Pada bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (misal: `https://your-domain.vercel.app/api/google/callback`)
5. Klik **Deploy**. Vercel akan secara otomatis membangun aplikasi Next.js dan menghasilkan tautan produksi yang aktif dalam hitungan menit.

---

## 📱 Memasang sebagai PWA (Progressive Web App)

Aplikasi telah dilengkapi dengan berkas `manifest.webmanifest`, metadata mobile, dan meta viewport anti-zoom:
- **Di Android (Chrome)**: Buka alamat web aplikasi, ketuk ikon menu tiga titik di kanan atas, lalu pilih **"Install app"** atau **"Tambahkan ke Layar Utama"**.
- **Di iOS (Safari)**: Buka alamat web aplikasi, ketuk ikon **Share**, lalu pilih **"Add to Home Screen"**.

---

## 🔒 Keamanan & Privasi Data

- **Row Level Security (RLS)**: Setiap baris data dalam database Supabase PostgreSQL dilindungi oleh kebijakan RLS `auth.uid() = user_id`. Pengguna tidak dapat melihat data pengguna lain.
- **Tanpa Kredensial di Sisi Klien**: Kredensial rahasia seperti `SERVICE_ROLE_KEY` dan `GOOGLE_CLIENT_SECRET` disimpan di variabel lingkungan server dan tidak pernah diekspos ke peramban.
- **Validasi Ketat Zod**: Setiap data masukan divalidasi pada sisi formulir dan endpoint API.

---

## 📄 Lisensi
Hak Cipta © 2026. Dikembangkan untuk pengelolaan finansial harian yang rapi dan terukur.
#   w e b - k e u a n g a n  
 