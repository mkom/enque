"use client";
import Cookies from "js-cookie";
import React from "react";
import { useState,useEffect,useCallback } from "react";
import {DocumentPlusIcon,PencilIcon,TrashIcon, MagnifyingGlassIcon, DocumentIcon, ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
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
import { formatRupiah } from "@/utils/formatRupiah";

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
const ITEMS_PER_PAGE = 20;

const TransactionList = ({ }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [skeletonShow, setSkeletonShow] = useState(true);
    const TABLE_HEAD = ["No", "ID Trx", "Tanggal", "Keterangan", "Jumlah", "Kategori", "Tunai/Transfer", "Status", ""];
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

    const fetchTransactions = useCallback(async () => {
        //setSkeletonShow(true);
        const token = Cookies.get("token.app_oq");
        try {
            const response = await fetch('/api/transactions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY
                },
            });
            const data = await response.json();
            console.log('Fetched transactions:', data);
            setTransactions(data.data || []);
            setTotalTransactions(data.total || 0);
        } catch (error) {
            console.error('Error fetching transactions:', error.message);
        } finally {
           setSkeletonShow(false); 
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleSearchChange = (event) => {
        setActive(1)
        setCurrentPage(0);
        const query = event.target.value;
        setSearchTerm(query);
    };

    const filteredData = transactions.filter(data => {
        const search = searchTerm.toLowerCase();
        return (
            data?.description?.toLowerCase().includes(search) ||
            data?.unique_id?.toLowerCase().includes(search) 
        );
    });

    const offset = currentPage * ITEMS_PER_PAGE;
    const currentPageData = filteredData.slice(offset, offset + ITEMS_PER_PAGE);
    const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    return (
        <>
            <div className="flex items-center justify-end px-4">
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
                        <tr>
                            <td colSpan={TABLE_HEAD.length}>
                                <Skeleton count={5} />
                            </td>
                        </tr>
                    ) : (
                        currentPageData.map((transaction, index) => (
                            <tr key={index} className="even:bg-blue-gray-50/50">
                                <td className="py-2 px-3">
                                    <Typography variant="small" className="font-bold">
                                       {offset+ index + 1}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" className="font-bold">
                                        {transaction.unique_id}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" className="font-normal">
                                       {formatDate(transaction.transaction_date)}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" className="font-normal">
                                        {transaction.description}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" className={`${transaction.transaction_type === "income" ? "text-green-600" : "text-red-600"} font-bold`}>
                                        <span>{transaction.transaction_type === "income" ? "+" : "-"}</span>
                                       <span> {formatRupiah(parseInt(transaction.amount))}</span>
                                    </Typography>
                                </td>
                                <td className="py-2 px-3">
                                    <Typography variant="small" className="font-normal">
                                      {transaction.transaction_category || "Umum"}
                                    </Typography>
                                </td>
                                 <td className="py-2 px-3">
                                     <Typography variant="small" className="font-normal">
                                       {transaction?.payment_method === "cash" ? "Tunai" : "Transfer"}
                                    </Typography>
                                    
                                </td>
                                <td className="py-2 px-3">
                                    <Chip
                                        size="sm"
                                        variant="ghost"
                                        className="text-center"
                                        value={
                                            transaction?.status === "completed"
                                            ? "Sukses"
                                            : transaction?.status === "failed"
                                            ? "Gagal"
                                            : "Menunggu"
                                        }
                                        color={
                                        transaction?.status === "completed"
                                            ? "green"
                                            : transaction?.status === "failed"
                                            ? "red"
                                            : "amber"
                                        }
                                    />
                                </td>
                                <td className="py-2 px-3 flex gap-2">
                                    {/* Action buttons can be added here */}
                                    <Tooltip content="Ubah">
                                        <IconButton className="h-8"variant="text">
                                            <PencilIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip content="Lihat detail">
                                        <IconButton className="h-8"variant="text">
                                            <DocumentIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip content="Hapus">
                                        <IconButton className="h-8" variant="text">
                                            <TrashIcon className="h-4 w-4" />
                                        </IconButton>
                                    </Tooltip>
                                </td>
                            </tr>
                        ))
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
    )
}

export default TransactionList;