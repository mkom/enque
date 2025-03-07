// /src/middleware/apiKeyMiddleware.js
import 'dotenv/config';  // Pastikan dotenv digunakan

export function apiKeyMiddleware(req) {
   // console.log('Headers Request:', req.headers); // Debugging
    const apiKey = req.headers.get('x-api-key'); // Gunakan .get() untuk mengakses header
    // console.log('API Key dari Header:', apiKey);  // Debugging
    // console.log('API Key dari .env.local:', process.env.API_KEY); // Debugging

    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new Error('Unauthorized');
    }
  }
  