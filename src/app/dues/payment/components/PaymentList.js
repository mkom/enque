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
} from "@material-tailwind/react";

import { fetchTenantDetails } from "@/utils/fetchTenant";
import { Skeleton } from "@/components/Skeleton";
import { formatRupiah } from "@/utils/formatRupiah";

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
 
const TABLE_HEAD = ["No", "ID", "Iuran", "Unit", "Jumlah", "Tanggal", "Tunai/Transfer", "Status",  ""];
 
const ITEMS_PER_PAGE = 20;
 
export function PaymentList() {
    const [tenantId, setTenantId] = useState(0);
    const [openForm, setOpenForm] = useState(false);
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
    

    const getPaymentData =  useCallback( async () => {
        const token = Cookies.get("token.oqoe");
        const url = `/api/fee/payment`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                    'X-Tenant-Id': tenantId,
                },
            });
        
            const data = await response.json();
            //console.log(data);
            setPaymentData(data.data || []);
            
            } catch (error) {
                console.error('Error fetching:', error.message);
                throw error;
            } finally {
                setSkeletonShow(false); 
            }

    },[tenantId]);

    useEffect(() => {
        getPaymentData();
    }, [getPaymentData]);

    const handleSearchChange = (event) => {
        setActive(1)
        setCurrentPage(0);
        const query = event.target.value;
        setSearchTerm(query);
    };

    const filteredData = paymentData.filter(data => {
        const search = searchTerm.toLowerCase(); // Normalisasi searchTerm untuk pencarian case-insensitive
        return (
            data?.member_address?.toLowerCase().includes(search) || // Cek alamat
            data?.fee_name?.toLowerCase().includes(search) || // Cek nama iuran
            data?.unique_id?.toLowerCase().includes(search)
        );
    });

    const offset = currentPage * ITEMS_PER_PAGE;
    const currentPageData = filteredData.slice(offset, offset + ITEMS_PER_PAGE);
    const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    return (
        <>
        <div className="flex items-center justify-end px-7">
            <div className="w-full md:w-72">
                <Input
                label="Cari"
                onChange={handleSearchChange}
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                />
            </div>
        </div>
        <CardBody className="px-0 ">
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
                                        {data?.member_address}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {formatRupiah(data?.amount)}
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
                                        value={
                                            data?.status === "completed"
                                            ? "Sukses"
                                            : data?.status === "failed"
                                            ? "Gagal"
                                            : "Pending"
                                        }
                                        color={
                                        data?.status === "completed"
                                            ? "green"
                                            : data?.status === "failed"
                                            ? "amber"
                                            : "red"
                                        }
                                    />

                                </td>
                                <td className="py-2 px-3 flex gap-2">
                                    <Tooltip content="Ubah">
                                        <IconButton className="h-8" onClick={() => { handleOpen(); handleEdit(data); }} variant="text">
                                            <PencilIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip content="Hapus">
                                        <IconButton className="h-8" onClick={() => { setConfirmationOpen(true); setMemberIdEdit(member?.member_id); }} variant="text">
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
        </>
    );
}