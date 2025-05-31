// File: src/components/UnitAutocomplete.js
import { useState, useEffect, useCallback } from "react";
import { Input, Typography } from "@material-tailwind/react";
import Cookies from "js-cookie";
import { fetchTenantDetails } from "../utils/fetchTenant";

export default function UnitAutocomplete({onSelect,initialValue = "" }) {
  const [unitsData, setUnitsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [selectedName, setSelectedName] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);

  const [tenantId, setTenantId] = useState(0);

  useEffect(() => {
    setSearchTerm(initialValue);
    setSelectedName(initialValue);
  }, [initialValue]);


  // Fetch data dari API
  const getUnitsData = useCallback(async () => {
    const token = Cookies.get("token.app_oq");
    
    try {
      const response = await fetch(`/api/unit`,  {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
        },
      });

      const data = await response.json();
      const occupiedUnits = data.data.filter(unit => unit.status === 'occupied');
      setUnitsData(occupiedUnits || []);
      setFilteredData(occupiedUnits || []); // Inisialisasi filteredData
    } catch (error) {
      console.error("Error fetching tenant details:", error.message);
    }
  }, [tenantId]);

  useEffect(() => {
    getUnitsData();
  }, [getUnitsData]);

  // Fungsi untuk menangani pencarian
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value === "") {
      setFilteredData([]); // Jika kosong, tidak ada opsi yang ditampilkan
      setIsOpen(false);
    } else {
      const filtered = unitsData.filter((unit) =>
        unit.house_number.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredData(filtered);
      setIsOpen(true); // Tampilkan dropdown saat mengetik
    }
  };

  // Pilih unit dari hasil autocomplete
  const handleSelect = (unit) => {
    setSearchTerm(unit.house_number); // Yang tampil di input adalah unit.house_number
    setSelectedName(unit.unit_name);
    setIsOpen(false);
    if (onSelect) onSelect({ id: unit.unit_id, name: unit.house_number });
  };

  return (
    <div className="w-full relative">
      {/* <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
        No. Unit
      </Typography> */}
      <Input
        size="lg"
        labelProps={{
            className: "hidden",
          }}
        placeholder="Cari Unit..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => searchTerm && setIsOpen(true)} // Tampilkan dropdown saat input difokuskan jika ada teks
        onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Tutup dropdown setelah kehilangan fokus (dengan delay)
        className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
      />

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-gray-300 rounded-md max-h-48 overflow-y-auto">
          {filteredData.length > 0 ? (
            filteredData.map((unit) => (
              <div
                key={unit.unit_id}
                className="px-4 py-2 cursor-pointer hover:bg-blue-gray-100"
                onMouseDown={() => handleSelect(unit)}
              >
                <span className="font-medium">{unit.house_number}</span> - {unit.unit_name}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
