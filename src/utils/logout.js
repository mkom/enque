// utils/logout.js
import Cookies from "js-cookie";
export const logout = (router) => {
    Cookies.remove("token.app_oq");
    
    // Redirect ke halaman login
    router.push('/');
};
  