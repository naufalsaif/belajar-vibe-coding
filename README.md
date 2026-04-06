# Belajar Vibe Coding - Backend Authentication API

Proyek ini adalah sistem *Backend API* otentikasi pengguna modern dan cepat yang dikembangkan menggunakan **Bun** dan **ElysiaJS**. Proyek ini menekankan pada keamanan (validasi *payload*, *error handling* terpusat, pengamanan *password*), arsitektur kode yang bersih dan berlapis (Controller-Service pattern), serta kinerja maksimal berkat runtime Bun.

## 🚀 Technology Stack & Libraries

Aplikasi ini dibangun menggunakan tumpukan teknologi modern masa kini:
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/) (Extremely Fast Bun Web Framework)
- **Database**: [MariaDB](https://mariadb.org/) / MySQL
- **ORM (Object Relational Mapping)**: [Drizzle ORM](https://orm.drizzle.team/) (Type-safe ORM ringan dan super cepat)
- **Validasi Data**: TypeBox (Terintegrasi bawaan dari ElysiaJS)
- **Keamanan (Hashing)**: `bcrypt`
- **Testing**: `bun:test` (Pustaka pengujian bawaan Bun)

---

## 📁 Arsitektur & Struktur Folder

Aplikasi ini menggunakan pola arsitektur **Controller-Service** yang memisahkan antara penanganan permintaan *HTTP Routing* (Controller) dengan *Business Logic* (Service).

```text
belajar-vibe-coding/
├── src/
│   ├── db/
│   │   ├── index.ts        # Inisiasi koneksi ke database Drizzle ORM
│   │   └── schema.ts       # Definisi skema tabel database (Users & Sessions)
│   │
│   ├── routes/             # Layer Controller
│   │   └── users-route.ts  # Menangani alur HTTP, validasi payload (TypeBox), ekskstraksi Token
│   │
│   ├── services/           # Layer Business Logic
│   │   └── users-service.ts# Logika registrasi, komparasi bcrypt, token manajemen
│   │
│   ├── utils/              # Layer Helpers (Utilitas)
│   │   └── errors.ts       # Kelas AppError untuk standarisasi format pesan error
│   │
│   └── index.ts            # Entry-point utama aplikasi, Global Error Handler & Registrasi Rute
│
├── tests/
│   └── user.test.ts        # Kumpulan unit test (Automated Testing)
│
├── drizzle.config.ts       # Konfigurasi migrasi data untuk Drizzle
├── package.json            # Daftar peredaran dependensi NPM
└── tsconfig.json           # Konfigurasi kompiler TypeScript
```

### Penamaan Konvensi (Naming Convention)
- **File & Direktori**: Menggunakan *kebab-case* (contoh: `users-service.ts`, `users-route.ts`)
- **Variabel & Fungsi**: Menggunakan *camelCase* (contoh: `registerUser`, `authMiddleware`)
- **Kelas / Model Interface**: Menggunakan *PascalCase* (contoh: `AppError`)

---

## 🗄️ Skema Database (Database Schema)

Terdapat dua entitas utama pada database kita yang didefinisikan menggunakan Drizzle `mysql-core`:

### 1. Tabel `users`
Menyimpan identitas rahasia pengguna secara persisten.
| Field | Type | Attributes | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `int` | Primary Key, Auto Increment | ID unik pengguna |
| `name` | `varchar(255)` | Not Null | Nama pengguna |
| `email` | `varchar(255)` | Not Null, Unique | Email (Tervalidasi & Unik) |
| `password` | `varchar(255)` | Not Null | Hash Bcrypt rahasia pengguna |
| `created_at`| `timestamp` | Default: NOW() | Waktu profil dibuat |

### 2. Tabel `sessions`
Sistem *Session Identifier* (bukan JWT token) demi kontrol penuh penghapusan (*Logout*) sisi Server.
| Field | Type | Attributes | Deskripsi |
| :--- | :--- | :--- | :--- |
| `token` | `varchar(255)` | Primary Key | UUID Token Otentikasi (Bearer) |
| `user_id`| `int` | Foreign Key (`users.id`) | Relasi (kepemilikan akses) dari pengguna aktif |

---

## 📡 API Endpoints

Seluruh respon *error* menggunakan sentralisasi error format: `{"error": "Pesan kesahalan"}` atau `422 Validation Error`.

### 1. Registrasi Akun
Mendaftarkan akun baru ke sistem.
- **URL**: `/api/users/`
- **Method**: `POST`
- **Body JSON**:
  - `name`: (String, Min: 3, Max: 255 chars)
  - `email`: (String format Email, Max: 255 chars)
  - `password`: (String, Min: 6, Max: 255 chars)
- **Response Success (200)**: `{"data": "OK"}`

### 2. Login Akun
Melakukan otentikasi pengguna menggunakan kredensial email & kata sandi, yang membuahkan hasil *Bearer Token*.
- **URL**: `/api/users/login`
- **Method**: `POST`
- **Body JSON**: 
  - `email`: (String format Email)
  - `password`: (String)
- **Response Success (200)**: `{"data": "e3b0c442-uuid-token..."}`

### 3. Profil Pengguna (Mendapatkan Current User)
Mendapatkan metadata mendetail dari user. Dilindungi kewajiban melampirkan header `Authorization` Bearer Token.
- **URL**: `/api/users/current`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token_dari_api_login>`
- **Response Success (200)**: `{"data": { "id": 1, "name": "Budi", "email": "budi@gmail.com", "createdAt": "..." }}` (Password disembunyikan/dikelucan).

### 4. Logout Pengguna
Menghancurkan Sesi/Token Otentikasi saat ini, sehingga tidak dapat digunakan kembali.
- **URL**: `/api/users/logout`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token_dari_api_login>`
- **Response Success (200)**: `{"data": "OK"}`

---

## 🛠️ Panduan Pengembang (Development Setup)

Bagaimana cara memasang aplikasi ini secara lokal.

### 1. Persyaratan Instalasi
Pastikan komputer sistem anda sudah terpasang:
- Bun runtime ter-kini ([install petunjuk di bun.sh](https://bun.sh/))
- Instansi Database MariaDB / MySQL Server

### 2. Copy dan Setup Repository
```bash
# Lakukan git clone repository ini 
git clone https://github.com/naufalsaif/belajar-vibe-coding.git

# Masuk ke folder proyek
cd belajar-vibe-coding

# Install seluruh dependency dari package.json (sangat cepat dibandingkan npm)
bun install
```

### 3. Konfigurasi Environment & Database Setup
1. Buat database baru di MariaDB/MySQL Anda, letakan nama yang diinginkan misal `belajar_vibe_coding_db`.
2. Buat berkas file bernama `.env` di root folder proyek ini.
3. Masukan string koneksi `DATABASE_URL` ke `.env`:
   ```env
   DATABASE_URL="mysql://root:password_database_anda@localhost:3306/db_name"
   ```
4. Jalankan perintah Migrasi Database melalui Drizzle ORM agar ia otomatis mendesain seluruh tabel schema di database anda:
   ```bash
   bun run drizzle-kit push:mysql
   ```

### 4. Menjalankan Aplikasi Lokal
Nyalakan Web Server lokal menggunakan metode *Live-reload / Watch Mode*:
```bash
bun run dev
# Terminal akan memunculkan: 🦊 Elysia is running at localhost:3000
```
Server dapat diakses dari HTTP Client seperti Postman / cURL di alamat `http://localhost:3000`.

### 5. Menjalankan Pengujian (Software Testing Unit)
Aplikasi ini hadir mencakup proteksi keamanan dan integritas end-to-end melalui isolasi *software unit test*. Kami menggunakan library pengecekan `bun test` dengan simulasi payload lengkap.

Untuk menjalankan automasi pengujian:
```bash
bun test
```
*Catatan Perhatian: Skrip test diatur untuk menghapus lalu membuat ulang mock data di `users` dan `sessions` tabel anda `(db.delete(users))`, anda disarankan menggunakan local database development ketimbang real production saat testing.*