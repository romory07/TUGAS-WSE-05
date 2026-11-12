# LAPORAN PRAKTIKUM 05 WEB SERVICE ENGINEERING
## Desain Endpoint dan Implementasi Web Service dengan Framework

- **Mata Kuliah**: Web Service Engineering
- **Dosen Pengampu**: Muhayat, M.IT
- **Studi Kasus**: Layanan Katalog Buku Perpustakaan Kampus
- **Tanggal Praktikum**: 10 November 2026
- **Lingkungan Sistem**:
  - Sistem Operasi: Windows 10/11 x64
  - Node.js: `v24.19.0` (LTS 24.x)
  - npm: `11.17.0`
  - Framework & Dependensi:
    - `express@5.3.0` (Fixed Version)
    - `swagger-ui-express@5.0.1` (Fixed Version)
  - Host & Port: `http://127.0.0.1:3200`

---

## I. DESKRIPSI DAN TUJUAN PRAKTIKUM

Praktikum ini bertujuan untuk merancang dan membangun layanan web service RESTful menggunakan arsitektur berlapis (*layered architecture*) di atas runtime Node.js dan Express 5. Mahasiswa menerapkan pemisahan tanggung jawab (*separation of concerns*) yang jelas antara:
1. **Routing**: Penanganan pola URL dan pencocokan metode HTTP.
2. **Controller**: Pengelolaan konteks protokol HTTP (ekstraksi request dan formatting response).
3. **Service**: Eksekusi aturan bisnis katalog dan validasi data.
4. **Repository**: Akses manipulasi persistensi data (array in-memory).
5. **Error Handling**: Penyeragaman format pesan kesalahan JSON dan status HTTP.
6. **OpenAPI & Swagger UI**: Pembuatan kontrak mesin dan pengujian interaktif lokal melalui peramban.

---

## II. STRUKTUR PROYEK DAN PEMBAGIAN TANGGUNG JAWAB

Struktur berkas yang dibangun pada praktikum ini:

```text
praktikum05-webservice/
├── package.json               # Konfigurasi dependensi dan script npm
├── package-lock.json          # Rekaman versi presisi dependensi
├── app.cjs                    # Inisialisasi Express, middleware global, router, Swagger UI & error handler
├── server.cjs                 # Listener HTTP server pada 127.0.0.1:3200
├── client.cjs                 # Skrip pengujian HTTP berbasis node:fetch
├── test-runner.cjs            # Pengujian otomatis seluruh skenario matriks
├── README.md                  # Dokumentasi dan panduan menjalankan ulang
├── docs/
│   └── openapi.json           # Dokumen spesifikasi OpenAPI 3.1.0 (dihasilkan oleh skrip)
├── scripts/
│   └── generate-openapi.cjs   # Generator otomatis berkas OpenAPI JSON
├── samples/                   # Berkas JSON sampel uji positif dan negatif
│   ├── buku-baru.json
│   ├── buku-ubah.json
│   ├── buku-salah-tipe.json
│   ├── buku-parsial.json
│   ├── json-rusak.txt
│   ├── buku-tugas1-a.json
│   ├── buku-tugas1-b.json
│   └── buku-tugas1-ubah.json
└── src/
    ├── errors.cjs             # Kelas HttpError, parseId, dan validateBuku
    ├── buku.repository.cjs    # Array in-memory dan fungsi CRUD dasar
    ├── buku.service.cjs       # Logika bisnis dan integrasi validasi
    ├── buku.controller.cjs    # Pengolah request dan response HTTP
    └── buku.routes.cjs        # Definisi rute Express dan middleware media type
```

### Penjelasan Peran Setiap Lapisan:
- **`src/errors.cjs`**: Menyediakan kelas `HttpError` untuk membawa status HTTP dan error code aplikasi secara terstruktur. Memuat fungsi `parseId` yang memverifikasi ID bilangan bulat positif murni tanpa leading zero (`/^[1-9]\d*$/`) dan aman sebagai integer JavaScript (`Number.isSafeInteger`). Memuat `validateBuku` yang memastikan field wajib `judul` (1-120 karakter setelah trim) dan `tersedia` (boolean murni), serta menolak field tambahan (*strict schema*).
- **`src/buku.repository.cjs`**: Menyimpan state katalog pada array JavaScript dalam memori dengan dua data awal. Operasi yang didukung: `list(q)`, `find(id)`, `create(data)`, `replace(id, data)`, dan `remove(id)`. ID auto-increment menggunakan variabel `nextId` independen dari panjang array.
- **`src/buku.service.cjs`**: Bertindak sebagai lapisan bisnis independen dari objek Express (`req`/`res`). Menangani validasi panjang query `q`, memastikan buku target ada sebelum proses `replace` atau `remove`, dan mengembalikan kesalahan `BOOK_NOT_FOUND` (404) jika data tidak ditemukan.
- **`src/buku.controller.cjs`**: Menghubungkan HTTP dengan service. Mengatur HTTP Status 200, 201 (beserta header `Location: /api/buku/:id`), dan 204 No Content untuk DELETE.
- **`src/buku.routes.cjs`**: Menghubungkan endpoint dengan controller. Menyediakan middleware `jsonOnly` untuk memastikan header `Content-Type: application/json` pada POST dan PUT, serta middleware parameter `router.param('id')` untuk validasi ID sebelum handler dieksekusi.
- **`app.cjs`**: Mengonfigurasi middleware umum: penghapusan header `X-Powered-By`, logging request, header `Cache-Control: no-store`, parser `express.json({ limit: '10kb' })`, rute OpenAPI & Swagger UI, rute 404 penanganan rute tidak dikenal, dan centralized error handler 4-parameter.

---

## III. MATRIKS PENGUJIAN LENGKAP (24 SKENARIO)

Berdasarkan pengujian langsung menggunakan `client.cjs` dan `test-runner.cjs` terhadap server lokal yang berjalan:

| No | Skenario | Hasil yang Diharapkan | Hasil Aktual | Status |
| :---: | :--- | :--- | :--- | :---: |
| **01** | Versi dan paket | Node 24.x; express 5.3.0 & swagger-ui-express 5.0.1. | Node `v24.19.0`, npm `11.17.0`, `express@5.3.0`, `swagger-ui-express@5.0.1`. | **LULUS** |
| **02** | GET daftar awal | 200; array dua buku. | HTTP `200 OK`; respons memuat 2 buku awal: ID 1 dan ID 2. | **LULUS** |
| **03** | GET detail ID 2 | 200; tersedia false. | HTTP `200 OK`; `{"id":2,"judul":"Dasar Web Service","tersedia":false}`. | **LULUS** |
| **04** | Pencarian kotlin | 200; buku ID 1. | HTTP `200 OK`; respons array berisi 1 item (buku ID 1). | **LULUS** |
| **05** | Pencarian tidakada | 200; array kosong. | HTTP `200 OK`; respons array kosong `[]`. | **LULUS** |
| **06** | POST valid | 201; ID baru dan Location. | HTTP `201 Created`; Location: `/api/buku/3`; data buku tersimpan. | **LULUS** |
| **07** | GET lokasi hasil POST | 200; data baru terbaca. | HTTP `200 OK`; data buku ID 3 terbaca lengkap. | **LULUS** |
| **08** | PUT lengkap | 200; ID tetap, data berubah. | HTTP `200 OK`; data buku ID 3 terbarui menjadi `Belajar API HTTP` & `tersedia: false`. | **LULUS** |
| **09** | DELETE data baru | 204; body kosong. | HTTP `204 No Content`; body respons kosong `(kosong)`. | **LULUS** |
| **10** | GET sesudah DELETE | 404 BOOK_NOT_FOUND. | HTTP `404 Not Found`; `error.code: "BOOK_NOT_FOUND"`. | **LULUS** |
| **11** | ID 1abc atau 01 | 400 INVALID_ID. | HTTP `400 Bad Request`; `error.code: "INVALID_ID"` untuk `1abc` dan `01`. | **LULUS** |
| **12** | ID 999 | 404 BOOK_NOT_FOUND. | HTTP `404 Not Found`; `error.code: "BOOK_NOT_FOUND"`. | **LULUS** |
| **13** | tersedia berupa string | 400 INVALID_BOOK. | HTTP `400 Bad Request`; `error.code: "INVALID_BOOK"`. | **LULUS** |
| **14** | PUT parsial | 400; data target tidak berubah. | HTTP `400 Bad Request`; `error.code: "INVALID_BOOK"`. GET buku ID 1 membuktikan data tidak berubah. | **LULUS** |
| **15** | JSON sengaja rusak | 400 INVALID_JSON. | HTTP `400 Bad Request`; `error.code: "INVALID_JSON"`. | **LULUS** |
| **16** | Media type text/plain | 415 UNSUPPORTED_MEDIA_TYPE. | HTTP `415 Unsupported Media Type`; `error.code: "UNSUPPORTED_MEDIA_TYPE"`. | **LULUS** |
| **17** | q dikirim dua kali | 400 INVALID_QUERY. | HTTP `400 Bad Request`; `error.code: "INVALID_QUERY"`. | **LULUS** |
| **18** | Path tidak dikenal | 404 ROUTE_NOT_FOUND. | HTTP `404 Not Found`; `error.code: "ROUTE_NOT_FOUND"`. | **LULUS** |
| **19** | GET /openapi.json | 200; OpenAPI dan skema tersedia. | HTTP `200 OK`; Dokumen OpenAPI 3.1.0 terkirim valid. | **LULUS** |
| **20** | Halaman /docs/ | Lima operasi tampil dan dapat dicoba. | HTTP `200 OK`; Antarmuka Swagger UI berhasil dimuat di browser. | **LULUS** |
| **21** | CRUD dari Swagger UI | Status sesuai; pakai ID yang sama. | Pengujian interaktif "Try it out" pada Swagger UI berhasil mengeksekusi request nyata. | **LULUS** |
| **22** | Server dihentikan | Client tidak menerima respons HTTP. | Client fetch melempar `TypeError` / koneksi ditolak (tanpa respons HTTP dari provider). | **LULUS** |
| **23** | Server dimulai ulang | Data awal kembali; data tambahan hilang. | Server restart: data baru hilang (GET ID tambahan menghasilkan 404), katalog kembali ke 2 buku awal. | **LULUS** |
| **24** | Instalasi sesuai README | npm ci, generator, dan server dapat dijalankan ulang. | `npm ci` berhasil dari package-lock, `npm run docs` menghasilkan berkas, server berjalan lancar. | **LULUS** |

---

## IV. PELAKSANAAN TUGAS MANDIRI

### Tugas 1: Menambah Data Melalui API & Analisis Operasi
Pada tahap ini dilakukan penambahan minimal 2 buku melalui POST API, kemudian pembacaan data, perubahan (PUT) satu buku, dan penghapusan (DELETE) satu buku.

#### 1. Penambahan Buku Pertama (POST)
- **Input (`samples/buku-tugas1-a.json`)**:
  ```json
  {"judul":"Arsitektur Web Modern dan Microservices","tersedia":true}
  ```
- **Perintah**: `node client.cjs POST /api/buku samples/buku-tugas1-a.json`
- **Hasil Aktual**:
  - HTTP Status: `201 Created`
  - Location Header: `/api/buku/3`
  - Body Respons: `{"success":true,"data":{"id":3,"judul":"Arsitektur Web Modern dan Microservices","tersedia":true}}`

#### 2. Penambahan Buku Kedua (POST)
- **Input (`samples/buku-tugas1-b.json`)**:
  ```json
  {"judul":"Desain RESTful API Standar Industri","tersedia":false}
  ```
- **Perintah**: `node client.cjs POST /api/buku samples/buku-tugas1-b.json`
- **Hasil Aktual**:
  - HTTP Status: `201 Created`
  - Location Header: `/api/buku/4`
  - Body Respons: `{"success":true,"data":{"id":4,"judul":"Desain RESTful API Standar Industri","tersedia":false}}`

#### 3. Pembacaan Seluruh Katalog (GET)
- **Perintah**: `node client.cjs GET /api/buku`
- **Hasil Aktual**: HTTP `200 OK`, mengembalikan 4 item buku (ID 1, 2, 3, dan 4).

#### 4. Pengubahan Buku ID 3 (PUT)
- **Input (`samples/buku-tugas1-ubah.json`)**:
  ```json
  {"judul":"Arsitektur Web Modern dan Cloud Native","tersedia":false}
  ```
- **Perintah**: `node client.cjs PUT /api/buku/3 samples/buku-tugas1-ubah.json`
- **Hasil Aktual**:
  - HTTP Status: `200 OK`
  - Body Respons: `{"success":true,"data":{"id":3,"judul":"Arsitektur Web Modern dan Cloud Native","tersedia":false}}`
- **Verifikasi GET /api/buku/3**: HTTP 200, data berhasil diperbarui.

#### 5. Penghapusan Buku ID 4 (DELETE)
- **Perintah**: `node client.cjs DELETE /api/buku/4`
- **Hasil Aktual**:
  - HTTP Status: `204 No Content`
  - Body Respons: `(kosong)`
- **Verifikasi GET /api/buku/4**: HTTP `404 Not Found` (`BOOK_NOT_FOUND`).
- **Verifikasi Akhir GET /api/buku**: Tersisa 3 buku (ID 1, ID 2, dan ID 3).

#### 6. Penjelasan Analisis: Perbedaan Penyuntingan Array pada Berkas vs Operasi API Consumer
> **Mengapa penyuntingan langsung array pada berkas kode tidak sama dengan operasi yang dikirim consumer melalui API?**
> 
> 1. **Penerapan Kontrak & Validasi**: Ketika consumer mengirim request melalui API HTTP, data wajib melalui seluruh lapisan penjaga (*gatekeepers*): Content-Type check, sanitasi tipe data, batas karakter, validasi skema ketat (*no extra fields*), dan aturan integritas. Jika file diedit langsung, tidak ada validasi yang berjalan sehingga data cacat dapat langsung masuk ke memori.
> 2. **Protokol & Metrik Jaringan**: Operasi API melibatkan protokol HTTP riil: negosiasi konten, header `Location`, status code (201, 204, 400), pembatasan payload (10kb), serta logging akses server. Hal ini merepresentasikan interaksi client-server terdistribusi yang sesungguhnya.
> 3. **Independensi Client-Server**: Consumer API tidak memiliki (dan tidak boleh memiliki) akses ke kode sumber atau berkas internal server. API bertindak sebagai kontrak publik (*abstraction layer*) yang mengisolasi implementasi internal dari pihak luar.

---

### Tugas 2: Melengkapi Dokumentasi OpenAPI dan Bukti Pengujian

#### 1. Peningkatan Generator OpenAPI (`scripts/generate-openapi.cjs`)
Generator OpenAPI ditingkatkan dengan:
- Menambahkan rincian skenario deskripsi pada setiap status error (400, 404, 413, 415, 500).
- Menyediakan contoh respons error konkret (`example`) pada masing-masing operasi:
  - `GET /api/buku`: Contoh error 400 memuat kode `INVALID_QUERY`.
  - `GET /api/buku/{id}`: Contoh error 400 memuat `INVALID_ID`, contoh error 404 memuat `BOOK_NOT_FOUND`.
  - `POST /api/buku`: Contoh error 400 memuat `INVALID_BOOK`, contoh error 413 memuat `PAYLOAD_TOO_LARGE`, contoh 415 memuat `UNSUPPORTED_MEDIA_TYPE`.
  - `PUT /api/buku/{id}`: Contoh error 400 memuat `INVALID_BOOK` (validasi penggantian penuh).
  - `DELETE /api/buku/{id}`: Contoh error 400 memuat `INVALID_ID` dan 404 `BOOK_NOT_FOUND`.
- Menjalankan kembali generator:
  ```bash
  npm run docs
  ```
  Berkas `docs/openapi.json` berhasil diperbarui dan disajikan secara otomatis di `/openapi.json` dan `/docs/`.

#### 2. Otomasi Pengujian (`test-runner.cjs`)
Untuk memastikan seluruh 24 skenario pengujian dapat diverifikasi secara berulang (*repeatable*), dibuat skrip otomasi `test-runner.cjs` yang dapat dijalankan melalui perintah:
```bash
npm test
```
Hasil eksekusi: Seluruh 24 skenario uji lulus (100% Passed).

---

### Tugas 3: Jawaban Pertanyaan Pemahaman (1 s.d. 12)

#### 1. Apa perbedaan Node.js dan Express dalam proyek ini?
- **Node.js**: Adalah *runtime environment* berbasis mesin JavaScript V8 Google Chrome yang memungkinkan eksekusi kode JavaScript di luar peramban (di sisi server). Node.js menyediakan pustaka standar tingkat rendah seperti `node:http` (menangani koneksi TCP/HTTP mentah), `node:fs` (akses file sistem), dan `node:path`.
- **Express**: Adalah *framework* web tingkat tinggi yang berjalan di atas Node.js. Express menyediakan lapisan abstraksi untuk penanganan rute (*routing*), *middleware chain*, pemrosesan otomatis badan request JSON (`express.json()`), manajemen header HTTP, dan penanganan kesalahan terpusat.
- *Singkatnya*: Node.js adalah lingkungan komputasinya (*engine*), sedangkan Express adalah kerangka kerja pembantu pembuatan API-nya (*scaffolding & middleware*).

#### 2. Mengapa controller dipisahkan dari service dan repository?
Pemisahan ini menerapkan prinsip **Separation of Concerns (SoC)** dan **Layered Architecture**:
- **Controller**: Berurusan murni dengan protokol HTTP (membaca objek `req`, mengambil query `q`, ID dari path, body JSON, menentukan HTTP status 200/201/204, dan mengatur header seperti `Location`). Controller tidak mengetahui bagaimana data disimpan atau aturan logika bisnis yang kompleks.
- **Service**: Berurusan dengan logika bisnis dan aturan domain aplikasi (memeriksa panjang query, memvalidasi integritas objek buku, memastikan keberadaan data sebelum operasi update/delete). Service bebas dari dependensi HTTP (`req`/`res`) sehingga dapat diuji secara terisolasi melalui unit test.
- **Repository**: Berurusan murni dengan manipulasi dan akses penyimpanan data (array, query database, penambahan ID unik). Jika di kemudian hari sistem beralih dari array in-memory ke database PostgreSQL/MongoDB, perubahan kode hanya terjadi di lapisan repository tanpa mengubah controller atau service.

#### 3. Apa perbedaan parameter path, query, header, dan body?
- **Path Parameter**: Bagian dari struktur hierarki URL yang digunakan untuk mengidentifikasi suatu entitas atau resource secara spesifik (contoh: `/api/buku/1` mengidentifikasi buku dengan ID 1).
- **Query Parameter**: Bagian non-hierarkis setelah tanda tanya `?` pada URL berupa pasangan key-value, digunakan untuk memfilter, mencari, atau mengurutkan data (contoh: `/api/buku?q=kotlin`).
- **Header**: Metadata komunikasi protokol HTTP yang dikirimkan bersama request/response, membawa informasi kontekstual seperti tipe media (`Content-Type: application/json`), negosiasi format (`Accept`), kontrol caching (`Cache-Control: no-store`), dan lokasi URI baru (`Location`).
- **Body**: Payload atau konten utama yang dikirimkan bersama request (biasanya pada POST dan PUT), berisi representasi data yang akan dibuat atau diubah (contoh: JSON `{"judul":"...", "tersedia":true}`).

#### 4. Mengapa JSON yang sah belum tentu memenuhi kontrak objek buku?
JSON (*JavaScript Object Notation*) hanyalah format sintaks serialisasi teks untuk pertukaran data. Suatu dokumen JSON dapat berformat sintaks valid (misal: `{"judul": 12345, "tersedia": "benar", "stok": 50}`), namun dokumen tersebut melanggar kontrak bisnis objek buku karena:
- Nilai field `judul` berupa angka, bukan string 1-120 karakter.
- Nilai field `tersedia` berupa string `"benar"`, bukan boolean murni `true`/`false`.
- Terdapat field tambahan `stok` yang tidak diizinkan oleh skema kontrak (*strict schema*).
Oleh karena itu, keberhasilan parsing JSON oleh `express.json()` hanya membuktikan sintaks JSON benar, tetapi lapisan validasi aplikasi (`validateBuku`) tetap wajib memeriksa kepatuhan terhadap kontrak model data.

#### 5. Mengapa ID 1abc ditolak walaupun parseInt dapat menghasilkan angka?
Fungsi bawaan JavaScript `parseInt("1abc", 10)` membaca karakter dari kiri dan berhenti saat menemukan karakter non-numerik, sehingga menghasilkan nilai angka `1` dan membuang `"abc"`.
Perilaku *silent coercion* ini berbahaya bagi API karena klien yang salah mengirim ID (seperti `1abc`, `01`, atau input tidak sengaja) akan memanipulasi buku ID 1 tanpa ada peringatan kesalahan.
Untuk menjaga integritas dan ketegasan kontrak, modul menggunakan ekspresi reguler `/^[1-9]\d*$/` dan `Number.isSafeInteger(id)`. Hal ini menjamin bahwa seluruh string ID harus berupa digit desimal bulat positif murni tanpa nol di depan dan berada dalam rentang integer aman JavaScript.

#### 6. Mengapa PUT parsial ditolak pada kontrak ini?
Sesuai dengan spesifikasi standar RFC 9110 (HTTP Semantics), metode **PUT** merepresentasikan operasi **penggantian penuh (complete replacement)** dari resource target dengan representasi yang dikirimkan.
Jika PUT parsial diterima (misalnya hanya mengirimkan `{"judul": "Judul Baru"}` tanpa `tersedia`), maka field `tersedia` akan hilang atau bernilai `undefined`, merusak integritas skema data buku di katalog.
Untuk pembaruan parsial terhadap sebagian field, standar HTTP menyediakan metode terpisah yaitu **PATCH**. Karena layanan praktikum ini mengimplementasikan kontrak PUT murni, seluruh field yang dapat ditulis (`judul` dan `tersedia`) wajib dikirimkan secara lengkap.

#### 7. Mengapa respons DELETE 204 tidak dibaca sebagai JSON?
Status kode HTTP **204 No Content** secara definisi spesifikasi HTTP menandakan bahwa operasi berhasil diproses oleh server, namun server **secara sengaja tidak mengirimkan pesan badan/payload apapun** dalam responsnya.
Jika klien memanggil `response.json()` pada respons 204, parser JSON akan melempar kesalahan (*SyntaxError: Unexpected end of JSON input*) karena tidak ada byte data untuk di-parse. Klien yang benar harus memeriksa status respons (204) dan membaca sebagai teks biasa (`response.text()`) yang menghasilkan string kosong tanpa mencoba mem-parse JSON.

#### 8. Apa perbedaan OpenAPI, Swagger UI, dan implementasi Express?
- **OpenAPI**: Standar format spesifikasi deklaratif formal (berbasis JSON atau YAML) yang mendefinisikan antarmuka kontrak REST API (daftar endpoint, parameter, skema request/response, kode status HTTP) agar dapat dipahami oleh mesin dan manusia.
- **Swagger UI**: Aplikasi antarmuka pengguna berbasis peramban (HTML/CSS/JS) yang bertugas membaca dokumen OpenAPI dan menampilkannya sebagai dokumentasi interaktif yang memungkinkan pengembang mencoba memanggil API secara visual (*Try it out*).
- **Implementasi Express**: Kode program backend yang berjalan di runtime Node.js, bertanggung jawab menerima request TCP/HTTP, mengeksekusi logika validasi, memproses data di memori/database, dan menghasilkan respons nyata.

#### 9. Mengapa Example Value bukan bukti bahwa endpoint berhasil?
*Example Value* pada halaman Swagger UI hanyalah contoh statis dari skema yang didefinisikan di dokumen OpenAPI (`openapi.json`). Contoh tersebut dapat ditampilkan oleh Swagger UI meskipun server backend dalam kondisi mati, rusak, rutenya belum dibuat, atau mengalami error 500.
Bukti keberhasilan operasi endpoint hanya sah jika pengguna mengklik tombol **Execute** pada Swagger UI atau mengirimkan request melalui client terminal, dan server menghasilkan **Server response** aktual dengan status kode HTTP dan data yang diproses oleh logika backend yang hidup.

#### 10. Bagaimana perubahan penyimpanan ke database memengaruhi kode dan pengujian?
- **Pengaruh pada Kode**:
  1. *Operasi Asinkron*: Operasi I/O database bersifat asinkron, sehingga fungsi di repository wajib mengembalikan `Promise` (menggunakan `async`/`await`), dan pemanggil di service serta controller harus disesuaikan menjadi asinkron.
  2. *Manajemen Koneksi & Transaksi*: Diperlukan connection pool, pengelolaan koneksi (connect/disconnect/timeout), dan penanganan transaksi untuk memastikan ACID.
  3. *Error Handling Khusus*: Perlu menangani error level database (koneksi terputus, duplicate unique key, deadlock) dan menerjemahkannya ke kode error HTTP yang terstandar.
- **Pengaruh pada Pengujian**:
  1. *Database Testing Terisolasi*: Pengujian memerlukan skema basis data uji terpisah (bukan database produksi) atau mock database.
  2. *Seeding dan Cleanup*: Pengujian harus menyertakan mekanisme penyemaian data awal (*fixture/seed*) dan pembersihan (*teardown/rollback*) agar setiap skenario pengujian tetap independen dan *idempotent*.
  3. *Uji Kegagalan Koneksi*: Perlu menguji skenario ketahanan ketika database offline atau kehabisan koneksi pool.

#### 11. Mengapa array tidak cocok untuk data operasional yang harus bertahan?
1. **Volatile (Sifat Sementara Memori)**: Array JavaScript disimpan di RAM proses Node.js. Begitu proses server dihentikan, crash, atau komputer dimulai ulang, seluruh data baru dan perubahannya akan hilang seketika (*ephemeral*).
2. **Ketiadaan Konkurensi & Skalabilitas Multi-Instance**: Jika aplikasi di-scale ke beberapa proses CPU (misal menggunakan cluster mode atau beberapa container/pod), masing-masing proses memiliki array sendiri di memorinya, sehingga data menjadi terfragmentasi dan tidak sinkron antar-pengguna.
3. **Keterbatasan Kapasitas RAM**: Kapasitas RAM jauh lebih terbatas dibandingkan penyimpanan persisten (SSD/HDD), sehingga tidak dapat menampung pertumbuhan data jangka panjang.
4. **Tanpa Fitur ACID**: Array tidak menyediakan fitur integritas transaksional (Atomicity, Consistency, Isolation, Durability) dan *crash recovery*.

#### 12. Mengapa tombol atau dokumentasi yang disembunyikan tidak menggantikan otorisasi server?
Menyembunyikan tombol di antarmuka web (*frontend*) atau tidak mencantumkan endpoint di Swagger UI hanyalah ilusi keamanan (*Security through Obscurity*).
Setiap orang atau penyerang dapat menggunakan alat HTTP client (seperti `curl`, Postman, modul fetch script, atau DevTools peramban) untuk mengirimkan request HTTP langsung ke URL endpoint server (misalnya mengirim `DELETE http://127.0.0.1:3200/api/buku/1`).
Jika server tidak mengimplementasikan pemeriksaan otorisasi dan autentikasi secara ketat di sisi backend (misalnya melalui middleware verifikasi token JWT / session dan role-based access control), server akan tetap mengeksekusi request berbahaya tersebut. Keamanan dan otorisasi sejati **wajib ditegakkan di sisi server**.

---

## V. KESIMPULAN

Praktikum 05 telah berhasil diselesaikan secara menyeluruh sesuai dengan seluruh ketentuan modul:
1. Arsitektur berlapis (Routing, Controller, Service, Repository, Error Handling) berhasil diimplementasikan dengan pemisahan tanggung jawab yang rapi dan konsisten.
2. Seluruh 24 skenario pada Matriks Pengujian berhasil dieksekusi dengan status **LULUS (100%)**.
3. Tugas Mandiri 1 (siklus operasi POST, GET, PUT, DELETE melalui API dan komparasi manipulasi data) berhasil dibuktikan dengan ID aktual dan respons HTTP riil.
4. Tugas Mandiri 2 (peningkatan dokumentasi OpenAPI dengan deskripsi detail, contoh respons error konkret, pengujian Swagger UI, dan otomatisasi pengujian dengan `test-runner.cjs`) berhasil diwujudkan.
5. Tugas Mandiri 3 (12 pertanyaan pemahaman konsep dan arsitektur) telah dijawab secara mendalam dan berlandaskan bukti teknis.
6. Proyek memiliki tingkat keterulangan (*reproducibility*) yang tinggi melalui penggunaan versi dependensi terkunci, perintah `npm ci`, script npm yang lengkap, dan panduan `README.md`.
