// utils/redirect.js
import Cookies from "js-cookie";
import { isTokenExpired, getTokenPayload } from './jwtUtils';
import { fetchUser } from "./fetchUser";

export const redirectBasedOnAuth = async (router, pathname, allowedRoles = []) => {
  //console.log("redirectBasedOnAuth", { router, pathname, allowedRoles });

  const token = Cookies.get("token.app_oq");

  if (!token) {
   // console.warn("No token found. Redirecting to /login.");
    router.push('/login');
    return;
  }

  if (isTokenExpired(token)) {
    //console.warn("Token expired. Removing token and redirecting to /login.");
    Cookies.remove("token.app_oq");
    router.push('/login');
    return;
  }

  try {
    const payload = getTokenPayload(token);
   // console.log("Token payload:", payload);

    if (pathname === '/' && payload) {
      //console.info("User already logged in. Redirecting to /dashboard.");
      router.push('/dashboard');
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      //console.warn("User role not authorized. Redirecting to /unauthorized.");
      router.push('/unauthorized');
      return;
    }

    // Check if tenantId in payload matches the user's tenant_id
    const user = await fetchUser(); // Adjusted to call fetchUser without userId
   // console.log("Fetched user:", user);
    if (!user || user.tenant_id !== payload.tenantId) {
      //console.warn("Tenant ID mismatch. Redirecting to /unauthorized.");
      router.push('/unauthorized');
      return;
    }

    //console.info("All validations passed. Staying on the current page.");
    return;
  } catch (error) {
    //console.error("Error verifying token in redirectBasedOnAuth:", error);
    Cookies.remove("token.app_oq");
    router.push('/login');
  }
};
