# Rancangan Desain Endpoint dan Kontrak API Katalog Perpustakaan
**Mata Kuliah**: Web Service Engineering  
**Studi Kasus**: Layanan Katalog Buku Perpustakaan Kampus  
**Dosen Pengampu**: Muhayat, M.IT  

---

## 1. Tujuan Layanan dan Pengguna (Consumer)
Layanan API Katalog Perpustakaan ini dirancang untuk menyediakan antarmuka terstandarisasi berbasis RESTful Web Service guna membaca dan mengelola data buku perpustakaan kampus.

**Pengguna / Consumer Layanan**:
1. **Aplikasi Katalog Web / Mobile Mahasiswa**: Mengakses daftar buku, mencari buku berdasarkan judul, dan memeriksa ketersediaan buku untuk dipinjam.
2. **Sistem Sirkulasi Staf Perpustakaan**: Menambahkan katalog buku baru (POST), memperbarui informasi katalog (PUT), dan menghapus buku yang sudah ditarik dari peredaran (DELETE).
3. **Consumer Otomasi & Integrasi Kampus**: Sistem informasi akademik atau bot telegram perpustakaan kampus.

---

## 2. Model Data

| Field | Tipe | Aturan Validasi |
| :--- | :--- | :--- |
| `id` | Number (Integer Positif) | Dihasilkan secara otomatis oleh server (`nextId++`). Aman sebagai integer JavaScript (`Number.isSafeInteger`). **Dilarang dikirim** pada body request `POST` atau `PUT`. Karakter pada path hanya menerima digit desimal murni tanpa leading zero (`/^[1-9]\d*$/`). |
| `judul` | String | Wajib ada (`required`). Setelah di-trim, panjang minimal 1 karakter dan maksimal 120 unit string JavaScript (UTF-16). Tidak boleh hanya berupa spasi kosong. |
| `tersedia` | Boolean | Wajib ada (`required`). Wajib bernilai boolean murni (`true` atau `false`). String `"true"` atau `"false"` ditolak. |

> **Catatan Validasi Tambahan**:
> Body request `POST` dan `PUT` dilarang menyertakan field tambahan di luar `judul` dan `tersedia` (`additionalProperties: false`). Payload body dibatasi maksimal 10kb.

---

## 3. Kontrak Operasi Endpoint

Base URL: `http://127.0.0.1:3200`

| Metode | Endpoint (Path) | Parameter / Input | Kode Sukses & Respon | Kode Gagal & Kondisi |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/buku` | Query string opsional: `q` (string pencarian judul, maks 80 karakter). | `200 OK`<br>Array objek buku `{"success":true,"data":[...]}`. Jika pencarian tidak cocok, kembalikan array kosong `[]`. | `400 INVALID_QUERY` (jika `q` bukan string tunggal atau > 80 karakter, misal dikirim ganda `?q=a&q=b`).<br>`500 INTERNAL_ERROR`. |
| **GET** | `/api/buku/:id` | Path parameter: `id` (integer positif tanpa leading zero). | `200 OK`<br>Objek buku tunggal `{"success":true,"data":{...}}`. | `400 INVALID_ID` (format id bukan digit positif, misal `abc`, `01`).<br>`404 BOOK_NOT_FOUND` (id valid namun buku tidak ada di katalog).<br>`500 INTERNAL_ERROR`. |
| **POST** | `/api/buku` | Body JSON: `{"judul": string, "tersedia": boolean}`.<br>Header: `Content-Type: application/json`. | `201 Created`<br>Header `Location: /api/buku/:id`.<br>Body objek buku baru yang dibuat beserta `id`. | `400 INVALID_BOOK` (field hilang/tipe salah/field ekstra).<br>`400 INVALID_JSON` (sintaks JSON rusak).<br>`413 PAYLOAD_TOO_LARGE` (body > 10kb).<br>`415 UNSUPPORTED_MEDIA_TYPE` (Content-Type bukan JSON).<br>`500 INTERNAL_ERROR`. |
| **PUT** | `/api/buku/:id` | Path: `id`.<br>Body JSON lengkap: `{"judul": string, "tersedia": boolean}`.<br>Header: `Content-Type: application/json`. | `200 OK`<br>Objek buku hasil pembaruan. | `400 INVALID_ID` (format id salah).<br>`400 INVALID_BOOK` (update parsial atau field salah).<br>`404 BOOK_NOT_FOUND` (target buku tidak ditemukan).<br>`413 PAYLOAD_TOO_LARGE`<br>`415 UNSUPPORTED_MEDIA_TYPE`<br>`500 INTERNAL_ERROR`. |
| **DELETE** | `/api/buku/:id` | Path parameter: `id`. | `204 No Content`<br>Respons tanpa body (`Content-Type: null`). | `400 INVALID_ID`<br>`404 BOOK_NOT_FOUND`<br>`500 INTERNAL_ERROR`. |

---

## 4. Format Respons Terstandar

### Format Respons Berhasil
```json
{
  "success": true,
  "data": {
    "id": 1,
    "judul": "Dasar Pemrograman Kotlin",
    "tersedia": true
  }
}
```

### Format Respons Gagal / Error
```json
{
  "success": false,
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "Buku tidak ditemukan."
  }
}
```

---

## 5. Arsitektur Berlapis (Separation of Concerns)

1. **Routing (`src/buku.routes.cjs`)**:
   Memetakan metode HTTP dan path URL, memvalidasi format ID path melalui `router.param`, memvalidasi Content-Type JSON melalui `jsonOnly`, dan meneruskan eksekusi ke controller.
2. **Controller (`src/buku.controller.cjs`)**:
   Membaca konteks protokol HTTP (`req.query`, `req.bukuId`, `req.body`), memanggil fungsi service yang sesuai, lalu membentuk respons HTTP (menetapkan status code 200, 201, 204 dan header `Location`).
3. **Service (`src/buku.service.cjs`)**:
   Menerapkan aturan bisnis dan validasi input. Menjamin integritas data sebelum memanggil repository. Tidak terikat langsung dengan objek `req` atau `res`.
4. **Repository (`src/buku.repository.cjs`)**:
   Mengelola penyimpanan data koleksi buku (pada praktikum ini menggunakan array in-memory), menyediakan operasi CRUD (`list`, `find`, `create`, `replace`, `remove`).
5. **Error Handler (`app.cjs` & `src/errors.cjs`)**:
   Sentralisasi penanganan kesalahan aplikasi (`HttpError`), parsing JSON yang gagal (`INVALID_JSON`), payload melebihi batas (`PAYLOAD_TOO_LARGE`), rute tidak dikenal (`ROUTE_NOT_FOUND`), serta kegagalan internal (`INTERNAL_ERROR`).
