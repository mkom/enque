import { useState, useEffect, useCallback } from "react";
import { Select, Option, Typography, Input } from "@material-tailwind/react";
import Cookies from "js-cookie";
import { fetchTenantDetails } from "../utils/fetchTenant";

export default function FeeSelect({onSelect }) {
  const [invoceData, setInvoiceData] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
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

  const getInvoiceData =  useCallback( async () => {
    const token = Cookies.get("token.oqoe");
    const url = `/api/fee/invoices`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                'X-Tenant-Id': tenantId,
            },
        });
    
        const data = await response.json();
        //console.log(data);

        if (data && Array.isArray(data.data)) {
          const filteredData = data.data
            .filter((item) => item.status !== 'paid')
            .map((item) => ({
              invoice_id: item.invoice_id,
              fee_name: item.fee_name,
              due_date: item.due_date,
              is_recurring: item.is_recurring,
              amount_due: item.amount_due,
              amount_paid: item.amount_paid
            }));
    
            setInvoiceData(filteredData);
          //console.log("Fees data:", filteredData);
        } else {
          console.error("No valid data found", data);
        }

        
        } catch (error) {
            console.error('Error fetching:', error.message);
            throw error;
        } finally {
           // setSkeletonShow(false); 
        }

  },[tenantId]);

  useEffect(() => {
    if (tenantId && tenantId !== 0) {
      getInvoiceData();
    } else {
     // console.warn("Invalid tenantId:", tenantId);
     getInvoiceData([]); // Kosongkan data jika tenantId tidak valid
    }
  }, [getInvoiceData, tenantId]);
  

  // Fungsi untuk menangani pemilihan fee
  const handleSelect = (value) => {
   // console.log("Selected value in handleSelect:", value); // Untuk memeriksa nilai yang diterima
    const selected = invoceData.find((inv) => inv.invoice_id === Number(value));
  
    if (selected) {
      setSelectedInvoiceId(selected.invoice_id); 
      if (onSelect) onSelect({ id: selected.invoice_id, name: selected.fee_name,  period: selected.due_date }); // Kirim data ke parent
    }
  };
  

  return (
    <div className="w-full">
     
        <Select
          key={selectedInvoiceId}
          size="lg"
          label="Pilih Tagihan"
          value={selectedInvoiceId ? selectedInvoiceId.toString() : ""}
          onChange={handleSelect} // Pastikan feeId dikirimkan
          labelProps={{
              className: "hidden",
            }}
            className="border-t-blue-gray-200 aria-[expanded=true]:border-t-blue-gray-900 !border-blue-gray-200"
        >
           
            {invoceData.map((inv) => (
            <Option key={inv.invoice_id} value={inv.invoice_id.toString()}>
                {`Tagihan iuran ${inv.fee_name} ${inv.is_recurring ? inv.due_date :''}`}
            </Option>
            ))}
        </Select>

    </div>
  );
}
