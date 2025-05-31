// File: src/components/BillsSelect.js
import { useState, useEffect, useCallback } from "react";
import { Select, Option } from "@material-tailwind/react";
import Cookies from "js-cookie";
import { fetchTenantDetails } from "../utils/fetchTenant";

import React, { forwardRef, useImperativeHandle } from "react";

const BillsSelect = forwardRef(({ unitId, feeId, onSelect, initialSelectedBills = [] }, ref) => {
  const [billsData, setBillsData] = useState([]);
  const [selectedBills, setSelectedBills] = useState(initialSelectedBills);
  const [allbillsData, setAllBillsData] = useState([]);

  const generateFullYearData = useCallback((existingData) => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
  
    const fullYearData = [];
    const existingMonthsMap = {};
  
    let startMonth, startYear, defaultAmount;
  
    if (existingData.length > 0) {
      // Urutkan dan cari bulan setelah tanggal terakhir
      const sortedByDate = [...existingData].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      const lastDate = new Date(sortedByDate[sortedByDate.length - 1].due_date);
      startMonth = lastDate.getMonth() + 1;
      startYear = lastDate.getFullYear();
      defaultAmount = sortedByDate[0].amount_due;
  
      // Masukkan existing data ke dalam map + array final
      existingData.forEach(item => {
        const date = new Date(item.due_date);
        const key = `${date.getMonth()}-${date.getFullYear()}`;
        existingMonthsMap[key] = item;
        fullYearData.push(item);
      });
    } else {
      // Kalau data kosong, mulai dari bulan sekarang
      const now = new Date();
      startMonth = now.getMonth();
      startYear = now.getFullYear();
      defaultAmount = "0.00";
    }
  
    // Tambahkan 12 bulan ke depan (jangan duplikat bulan yang sudah ada)
    for (let index = 0; index < 12; index++) {
      const key = `${startMonth}-${startYear}`;
      if (!existingMonthsMap[key]) {
        const lastDayOfMonth = new Date(startYear, startMonth + 1, 0);
        const formattedDate = `${monthNames[startMonth]} ${startYear}`;
  
        fullYearData.push({
          bill_id: -1 * (index + 1), // ID negatif untuk data dummy
          fee_id: feeId,
          due_date: lastDayOfMonth.toISOString(),
          due_date_formatted: formattedDate,
          amount_due: defaultAmount,
          amount_paid: "0.00"
        });
      }
  
      // Geser ke bulan berikutnya
      startMonth++;
      if (startMonth > 11) {
        startMonth = 0;
        startYear++;
      }
    }
  
    // Kembalikan data terurut berdasarkan tanggal
    return fullYearData.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [feeId]);
  

  // Fetch data API
  const getBillsData = useCallback(async () => {
    if (!unitId || !feeId) return;
    
    const token = Cookies.get("token.app_oq");  

    try {
      const response = await fetch(`/api/fee/bills/${unitId}/${feeId}/?allbill=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
        },
      });
  
      
      const data = await response.json();
      //console.log("Data:", data.data[0].items);
      
      if (data && Array.isArray(data.data[0].items)) {
        setAllBillsData(data.data[0].items);
        // Filter data unpaid
        const unpaidData = data.data[0].items.filter((item) => item.status !== 'paid');
        
        // Generate data setahun
        const fullYearData = generateFullYearData(unpaidData);

        //console.log("Full Year Data:", fullYearData);
        
        setBillsData(fullYearData);
      } else {
        // Data kosong untuk setahun
        const emptyYearData = generateFullYearData([]);
        setBillsData(emptyYearData);
      }
  
    } catch (error) {
      console.error("Error fetching fees:", error.message);
    }
  }, [ unitId, feeId, generateFullYearData]);


  useEffect(() => {
    if (unitId && feeId) {
      getBillsData();
    } else {
      setBillsData([]);
    }
  }, [getBillsData, unitId, feeId]);


  useEffect(() => {
    if (initialSelectedBills.length > 0) {
      setSelectedBills(initialSelectedBills);
    }
  }, [initialSelectedBills]);

  useEffect(() => {
    if (selectedBills.length > 0  ) {
    
      const selected = allbillsData
        .filter((bill) => selectedBills.includes(bill.unit_fee_id.toString()))
        .map((bill) => {
          const dueDate = new Date(bill.due_date);
          const due_date_formatted = dueDate.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          });
  
          return {
            bill_id: bill.unit_fee_id,
            fee_id: bill.fee_id,
            due_date: bill.due_date,
            due_date_formatted,
            amount_due: bill.amount_due,
            amount_paid: bill.amount_paid,
            //editable_amount: parseInt(bill.amount_paid).toString(),
          };
        });

      if (selected.length > 0) {
        onSelect(selected);
      }
    }
  }, [selectedBills,allbillsData]);
  

  // Handle pilih bulan
  const handleSelect = (value) => {
    //console.log(billsData);
    const selected = billsData.find((bill) => bill.bill_id.toString() === value.toString());
  
    if (selected) {
      // Tanda jika ini generated data
      const selectedData = selected.bill_id < 0 ? {
        ...selected,
        is_generated: true
      } : selected;
      
      // Kirim hanya bill yang dipilih ke parent
      // Parent akan bertanggung jawab menggabungkannya dengan data sebelumnya
      if (onSelect) {
        onSelect([selectedData]);
      }
      
      // Update local state juga
      const updatedSelectedBills = [...selectedBills, selectedData];
      setSelectedBills(updatedSelectedBills);
      
      // Hapus dari opsi dropdown
      setBillsData(billsData.filter((bill) => bill.bill_id !== selected.bill_id));
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    // Method untuk menambahkan bill yang dihapus kembali ke dropdown
    addRemovedBill: (bill) => {
      // Cek apakah bill sudah ada di daftar
      const exists = billsData.some(item => item.bill_id === bill.bill_id);
      if (!exists) {
        // Tambahkan kembali dan urutkan
        setBillsData(prev => {
          return [...prev, bill].sort((a, b) => {
            const dateA = new Date(a.due_date);
            const dateB = new Date(b.due_date);
            return dateA - dateB;
          });
        });
      }
    }
  }));
  
  return (
    <div className="w-full">
      <Select
        key={`bills-select-${selectedBills.length}`}
        size="lg"
        value="Pilih Bulan"
        onChange={handleSelect} 
        labelProps={{
          className: "hidden",
        }}
        className="border-t-blue-gray-200 aria-[expanded=true]:border-t-blue-gray-900 !border-blue-gray-200"
      >
        <Option value="Pilih Bulan" disabled>Pilih Bulan</Option>
        {billsData.map((bill, index) => (
          <Option key={`bill-option-${bill.bill_id}-${index}`} value={bill.bill_id}>
            {bill.due_date_formatted}
          </Option>
        ))}
      </Select>
    </div>
  );
});

// Tambahkan displayName untuk component forwardRef
BillsSelect.displayName = 'BillsSelect';

export default BillsSelect;