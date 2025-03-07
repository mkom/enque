// utils/logout.js
import Cookies from "js-cookie";
export const logout = (router) => {
    Cookies.remove("token.oqoe");
    
    // Redirect ke halaman login
    router.push('/');
};
  