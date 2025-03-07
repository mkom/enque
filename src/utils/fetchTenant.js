import Cookies from "js-cookie";
export const fetchTenantDetails = async () => {
    const token = Cookies.get("token.oqoe");
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    try {
      const response = await fetch('/api/tenant', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': apiKey,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
  
      const data = await response.json();
      //console.log(data)
      return data.data; // Mengembalikan data tenant
    } catch (error) {
      console.error('Error fetching tenant details:', error.message);
      throw error;
    }
};
  