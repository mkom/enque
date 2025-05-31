// utils/apiResponse.js - Utilitas untuk memformat respon API secara konsisten

/**
 * Membuat respon API berhasil
 * @param {Object} data - Data yang akan dikembalikan dalam respons
 * @param {string} message - Pesan sukses
 * @param {number} status - Kode status HTTP (default: 200)
 * @returns {Response} - Objek Response dengan format yang konsisten
 */
export function successResponse(data = [], message = 'Sukses', status = 200) {
  return new Response(
    JSON.stringify({
      status: 'success',
      message,
      data,
    }),
    { 
      status, 
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Membuat respon API gagal
 * @param {string} message - Pesan kesalahan
 * @param {Object} data - Data tambahan (opsional)
 * @param {number} status - Kode status HTTP (default: 400)
 * @returns {Response} - Objek Response dengan format yang konsisten
 */
export function errorResponse(message = 'Terjadi kesalahan', data = [], status = 400) {
  return new Response(
    JSON.stringify({
      status: 'error',
      message,
      data,
    }),
    { 
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Membuat respon tidak ditemukan
 * @param {string} message - Pesan tidak ditemukan
 * @returns {Response} - Objek Response 404
 */
export function notFoundResponse(message = 'Data tidak ditemukan') {
  return errorResponse(message, [], 404);
}

/**
 * Membuat respon tidak diotorisasi
 * @param {string} message - Pesan tidak diotorisasi
 * @returns {Response} - Objek Response 401
 */
export function unauthorizedResponse(message = 'Tidak diotorisasi') {
  return errorResponse(message, [], 401);
}