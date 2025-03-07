// utils/auth.js
export const verifyToken = async (token) => {
    try {
      const response = await fetch('/api/verify-token', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.message === 'Invalid or expired token') {
        return { isValid: false, user: null };
      }
      
      return { isValid: true, user: data.user };
    } catch (error) {
      throw new Error('Error verifying token');
    }
  };
  