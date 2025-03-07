// utils/jwtUtils.js
import { jwtDecode } from 'jwt-decode';


// Cek apakah token kedaluwarsa
export const isTokenExpired = (token) => {
  try {
    const payload = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000); // Waktu saat ini dalam detik
    return payload.exp < now;
  } catch (error) {
    console.error('Invalid token:', error);
    return true;
  }
};

// Ambil payload dari token
export const getTokenPayload = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
