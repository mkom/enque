"use client";
import Cookies from "js-cookie";
import React from "react";
import { useState,useEffect,useCallback } from "react";
import {DocumentPlusIcon,PencilIcon,TrashIcon, ArrowPathIcon, BanknotesIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Input,
    Option,
    Select,
    Button,
    Dialog,
    Textarea,
    IconButton,
    Typography,
    DialogBody,
    DialogHeader,
    DialogFooter,
    Tooltip,
    Chip,
} from "@material-tailwind/react";
import { formatRupiah } from "@/utils/formatRupiah";
import { rupiahInput } from "@/utils/rupiahInput";
import { fetchTenantDetails } from "@/utils/fetchTenant";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { id } from "date-fns/locale"; 
registerLocale("id", id);
import { Skeleton } from "../../../components/Skeleton";
  
const IuranSetup = ({}) => {
    const [tenantId, setTenantId] = useState(0);
    const [open, setOpen] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const handleOpen = () => setOpen(!open);
    const handleConfirmationOpen = () => setConfirmationOpen(!open);

    const TABLE_HEAD = ["Nama", "Nominal", "Tipe", "Kategori Unit", "Status",  ""];

    const [feeCount, setFeeCount] = useState(0);
    const [feeName, setFeeName] = useState('');
    const [feeType, setFeeType] = useState('true');
    const [feeStatus, setFeeStatus] = useState('active');
    const [feeDescription, setFeeDescription] = useState(0);
    const [feeAmount, setFeeAmount] = useState('');
    const [feeIdEdit, setFeeIdEdit] = useState('');
    const [feePeriod, setFeePeriod] = useState();  
    const [feeUnitStatus, setUnitStatus] = useState('occupied');
    const [feeDueDate, setFeeDueDate] = useState('1');
    const [loading, setLoading] = useState(false);
    const [FeesData, setFeesData] = useState([]);
    const [amountHistory, setAmountHistory] = useState([]);
    const [skeletonShow, setSkeletonShow] = useState(true);
    const [error, setError] = useState([
        {
            feeName: '',
            feeType: '',
            feeStatus: '',
            feeAmount:'',
            //feePeriod:'',
        },
    ]);

    const formatStatusMonth = (statusMonth) => {
        const date = new Date(statusMonth);
        const options = { year: 'numeric', month: 'long' };
        const formattedDate = date.toLocaleDateString('id-ID', options);
        //console.log(formattedDate)
        return formattedDate;
    };

    const getFeesData =  useCallback( async () => {
        const token = Cookies.get("token.app_oq");

        try {
            const response = await fetch(`/api/fee`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
              },
            });
        
            const data = await response.json();
            //console.log(data.data)
            setFeeCount(data.data.length)
            setFeesData(data.data || []);
            setSkeletonShow(false); 
        } catch (error) {
            console.error('Error fetching tenant details:', error.message);
            throw error;
        }

    },[tenantId]);

    useEffect(() => {
        getFeesData();
    }, [getFeesData]);



    const validateForm = () => {
        let valid = true;
        const newError = {
            feeName: '',
            feeType: '',
            feeStatus: '',
            feeAmount:'',
            feeUnitStatus:''
        };

        if (!feeName) {
            newError.feeName = "Nama Iuran wajib diisi";
            valid = false;
        }

        if (!feeType) {
            newError.feeType = "Tipe Iuran wajib dipilih";
            valid = false;
        }

        if (!feeStatus) {
            newError.feeStatus = "Status Iuran wajib dipilih";
            valid = false;
        }

        // if (!feeMemberStatus) {
        //     newError.feeMemberStatus = "";
        //     valid = false;
        // }

        if (!feeAmount) {
            newError.feeAmount =  "Nominal tidak boleh kosong atau 0";
            valid = false;
        }
        setError(newError);
        return valid;
    };
   
    const onSubmit = async(e) => {
        if (validateForm()) {
            setLoading(true);
            const token = Cookies.get("token.app_oq");
            try {
                const response = await fetch('/api/fee', {
                  method: feeIdEdit ? 'PUT' : 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    feeID:feeIdEdit,
                    feeName: feeName,
                    feeType: feeType,
                    feeStatus: feeStatus,
                    effective_date: feePeriod + "-01",
                    amount: feeAmount,
                    unitStatus: feeUnitStatus,
                    tenantId
                  }),
                });
        
                const data = await response.json();


              } catch (error) {
                
              } finally {
                setLoading(false); 
                handleOpen();
                getFeesData();
              }

        } else {
             console.log('Form validation failed');
        }
    };


    const handleChangeAmount = (event) => {
        const raw = event.target.value.replace(/\D/g, "")
        setFeeAmount(raw); 
      };
    

    const handlePeriodeChange = (date) => {
        //console.log(date)
        const formattedDate = date.toISOString().slice(0, 7);
        setFeePeriod(formattedDate)
    };

   

    const resetForm = () => {
        setFeeName('');
        setFeeType('true');
        setFeeStatus('active');
        setFeeDescription('');
        setFeeAmount('');
        setFeePeriod(new Date().toISOString().slice(0, 7));
        setFeeIdEdit('');
        setFeeDueDate("1");
        setUnitStatus('occupied');
        setError ([
            {
                feeName: '',
                feeType: '',
                feeStatus: '',
                feeAmount:'',
                feeUnitStatus: '',
            },
        ]);
    };

    useEffect(() => {
        if (!open) {
            resetForm();
           
        }
    }, [open]);

    const handleEdit = (Fee) => {
       // console.log(Fee)
        setFeeIdEdit(Fee.fee_id);
        setFeeName(Fee.fee_name);
        setFeeType(Fee.is_recurring === true? 'true': 'false');
        setFeeStatus(Fee.status);
        setFeeAmount(Fee.amount);
        setUnitStatus(Fee.unit_status);
        setFeePeriod(new Date(Fee.effective_date).toISOString().slice(0, 7));
        setAmountHistory(Fee.amount_history);
    };

    const handleDelete = async () => {
        setLoading(true);
        const token = Cookies.get("token.app_oq");
        try {
            const response = await fetch('/api/fee', {
                method: 'DELETE',
                headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                Authorization: `Bearer ${token}`,
                },

                body: JSON.stringify({
                feeId:feeIdEdit,
              
                }),
            });

            const data = await response.json();

            if (response.status === 200) {
                setLoading(false);
                getFeesData();
                resetForm();
                setConfirmationOpen(false);
            } 
         
        } catch (error) {
         
        } finally {
          setLoading(false);
          getFeesData();
          resetForm();
          setConfirmationOpen(false);
        }
    };
    
    return (
        <>
         <Card className=" w-full mb-8">
            <CardHeader floated={false} shadow={false} className="rounded-none">
            <div className="mb-8 flex items-start justify-between gap-8">
                <div>
                    <Typography variant="h5" color="blue-gray">
                        Iuran
                    </Typography>
                    <Typography className="mt-1 font-normal text-[16px] text-gray">
                        Iuran yang akan diberlakukan kepada semua unit.
                    </Typography>
                  
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Button onClick={handleOpen} variant="gradient"  className="flex items-center gap-3" size="sm">
                    <DocumentPlusIcon strokeWidth={2} className="h-4 w-4" /> Tambah
                </Button>
                </div>
            </div>
            
            
            </CardHeader>
            <CardBody className="px-0 pt-0 ">
                <table className="w-full min-w-max table-auto text-left">
                    <thead>
                        <tr>
                            {TABLE_HEAD.map((head) => (
                            <th
                                key={head}
                                className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-3"
                            >
                                <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-bold leading-none"
                                >
                                {head}
                                </Typography>
                            </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        { skeletonShow ? (
                        <tr className="even:bg-blue-gray-50/50">
                            <td colSpan="6" className="py-2 px-3">
                                <Skeleton />
                            </td>
                        </tr>
                        ) : FeesData.length > 0 ? (
                            FeesData.map((fee, index) => (
                                <tr key={index} className="even:bg-blue-gray-50/50">
                                <td className="py-2 px-3 ">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {fee.fee_name}
                                    </Typography>
                                   
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                    {formatRupiah(fee.amount)}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                    {fee.is_recurring ? 'Bulanan' :'One time'}
                                    </Typography>
                                </td>

                                <td className="py-2 px-3">
                                  
                                    <Chip
                                    size="sm"
                                    variant="ghost"
                                    value={
                                        fee.unit_status === "occupied"
                                        ? "Dihuni"
                                        : fee.unit_status === "vacant"
                                        ? "Kosong"
                                        : "Semua"
                                    }
                                    className="text-center max-w-20"
                                    color={
                                        fee.unit_status === "occupied"
                                        ? "green"
                                        : fee.unit_status === "vacant"
                                        ? "gray"
                                        : "blue"
                                    }
                                    />
                                </td>
                                
                                <td className="py-2 px-3">
                                    <Chip
                                    variant="ghost"
                                    size="sm"
                                    className="text-center max-w-20"
                                    value={fee.status === "active"? "Aktif" : "Non Aktif"}
                                    color={fee.status === "active"? "green" : "red"}
                                    />
                                    
                                </td>

                                
                                
                                <td className="py-2 px-3">
                                    <Tooltip content="Ubah">
                                        <IconButton className="h-8" onClick={() => {handleOpen(); handleEdit(fee)}} variant="text">
                                            <PencilIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip>
    
                                    <Tooltip content="Hapus">
                                        <IconButton disabled={feeCount === 1}  className="h-8" onClick={() => {setConfirmationOpen(true), setFeeIdEdit(fee.fee_id)}} variant="text">
                                            <TrashIcon className="h-5 w-5" />
                                        </IconButton>
                                    </Tooltip>

                                    
                                </td>
                                </tr>
                            ))
                        ): !skeletonShow &&(
                            <tr className="even:bg-blue-gray-50/50">
                                <td colSpan="5" className="py-2 px-3 text-center">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        Belum ada data
                                    </Typography>
                                </td>
                            </tr>
                        )}
                       
                    </tbody>
                </table>

            </CardBody>
            <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">          
            </CardFooter>

            {confirmationOpen && (
                <Dialog 
                open={confirmationOpen} 
                handler={handleConfirmationOpen}
                className="p-4"
                >
                    <DialogHeader>
                        <Typography variant="h5" color="blue-gray">
                            Konfirmasi Hapus
                        </Typography>
                    </DialogHeader>
                    <DialogBody>
                        <Typography className="font-normal  text-gray">Apakah Anda yakin ingin menghapus Iuran ini? Tindakan ini tidak bisa dibatalkan.</Typography>
                    </DialogBody>
                    <DialogFooter className="space-x-2">
                        <Button variant="text" color="blue-gray" onClick={() => setConfirmationOpen(false)} disabled={loading}>
                            Batal
                        </Button>
                        <Button variant="gradient" onClick={handleDelete} disabled={loading}>
                            {loading ? "Menghapus..." : "Hapus"}
                        </Button>

                    </DialogFooter>
              </Dialog>
            )}

            {open && (
                <Dialog 
                size="md" 
                open={open} 
                handler={handleOpen} 
                className="p-4 h-3/4 overflow-scroll">
                    <DialogHeader className="relative m-0 block">
                    <Typography variant="h5" color="blue-gray">
                        Iuran
                    </Typography>
                    <Typography className="mt-1 font-normal text-[16px] text-gray">
                        Tetapkan iuran baru atau ubah iuran yang sudah ada
                    </Typography>
                    <IconButton
                        size="sm"
                        variant="text"
                        className="!absolute right-3.5 top-3.5"
                        onClick={handleOpen}
                    >
                        <XMarkIcon className="h-4 w-4 stroke-2" />
                    </IconButton>
                    </DialogHeader>
                    <DialogBody className="space-y-7 pb-6">
                        <form className="space-y-7">
                            <div className=" ">
                                <Typography
                                variant="small"
                                color="blue-gray"
                                className="mb-2 font-medium"
                                >
                                    Nama Iuran
                                </Typography>
                                <Input
                                color="gray"
                                size="lg"
                                id="fee_name"
                                name="fee_name"
                                value={feeName}
                                placeholder="Iuran"
                                onChange={(e) => setFeeName(e.target.value)}
                                labelProps={{
                                    className: "hidden",
                                  }}
                                className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                                />
                                {error.feeName && <p className="text-red-500 text-sm mt-1 ml-1">{error.feeName}</p>}
                            </div>
                            <div className="">
                                <Typography
                                variant="small"
                                color="blue-gray"
                                className="mb-2 font-medium"
                                >
                                    Tipe
                                </Typography>
                                <Select 
                                
                                id="fee_type"
                                size="lg"
                                value={feeType}
                                onChange={(value) => setFeeType(value)}
                                labelProps={{
                                    className: "hidden",
                                  }}
                                className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                                >
                                    <Option value="true">Bulanan</Option>
                                    <Option value="false">One time</Option>
                                </Select>
                                {error.feeType && <p className="text-red-500 text-sm mt-1 ml-1">{error.feeType}</p>}
                            </div>
                            <div className="">
                                <Typography
                                variant="small"
                                color="blue-gray"
                                className="mb-2 font-medium"
                                >
                                    Status
                                </Typography>
                                <Select 
                                id="status"
                                size="md"
                                value={feeStatus}
                                onChange={(value) => setFeeStatus(value)}
                                labelProps={{
                                    className: "hidden",
                                  }}
                                className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                                >
                                    <Option value="active">Aktif</Option>
                                    <Option value="non-active">Non Aktif</Option>
                                </Select>
                                {error.feeStatus && <p className="text-red-500 text-sm mt-1 ml-1">{error.feeStatus}</p>}
                            </div>

                            <div className="">
                                <Typography
                                variant="small"
                                color="blue-gray"
                                className="mb-2 font-medium"
                                >
                                    Diterapkan pada unit
                                </Typography>
                                <Select 
                                id="status"
                                size="md"
                                value={feeUnitStatus}
                                onChange={(value) => setUnitStatus(value)}
                                labelProps={{
                                    className: "hidden",
                                  }}
                                className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                                >
                                    <Option value="all">Semua</Option>
                                    <Option value="occupied">Dihuni</Option>
                                    <Option value="vacant">Kosong</Option>
                                </Select>
                                {error.feeStatus && <p className="text-red-500 text-sm mt-1 ml-1">{error.feeStatus}</p>}
                            </div>

                            {/* {feeType === 'true' && (
                                <div className=" ">
                                    <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="mb-2 font-medium"
                                    >
                                        Tanggal Jatuh Tempo
                                    </Typography>
                                    <Select 
                                    value={feeDueDate}
                                    onChange={(value) => setFeeDueDate(value)}
                                    // defaultValue="1"
                                    size="lg"
                                    labelProps={{
                                        className: "hidden",
                                      }}
                                    className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                                >
                                        <Option value="1">1</Option>
                                        <Option value="2">2</Option>
                                        <Option value="3">3</Option>
                                        <Option value="4">4</Option>
                                        <Option value="5">5</Option>
                                        <Option value="6">6</Option>
                                        <Option value="7">7</Option>
                                        <Option value="8">8</Option>
                                        <Option value="9">9</Option>
                                        <Option value="10">10</Option>
                                        <Option value="11">11</Option>
                                        <Option value="12">12</Option>
                                        <Option value="13">13</Option>
                                        <Option value="14">14</Option>
                                        <Option value="15">15</Option>
                                    </Select>
                               
                                </div>
                            )} */}
                            
                            <div className="flex gap-4 !mt-5">
                                <div className="w-full">
                                    <Typography
                                    variant="small"
                                    color="black"
                                    className="mb-1 text-left font-medium text-[14px]"
                                    >
                                        Nominal
                                    </Typography>
                                    <div className="relative">
                                        <Typography className="absolute left-3 top-2 text-blue-gray-700">Rp</Typography>
                                        <Input
                                            containerProps={{
                                                className: "!min-w-full",
                                            }}
                                            labelProps={{
                                                className: "hidden",
                                            }}
                                            value={feeAmount ? rupiahInput(feeAmount) : ""}
                                            onChange={handleChangeAmount}
                                            type="text"
                                            color="gray"
                                            size="lg"
                                            id="nominal"
                                            name="nominal"
                                            placeholder="Nominal"
                                            autoComplete="off" 
                                            spellCheck="false" 
                                            autoCorrect="off"
                                            className="!border pl-9 !border-gray-300 placeholder:opacity-100"
                                            />
                                            {error.feeAmount && error.feeAmount && (
                                                <p className="text-red-500 text-sm mt-1 ml-1">{error.feeAmount}</p>
                                            )}
                                    </div>
                                    
                                </div>
                                
                                <div className={`w-full ${feeType === 'false'? 'hidden':''}`}>
                                    <Typography
                                    variant="small"
                                    color="black"
                                    className="mb-1 text-left font-medium text-[14px]"
                                    >
                                        Berlaku dari bulan
                                    </Typography>
                                    <div className="flex items-center gap-2 ">
                                        <DatePicker
                                            selected={feePeriod}
                                            onChange={(date) => handlePeriodeChange(date)}
                                            locale="id"
                                            showMonthYearPicker
                                            dateFormat="MMMM yyyy"
                                            className="w-full py-2 px-2 !h-[43px] text-blue-gray-700  !border !border-gray-300 outline-none rounded-md"
                                            popperPlacement="top-start" 
                                            popperClassName="!z-[9999]" 
                                            // portalId="root" 
                                        />
                                        
                                    </div>
                                    
                                </div>
                            </div>
                            {feeIdEdit && feeType === 'true' && (
                                <div className="!mt-4">
                                    <Typography color="blue-gray" className="font-bold text-[14px] ">{amountHistory.length > 1 ?'Riwayat perubahan nominal:':'Belum ada riwayat perubahan nominal'}</Typography>
                                    {amountHistory && amountHistory.length > 1 && (
                                        <table className="w-2/3 table-auto text-left mt-3">
                                            <thead>
                                                <tr>
                                                    <th className="border px-2 py-1  border-blue-gray-100 bg-blue-gray-50/50 ">
                                                        <Typography
                                                        variant="small"
                                                        color="blue-gray"
                                                        className="font-bold leading-none opacity-70"
                                                        >
                                                        Nominal
                                                        </Typography>
                                                    </th>
                                                    <th className="border  px-2 py-1  border-blue-gray-100 bg-blue-gray-50/50 ">
                                                        <Typography
                                                        variant="small"
                                                        color="blue-gray"
                                                        className="font-bold leading-none opacity-70"
                                                        >
                                                       Berlaku dari bulan
                                                        </Typography>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {amountHistory.map((status, index) => (
                                                    <tr key={index} className="even:bg-blue-gray-50/50">
                                                        <td className=" px-2 py-1 font-normal text-sm border border-blue-gray-100 text-gray">
                                                            {formatRupiah(status.amount) }
                                                        </td>
                                                        <td className=" px-2 py-1 font-normal text-sm border border-blue-gray-100 text-gray">
                                                            {formatStatusMonth(status.effective_date)}
                                                        </td>
                                                    </tr>
                                                ))}

                                            
                                            </tbody>
                                        </table>
                                    )}
                                    
                                </div>
                            )}
                            
                        </form>
                    </DialogBody>
                    <DialogFooter>
                    <Button  
                    loading={loading}
                    className="ml-auto" onClick={() =>onSubmit()}>
                         {loading ? 'Loading...' : 'Simpan'}
                    </Button>
                    </DialogFooter>
                </Dialog>
            )}
           
        </Card>
        </>
    );
}

export default IuranSetup;