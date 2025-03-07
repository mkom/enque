import { useState, useEffect, useCallback } from "react";
import { Input, Typography } from "@material-tailwind/react";
import Cookies from "js-cookie";
import { fetchTenantDetails } from "../utils/fetchTenant";

export default function UnitAutocomplete({onSelect }) {
  const [membersData, setMembersData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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
  const getMembersData = useCallback(async () => {
    const token = Cookies.get("token.oqoe");
    const url = tenantId ? `/api/member?tenan_id=${tenantId}` : "/api/member";

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
        },
      });

      const data = await response.json();
      setMembersData(data.data || []);
      setFilteredData(data.data || []); // Inisialisasi filteredData
    } catch (error) {
      console.error("Error fetching tenant details:", error.message);
    }
  }, [tenantId]);

  useEffect(() => {
    getMembersData();
  }, [getMembersData]);

  // Fungsi untuk menangani pencarian
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value === "") {
      setFilteredData([]); // Jika kosong, tidak ada opsi yang ditampilkan
      setIsOpen(false);
    } else {
      const filtered = membersData.filter((member) =>
        member.member_address.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredData(filtered);
      setIsOpen(true); // Tampilkan dropdown saat mengetik
    }
  };

  // Pilih unit dari hasil autocomplete
  const handleSelect = (member) => {
    setSearchTerm(member.member_address); // Yang tampil di input adalah member_address
    setSelectedName(member.member_name);
    setIsOpen(false);
    if (onSelect) onSelect({ id: member.member_id, name: member.member_name });
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
            filteredData.map((member) => (
              <div
                key={member.member_id}
                className="px-4 py-2 cursor-pointer hover:bg-blue-gray-100"
                onMouseDown={() => handleSelect(member)}
              >
                {member.member_address} {/* Tampilkan alamat unit */}
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
