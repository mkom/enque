import Cookies from "js-cookie";
import React from "react";
import { useState,useEffect,useCallback,useRef  } from "react";
// @material-tailwind/react
import {
  Input,
  Typography,
  Select,
  Option,
  Popover,
  PopoverHandler,
  PopoverContent,
  Card,
  CardBody,
  CardFooter,
  IconButton,
  Button
} from "@material-tailwind/react";

// day picker
import { format,parseISO} from "date-fns";
import { DayPicker } from "react-day-picker";
import { id } from "date-fns/locale"; 

import "react-day-picker/style.css";

import { CalendarIcon } from "@heroicons/react/24/outline";
import {DocumentPlusIcon,PencilIcon,TrashIcon } from "@heroicons/react/24/solid";


import { rupiahInput } from "@/utils/rupiahInput";
import UnitAutocomplete from "../../../../components/UnitAutocomplete";
import FeeSelect from "../../../../components/FeeAutocomplete";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";



function PaymentForm({onCancel}) {
  // const now = Date.now(); // Pastikan waktu valid
  // const localDate = new Date(now).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  
  // console.log(localDate); // Output sesuai zona WIB
  
  const [date, setDate] = useState(Date.now());
  const [amount, setAmount] = useState("");
  const [feeId, setFeeId] = useState(null);
  const [memberId, setMemberId] = useState(null);
  const [selectedName, setSelectedName] = useState("");
  const [status, setStatus] = useState("completed");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [loading, setLoading] = useState(false);

  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);   // Untuk file yang di-upload
  const [fileKey, setFileKey] = useState(Date.now());
  const [idEdit, setIdEdit] = useState('');

  const handleChangeAmount = (event) => {
    const raw = event.target.value.replace(/\D/g, "")
    setAmount(raw); 
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Membaca file dan membuat URL gambar untuk preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Menyimpan URL gambar untuk preview
      };
      reader.readAsDataURL(selectedFile); // Membaca file sebagai URL data
      setFile(selectedFile); // Menyimpan file yang dipilih untuk upload
    }
  };

  const handleImageRemove = () => {
    setImage(null); // Menghapus gambar dengan mengatur state menjadi null
    setFileKey(Date.now());
  };

  const [error, setError] = useState([
    {
      feeId: '',
      memberId: '',
      status: '',
      amount:'',
      image:'',
    },
  ]);

  const validateForm = async  () => {
    let valid = true;
    const newError = {
      feeId: '',
      memberId: '',
      status: '',
      amount:'',
      image:''
    };

    if (!feeId) {
        newError.feeId = "Iuran wajib dipilih";
        valid = false;
    }

    if (!memberId) {
        newError.memberId = "Unit wajib dipilih";
        valid = false;
    }

    if (!amount) {
        newError.amount = "Nominal wajib diisi";
        valid = false;
    }

    if (!date) {
        newError.date = "Tanggal wajib diisi";
        valid = false;
    }

    if (!image) {
        newError.image = "Bukti transfer wajib diunggah";
        valid = false;
    }

    if (!status) {
        newError.status =  "Status wajib dipilih";
        valid = false;
    }
    setError(newError);
    return valid;
  };

  useEffect(() => {
    if (feeId) {
      setError((prevError) => ({
        ...prevError,
        feeId: '',
      }));
    }
    if (memberId) {
      setError((prevError) => ({
        ...prevError,
        memberId: '',
      }));
    }
    if (amount) {
      setError((prevError) => ({
        ...prevError,
        amount: '',
      }));
    }
    if (status) {
      setError((prevError) => ({
        ...prevError,
        status: '',
      }));
    }
    if (image) {
      setError((prevError) => ({
        ...prevError,
        image: '',
      }));
    }
  
  }, [feeId,memberId,amount,status,image]);



  const onSubmit = async (e) => {
   // console.log("Submitting...");
  
    const isValid = await validateForm();
    // console.log("Form validation result:", isValid);
    // console.log("Form data:", feeId, memberId, amount, status, new Date(date).toISOString());
  
    if (isValid) {
      setLoading(true);
  
      try {
        let imageUrl = file; // Jika tidak ada gambar baru, gunakan gambar yang sudah ada (file)
  
        // 🔹 Upload gambar jika ada file baru
        if (imageUrl instanceof File) {
          const formData = new FormData();
          formData.append("file", imageUrl);
  
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            headers: {
                  "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
                },
          });
  
          // Cek jika respons upload berhasil
          if (!uploadResponse.ok) {
            throw new Error("Gagal mengunggah gambar");
          }
  
          const uploadData = await uploadResponse.json();
          //console.log("Upload data:", uploadData);
  
          // Pastikan URL ada dalam uploadData
          if (uploadData && uploadData.url) {
            imageUrl = uploadData.url; // Gunakan URL gambar yang di-upload
          } else {
            throw new Error("URL gambar tidak ditemukan dalam respons");
          }
        }
  
        //console.log("Image URL:", imageUrl);
  
        const token = Cookies.get("token");
  
        const response = await fetch("/api/fee/payment", {
          method: idEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify({
            id: idEdit,
            feeId,
            memberId,
            amount,
            paymentMethod,
            status,
            image: imageUrl,
            date: new Date(date).toISOString(),
          }),
        });
  
        const data = await response.json();
        //console.log("Response data:", data); // Menampilkan hasil dari server
  
      } catch (error) {
        console.error("Error submitting form:", error);
      } finally {
        setLoading(false);
        onCancel();
        //handleOpen();
        //getMembersData();
      }
  
    } else {
      setLoading(false);
    }
  };
  
  

  return (
    <>
    <CardBody className="pt-0">
        <form className="flex flex-col px-3">
          <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
            <div className="w-full ">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Iuran
              </Typography>

              <FeeSelect
                onSelect={(data) => {
                  //console.log("Selected data:", data);
                  if (data.id) {
                    setFeeId(data.id);
                    //console.log("Fee selected:", data.id);
                  // console.log("Updated feeId:", feeId);  // Pastikan nilai feeId terupdate
                  } else {
                  // console.error("ID tidak ditemukan pada data");
                  }
                }}
              />

              {error.feeId && <p className="text-red-500 text-sm mt-1 ml-1">{error.feeId}</p>}
            </div>
            <div className="w-full ">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Nominal
              </Typography>
              <div className="relative">
                <Typography 
                className="absolute left-3 top-2 text-blue-gray-700">Rp</Typography>
              <Input
                type="text"
                size="lg"
                placeholder="0"
                value={amount ? rupiahInput(amount) : ""}
                onChange={handleChangeAmount}
                labelProps={{
                  className: "hidden",
                }}
                className="w-full pl-9 placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
              />
              {error.amount && <p className="text-red-500 text-sm mt-1 ml-1">{error.amount}</p>}
              </div>
            </div>
          
          </div>
          <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
            <div className="w-full relative">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                No. Unit
              </Typography>

              <UnitAutocomplete
                onSelect={(data) => {setMemberId(data.id);setSelectedName(data.name);} }
              />

            {error.memberId && <p className="text-red-500 text-sm mt-1 ml-1">{error.memberId}</p>}

            </div>
            <div className="w-full">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Nama
              </Typography>
              <Input
                size="lg"
                placeholder="Nama"
                value={selectedName || ""}
                readOnly
                labelProps={{
                  className: "hidden",
                }}
                className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
              />
            </div>
          </div>
          <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
            <div className="w-full">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
              Metode Pembayaran
              </Typography>
              <div className="relative">
                
              <Select 
                  label="method"
                  id="status"
                  size="lg"
                  variant="outlined"
                  labelProps={{
                    className: "hidden",
                  }}
                  value={paymentMethod}
                  onChange={(value) => setPaymentMethod(value)} 
                  className="border-t-blue-gray-200 aria-[expanded=true]:border-t-blue-gray-900 !border-blue-gray-200"
              >
                  <Option value="transfer">Transfer</Option>
                  <Option value="cash">Tunai</Option>
              </Select>
              </div>
            </div>
            <div className="w-full">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Tanggal
              </Typography>
              <Popover placement="bottom">
                <PopoverHandler>
                  <div className="relative">
                    <Input
                      size="lg"
                      onChange={() => null}
                      placeholder="Tanggal"
                      value={date ? format(date, "PPP", { locale: id }) : ""}
                      labelProps={{
                        className: "hidden",
                      }}
                      className="w-full  placeholder:opacity-100 !pl-10 focus:border-t-blue-gray-900 !border-blue-gray-200"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-3 text-gray-500"
                    >
                      <CalendarIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  
                </PopoverHandler>
                <PopoverContent>
                  <DayPicker
                    timeZone="Asia/Jakarta"
                    locale={id}
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    showOutsideDays
                    className="border-0"
                  />
                </PopoverContent>
              </Popover>
              {error.date && <p className="text-red-500 text-sm mt-1 ml-1">{error.date}</p>}
            </div>
          </div>
          <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
            <div className="w-1/2">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Bukti Transfer
              </Typography>
              <div className="relative">
                
                <Input
                  key={fileKey}
                  onChange={handleFileChange}
                  type="file"
                  accept="image/*"
                  size="lg"
                  placeholder="0"
                  labelProps={{
                    className: "hidden",
                  }}
                  className="w-full   !p-2 placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                />

                {error.image && <p className="text-red-500 text-sm mt-1 ml-1">{error.image}</p>}

                {image && (
                  <div className="mt-4 relative w-28">
                    <Zoom>
                      <img
                      src={image}
                      alt="Preview"
                      className="h-36 w-36 cursor-pointer rounded-md object-cover"
                      />
                    </Zoom>
                    <button className="h-8 absolute  cursor-pointer top-0 right-2 "  onClick={handleImageRemove} variant="text">
                        <TrashIcon className="h-4 w-4 text-red-500" />
                    </button>
                    
                  </div>
                )}

              </div>
            </div>
            {/* <div className="w-full">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
              Status
              </Typography>
              <div className="relative">

                <Select 
                    label="Status"
                    id="status"
                    size="lg"
                    variant="outlined"
                    labelProps={{
                      className: "hidden",
                    }}
                    value={status}
                    onChange={(value) => setStatus(value)} 
                    className="border-t-blue-gray-200 aria-[expanded=true]:border-t-blue-gray-900 !border-blue-gray-200"
                >
                    <Option value="completed">Sukses</Option>
                    <Option value="pending">Menunggu</Option>
                    <Option value="failed">Gagal</Option>
                </Select>
                {error.status && <p className="text-red-500 text-sm mt-1 ml-1">{error.status}</p>}
              

              </div>
            </div> */}
            
          </div>
        
        </form>
    </CardBody>
    <CardFooter className="space-x-2 pb-10 flex items-center justify-end">
      <Button onClick={onCancel} variant="text" color="blue-gray" >
          Batal
      </Button>
      <Button variant="gradient" onClick={onSubmit}>
        {loading ? "Loading..." : "Simpan"}
      </Button>

    </CardFooter>
    
    </>
   
  );
}

export default PaymentForm;