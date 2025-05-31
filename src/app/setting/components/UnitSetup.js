"use client";
import Cookies from "js-cookie";
import React from "react";
import { useState,useEffect,useCallback } from "react";
import {DocumentPlusIcon,PencilIcon,TrashIcon, MagnifyingGlassIcon, ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { XMarkIcon,ArrowDownTrayIcon } from "@heroicons/react/24/outline";
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
    Chip,
    IconButton,
    Typography,
    DialogBody,
    DialogHeader,
    DialogFooter,
    Tooltip
} from "@material-tailwind/react";
import { Skeleton } from "../../../components/Skeleton";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { da, id } from "date-fns/locale"; 
import { set } from "date-fns";
registerLocale("id", id);
const ITEMS_PER_PAGE = 20;
  
const UnitSetup = ({}) => {
   // const token = Cookies.get("token.oqoe");
    const [totalFees, setTotalFees] = useState(0);
    const [open, setOpen] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const handleOpen = () => setOpen(!open);
    const handleConfirmationOpen = () => setConfirmationOpen(!confirmationOpen);
    const handleImportOpen = () => setImportOpen(!importOpen);
    const [skeletonShow, setSkeletonShow] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [active, setActive] = useState(1);

    const next = () => {
        if (active === ITEMS_PER_PAGE) return;
        setActive(active + 1);
        setCurrentPage(active)
    };
    const prev = () => {
        if (active === 1) return;
        setActive(active - 1);
        setCurrentPage(currentPage -1)
    };
    

    const [file, setFile] = useState(null);
    const [errorImport, setErrorImport] = useState("");

    const TABLE_HEAD = ["No", "No Unit", "Nama", "No HP", "Status", ""];
    
    const [unitName, setUnitName] = useState('');
    const [houseNumber, setHouseNumber] = useState('');
    const [unitHoHP, setUnitHoHP] = useState('');
    const [unitStatus, setUnitStatus] = useState('occupied');
    const [statusPeriod, setStatusPeriod] = useState(new Date().toISOString().slice(0, 7));  
    const [unitIdEdit, setUnitIdEdit] = useState('');
    const [statusHistory, setStatusHistory] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [unitsData, setUnitsData] = useState([]);
    const [error, setError] = useState([
        {
            memberName: '',
            memberAddress: '',
            memberNoPhone: '',
            memberStatus:'',
        },
    ]);

    const formatStatusMonth = (statusMonth) => {
        //console.log(statusMonth)
        const date = new Date(statusMonth);
        const options = { year: 'numeric', month: 'long' };
        const formattedDate = date.toLocaleDateString('id-ID', options);
        //console.log(formattedDate)
        return formattedDate;
    };

    const getUnitsData =  useCallback( async () => {
        const token = Cookies.get("token.app_oq");
        //console.log(token)
        try {
            const response = await fetch(`/api/unit`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY
              },
            });
        
            const data = await response.json();
            setUnitsData(data.data || []);
            //console.log(data)
            

          } catch (error) {
            console.error('Error fetching unit details:', error.message);
            throw error;
          } finally {
            setSkeletonShow(false); 
          }

    },[]);

    useEffect(() => {
        getUnitsData();
    }, [getUnitsData]);

    //console.log(unitsData.filter(unit => unit.status === "vacant"));
    const totalVacant = unitsData.filter(unit => unit.status === "vacant").length;
    const totalOccupied = unitsData.filter(unit => unit.status === "occupied").length;

    const validateForm = async  () => {
        let valid = true;
        const newError = {
            unitName: '',
            houseNumber: '',
            unitHoHP: '',
            unitStatus: '',
        };

        // Validasi lokal
        if (!unitName) {
            newError.unitName = "Nama wajib diisi";
            valid = false;
        }

        if (!houseNumber) {
            newError.houseNumber = "No unit wajib diisi";
            valid = false;
        }

        if (!unitStatus) {
            newError.unitStatus =  "Status wajib dipilih";
            valid = false;
        }


        if(!unitIdEdit) {
            try {
                const token = Cookies.get("token.app_oq");
                const response = await fetch(`/api/unit`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                },
                });
    
                const data = await response.json();
                if (response.status === 200) {

                    if(data.data.length > 0 && houseNumber === data.data[0].house_number) {
                        newError.houseNumber ='No unit sudah terdaftar';
                        valid = false;
                    }
                }
    
        
            } catch (error) {
                console.error("Error fetching validation:", error);
                //valid = false;
            }
    
        }
       
        setError(newError);
        return valid;
    };
   
    const onSubmit = async(e) => {
        //console.log(validateForm())
        const isValid = await validateForm();

        if (isValid) {
            setLoading(true);
            const token = Cookies.get("token.app_oq");
            try {
                const response = await fetch('/api/unit', {
                  method: unitIdEdit ? 'PUT' : 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                    Authorization: `Bearer ${token}`,
                  },
                  
                  body: JSON.stringify({
                    unitId: unitIdEdit,
                    unitName,
                    houseNumber,
                    unitHoHP,
                    unitStatus,
                    statusPeriod: statusPeriod + "-01",
                  }),
                });
        
                const data = await response.json();
               // console.log(data)

              } catch (error) {
                
              } finally {
                setLoading(false); 
                handleOpen();
                getUnitsData();
              }

        } else {
            // console.log('Form validation failed');
        }
    };

    const handlePeriodeChange = (date) => {
        const formattedDate = date.toISOString().slice(0, 7);
        //console.log(formattedDate + '-01')
        setStatusPeriod(formattedDate)
    };
    

    const resetForm = () => {
        setUnitIdEdit('');
        setUnitName('');
        setHouseNumber('');
        setUnitStatus('occupied');
        setUnitHoHP('');
        setStatusPeriod(new Date().toISOString().slice(0, 7));
        setError ([
            {
            unitName: '',
            houseNumber: '',
            unitHoHP: '',
            unitStatus: '',
            },
        ]);
    };

    useEffect(() => {
        if (!open) {
            resetForm();
           
        }
    }, [open]);

    const handleEdit = (unit) => {
        //console.log(unit)
        setUnitIdEdit(unit.unit_id);
        setUnitName(unit.unit_name);
        setHouseNumber(unit.house_number);
        setUnitHoHP(unit.no_hp);
        setUnitStatus(unit.status);
        setStatusPeriod(
            unit.status_date ? new Date(unit.status_date) : null
        );
        setStatusHistory(unit.status_history);
    };

    const handleDelete = async () => {
        setLoading(true);
        const token = Cookies.get("token.app_oq");
        try {
            const response = await fetch('/api/unit', {
                method: 'DELETE',
                headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                unitId: unitIdEdit,
                }),
            });

            const data = await response.json();

            if (response.status === 200) {
                setLoading(false);
                getUnitsData();
                setConfirmationOpen(false);
            } 
         
        } catch (error) {
         
        } finally {
          setLoading(false);
          getUnitsData();
          setConfirmationOpen(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) {
            setErrorImport("Silakan pilih file untuk diunggah.");
            return;
        }

        const allowedExtensions = [".csv", ".xlsx"];
        const fileExtension = selectedFile.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            setErrorImport("Format file tidak valid. Hanya .csv dan .xlsx yang diterima.");
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setErrorImport("");
    };

    const handleImport = async () => {
        if (!file) {
            setErrorImport("Silakan pilih file sebelum mengimpor.");
            return;
        }
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        // formData.append("memberStatus", memberStatus);
        // formData.append("statusPeriod", statusPeriod);
        const token = Cookies.get("token.app_oq");

        try {
            const response = await fetch('/api/import/units', {
                method: 'POST',
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
    
            const data = await response.json();

            //console.log(data);

            if (data.errors?.length > 0 && data.errors) {
                setErrorImport(data.errors);
            } else {
                //alert("Data berhasil diimpor!");
                setImportOpen(false);
            }
            //console.log(data);

          } catch (error) {
            console.error("Error saat mengimpor:", error);
            setErrorImport("Terjadi kesalahan saat mengimpor data.");
          } finally {
            setLoading(false); 
            setErrorImport('');
            getUnitsData();
          }
    };

    const handleSearchChange = (event) => {
        setActive(1)
        setCurrentPage(0);
        const query = event.target.value;
        setSearchTerm(query);
    };

    const filteredData = unitsData.filter(data => {
        const search = searchTerm.toLowerCase(); // Normalisasi searchTerm untuk pencarian case-insensitive
        return (
            data?.house_number?.toLowerCase().includes(search) || // Cek alamat
            data?.unit_name?.toLowerCase().includes(search) || // Cek nama unit
            (data?.no_hp?.toLowerCase() ?? '').includes(search) // Cek nomor telepon, jika null diubah jadi ''
        );
    });
    
    

    const offset = currentPage * ITEMS_PER_PAGE;
    const currentPageData = filteredData.slice(offset, offset + ITEMS_PER_PAGE);
    const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    return (
        <>
         <Card className=" w-full mb-8">
            <CardHeader floated={false} shadow={false} className="rounded-none">
            <div className="mb-4 flex items-start justify-between gap-8">
                <div>
                    <Typography variant="h5" color="blue-gray">
                        Unit
                    </Typography>
                    <Typography className="mt-1 font-normal text-[16px] text-gray">
                       Daftar unit.
                    </Typography>
                    
                  
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                    <input type="file" accept=".csv" className="hidden" />
                    <Button onClick={handleImportOpen}  variant="outlined" className="flex items-center gap-3" size="sm">
                        <ArrowDownTrayIcon strokeWidth={2} className="h-4 w-4" />  Import
                    </Button>
                    <Button onClick={handleOpen} variant="gradient"  className="flex items-center gap-3" size="sm">
                        <DocumentPlusIcon strokeWidth={2} className="h-4 w-4" /> Tambah
                    </Button>
                </div>
            </div>
            <div className="flex flex-col items-center justify-between  gap-4 md:flex-row">
                <div className="flex gap-4">
                    <Typography className="mt-1 font-bold text-[16px] text-gray">
                       Dihuni: {totalOccupied ? totalOccupied : 0}
                    </Typography>
                    <Typography className="mt-1 font-bold text-[16px] text-gray">
                       Kosong: {totalVacant ? totalVacant : 0}
                    </Typography>
                </div>
                <div className="w-full md:w-72">
                    <Input
                    label="Cari"
                    onChange={handleSearchChange}
                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    />
                </div>
            </div>
            
            
            </CardHeader>
            <CardBody className="p-6 px-0 ">
                <table className="w-full min-w-max table-auto text-left">
                    <thead>
                        <tr>
                            {TABLE_HEAD.map((head) => (
                            <th
                                key={head}
                                className="border-y p-3  border-blue-gray-100 bg-blue-gray-50/50 "
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
                    ) : currentPageData.length > 0 ? (
                        currentPageData.map((unit, index) => (
                            <tr key={index} className="even:bg-blue-gray-50/50">
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                    {offset+ index + 1}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {unit?.house_number}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {unit?.unit_name}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {unit?.no_hp}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Chip
                                    variant="ghost"
                                    size="sm"
                                    className="text-center max-w-20"
                                    value={unit?.status ==='vacant' ? "Kosong" : "Dihuni"}
                                    color={unit?.status === 'vacant' ? "blue-gray" : "green"}
                                    />

                                </td>
                                <td className="py-2 px-3 flex gap-2">
                                    <Tooltip content="Ubah">
                                        <IconButton className="h-8" onClick={() => { handleOpen(); handleEdit(unit); }} variant="text">
                                            <PencilIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip content="Hapus">
                                        <IconButton className="h-8" onClick={() => { setConfirmationOpen(true); setUnitIdEdit(unit?.unit_id); }} variant="text">
                                            <TrashIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip>
                                </td>
                            </tr>
                        ))
                    ) : !skeletonShow && (
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
                {filteredData.length > ITEMS_PER_PAGE && (
                    <>
                    <Typography variant="small" color="blue-gray" className="font-bold">
                    Total {filteredData.length}
                    </Typography>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                    Halaman {active} dari {pageCount}
                    </Typography>
                    <div className="flex gap-2">
                        <Button 
                        variant="outlined" 
                        onClick={prev}
                        disabled={active === 1}
                        size="sm">
                            <ArrowLeftIcon  className="h-4 w-4" />
                        </Button>
                        <Button 
                        variant="outlined" 
                        onClick={next}
                        disabled={active === pageCount}
                        size="sm">
                            <ArrowRightIcon className="h-4 w-4" />
                        </Button>
                    </div>
                    </>
                )}
                
            </CardFooter>
         </Card>
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
                        <Typography className="font-normal  text-gray">Apakah Anda yakin ingin menghapus Unit ini? Tindakan ini tidak bisa dibatalkan.</Typography>
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
                className="p-4">
                    <DialogHeader className="relative m-0 block">
                    <Typography variant="h5" color="blue-gray">
                        Unit
                    </Typography>
                    <Typography className="mt-1 font-normal text-[16px] text-gray">
                        Tambah atau ubah unit yang sudah ada
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
                                    No Unit
                                </Typography>
                                <Input
                                    color="gray"
                                    size="lg"
                                    id="house_number"
                                    name="house_number"
                                    // label="No Unit"
                                    // variant="outlined"
                                    value={houseNumber  || ""}
                                    onChange={(e) => setHouseNumber(e.target.value)}
                                    placeholder="A1-01"
                                    labelProps={{
                                        className: "hidden",
                                      }}
                                    className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                                />
                                {error.houseNumber && <p className="text-red-500 text-sm mt-1 ml-1">{error.houseNumber}</p>}
                            </div>

                            <div className=" ">
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="mb-2 font-medium"
                                >
                                    Nama
                                </Typography>
                                <Input
                                    color="black"
                                    size="md"
                                    id="unit_name"
                                    name="unit_name"
                                    value={unitName || ""}
                                    onChange={(e) => setUnitName(e.target.value)}
                                    placeholder="Jhon Doe"
                                    labelProps={{
                                        className: "hidden",
                                      }}
                                    className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                                />
                                {error.unitName && <p className="text-red-500 text-sm mt-1 ml-1">{error.unitName}</p>}
                            </div>
                            <div className=" ">
                            <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="mb-2 font-medium"
                                >
                                    No. Hp
                                </Typography>
                                <Input
                                    color="black"
                                    size="md"
                                    type="number"
                                    id="unit_no_hp" 
                                    name="unit_no_hp"
                                    value={unitHoHP  || "" }
                                    onChange={(e) => setUnitHoHP(e.target.value)}
                                    placeholder="081187487152"
                                    labelProps={{
                                        className: "hidden",
                                      }}
                                    className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                                />
                                {error.unitHoHP && <p className="text-red-500 text-sm mt-1 ml-1">{error.unitHoHP}</p>}
                            </div>

                            
                            <div className="flex gap-4 !mt-7 border border-blue-gray-200 rounded-md p-4">
                                <div className="w-full">
                                    <Typography
                                    variant="small"
                                    color="black"
                                    className="mb-1 text-left font-medium text-[14px]"
                                    >
                                        Status
                                    </Typography>
                                  
                                    <Select 
                                        containerProps={{
                                            className: "!min-w-full",
                                        }}
                                        labelProps={{
                                            className: "hidden",
                                        }}
                                        label="Status"
                                        id="status"
                                        size="md"
                                        variant="outlined"
                                        required
                                        value={unitStatus}
                                        onChange={(value) => setUnitStatus(value)}
                                        className="!border !border-gray-300 "
                                    >
                                        <Option value="occupied">{unitStatus === 'occupied' ? 'Dihuni': 'Dihuni'}</Option>
                                        <Option value="vacant">{unitStatus === 'vacant' ? 'Kosong': 'Kosong'}</Option>
                                    </Select>
                                    {error.unitStatus && <p className="text-red-500 text-sm mt-1 ml-1">{error.unitStatus}</p>}

                                    
                                </div>
                                <div className={`w-full`}>
                                    <Typography
                                    variant="small"
                                    color="black"
                                    className="mb-1 text-left font-medium text-[14px]"
                                    >
                                        Bulan
                                    </Typography>
                                    <div className="flex items-center gap-2 ">
                                        <DatePicker
                                            selected={statusPeriod}
                                            onChange={(date) => handlePeriodeChange(date)}
                                            locale="id"
                                            showMonthYearPicker
                                            dateFormat="MMMM yyyy"
                                            className="w-full py-2 px-2 !h-[40px] text-blue-gray-700  !border !border-gray-300 outline-none rounded-md"
                                            popperPlacement="top-start" 
                                            popperClassName="!z-[9999]" 
                                            // portalId="root" 
                                        />
                                        
                                    </div>
                                    
                                </div>
                                
                            </div>

                            {unitIdEdit && (
                                <div className="!mt-4">
                                    <Typography color="blue-gray" className="font-bold text-[14px] ">{statusHistory.length > 1 ?'Riwayat perubahan status:':'Belum ada riwayat perubahan status'}</Typography>
                                    {statusHistory && statusHistory.length > 1 && (
                                        <table className="w-2/3 table-auto text-left mt-3">
                                            <thead>
                                                <tr>
                                                    <th className="border px-2 py-1  border-blue-gray-100 bg-blue-gray-50/50 ">
                                                        <Typography
                                                        variant="small"
                                                        color="blue-gray"
                                                        className="font-bold leading-none opacity-70"
                                                        >
                                                        Status
                                                        </Typography>
                                                    </th>
                                                    <th className="border  px-2 py-1  border-blue-gray-100 bg-blue-gray-50/50 ">
                                                        <Typography
                                                        variant="small"
                                                        color="blue-gray"
                                                        className="font-bold leading-none opacity-70"
                                                        >
                                                        Bulan
                                                        </Typography>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {statusHistory.map((status, index) => (
                                                    <tr key={index} className="even:bg-blue-gray-50/50">
                                                        <td className=" px-2 py-1 font-normal text-sm border border-blue-gray-100 text-gray">
                                                           {status.status === 'occupied' ?'Dihuni':'Kosong'}
                                                        </td>
                                                        <td className=" px-2 py-1 font-normal text-sm border border-blue-gray-100 text-gray">
                                                          {formatStatusMonth(status.status_date)}
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

            {importOpen && (
                 <Dialog 
                 open={importOpen} 
                 handler={handleImportOpen}
                 className="p-4"
                 >
                     <DialogHeader>
                         <Typography variant="h5" color="blue-gray">
                             Import Data
                         </Typography>
                     </DialogHeader>
                     <DialogBody>
                         <Typography className="font-normal  text-gray">Hanya file dengan ekstensi <strong>.csv</strong> atau <strong>.xlsx</strong> yang diterima.</Typography>
                         <Typography
                            as="a"
                            href="/sample-format.csv"
                            download
                            className="text-blue-500 hover:underline mr-2"
                            >
                            Unduh format sampel (.csv)
                        </Typography>
                        <Typography
                            as="a"
                            href="/sample-format.xlsx"
                            download
                            className="text-blue-500 hover:underline mr-2"
                            >
                            Unduh format sampel (.xlsx)
                        </Typography>
                        
                        <div className="py-5">
                            <Typography
                                variant="small"
                                color="blue-gray"
                                className="mb-2 font-medium"
                            >
                                Unggah File
                            </Typography>
                            <Input
                                type="file"
                                accept=".csv, .xlsx"
                                color="gray"
                                size="md"
                                // id="member_address"
                                // name="member_address"
                                label="Unggah File"
                                onChange={handleFileChange}
                                placeholder="Jhon Doe"
                                labelProps={{
                                    className: "hidden",
                                    }}
                                className="w-full !h-12 placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                            />
                            {errorImport && <p className="text-red-500 text-sm mt-3 ml-1">{errorImport}</p>}
                        </div>
                         
                     </DialogBody>
                     <DialogFooter className="space-x-2">
                         <Button variant="text" color="blue-gray" onClick={() => { setImportOpen(false); setErrorImport(''); }}>
                             Batal
                         </Button>
                         <Button variant="gradient" onClick={handleImport} disabled={loading}>
                             {loading ? "Mengimpor..." : "Import"}
                         </Button>
 
                     </DialogFooter>
               </Dialog>
            )}

        </>
    );
}

export default UnitSetup;