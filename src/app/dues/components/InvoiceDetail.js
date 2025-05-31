// Details.js
"use client";
import React from "react";
import { useState,useEffect,useCallback } from "react";
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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const TABLE_HEAD = ["Item", "Jumlah"];

function Details({ data, onClose }) {
    console.log("Invoice Data:", data);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(new Date(date), "MMMM yyyy", { locale: id });
    };


    return (
        <>
        <div className="flex w-full shrink-0 gap-2  my-4 justify-end items-end">
            <Button className="flex items-center gap-3" size="sm" onClick={onClose}>
                    Kembali
            </Button>
        </div>
        <Card className="w-full p-2 mb-5">
            <CardHeader floated={false} shadow={false} className="rounded-none">
               
                <div className="mb-4 flex justify-between gap-8 items-start">
                    <div>
                        <Typography variant="h5" color="blue-gray">
                            Invoice untuk:
                        </Typography>
                    
                        <Typography variant="small"  color="blue-gray" className="font-bold">
                            Saudara/i Penghuni: {data?.house_number}
                        </Typography>
                        <Typography variant="small"  color="blue-gray" className="font-bold">
                            lingkungan
                        </Typography>
                        <Typography variant="small"  color="blue-gray" className="font-bold">
                            Email
                        </Typography>
                        <Typography variant="small"  color="blue-gray" className="font-bold">
                            WhatsApp
                        </Typography>

                       
                    </div>
                    <div>
                       
                       
                        <Typography variant="small"  color="blue-gray" className="font-bold">
                            Nomor: {data?.invoice_number}
                        </Typography>
                        <Typography variant="small"  color="blue-gray" className=" font-bold">
                            Tanggal Invoice: {data?.invoice_created_at && (data.format_invoice_created_at = format(new Date(data.invoice_created_at), "dd MMMM yyyy", { locale: id }))}
                        </Typography>
                        <Typography variant="small"  color="blue-gray" className=" font-bold">
                            Jatuh Tempo: {data?.invoice_created_at && (data.format_invoice_created_at = format(new Date(data.invoice_created_at), "dd MMMM yyyy", { locale: id }))}
                        </Typography>
                    </div>
                    
                </div>
            </CardHeader>
        </Card>

        <Card className="w-full">
            <CardHeader floated={false} shadow={false} className="rounded-none">
                <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-4">
                            <Typography variant="h5" color="blue-gray">
                                Invoice
                            </Typography>
                            <Chip
                                size="sm"
                                variant="ghost"
                                value={
                                    data.invoice_status === "paid"
                                        ? "Lunas"
                                        : data.invoice_status === "Not Billable"
                                        ? "Tidak tertagih"
                                        : "Belum bayar"
                                }
                                color={
                                    data.invoice_status === "paid"
                                        ? "green"
                                        : data.invoice_status === "Not Billable"
                                        ? "amber"
                                        : "red"
                                }
                            />
                        </div>
                        
                        <Typography variant="small"  color="blue-gray" className="mt-1 font-bold">
                            Nomor: {data?.invoice_number}
                        </Typography>
                        <Typography variant="small"  color="blue-gray" className=" font-bold">
                            Tanggal Invoice: {data?.invoice_created_at && (data.format_invoice_created_at = format(new Date(data.invoice_created_at), "dd MMMM yyyy", { locale: id }))}
                        </Typography>
                    </div>
                    
                </div>
            </CardHeader>
            <CardBody className="px-4 pt-0 pb-6">
                <table className="w-full min-w-max table-auto text-left">
                    <thead>
                        <tr>
                            {TABLE_HEAD.map((head, index) => (
                                <th
                                    key={head}
                                    className={`border p-3 border-blue-gray-100 bg-blue-gray-50/50 ${
                                        index === 0 ? "text-center w-[80%]" : ""
                                    }`}
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
                        <tr className="color-transition ">
                            <td colSpan={2} className="py-2 px-3 border  border-blue-gray-100 bg-gray-300/50">
                                <Typography variant="small" color="blue-gray" className="font-bold ">
                                   {`Pembayaran iuran ${data.items[0]?.fee_name} ${data?.house_number}`}  
                                </Typography>
                            </td>
                            {/* <td className="py-2 px-3 border border-blue-gray-100 bg-gray-300/50">
                                <Typography variant="small" color="blue-gray" className="font-bold">
                                    {data?.items.length} Tagihan
                                </Typography>
                            </td> */}
                        </tr>
                       {data?.items.map((item, index) => (
                            <tr key={index} className="hover:bg-blue-gray-50/50 color-transition ">
                                <td className="py-2 px-3 w-[80%] border-x border-blue-gray-100">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {item?.due_date && `${formatDate(item?.due_date)}`}
                                    </Typography>
                                    
                                </td>
                                <td className="py-2 px-3 border-x border-blue-gray-100">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    {formatRupiah(parseInt(item?.amount_paid))}
                                </Typography>
                                    
                                </td>
                            </tr>
                        ))}
                        <tr className="h-5 ">
                            <td className="border-x border-blue-gray-100"></td>
                            <td className="border-x border-blue-gray-100"></td>
                        </tr>
                        <tr className="bg-blue-gray-50/50 m">
                            <td className="py-2 px-3 w-[80%] border border-blue-gray-100">
                                <Typography variant="small" color="blue-gray" className="font-bold">
                                      Total
                                </Typography>
                            </td>
                            <td className="py-2 px-3 border border-blue-gray-100">
                                <Typography variant="small" color="blue-gray" className="font-bold">
                                    {formatRupiah(parseInt(data?.invoice_total))}
                                </Typography>
                            </td>
                        </tr>
                        
                    </tbody>
                </table>
                
                <table className="w-full min-w-max table-auto text-left my-10">
                    <thead>
                        <tr>
                            <th
                                className={`border-y p-3 border-blue-gray-100 bg-blue-gray-50/50`}
                            >
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-bold leading-none"
                                >
                                    Tanggal Transaksi
                                </Typography>
                            </th>
                            <th
                                className={`border-y p-3 border-blue-gray-100 bg-blue-gray-50/50`}
                            >
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-bold leading-none"
                                >
                                    Metode Pembayaran
                                </Typography>
                            </th>
                           
                            <th
                                className={`border-y p-3 border-blue-gray-100 bg-blue-gray-50/50`}
                            >
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-bold leading-none"
                                >
                                    ID Transaksi
                                </Typography>
                            </th>
                            <th
                                className={`border-y p-3 border-blue-gray-100 bg-blue-gray-50/50`}
                            >
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-bold leading-none"
                                >
                                   Jumlah
                                </Typography>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="color-transition ">
                            <td className="py-2 px-3 border-b border-blue-gray-100">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    {data?.transaction_date && (data.format_transaction_date = format(new Date(data.transaction_date), "dd MMMM yyyy", { locale: id }))}
                                </Typography>
                            </td>
                            <td className="py-2 px-3 border-b border-blue-gray-100">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    {data?.payment_method}
                                </Typography>
                            </td>
                            <td className="py-2 px-3 border-b border-blue-gray-100">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    {data?.transaction_unique_id}
                                </Typography>
                            </td>
                            <td className="py-2 px-3 border-b border-blue-gray-100">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                    {formatRupiah(parseInt(data?.amount))}
                                </Typography>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </CardBody>
        </Card>
        </>
       
    );
}

export default Details;