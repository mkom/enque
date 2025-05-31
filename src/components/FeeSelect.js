// FeeSelect.js
import { useState, useEffect } from "react";
import { Select, Option } from "@material-tailwind/react";
import Cookies from "js-cookie";

export default function FeeSelect({ onSelect, initialValue = "" }) {
  const [feesData, setFeesData] = useState([]);
  const [selectedFeeId, setSelectedFeeId] = useState(String(initialValue));
  const [isLoading, setIsLoading] = useState(true);

  //console.log("FeeSelect initialValue", initialValue);
  useEffect(() => {
    setSelectedFeeId(initialValue);
  }, [initialValue]);

  useEffect(() => {
    async function loadData() {
      try {
        
        // Fetch fees data
        const token = Cookies.get("token.app_oq");
        const response = await fetch('/api/fee', {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
        });
        
        const data = await response.json();
        
        if (data?.data) {
          const activeData = data.data
            .filter(item => item.status === 'active')
            .map(item => ({
              fee_id: String(item.fee_id),
              fee_name: item.fee_name,
              is_recurring: item.is_recurring,
            }));
          
          setFeesData(activeData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Simplest possible handler
  const handleSelect = (value) => {
    setSelectedFeeId(value);
    const selected = feesData.find((fee) => fee.fee_id === String(value));
  
    if (selected && onSelect) {
      onSelect({
        id: selected.fee_id,
        name: selected.fee_name,
        is_recurring: selected.is_recurring || false
      });
    }
  };

  // If still loading, render a placeholder
  if (isLoading) {
    return (
      <div className="w-full p-3 border border-blue-gray-200 rounded-md">
        Loading...
      </div>
    );
  }

  // Prepare options array with default option
  const options = [
    { id: '', name: 'Pilih Iuran', disabled: true },
    ...feesData.map(fee => ({ id: fee.fee_id, name: fee.fee_name, disabled: false }))
  ];

  return (
    <div className="w-full">
      <Select
       size="lg"
        //label="Pilih Iuran"
        labelProps={{
          className: "hidden",
        }}
        value={selectedFeeId}
        onChange={handleSelect}
        className="border-t-blue-gray-200 aria-[expanded=true]:border-t-blue-gray-900 !border-blue-gray-200"
      >
        {options.map(option => (
          <Option 
            key={option.id || 'default'} 
            value={option.id}
            disabled={option.disabled}
            className="mb-[2px] last:mb-0"
          >
            {option.name}
          </Option>
        ))}
      </Select>
    </div>
  );
}