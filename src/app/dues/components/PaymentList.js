"use client";
import Cookies from "js-cookie";
import React from "react";
import { useState,useEffect,useCallback } from "react";
import {DocumentPlusIcon,PencilIcon,TrashIcon, MagnifyingGlassIcon, ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

import {
  Card,
  CardHeader,
  Typography,
  Button,
  CardBody,
  Chip,
  CardFooter,
  Avatar,
  IconButton,
  Tooltip,
  Input,
  Dialog,
  DialogBody,
    DialogHeader,
    DialogFooter,
} from "@material-tailwind/react";

import { Skeleton } from "@/components/Skeleton";
import { formatRupiah } from "@/utils/formatRupiah";
//import PaymentForm from "./PaymentForm";

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
 
const TABLE_HEAD = ["No", "ID", "Iuran", "Keterangan", "Unit", "Jumlah", "Tanggal", "Tunai/Transfer", "Status",  ""];
 
const ITEMS_PER_PAGE = 20;
 
export function PaymentList ({ onEdit }) {
    //const [openForm, setOpenForm] = useState(false);

    const [open, setOpen] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const handleOpen = () => setOpen(!open);
    const handleConfirmationOpen = () => setConfirmationOpen(!open);
    const [trxId, setTrxId] = useState(0);
    
    const [paymentData, setPaymentData] = useState([]);
    const [skeletonShow, setSkeletonShow] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(new Date(date), "dd MMM yyyy", { locale: id });
    };


    const getPaymentData =  useCallback( async () => {
        const token = Cookies.get("token.app_oq");
        const url = `/api/fee/payment`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                    Authorization: `Bearer ${token}`,
                },
            });
        
            const data = await response.json();
            console.log(data);
            setPaymentData(data.data || []);
            
            } catch (error) {
                console.error('Error fetching:', error.message);
                throw error;
            } finally {
                setSkeletonShow(false); 
            }

    },[]);

    useEffect(() => {
        getPaymentData();
    }, [getPaymentData]);

    const handleSearchChange = (event) => {
        setActive(1)
        setCurrentPage(0);
        const query = event.target.value;
        setSearchTerm(query);
    };
   // console.log("data", paymentData);

    const filteredData = paymentData.filter(data => {
        const search = searchTerm.toLowerCase();
        return (
            data?.house_number?.toLowerCase().includes(search) || 
            data?.fee_name?.toLowerCase().includes(search) || 
            data?.unique_id?.toLowerCase().includes(search)
        );
    });

    const offset = currentPage * ITEMS_PER_PAGE;
    const currentPageData = filteredData.slice(offset, offset + ITEMS_PER_PAGE);
    const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const handleEdit = (item) => {
        onEdit(item); // buka form dan kirim data untuk edit
    };

     const handleDelete = async () => {
        setLoading(true);
        const token = Cookies.get("token.app_oq");
        try {
            const response = await fetch('/api/fee/payment', {
                method: 'DELETE',
                headers: {
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                Authorization: `Bearer ${token}`,
                },

                body: JSON.stringify({
                trxId:trxId,
                }),
            });

            const data = await response.json();

            if (response.status === 200) {
                setLoading(false);
                getPaymentData();
                setConfirmationOpen(false);
            } 
            
        } catch (error) {
            
        } finally {
            setLoading(false);
            getPaymentData();
            setConfirmationOpen(false);
        }
    };

    return (
        <>
        {/* {openForm && (
            <PaymentForm onCancel={() => setOpenForm(false)}/>
        )} */}

        <div className="flex items-center justify-end px-4">
            <div className="w-full md:w-72">
                <Input
                label="Cari"
                onChange={handleSearchChange}
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                />
            </div>
        </div>
        <CardBody className="p-6 px-0 ">
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
                        className="font-bold  leading-none "
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
                            <td colSpan="8" className="py-2 px-3">
                                <Skeleton />
                            </td>
                        </tr>
                    ) : currentPageData.length > 0 ? (
                        currentPageData.map((data, index) => (
                            <tr key={index} className="even:bg-blue-gray-50/50">
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-bold">
                                    {offset+ index + 1}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-bold">
                                        {data?.unique_id}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-bold">
                                        {data?.fee_name} 
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {data?.house_number}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {data?.house_number}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {formatRupiah(parseInt(data?.amount))}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {formatDate(data?.transaction_date)}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {data?.payment_method === "cash" ? "Tunai" : "Transfer"}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Chip
                                        size="sm"
                                        variant="ghost"
                                        className="text-center"
                                        value={
                                            data?.status === "completed"
                                            ? "Sukses"
                                            : data?.status === "failed"
                                            ? "Gagal"
                                            : "Menunggu"
                                        }
                                        color={
                                        data?.status === "completed"
                                            ? "green"
                                            : data?.status === "failed"
                                            ? "red"
                                            : "amber"
                                        }
                                    />

                                </td>
                                <td className="py-2 px-3 flex gap-2">
                                    <Tooltip content="Ubah">
                                        <IconButton className="h-8" onClick={() => { handleEdit(data); }} variant="text">
                                            <PencilIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip content="Hapus">
                                        <IconButton className="h-8" onClick={() => { setConfirmationOpen(true); setTrxId(data.transaction_id) }} variant="text">
                                            <TrashIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip>
                                </td>
                            </tr>
                        ))
                    ) : !skeletonShow && (
                        <tr className="even:bg-blue-gray-50/50">
                            <td colSpan="8" className="py-2 px-3 text-center">
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
                    <Typography className="font-normal  text-gray">Apakah Anda yakin ingin menghapus Transaksi ini? Tindakan ini tidak bisa dibatalkan.</Typography>
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

        </>
    );
}