import { useState, useEffect, useCallback } from "react";
import { Select, Option, Typography, Input } from "@material-tailwind/react";
import Cookies from "js-cookie";
import { fetchTenantDetails } from "../utils/fetchTenant";

export default function FeeSelect({onSelect }) {
  const [feesData, setFeesData] = useState([]);
  const [selectedFeeId, setSelectedFeeId] = useState(null);
  const [tenantId, setTenantId] = useState(0);

  useEffect(() => {
      const getTenantData = async () => {
          try {
          const tenantData = await fetchTenantDetails();
          setTenantId(tenantData.tenant_id || '0');
          } catch (error) {
          console.error('Failed to load tenant data:', error);
          }
      };

      getTenantData();
  }, []);

  // Fetch data dari API
  const getFeesData = useCallback(async () => {
    const token = Cookies.get("token.oqoe");
    const url = tenantId ? `/api/fee?tenan_id=${tenantId}` : "/api/fee";
  
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
        },
      });
  
      // Cek apakah response.ok, jika tidak lempar error
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      // Pastikan data ada dan sesuai format
      if (data && Array.isArray(data.data)) {
        const filteredData = data.data
          .filter((item) => item.status === true)  // Hanya status yang true
          .map((item) => ({
            fee_id: item.fee_id,
            fee_name: item.fee_name,
            fee_type: item.fee_type,
          }));
  
        setFeesData(filteredData);
        //console.log("Fees data:", filteredData);
      } else {
        console.error("No valid data found", data);
      }
  
    } catch (error) {
      console.error("Error fetching fees:", error.message);
    }
  }, [tenantId]);
  

  useEffect(() => {
    if (tenantId && tenantId !== 0) {
      getFeesData();
    } else {
     // console.warn("Invalid tenantId:", tenantId);
      setFeesData([]); // Kosongkan data jika tenantId tidak valid
    }
  }, [getFeesData, tenantId]);
  

  // Fungsi untuk menangani pemilihan fee
  const handleSelect = (value) => {
   // console.log("Selected value in handleSelect:", value); // Untuk memeriksa nilai yang diterima
    const selected = feesData.find((fee) => fee.fee_id === Number(value));
  
    if (selected) {
      setSelectedFeeId(selected.fee_id); // Simpan fee_id
      if (onSelect) onSelect({ id: selected.fee_id, name: selected.fee_name,  type: selected.fee_type }); // Kirim data ke parent
    }
  };
  

  return (
    <div className="w-full">
     
        <Select
          key={selectedFeeId}
          size="lg"
          label="Pilih Iuran"
          value={selectedFeeId ? selectedFeeId.toString() : ""}
          onChange={handleSelect} // Pastikan feeId dikirimkan
          labelProps={{
              className: "hidden",
            }}
            className="border-t-blue-gray-200 aria-[expanded=true]:border-t-blue-gray-900 !border-blue-gray-200"
        >
           
            {feesData.map((fee) => (
            <Option key={fee.fee_id} value={fee.fee_id.toString()}>
                {fee.fee_name}
            </Option>
            ))}
        </Select>

    </div>
  );
}
