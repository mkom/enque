// TransactionCategories.js
"use client";
import Cookies from "js-cookie";
import { useState,useEffect,useCallback } from "react";
import {
  Input,
  Textarea,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@material-tailwind/react";
import {PencilIcon,TrashIcon} from "@heroicons/react/24/solid";

function TransactionCategories({resetForm}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [editCategory, setEditCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = Cookies.get("token.app_oq");
    
    try {
      const response = await fetch('/api/transactions/category', {
        method: editCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY
        },
        body: JSON.stringify(
          {
            category_name: categoryName,
            description: description,
            ...(editCategory ? { category_id: editCategory } : {})
          }
        ),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      const result = await response.json();
      if (result.status === 'success') {
        if (editCategory) {
          setCategories((prev) =>
            prev.map(cat =>
              cat.category_id === editCategory
                ? { ...cat, category_name: categoryName, description: description }
                : cat
            )
          );
        } else {
          setCategories((prev) => [...prev, result.data]);
        }
        setEditCategory(null);
        setCategoryName('');
        setDescription('');
      } else {
        console.error('Error creating category:', result.message);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setCategoryName(category.category_name);
    setDescription(category.description);
    setEditCategory(category.category_id);
    // Here you can implement the logic to update the category
    // For example, you can open a modal with the category data pre-filled
  }
  const handleDelete = async (categoryId) => {
    const token = Cookies.get("token.app_oq");
    try {
      const response = await fetch(`/api/transactions/category/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY
        },
        body: JSON.stringify({ category_id: categoryId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      const result = await response.json();

      if (result.status === 'success') {
        setCategories((prev) => prev.filter(cat => cat.category_id !== categoryId));
      } else {
        console.error('Error deleting category:', result.message);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  useEffect(() => {
    if (resetForm) {
      setCategoryName('');
      setDescription('');
      setEditCategory(null);
    }
  }
  , [resetForm]);

  return (
      <>
      <form className="mb-4">
          <div className="mb-3 flex flex-col items-start gap-4 md:flex-row">
              <div className="w-full">
                  <Typography
                      variant="small"
                      color="blue-gray"
                      className="mb-2 font-medium"
                      >
                      Kategori
                  </Typography>
                  <Input
                      type="text"
                      size="lg"
                      placeholder="Masukkan kategori"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      labelProps={{
                          className: "hidden",
                      }}
                      className="w-full  placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                  />
              </div>
          </div>
          <div className="flex flex-col items-start gap-4 md:flex-row">
              <div className="w-full">
                  <Typography
                      variant="small"
                      color="blue-gray"
                      className="mb-2 font-medium"
                      >
                      Keterangan
                  </Typography>
                  <Textarea
                      // type="text"
                      size="lg"
                      placeholder="Masukkan keterangan"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      labelProps={{
                          className: "hidden",
                      }}
                      className="w-full  placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                  />
              </div>
          </div>
      </form>
      <div className="mb-4 flex items-center justify-start gap-4 ">
        <Button variant="gradient" size="sm" onClick={onSubmit } disabled={categoryName.trim() === '' || description.trim() === '' || loading}>
          {loading ? "Loading..." : editCategory ? "Ubah" : "Simpan"}
        </Button>
        {editCategory && (
          <Button variant="gradient" size="sm" onClick={() => {
            setEditCategory(null);
            setCategoryName('');
            setDescription('');
          }} disabled={loading}>
            Batal
          </Button>
        )}
      </div>
      {/* <Button variant="gradient" size="sm" onClick={onSubmit } disabled={categoryName.trim() === '' || description.trim() === '' || loading}>
        {loading ? "Loading..." : editCategory ? "Ubah" : "Simpan"}
      </Button> */}
      
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="border-y p-3 border-blue-gray-100 bg-blue-gray-50/50">
              <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none"
              >
                  Kategori
              </Typography>
            </th>
            <th className="border-y p-3 border-blue-gray-100 bg-blue-gray-50/50">
             <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none"
              >
                  Keterangan
              </Typography>
            </th>
            <th className="border-y p-3 border-blue-gray-100 bg-blue-gray-50/50"></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category, index) => (
            <tr key={index} className="even:bg-blue-gray-50/50">
              <td className="py-2 px-3">
                  <Typography variant="small" className="font-normal">
                      {category.category_name}
                  </Typography>
              </td>
              <td className="py-2 px-3">
                  <Typography variant="small" className="font-normal">
                      {category.description}
                  </Typography>
              </td>
              <td className="py-2 px-3 flex gap-2">
                    <Tooltip content="Ubah">
                        <IconButton onClick={() => { handleEdit(category); }} className="h-8" disabled={category.category_name == 'Iuran'} variant="text">
                            <PencilIcon className="h-4 w-4" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip content="Hapus">
                        <IconButton onClick={() => { handleDelete(category.category_id); }} disabled={category.category_name == 'Iuran'} className="h-8"  variant="text">
                            <TrashIcon className="h-4 w-4" />
                        </IconButton>
                    </Tooltip>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      </>
  )
}
export default TransactionCategories;
