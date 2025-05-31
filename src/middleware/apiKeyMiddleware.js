// /src/middleware/apiKeyMiddleware.js
import 'dotenv/config';

export function apiKeyMiddleware(req) {
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new Error('Unauthorized');
    }
}
  