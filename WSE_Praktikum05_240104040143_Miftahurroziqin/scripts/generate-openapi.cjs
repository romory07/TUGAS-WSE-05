const fs = require('node:fs');
const path = require('node:path');

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const fields = {
  judul: {
    type: 'string',
    description: 'Setelah trim, panjang 1-120 unit UTF-16.'
  },
  tersedia: {
    type: 'boolean',
    description: 'Status ketersediaan buku untuk dipinjam (wajib true/false boolean murni).'
  }
};

const book = {
  id: 1,
  judul: 'Dasar Pemrograman Kotlin',
  tersedia: true
};

const input = {
  judul: 'Belajar API dengan Express',
  tersedia: true
};

function jsonResponse(description, schema, example) {
  return {
    description,
    content: {
      'application/json': {
        schema: ref(schema),
        ...(example ? { example } : {})
      }
    }
  };
}

const errorDescriptions = {
  400: 'Input tidak valid (INVALID_ID bila format ID salah, INVALID_QUERY bila parameter query tidak sesuai, INVALID_BOOK bila body tidak sesuai skema, atau INVALID_JSON bila sintaks JSON rusak).',
  404: 'Resource tidak ditemukan (BOOK_NOT_FOUND jika data buku dengan ID target tidak ada di katalog).',
  413: 'Payload melebihi batas (PAYLOAD_TOO_LARGE: Body request melebihi batas parser 10kb).',
  415: 'Media type tidak didukung (UNSUPPORTED_MEDIA_TYPE: Wajib menggunakan Content-Type application/json).',
  500: 'Kesalahan internal server (INTERNAL_ERROR).'
};

const errorExamples = {
  400: { success: false, error: { code: 'INVALID_BOOK', message: 'Isi hanya judul 1-120 karakter dan tersedia boolean.' } },
  404: { success: false, error: { code: 'BOOK_NOT_FOUND', message: 'Buku tidak ditemukan.' } },
  413: { success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Body melebihi batas 10kb.' } },
  415: { success: false, error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Gunakan Content-Type application/json.' } },
  500: { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server.' } }
};

function responses(success, codes, customExamples = {}) {
  const result = { ...success };
  for (const code of codes) {
    const example = customExamples[code] || errorExamples[code];
    result[code] = jsonResponse(errorDescriptions[code], 'ErrorResponse', example);
  }
  return result;
}

const body = {
  required: true,
  content: {
    'application/json': {
      schema: ref('BukuInput'),
      example: input
    }
  }
};

const id = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Digit positif tanpa nol di depan; nilai <= 9007199254740991.',
  schema: { type: 'string', pattern: '^[1-9][0-9]*$' },
  example: '1'
};

const created = jsonResponse('Buku dibuat.', 'BukuResponse', {
  success: true,
  data: { id: 3, ...input }
});
created.headers = {
  Location: {
    description: 'URI buku baru.',
    schema: { type: 'string' },
    example: '/api/buku/3'
  }
};

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'API Katalog Perpustakaan',
    version: '1.0.0',
    description:
      'Praktikum lokal tanpa login. Data memori hilang saat restart. ' +
      'POST dan PUT wajib judul serta tersedia, tanpa field tambahan. ' +
      'Kode error: INVALID_ID, INVALID_QUERY, INVALID_BOOK, INVALID_JSON, ' +
      'BOOK_NOT_FOUND, PAYLOAD_TOO_LARGE, UNSUPPORTED_MEDIA_TYPE, ' +
      'ROUTE_NOT_FOUND, BAD_REQUEST, INTERNAL_ERROR.'
  },
  servers: [{ url: 'http://127.0.0.1:3200' }],
  tags: [{ name: 'Buku', description: 'Operasi katalog perpustakaan kampus.' }],
  paths: {
    '/api/buku': {
      get: {
        tags: ['Buku'],
        summary: 'Membaca atau mencari daftar buku',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Satu teks, maksimal 80 unit UTF-16; kosong menampilkan semua.',
            schema: { type: 'string' },
            example: 'kotlin'
          }
        ],
        responses: responses(
          {
            200: jsonResponse('Daftar buku; boleh kosong.', 'DaftarResponse', {
              success: true,
              data: [book]
            })
          },
          [400, 500],
          {
            400: {
              success: false,
              error: {
                code: 'INVALID_QUERY',
                message: 'q harus berupa satu teks maksimal 80 karakter.'
              }
            }
          }
        )
      },
      post: {
        tags: ['Buku'],
        summary: 'Menambahkan buku',
        requestBody: body,
        responses: responses({ 201: created }, [400, 413, 415, 500], {
          400: {
            success: false,
            error: {
              code: 'INVALID_BOOK',
              message: 'Isi hanya judul 1-120 karakter dan tersedia boolean.'
            }
          }
        })
      }
    },
    '/api/buku/{id}': {
      parameters: [id],
      get: {
        tags: ['Buku'],
        summary: 'Membaca satu buku',
        responses: responses(
          {
            200: jsonResponse('Buku ditemukan.', 'BukuResponse', {
              success: true,
              data: book
            })
          },
          [400, 404, 500],
          {
            400: {
              success: false,
              error: {
                code: 'INVALID_ID',
                message: 'ID harus berupa bilangan bulat positif.'
              }
            },
            404: {
              success: false,
              error: {
                code: 'BOOK_NOT_FOUND',
                message: 'Buku tidak ditemukan.'
              }
            }
          }
        )
      },
      put: {
        tags: ['Buku'],
        summary: 'Mengganti seluruh field buku',
        description: 'Target harus sudah ada. judul dan tersedia wajib.',
        requestBody: body,
        responses: responses(
          {
            200: jsonResponse('Buku diperbarui.', 'BukuResponse', {
              success: true,
              data: { id: 1, judul: 'Belajar API HTTP', tersedia: false }
            })
          },
          [400, 404, 413, 415, 500],
          {
            400: {
              success: false,
              error: {
                code: 'INVALID_BOOK',
                message: 'Isi hanya judul 1-120 karakter dan tersedia boolean.'
              }
            },
            404: {
              success: false,
              error: {
                code: 'BOOK_NOT_FOUND',
                message: 'Buku tidak ditemukan.'
              }
            }
          }
        )
      },
      delete: {
        tags: ['Buku'],
        summary: 'Menghapus buku',
        responses: responses(
          {
            204: { description: 'Berhasil tanpa body.' }
          },
          [400, 404, 500],
          {
            400: {
              success: false,
              error: {
                code: 'INVALID_ID',
                message: 'ID harus berupa bilangan bulat positif.'
              }
            },
            404: {
              success: false,
              error: {
                code: 'BOOK_NOT_FOUND',
                message: 'Buku tidak ditemukan.'
              }
            }
          }
        )
      }
    }
  },
  components: {
    schemas: {
      BukuInput: {
        type: 'object',
        additionalProperties: false,
        required: ['judul', 'tersedia'],
        properties: fields
      },
      Buku: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'judul', 'tersedia'],
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            maximum: 9007199254740991
          },
          ...fields
        }
      },
      BukuResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { const: true },
          data: ref('Buku')
        }
      },
      DaftarResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { const: true },
          data: {
            type: 'array',
            items: ref('Buku')
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { const: false },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    }
  }
};

const target = path.join(__dirname, '..', 'docs', 'openapi.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(spec, null, 2) + '\n');
console.log('Dokumen dibuat: docs/openapi.json');
