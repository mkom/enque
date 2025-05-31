// PaymentForm.js
"use client";
import Cookies from "js-cookie";
import React from "react";
import { useState,useEffect,useRef  } from "react";
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
  Button,
} from "@material-tailwind/react";

// day picker
import { format,parseISO} from "date-fns";
import { DayPicker } from "react-day-picker";
import { id } from "date-fns/locale"; 

import "react-day-picker/style.css";

import { CalendarIcon } from "@heroicons/react/24/outline";
import {TrashIcon} from "@heroicons/react/24/solid";


import { rupiahInput } from "@/utils/rupiahInput";
import UnitAutocomplete from "../../../components/UnitAutocomplete";
import FeeSelect from "../../../components/FeeSelect";
import BillsSelect from "@/components/BillsSelect";
import { formatRupiah } from "@/utils/formatRupiah";
import UploadFile from "@/components/UploadFile";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

function PaymentForm({ data, onCancel }) {

  const [date, setDate] = useState(Date.now());
  const [amount, setAmount] = useState("");
  const [feeId, setFeeId] = useState("");
  const [feeName, setFeeName] = useState("");
  const [unitId, setUnitId] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [status, setStatus] = useState("completed");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [createdBy, setCreatedBy] = useState(0);
  const [createdByType, setCreatedByType] = useState("tenant");
  const [categoryId, setCategoryId] = useState(1);
  const [transactionType, setTransactionType] = useState("income");
  const [transactionDescription, setTransactionDescription] = useState("Pembayaran");
  const [transferProof, setTransferProof] = useState("");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId]= useState([]);
  const billsSelectRef = useRef(null);
  const [existingBills, setExistingBills] = useState([]);
  const [existingBillsId, setExistingBillsId] = useState([]);

  const [image, setImage] = useState(transferProof);
  const [fileKey, setFileKey] = useState(Date.now());
  const [idEdit, setIdEdit] = useState('');
  const [recurring, setRecurring] = useState(false);

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  const handleRemove = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };


  useEffect(() => {
    //console.log(data);
    if (data) {
      setImage(data.transfer_proof || "");
      //setFiles(data.transfer_proof || "");
      setUnitId(data.unit_id || "");
      setSelectedName(data.house_number || "");
      setAmount(data.amount ? data.amount.toString() : "");
      setFeeId(data.fee_id || "");
      setRecurring(data.is_recurring || false);
      setExistingBills(data.bill_id);
      setPaymentMethod(data.payment_method || "transfer");
      //setTransferProof(data.image || "https://fastly.picsum.photos/id/715/200/200.jpg?hmac=eR-80S6YYIV9vV26EYLSVACDM5HWe94Oz2hx0icP5vI");
      setTransferProof(data.transfer_proof || "");
      setDate(parseISO(data.transaction_date) || new Date());
      setIdEdit(data.transaction_id || "");
     // setExistingBillsId(data.bills.map(bill => bill.id));
    } else {
      setUnitId("");
      setSelectedName("");
      setAmount("");
      setFeeId("");
      setRecurring(false);
      setExistingBills([]);
      setTransferProof("");
      setDate(Date.now());
      //etExistingBillsId([]);
    }
  }, [data]);

  
  const handleChangeAmount = (event) => {
    const raw = event.target.value.replace(/\D/g, "")
    setAmount(raw); 
  };


  const [error, setError] = useState([
    {
      feeId: '',
      unitId: '',
      status: '',
      amount:'',
      image:'',
      files:''
    },
  ]);

  const validateForm = async  () => {
    let valid = true;
    const newError = {
      feeId: '',
      unitId: '',
      status: '',
      amount:'',
      image:'',
      invoiceId: '',
      files:''

    };

    if (!feeId) {
        newError.feeId = "Iuran wajib dipilih";
        valid = false;
    }

    if (!unitId) {
        newError.unitId = "Unit wajib dipilih";
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

    if ( !files) {
        newError.image = "Bukti transfer wajib diunggah";
        valid = false;
    }

    if (!status) {
        newError.status =  "Status wajib dipilih";
        valid = false;
    }
    if(invoiceId.length === 0) {
      newError.invoiceId = "Bulan wajib dipilih";
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
    if (unitId) {
      setError((prevError) => ({
        ...prevError,
        unitId: '',
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

    if (files) {
      setError((prevError) => ({
        ...prevError,
        image: '',
      }));
    }
  
  }, [feeId,unitId,amount,status,image,files]);

  //console.log("invoiceid",invoiceId);
  
  const bills = invoiceId.map((bill) => ({
    fee_id: parseInt(bill.fee_id),
    due_date: bill.due_date,
    amount_due: bill.amount_due,
    amount_paid: bill.amount_paid,
    bill_id: bill.bill_id,
    editable_amount: bill.editable_amount,
  }));

  //console.log(bills); //

  //console.log(image);

  const onSubmit = async (e) => {
    const isValid = await validateForm();
    if (isValid) {
      setLoading(true);
  
      try {
        const token = Cookies.get("token.app_oq");
        let imageUrl = image;

        if(files && files.length > 0) {
          const formData = new FormData();
          files.forEach((entry) => {
              formData.append("files", entry.file);
          });

          const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
              headers: {
                  "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
                  Authorization: `Bearer ${token}`,
              },
          });

          if (!uploadResponse.ok) {
             // const responseText = await uploadResponse.text();
              throw new Error("Failed to upload file(s)");
          }
          const uploadData = await uploadResponse.json();
          const uploadedUrls = uploadData.data.map(item => item.secure_url);
          //console.log("Uploaded URLs:", uploadedUrls);
          imageUrl = uploadedUrls;
        }
       
        const response = await fetch("/api/fee/payment", {
          method: idEdit ? "PUT" : "POST",
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transactionId: idEdit,
            unitId,
            categoryId,
            transactionDate: date,
            transactionType,
            amount,
            transactionDescription: transactionDescription + " " + feeName + " " + selectedName,
            createdBy,
            createdByType,
            createdAt,
            bills,
            paymentMethod,
            status,
            image: imageUrl,
          }),
        });
  
        const data = await response.json();
        //console.log("Response data:", data); // Menampilkan hasil dari server
  
      } catch (error) {
        console.error("Error submitting form:", error);
      } finally {
        setLoading(false);
        onCancel();
      }
  
    } else {
      setLoading(false);
    }
  };

  console.log(image);


  return (
    <>
    <CardBody className="">
        <form className="flex flex-col px-3">
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
                  initialValue={selectedName}
                  onSelect={(data) => {
                    //console.log("Selected unit:", data);
                    setUnitId(data.id);
                    setSelectedName(data.name);} }
                />

              {error.unitId && <p className="text-red-500 text-sm mt-1 ml-1">{error.unitId}</p>}

              </div>
             
              <div className="w-full ">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mb-2 font-medium"
                >
                Iuran
                </Typography>

                <FeeSelect
                  initialValue={String(feeId)}
                  onSelect={(data) => {
                     //console.log("Selected fee:", data);
                    if (data.id) {
                      setFeeId(data.id);
                      setRecurring(data.is_recurring);
                      setFeeName(data.name);
                    } else {
                    // console.error("ID tidak ditemukan pada data");
                    }
                  }}
                />

                {error.feeId && <p className="text-red-500 text-sm mt-1 ml-1">{error.feeId}</p>}
              </div>
          </div>

          {recurring && unitId && (
            <div className="mb-6">
               <Typography
               variant="small"
               color="blue-gray"
               className="mb-1 font-medium"
             >
               Pilih Bulan Dibayar
             </Typography>
             <BillsSelect 
                ref={billsSelectRef}
                unitId={unitId} 
                feeId={feeId} 
                onSelect={(data) => {

                // console.log("Selected data:", data); 
                // Pastikan data adalah array
                if (!Array.isArray(data)) return;
                
                // Jika data berisi hanya satu item (item yang baru dipilih)
                if (data.length === 1 && invoiceId.length > 0) {
                  // Ini menandakan item baru ditambahkan, bukan daftar lengkap
                  const newBill = data[0];
                  
                  // Cek apakah bill sudah ada di invoiceId (mencegah duplikasi)
                  const billExists = invoiceId.some(bill => bill.bill_id === newBill.bill_id);
                  
                  if (!billExists) {
                    // Inisialisasi editable_amount
                   
                   const remainingAmount = newBill.amount_paid > 0
                    ? parseFloat(newBill.amount_paid)
                    : parseFloat(newBill.amount_due) - parseFloat(newBill.amount_paid || 0);

                    
                    // Tambahkan bill baru dengan editable_amount
                    const billWithAmount = {
                      ...newBill,
                      editable_amount: remainingAmount.toString()
                    };
                    
                    // Gabungkan dengan data yang sudah ada
                    const newInvoiceId = [...invoiceId, billWithAmount];
                    
                    // Hitung total baru
                    const totalAmount = newInvoiceId.reduce((total, bill) => {
                      return total + (bill.editable_amount ? parseFloat(bill.editable_amount) : 0);
                    }, 0);
                    
                    setInvoiceId(newInvoiceId);
                    setAmount(totalAmount.toString());
                  }
                } else {
                  // Untuk kasus pertama kali memilih atau kasus lainnya
                  // Mapkan seluruh data dengan menambahkan editable_amount
                  const newData = data.map(bill => {
                    
                    const remainingAmount = bill.amount_paid > 0
                    ? parseFloat(bill.amount_paid)
                    : parseFloat(bill.amount_due) - parseFloat(bill.amount_paid || 0);
                    
                    return {
                      ...bill,
                      editable_amount: remainingAmount.toString()
                    };
                  });
                  
                  // Hitung total
                  const totalAmount = newData.reduce((total, bill) => {
                    return total + (bill.editable_amount ? parseFloat(bill.editable_amount) : 0);
                  }, 0);
                  
                  setInvoiceId(newData);
                  setAmount(totalAmount.toString());
                }
              }} 
              
              initialSelectedBills={existingBills}
            />

            {error.invoiceId && recurring && unitId && <p className="text-red-500 text-sm mt-1 ml-1">{error.invoiceId}</p>}

            
            {/* Tampilkan tabel jika ada data tagihan */}
            {/* {console.log(invoiceId)} */}

            {invoiceId.length > 0 && (
              <div className="mt-4">
                <Card className="w-full shadow-none">
                  <table className="w-full min-w-max table-auto text-left">
                    <thead>
                      <tr>
                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-2">
                          <Typography
                            color="blue-gray"
                            variant="small"
                            className="font-bold"
                          >
                            Bulan
                          </Typography>
                        </th>
                        <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-2">
                          <Typography
                            color="blue-gray"
                            variant="small"
                            className="font-bold"
                          >
                            Nominal
                          </Typography>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceId.map((bill, index) => {
                        // Hitung selisih antara jumlah tagihan dan yang sudah dibayar
                        const remainingAmount = bill.amount_due ? parseFloat(bill.amount_due) - parseFloat(bill.amount_paid || 0) : 0;
                        
                        // Gunakan ID khusus untuk setiap baris
                        const billRowId = `bill-row-${bill.bill_id}-${index}`;
                        
                        // Simpan amount yang bisa diedit dalam bill jika belum ada
                        if (bill.editable_amount === undefined) {
                          bill.editable_amount = remainingAmount.toString();
                        }
                        
                        return (
                          <tr key={billRowId} className="even:bg-blue-gray-50/50">
                            <td className="p-2 border-b border-blue-gray-100">
                              <div className="flex items-center gap-2">
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-bold"
                                >
                                  {bill.due_date_formatted}
                                </Typography>
                              </div>
                            </td>
                            <td className="p-2 border-b border-blue-gray-100">
                              <div className="flex items-center">
                                <div className="relative flex-grow">
                                  <Typography 
                                    className="absolute left-2 top-2 text-blue-gray-700 text-xs"
                                  >
                                    Rp
                                  </Typography>
                                  <Input
                                    type="text"
                                    size="sm"
                                    placeholder="0"
                                    value={bill.editable_amount ? rupiahInput(bill.editable_amount) : ""}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\D/g, "");
                                      const newInvoiceId = [...invoiceId];
                                      newInvoiceId[index].editable_amount = raw;
                                      setInvoiceId(newInvoiceId);
                                      
                                      // Hitung total untuk jumlah yang dibayar
                                      const totalAmount = newInvoiceId.reduce((total, item) => {
                                        return total + (item.editable_amount ? parseFloat(item.editable_amount) : 0);
                                      }, 0);
                                      setAmount(totalAmount.toString());
                                    }}
                                    labelProps={{
                                      className: "hidden",
                                    }}
                                    className="w-full pl-6 placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                                  />
                                </div>
                                <IconButton 
                                  size="sm" 
                                  color="red" 
                                  variant="text" 
                                  className="ml-2"
                                  onClick={() => {
                                    // Ambil item yang akan dihapus
                                    const removedItem = invoiceId[index];
                                    
                                    // Hapus item dari invoice
                                    const newInvoiceId = [...invoiceId];
                                    newInvoiceId.splice(index, 1);
                                    setInvoiceId(newInvoiceId);
                                    
                                    // Hitung ulang total
                                    const totalAmount = newInvoiceId.reduce((total, item) => {
                                      return total + (item.editable_amount ? parseFloat(item.editable_amount) : 0);
                                    }, 0);
                                    setAmount(totalAmount.toString());
                                    
                                    // Kembalikan bulan yang dihapus ke dropdown selection
                                    if (billsSelectRef && billsSelectRef.current && removedItem) {
                                      billsSelectRef.current.addRemovedBill(removedItem);
                                    }
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </IconButton>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-blue-gray-50/80">
                        <td className="p-2 border-t border-blue-gray-200">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-bold"
                          >
                            Total
                          </Typography>
                        </td>
                        <td className="p-2 border-t border-blue-gray-200">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-bold"
                          >
                            {formatRupiah(
                              invoiceId.reduce((total, bill) => {
                                return total + (bill.editable_amount ? parseFloat(bill.editable_amount) : 0);
                              }, 0)
                            )}
                          </Typography>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </div>
            )}
            </div>
           
          )}
         
          <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
            <div className="w-full ">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Jumlah yang Dibayar
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
                  <Option value="transfer" className="mb-[2px] last:mb-0">Transfer</Option>
                  <Option value="cash" className="mb-[2px] last:mb-0">Tunai</Option>
              </Select>
              </div>
            </div>
            
            
          </div>

          <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
            <div className="w-full">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Bukti Transfer
              </Typography>
              <div className="relative">
               
               <UploadFile
                    files={files}
                    images={image}
                    setFiles={setFiles}
                    handleRemove={handleRemove}
                />
                {(error.image || error.files) && <p className="text-red-500 text-sm mt-1 ml-1">{error.image}</p>}

              </div>
            </div>
            <div className="w-full">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium"
              >
                Tanggal Pembayaran
              </Typography>
              <Popover placement="bottom">
                <PopoverHandler>
                  <div className="relative">
                    <Input
                      size="lg"
                      onChange={() => null}
                      placeholder="Tanggal"
                      value={date ? format(new Date(date), "PPP", { locale: id }) : ""}
                      labelProps={{
                        className: "hidden",
                      }}
                      className="w-full z-30 placeholder:opacity-100 !pl-10 focus:border-t-blue-gray-900 !border-blue-gray-200"
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
                    className="border-0 z-30"
                  />
                </PopoverContent>
              </Popover>
              {error.date && <p className="text-red-500 text-sm mt-1 ml-1">{error.date}</p>}
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