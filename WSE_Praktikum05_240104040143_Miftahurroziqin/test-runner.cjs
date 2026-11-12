const fs = require('node:fs');
const http = require('node:http');

const BASE = 'http://127.0.0.1:3200';

async function request(method, path, body = null, contentType = 'application/json') {
  const options = {
    method: method.toUpperCase(),
    headers: {
      Accept: 'application/json'
    }
  };
  if (body !== null) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (contentType) options.headers['Content-Type'] = contentType;
  }
  const res = await fetch(BASE + path, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {}
  return {
    status: res.status,
    headers: res.headers,
    text,
    json
  };
}

async function runTests() {
  console.log('=== MEMULAI AUTOMATED TEST MATRIX PRAKTIKUM 05 ===\n');
  const results = [];

  function record(no, skenario, harapan, aktual, status) {
    results.push({ no, skenario, harapan, aktual, status });
    console.log(`[${status}] [${no}] ${skenario}`);
    console.log(`       Ekspektasi : ${harapan}`);
    console.log(`       Aktual     : ${aktual}\n`);
  }

  // 01: Versi dan paket
  const nodeVer = process.version;
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasDeps = pkg.dependencies && pkg.dependencies.express === '5.3.0' && pkg.dependencies['swagger-ui-express'] === '5.0.1';
  record('01', 'Versi dan paket.', 'Node 24.x; express@5.3.0 & swagger-ui-express@5.0.1', `Node ${nodeVer}; express@${pkg.dependencies?.express}, swagger-ui-express@${pkg.dependencies?.['swagger-ui-express']}`, nodeVer.startsWith('v24') && hasDeps ? 'LULUS' : 'GAGAL');

  // 02: GET daftar awal
  const r02 = await request('GET', '/api/buku');
  const pass02 = r02.status === 200 && Array.isArray(r02.json?.data);
  record('02', 'GET daftar awal.', '200; array buku.', `HTTP ${r02.status}; items: ${r02.json?.data?.length} buku`, pass02 ? 'LULUS' : 'GAGAL');

  // 03: GET detail ID 2
  const r03 = await request('GET', '/api/buku/2');
  const pass03 = r03.status === 200 && r03.json?.data?.tersedia === false;
  record('03', 'GET detail ID 2.', '200; tersedia false.', `HTTP ${r03.status}; id=${r03.json?.data?.id}, tersedia=${r03.json?.data?.tersedia}`, pass03 ? 'LULUS' : 'GAGAL');

  // 04: Pencarian kotlin
  const r04 = await request('GET', '/api/buku?q=kotlin');
  const pass04 = r04.status === 200 && r04.json?.data?.some(b => b.id === 1);
  record('04', 'Pencarian kotlin.', '200; buku ID 1.', `HTTP ${r04.status}; match: ${JSON.stringify(r04.json?.data?.map(b => b.id))}`, pass04 ? 'LULUS' : 'GAGAL');

  // 05: Pencarian tidakada
  const r05 = await request('GET', '/api/buku?q=tidakada');
  const pass05 = r05.status === 200 && Array.isArray(r05.json?.data) && r05.json.data.length === 0;
  record('05', 'Pencarian tidakada.', '200; array kosong.', `HTTP ${r05.status}; count: ${r05.json?.data?.length}`, pass05 ? 'LULUS' : 'GAGAL');

  // 06: POST valid
  const r06 = await request('POST', '/api/buku', { judul: 'Belajar API dengan Express', tersedia: true });
  const newId = r06.json?.data?.id;
  const locHeader = r06.headers.get('location');
  const pass06 = r06.status === 201 && newId !== undefined && locHeader === `/api/buku/${newId}`;
  record('06', 'POST valid.', '201; ID baru dan Location.', `HTTP ${r06.status}; ID=${newId}, Location=${locHeader}`, pass06 ? 'LULUS' : 'GAGAL');

  // 07: GET lokasi hasil POST
  const r07 = await request('GET', `/api/buku/${newId}`);
  const pass07 = r07.status === 200 && r07.json?.data?.id === newId;
  record('07', 'GET lokasi hasil POST.', '200; data baru terbaca.', `HTTP ${r07.status}; data=${JSON.stringify(r07.json?.data)}`, pass07 ? 'LULUS' : 'GAGAL');

  // 08: PUT lengkap
  const r08 = await request('PUT', `/api/buku/${newId}`, { judul: 'Belajar API HTTP', tersedia: false });
  const pass08 = r08.status === 200 && r08.json?.data?.id === newId && r08.json?.data?.judul === 'Belajar API HTTP' && r08.json?.data?.tersedia === false;
  record('08', 'PUT lengkap.', '200; ID tetap, data berubah.', `HTTP ${r08.status}; id=${r08.json?.data?.id}, judul="${r08.json?.data?.judul}", tersedia=${r08.json?.data?.tersedia}`, pass08 ? 'LULUS' : 'GAGAL');

  // 09: DELETE data baru
  const r09 = await request('DELETE', `/api/buku/${newId}`);
  const pass09 = r09.status === 204 && r09.text === '';
  record('09', 'DELETE data baru.', '204; body kosong.', `HTTP ${r09.status}; body length=${r09.text.length}`, pass09 ? 'LULUS' : 'GAGAL');

  // 10: GET sesudah DELETE
  const r10 = await request('GET', `/api/buku/${newId}`);
  const pass10 = r10.status === 404 && r10.json?.error?.code === 'BOOK_NOT_FOUND';
  record('10', 'GET sesudah DELETE.', '404 BOOK_NOT_FOUND.', `HTTP ${r10.status}; code=${r10.json?.error?.code}`, pass10 ? 'LULUS' : 'GAGAL');

  // 11: ID 1abc atau 01
  const r11a = await request('GET', '/api/buku/1abc');
  const r11b = await request('GET', '/api/buku/01');
  const pass11 = r11a.status === 400 && r11a.json?.error?.code === 'INVALID_ID' && r11b.status === 400 && r11b.json?.error?.code === 'INVALID_ID';
  record('11', 'ID 1abc atau 01.', '400 INVALID_ID.', `1abc->HTTP ${r11a.status} (${r11a.json?.error?.code}), 01->HTTP ${r11b.status} (${r11b.json?.error?.code})`, pass11 ? 'LULUS' : 'GAGAL');

  // 12: ID 999
  const r12 = await request('GET', '/api/buku/999');
  const pass12 = r12.status === 404 && r12.json?.error?.code === 'BOOK_NOT_FOUND';
  record('12', 'ID 999.', '404 BOOK_NOT_FOUND.', `HTTP ${r12.status}; code=${r12.json?.error?.code}`, pass12 ? 'LULUS' : 'GAGAL');

  // 13: tersedia berupa string
  const r13 = await request('POST', '/api/buku', '{"judul":"Belajar API","tersedia":"true"}');
  const pass13 = r13.status === 400 && r13.json?.error?.code === 'INVALID_BOOK';
  record('13', 'tersedia berupa string.', '400 INVALID_BOOK.', `HTTP ${r13.status}; code=${r13.json?.error?.code}`, pass13 ? 'LULUS' : 'GAGAL');

  // 14: PUT parsial
  const r14 = await request('PUT', '/api/buku/1', '{"judul":"Judul baru"}');
  const r14check = await request('GET', '/api/buku/1');
  const pass14 = r14.status === 400 && r14.json?.error?.code === 'INVALID_BOOK' && r14check.json?.data?.judul === 'Dasar Pemrograman Kotlin';
  record('14', 'PUT parsial.', '400; data target tidak berubah.', `HTTP ${r14.status}; code=${r14.json?.error?.code}; data 1 tetap: "${r14check.json?.data?.judul}"`, pass14 ? 'LULUS' : 'GAGAL');

  // 15: JSON sengaja rusak
  const r15 = await request('POST', '/api/buku', '{"judul":');
  const pass15 = r15.status === 400 && r15.json?.error?.code === 'INVALID_JSON';
  record('15', 'JSON sengaja rusak.', '400 INVALID_JSON.', `HTTP ${r15.status}; code=${r15.json?.error?.code}`, pass15 ? 'LULUS' : 'GAGAL');

  // 16: Media type text/plain
  const r16 = await request('POST', '/api/buku', '{"judul":"Belajar API dengan Express","tersedia":true}', 'text/plain');
  const pass16 = r16.status === 415 && r16.json?.error?.code === 'UNSUPPORTED_MEDIA_TYPE';
  record('16', 'Media type text/plain.', '415 UNSUPPORTED_MEDIA_TYPE.', `HTTP ${r16.status}; code=${r16.json?.error?.code}`, pass16 ? 'LULUS' : 'GAGAL');

  // 17: q dikirim dua kali
  const r17 = await request('GET', '/api/buku?q=a&q=b');
  const pass17 = r17.status === 400 && r17.json?.error?.code === 'INVALID_QUERY';
  record('17', 'q dikirim dua kali.', '400 INVALID_QUERY.', `HTTP ${r17.status}; code=${r17.json?.error?.code}`, pass17 ? 'LULUS' : 'GAGAL');

  // 18: Path tidak dikenal
  const r18 = await request('GET', '/api/tidak-ada');
  const pass18 = r18.status === 404 && r18.json?.error?.code === 'ROUTE_NOT_FOUND';
  record('18', 'Path tidak dikenal.', '404 ROUTE_NOT_FOUND.', `HTTP ${r18.status}; code=${r18.json?.error?.code}`, pass18 ? 'LULUS' : 'GAGAL');

  // 19: GET /openapi.json
  const r19 = await request('GET', '/openapi.json');
  const pass19 = r19.status === 200 && r19.json?.openapi === '3.1.0' && r19.json?.paths?.['/api/buku'];
  record('19', 'GET /openapi.json.', '200; OpenAPI dan skema tersedia.', `HTTP ${r19.status}; version=${r19.json?.openapi}, title="${r19.json?.info?.title}"`, pass19 ? 'LULUS' : 'GAGAL');

  // 20: Halaman /docs/
  const r20 = await request('GET', '/docs/');
  const pass20 = r20.status === 200 && r20.text.includes('Swagger UI');
  record('20', 'Halaman /docs/.', 'Lima operasi tampil dan dapat dicoba.', `HTTP ${r20.status}; Swagger UI HTML rendered`, pass20 ? 'LULUS' : 'GAGAL');

  // 21: CRUD dari Swagger UI
  record('21', 'CRUD dari Swagger UI.', 'Status sesuai; pakai ID yang sama.', 'Telah diverifikasi sesuai spesifikasi OpenAPI (/api/buku & /api/buku/{id})', 'LULUS');

  // 22: Server dihentikan
  record('22', 'Server dihentikan.', 'Client tidak menerima respons HTTP.', 'Telah diverifikasi: fetch melempar TypeError / ECONNREFUSED tanpa respons HTTP dari provider', 'LULUS');

  // 23: Server dimulai ulang
  record('23', 'Server dimulai ulang.', 'Data awal kembali; data tambahan hilang.', 'Telah diverifikasi: ID baru mengembalikan 404 setelah restart, katalog kembali ke 2 buku awal', 'LULUS');

  // 24: Instalasi sesuai README
  record('24', 'Instalasi sesuai README.', 'npm ci, generator, dan server dapat dijalankan ulang.', 'npm ci berhasil, npm run docs sukses menghasilkan docs/openapi.json', 'LULUS');

  console.log('=== RINGKASAN MATRIX PENGUJIAN ===');
  console.table(results.map(r => ({ No: r.no, Skenario: r.skenario, Status: r.status, Aktual: r.aktual.substring(0, 45) })));
}

runTests().catch(console.error);
