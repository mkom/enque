// TransactionForm.js
"use client";
import Cookies from "js-cookie";
import { useState,useEffect } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import {
  Input,
  Typography,
  Select,
  Option,
  Popover,
  Textarea,
  PopoverHandler,
  PopoverContent,
  Button,
  Radio,
  Card,
  List,
  ListItem,
  ListItemPrefix,
  CardBody,
  CardFooter,
} from "@material-tailwind/react";

import { rupiahInput } from "@/utils/rupiahInput";
import CategoryTrxSelect from "@/components/CategoryTrxSelect";
import UploadFile from "@/components/UploadFile";

// day picker
import { format} from "date-fns";
import { DayPicker } from "react-day-picker";
import { fi, id } from "date-fns/locale"; 
import "react-day-picker/style.css";

function TransactionForm({ data, onCancel, onSuccess }) {
    const [date, setDate] = useState(Date.now());
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [transactionDescription, setTransactionDescription] = useState("");
    const [note, setNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("transfer");
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("completed");
    const [createdBy, setCreatedBy] = useState(0);
    const [createdByType, setCreatedByType] = useState("tenant");
    const [transactionType, setTransactionType] = useState();
    const [transferProof, setTransferProof] = useState("");
    const [createdAt, setCreatedAt] = useState(new Date().toISOString());
    const [files, setFiles] = useState([]);

    const handleRemove = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChangeAmount = (event) => {
        const raw = event.target.value.replace(/\D/g, "")
        setAmount(raw); 
    };

    const [error, setError] = useState([
        {
            transactionDescription: '',
            transactionType: '',
            amount: '',
            categoryId:'',
            paymentMethod:'',
            date:'',
           // note:'',
            image:'',
        },
    ]);

    const validateForm = async  () => {
    const errors = {
        transactionDescription: '',
        transactionType: '',
        amount: '',
        categoryId:'',
        paymentMethod:'',
        date:'',
        image:'',
    };

    if (!transactionDescription) {
        errors.transactionDescription = 'Judul transaksi tidak boleh kosong';
    }
    if (!transactionType) {
        errors.transactionType = 'Jenis transaksi harus dipilih';
    }
    if (!amount || isNaN(amount) || amount <= 0) {
        errors.amount = 'Jumlah harus berupa angka yang valid';
    }
    if (!categoryId) {
        errors.categoryId = 'Kategori harus dipilih';
    }
    if (!paymentMethod) {
        errors.paymentMethod = 'Metode pembayaran harus dipilih';
    }
    if (!date) {
        errors.date = 'Tanggal harus dipilih';
    }
    setError(errors);
    
    return Object.values(errors).every((error) => error === '');
    }

    useEffect(() => {
        if (transactionDescription) {
            setError((prev) => ({
                ...prev,
                transactionDescription: '',
            }));
        }
        if (transactionType) {
            setError((prev) => ({
                ...prev,
                transactionType: '',
            }));
        }
        if (amount) {
            setError((prev) => ({
                ...prev,
                amount: '',
            }));
        }
        if (categoryId) {
            setError((prev) => ({
                ...prev,
                categoryId: '',
            }));
        }
        if (paymentMethod) {
            setError((prev) => ({
                ...prev,
                paymentMethod: '',
            }));
        }
        if (date) {
            setError((prev) => ({
                ...prev,
                date: '',
            }));
        }
        
    }, [transactionDescription, transactionType, amount, categoryId, paymentMethod, date, note, image]);

    const onSubmit = async (e) => {
        const isValid = await validateForm();
        if (isValid) {
            setLoading(true);

            try {
                const token = Cookies.get("token.app_oq");
                let imageUrl ="";

                if (files && files.length > 0) {
                    const formData = new FormData();
                    files.forEach((entry) => {
                        formData.append("files", entry.file);
                       // console.log("Uploading:", entry.file.name, entry.file.type, (entry.file.size / 1024).toFixed(2), "KB");
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
                        const responseText = await uploadResponse.text();
                        // console.error("Upload failed with status:", uploadResponse.status);
                        // console.error("Response:", responseText);
                        throw new Error("Failed to upload file(s)");
                    }

                    const uploadData = await uploadResponse.json();
                    const uploadedUrls = uploadData.data.map(item => item.secure_url);
                    //console.log("Uploaded URLs:", uploadedUrls);
                    imageUrl = uploadedUrls;
                }

                const response = await fetch("/api/transactions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                       // userId: data?.userId || 0,
                        amount: parseInt(amount, 10),
                        transactionDate: date ? format(new Date(date), "yyyy-MM-dd") : null,
                        description: transactionDescription,
                        paymentMethod: paymentMethod,
                        status: status,
                        transactionType: transactionType,
                        categoryId: categoryId,
                        categoryName: categoryName,
                        note: note,
                        image: imageUrl || "",
                        createdBy: createdBy || 0,
                        createdByType: createdByType || "tenant",
                        createdAt: createdAt || new Date().toISOString(),
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to create transaction");
                }
                

            } catch (error) {
                console.error("Error during form submission:", error);
                setLoading(false);
                return;
            } finally {
                setLoading(false);
                onCancel();
            }

        } else {
            setLoading(false);
            return;
        }
    }
    return (
        <>
        <CardBody className="">
            <form className="flex flex-col px-3">
                <div className="mb-4 flex flex-col items-start gap-4 md:flex-row">
                    <div className="w-full">
                        <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-2 font-medium"
                            >
                            Jenis Transaksi
                        </Typography>
                        <Card className="w-full max-w-[24rem] rounded-md shadow-md">
                        <List className="flex-row">
                            <ListItem className="p-0">
                            <label
                                htmlFor="horizontal-list-react"
                                className="flex w-full cursor-pointer items-center px-3 py-2"
                            >
                                <ListItemPrefix className="mr-3">
                                <Radio
                                    name="horizontal-list"
                                    id="horizontal-list-react"
                                    ripple={false}
                                    className="hover:before:opacity-0"
                                    containerProps={{
                                    className: "p-0",
                                    }}
                                    checked={transactionType === "income"}
                                    onChange={() => setTransactionType("income")}
                                />
                                </ListItemPrefix>
                                <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal"
                                >
                                Pemasukan
                                </Typography>
                            </label>
                            </ListItem>
                            <ListItem className="p-0">
                            <label
                                htmlFor="horizontal-list-vue"
                                className="flex w-full cursor-pointer items-center px-3 py-2"
                            >
                                <ListItemPrefix className="mr-3">
                                <Radio
                                    name="horizontal-list"
                                    id="horizontal-list-vue"
                                    ripple={false}
                                    className="hover:before:opacity-0"
                                    containerProps={{
                                    className: "p-0",
                                    }}
                                    checked={transactionType === "expense"}
                                    onChange={() => setTransactionType("expense")}
                                />
                                </ListItemPrefix>
                                <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal"
                                >
                                Pengeluaran
                                </Typography>
                            </label>
                            </ListItem>
                        
                        </List>
                        </Card>
                        {error.transactionType && <p className="text-red-500 text-sm mt-1 ml-1">{error.transactionType}</p>}
                    </div>
                </div>
                <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
                    <div className="w-full">
                        <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-2 font-medium"
                            >
                            Judul
                        </Typography>
                        <Input
                            type="text"
                            size="lg"
                            placeholder="Masukkan judul transaksi"
                            value={transactionDescription}
                            onChange={(e) => setTransactionDescription(e.target.value)}
                            labelProps={{
                                className: "hidden",
                            }}
                            className="w-full  placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                        />
                        {error.transactionDescription && <p className="text-red-500 text-sm mt-1 ml-1">{error.transactionDescription}</p>}
                    </div>
                </div>
                <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
                    <div className="w-full">
                        <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-2 font-medium"
                        >
                            Jumlah
                        </Typography>
                        <div className="relative">
                            <Typography className="absolute left-3 top-2 text-blue-gray-700">Rp</Typography>
                            <Input
                            type="text"
                            size="lg"
                            placeholder="Masukkan jumlah transaksi"
                            value={amount ? rupiahInput(amount) : ""}
                            onChange={handleChangeAmount}
                            labelProps={{
                                className: "hidden",
                            }}
                            className="w-full pl-9 placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                            />
                        
                        </div>
                        {error.amount && <p className="text-red-500 text-sm mt-1 ml-1">{error.amount}</p>}
                    </div>
                    <div className="w-full">
                        <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-2 font-medium"
                        >
                            Kategori
                        </Typography>
                        
                        <CategoryTrxSelect
                           initialValue={categoryId}
                           onSelect={(data) => {
                            if (data) {
                                setCategoryId(data.id);
                                setCategoryName(data.name);
                                //console.log(data.id);
                            }
                            }}
                           className="w-full"
                        />
                        {error.categoryId && <p className="text-red-500 text-sm mt-1 ml-1">{error.categoryId}</p>}
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
                                <Option value="transfer" className="mb-[2px] last:mb-0">Transfer</Option>
                                <Option value="cash" className="mb-[2px] last:mb-0">Tunai</Option>
                            </Select>
                        </div>
                        {error.paymentMethod && <p className="text-red-500 text-sm mt-1 ml-1">{error.paymentMethod}</p>}
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
                </div>
                <div className="mb-4 flex flex-col items-start gap-4 md:flex-row">
                    <div className="w-full">
                        <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-2 font-medium"
                            >
                            Keterangan
                        </Typography>
                        <Textarea
                            type="text"
                            size="lg"
                            placeholder="Tulis catatan jika ada..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            labelProps={{
                                className: "hidden",
                            }}
                            className="w-full  placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                        />
                    </div>
                </div>
                <div className="mb-6 flex flex-col items-start gap-4 md:flex-row">
                    <div className="w-full md:w-1/2">
                        <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-2 font-medium"
                        >
                            Lampiran
                        </Typography>
                       
                        <UploadFile
                            files={files}
                            setFiles={setFiles}
                            handleRemove={handleRemove}
                        />

                    </div>
                </div>

            </form>
        </CardBody>
        <CardFooter className="space-x-2 pb-10 flex items-center justify-end">
            <Button onClick={onCancel}  variant="text" color="blue-gray" >
                Batal
            </Button>
            <Button variant="gradient" onClick={onSubmit} >
            {loading ? "Loading..." : "Simpan"}
            
            </Button>
    
        </CardFooter>
        </>
    )
}

export default TransactionForm;