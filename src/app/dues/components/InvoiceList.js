"use client";
import Cookies from "js-cookie";
import React from "react";
import { useState,useEffect,useCallback } from "react";

import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import {DocumentIcon, ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import {
  Card,
  CardHeader,
  Input,
  Typography,
  Button,
  CardBody,
  CardFooter,
  Chip,
  IconButton,
  Tooltip,
} from "@material-tailwind/react";

  
import { fetchTenantDetails } from "@/utils/fetchTenant";
import { Skeleton } from "@/components/Skeleton";
import { formatRupiah } from "@/utils/formatRupiah";
import Details from "./InvoiceDetail";
  
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const TABLE_HEAD = ["No", "Invoice", "ID Trx", "Tanggal", "Total", "Status", ""];
const ITEMS_PER_PAGE = 10;

export function InvoiceList() {
    const [invoceData, setInvoiceData] = useState([]);
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


    const getInvoiceData =  useCallback( async () => {
        const token = Cookies.get("token.app_oq");
        const url = `/api/fee/invoices`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                    'Authorization': `Bearer ${token}`,
                },
            });
        
            const data = await response.json();
            console.log(data);
            setInvoiceData(Array.isArray(data.data) ? data.data : []);
            
            } catch (error) {
                console.error('Error fetching:', error.message);
                throw error;
            } finally {
                setSkeletonShow(false); 
            }

    },[]);

    useEffect(() => {
        getInvoiceData();
    }, [getInvoiceData]);

    const filteredData = searchTerm.trim() === '' ? invoceData : invoceData.filter(data => {
        const search = searchTerm.toLowerCase();
        const houseNumber = data?.house_number?.toString().toLowerCase() ?? '';
        const memberName = data?.member_name?.toString().toLowerCase() ?? '';
        const phone = data?.no_hp?.toString().toLowerCase() ?? '';
        
        return houseNumber.includes(search) || 
               memberName.includes(search) || 
               phone.includes(search);
    });
    
    

    const offset = currentPage * ITEMS_PER_PAGE;
    const currentPageData = filteredData.slice(offset, offset + ITEMS_PER_PAGE);
    const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const toggleDetails = (invoice) => {
        setSelectedInvoice(invoice);
        setDetailsOpen(!detailsOpen);
    };

    return (
        <>
            {!detailsOpen && (
                <Card className="w-full mb-8">
                <CardHeader floated={false} shadow={false} className="rounded-none">
                    <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                        <div>
                            <Typography variant="h5" color="blue-gray">
                                Semua Invoice
                            </Typography>
                            <Typography color="gray" className="mt-1 font-normal">
                                Rincian lengkap semua invoice
                            </Typography>
                        </div>
                        {/* <div className="flex w-full shrink-0 gap-2 md:w-max">
                            <div className="w-full md:w-72">
                                <Input
                                    label="Search"
                                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button className="flex items-center gap-3" size="sm">
                                <ArrowDownTrayIcon strokeWidth={2} className="h-4 w-4" /> Download
                            </Button>
                        </div> */}
                    </div>
                </CardHeader>
                <div className="flex items-center justify-end px-4">
                    <div className="w-full md:w-72">
                        <Input
                        label="Cari"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                        className="border-y p-3 border-blue-gray-100 bg-blue-gray-50/50"
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
                            {skeletonShow ? (
                                <tr className="even:bg-blue-gray-50/50">
                                    <td colSpan="8" className="py-2 px-3">
                                        <Skeleton />
                                    </td>
                                </tr>
                            ) : currentPageData.length > 0 ? (
                                currentPageData.map((inv, index) => (
                                    <tr key={index} className="even:bg-blue-gray-50/50">
                                        <td className="py-2 px-3">
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {offset + index + 1}
                                            </Typography>
                                        </td>
                                        <td className="py-2 px-3">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                {inv?.invoice_number}
                                            </Typography>
                                        </td>
                                        <td className="py-2 px-3">
                                            <Typography variant="small" color="blue-gray" className="font-bold">
                                                {inv?.transaction_unique_id}
                                            </Typography>
                                        </td>
                                        <td className="py-2 px-3">
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {formatDate(inv?.invoice_created_at)}
                                            </Typography>
                                        </td>
                                        <td className="py-2 px-3">
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {formatRupiah(parseInt(inv.invoice_total))}
                                            </Typography>
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="w-max">
                                                <Chip
                                                    size="sm"
                                                    variant="ghost"
                                                    value={
                                                        inv.invoice_status === "paid"
                                                            ? "Lunas"
                                                            : inv.invoice_status === "Not Billable"
                                                            ? "Tidak tertagih"
                                                            : "Belum bayar"
                                                    }
                                                    color={
                                                        inv.invoice_status === "paid"
                                                            ? "green"
                                                            : inv.invoice_status === "Not Billable"
                                                            ? "amber"
                                                            : "red"
                                                    }
                                                />
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 flex gap-2">
                                            <Tooltip content="Lihat">
                                                <IconButton
                                                    className="h-8"
                                                    onClick={() => toggleDetails(inv)}
                                                    variant="text"
                                                >
                                                    <DocumentIcon className="h-4 w-4" />
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
                                    size="sm"
                                >
                                    <ArrowLeftIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={next}
                                    disabled={active === pageCount}
                                    size="sm"
                                >
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </CardFooter>
            </Card>
            )}
            
            {detailsOpen && <Details data={selectedInvoice} onClose={() => setDetailsOpen(false)} />}
        </>
    );
}