// CategorySelect.js
import { useState, useEffect } from "react";
import { Select, Option } from "@material-tailwind/react";
import Cookies from "js-cookie";

function CategorySelect({ initialValue = 3, onSelect }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(String(initialValue));
  console.log("CategorySelect initialValue", initialValue);
    console.log("CategorySelect selectedCategoryId", selectedCategoryId);

//   useEffect(() => {
//     setSelectedCategoryId(String(initialValue));
//   }, [initialValue]);

  useEffect(() => {
    async function fetchCategories() {
      const token = Cookies.get("token.app_oq");
      try {
        const response = await fetch("/api/transactions/category", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch categories");

        const result = await response.json();
        if (result.status === "success") {
          setCategories(result.data);
        } else {
          console.error("Error fetching categories:", result.message);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleSelect = (value) => {
    setSelectedCategoryId(value);
    const selected = categories.find(
      (category) => String(category.category_id) === String(value)
    );
    if (selected && onSelect) {
      onSelect({
        id: selected.category_id,
        name: selected.category_name,
      });
    }
  };

  const options = [
    { id: '', name: 'Pilih kategori', disabled: true },
    ...categories.map(category => ({ id: category.category_id, name: category.category_name, disabled: false }))
  ];

  return (
    <Select
      //value={selectedCategoryId}
      onChange={handleSelect}
      labelProps={{ className: "hidden" }}
      className="border-t-blue-gray-200 aria-[expanded=true]:border-t-blue-gray-900 !border-blue-gray-200"
    >
      {isLoading ? (
        <Option disabled>Loading...</Option>
      ) : (
        options.map((category) => (
          <Option key={category.id || 'default'} value={String(category.id)} disabled={category.disabled}>
            {category.name}
          </Option>
        ))
      )}
    </Select>
  );
}

export default CategorySelect;
