"use client";
import Cookies from "js-cookie";
import React from "react";
import { useState,useEffect,useCallback } from "react";

import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";
import {DocumentIcon,PencilIcon,TrashIcon, ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
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

import { Skeleton } from "@/components/Skeleton";
import { formatRupiah } from "@/utils/formatRupiah";
import Details from "./BillDetail";

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { id as idLocale } from "date-fns/locale";
import { parseISO } from "date-fns";
import { list } from "postcss";

const TABLE_HEAD = ["No", "Iuran", "Unit",  "Jumlah", "Total", "Keterangan", ""];
const ITEMS_PER_PAGE = 10;

export function FeeList() {
    const [tenantId, setTenantId] = useState(0);
    const [listData, setListData] = useState([]);
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
        return format(new Date(date), "MMM yyyy", { locale: id });
    };

    const getListData =  useCallback( async () => {
        const url = `/api/fee/bills`;
        const token = Cookies.get('token.app_oq');
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
                    'Authorization': `Bearer ${token}`,
                },
            });
        
            const result = await response.json();
            const rawData = result.data || [];
            //console.log('rawData', rawData);
            
            setListData(rawData || []);
            
            } catch (error) {
                console.error('Error fetching:', error.message);
                throw error;
            } finally {
                setSkeletonShow(false); 
            }

    },[tenantId]);

    useEffect(() => {
        getListData();
    }, [getListData]);

    const filteredData = listData.filter(data => {
        const search = searchTerm.toLowerCase(); // Normalisasi searchTerm untuk pencarian case-insensitive
        return (
            data?.house_number?.toLowerCase().includes(search) || // Cek alamat
            data?.unit_name?.toLowerCase().includes(search) || // Cek nama
            (data?.no_hp?.toLowerCase() ?? '').includes(search) // Cek nomor telepon, jika null diubah jadi ''
        );
    });
    
    

    const offset = currentPage * ITEMS_PER_PAGE;
    const currentPageData = filteredData.slice(offset, offset + ITEMS_PER_PAGE);
    const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    //console.log('currentPageData', currentPageData);

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);

    const toggleDetails = (unitId, feeId) => {
        setSelectedBill({ unitId, feeId });
        setDetailsOpen(!detailsOpen);
    };

    return (
        <>
        {!detailsOpen && (
            <Card className="w-full mb-8">
            <CardHeader floated={false} shadow={false}  className="rounded-none">
                <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                    <div>
                        <Typography variant="h5" color="blue-gray">
                            Tagihan Aktif   
                        </Typography>
                        <Typography color="gray" className="mt-1 font-normal">
                            Berikut adalah daftar tagihan yang belum dibayar.
                        </Typography>
                    </div>
                    {/* <div className="flex w-full shrink-0 gap-2 md:w-max">
                        <div className="w-full md:w-72">
                        <Input
                            label="Search"
                            icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                        />
                        </div>
                        <Button className="flex items-center gap-3" size="sm">
                        <ArrowDownTrayIcon strokeWidth={2} className="h-4 w-4" /> Download
                        </Button>
                    </div> */}
                </div>
            </CardHeader>
            <CardBody className="p-6 px-0">
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
                            <td colSpan="8" className="py-2 px-3">
                                <Skeleton />
                            </td>
                        </tr>
                    ) : currentPageData.length > 0 ? (
                        currentPageData.map((bill, index) => (
                            <tr key={index} className="even:bg-blue-gray-50/50">
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                    {offset+ index + 1}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-bold">
                                        {bill?.fee_name}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-bold">
                                        {bill?.house_number}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                    {formatRupiah(parseInt(bill.total))}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" color={`${bill?.is_recurring && bill?.total_bills >= 3 ? 'red' : 'blue-gray'}`} className="font-normal">
                                        {bill?.is_recurring? `${bill?.total_bills} Bulan` : 'Sekali Bayar'}
                                    </Typography>
                                </td>

                                <td className="py-2 px-3">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {bill?.is_recurring ? `${formatDate(bill?.from)} - ${formatDate(bill?.until)}` : `Iuran ${bill?.fee_name}`}
                                    </Typography>
                                </td>
                                
                                
                                <td className="py-2 px-3 flex gap-2">
                                    {/* <Tooltip content="Ubah">
                                        <IconButton className="h-8" onClick={() => { handleOpen(); handleEdit(bill); }} variant="text">
                                            <PencilIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip> */}

                                    <Tooltip content="Lihat">
                                        <IconButton className="h-8" onClick={() => { toggleDetails(bill?.unit_id, bill?.fee_id) }} variant="text">
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
        )}
         
        {detailsOpen && selectedBill && (
            <Details data={selectedBill} onClose={() => setDetailsOpen(false)} />
        )}
        </>
       
    )
}