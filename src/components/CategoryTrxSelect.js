// CategoryTrx.js   
import { useState, useEffect } from "react";
import { Select, Option } from "@material-tailwind/react";
import Cookies from "js-cookie";

export default function CategoryTrxSelect({ onSelect, initialValue = "" }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(String(initialValue));
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    async function fetchCategories() {
      const token = Cookies.get("token.app_oq");
      try {
        const response = await fetch('/api/transactions/category', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const result = await response.json();
        if (result.status === 'success') {
          setCategories(result.data);
        } else {
          console.error('Error fetching categories:', result.message);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

    const handleSelect = (value) => {
    //setSelectedCategoryId(value);
    const selected = categories.find(
        (category) => String(category.category_id) === value
    );

    if (selected && onSelect) {
        onSelect({
        id: selected.category_id,
        name: selected.category_name,
        });
    }
    };



  // Prepare options array with default option
const options = [
  { id: '', name: 'Pilih Kategori', disabled: true },
  ...categories.map((category) => ({
    id: String(category.category_id), // casting ke string
    name: category.category_name,
    disabled: false,
  })),
];


  return (
    <Select
      size="lg"
        labelProps={{
          className: "hidden",
        }}
        value={selectedCategoryId}
        onChange={(val) => handleSelect(val)}
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
  );
}