// utils/redirect.js
import Cookies from "js-cookie";
import { isTokenExpired, getTokenPayload } from './jwtUtils';

export const redirectBasedOnAuth = async (router, pathname, allowedRoles = []) => {

  const token = Cookies.get("token.oqoe");

  // Jika token tidak ada, arahkan ke /login
  if (!token) {
    router.push('/login');
    return;
  }

  // Jika token kedaluwarsa, hapus token dan arahkan ke /login
  if (isTokenExpired(token)) {
    Cookies.remove("token.oqoe");
    router.push('/login');
    return;
  }

  try {
    // Ambil payload dari token
    const payload = getTokenPayload(token);

    // console.log(payload);
    // console.log(allowedRoles)
    // console.log(pathname)

    // Jika pengguna sudah login dan mengakses `/`, arahkan ke `/dashboard`
    if (pathname === '/' && payload) {
      router.push('/dashboard');
      return;
    }
    

    // Periksa apakah peran pengguna termasuk dalam `allowedRoles`
    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      router.push('/unauthorized'); // Arahkan ke halaman Unauthorized
      return;
    }

    // Jika semua validasi lolos, tetap di halaman saat ini atau lanjutkan
    return;
  } catch (error) {
    console.error('Error verifying token:', error);
    Cookies.remove("token.oqoe");
    router.push('/login');
  }
};
