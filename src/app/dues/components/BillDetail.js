// Details.js
"use client";
import Cookies from "js-cookie";
import React from "react";
import { useState,useEffect,useCallback } from "react";
import {
    Card,
    CardHeader,
    Typography,
    Button,
    CardBody,
    CardFooter,
    Drawer,
    IconButton
} from "@material-tailwind/react";
import {
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { Spinner } from "@material-tailwind/react";
import {EnvelopeIcon,XMarkIcon } from "@heroicons/react/24/solid";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatRupiah } from "@/utils/formatRupiah";
import LetterPreview from "./LetterPreview";


const TABLE_HEAD = ["No", "Periode", "Jumlah"];

function Details({ data, onClose }) {
    //console.log('data', data);
    const [unitId, setUnitId] = useState(data?.unitId);
    const [feeId, setFeeId] = useState(data?.feeId);
    const [tenantId, setTenantId] = useState(0);
    const [detailData, setDetailData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const toggleDrawer = () => setOpen(!open);
    const [dataLetter, setDataLetter] = useState(null)

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(new Date(date), "MMMM yyyy", { locale: id });
    };


    const getListData =  useCallback( async () => {
        const url = `/api/fee/bills/${unitId}/${feeId}`;
        const token = Cookies.get("token.app_oq");
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

            setDetailData(rawData || []);
            
            } catch (error) {
                //console.error('Error fetching:', error.message);
                throw error;
            } finally {
                //setSkeletonShow(false); 
            }

    },[tenantId]);

    useEffect(() => {
        getListData();
    }, [getListData]);

    const handleDownload = async () => {
        setIsLoading(true);
        const token = Cookies.get("token.app_oq");
        const url = `/api/fee/bills/print/?unitId=${unitId}&feeId=${feeId}`;
      
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
      
          if (response.ok) {
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
      
            // Buat tag <a> dan set atribut untuk download
            const a = document.createElement('a');
            a.href = objectUrl;
            const now = new Date();
            const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
            a.download = `Tagihan-${detailData[0].house_number}-${formattedDate}.pdf`;
            document.body.appendChild(a);
            a.click();
      
            // Bersihkan setelah selesai
            a.remove();
            URL.revokeObjectURL(objectUrl);
          } else {
            console.error('Failed to fetch:', response.statusText);
          }
        } catch (error) {
          console.error('Error during download:', error);
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleOpenDrawer = async () => {
        try {
            setDataLetter(detailData)
            setOpen(true)
        } catch (error) {
            console.error('Gagal ambil data:', error)
        }
    }
      
      

    return (
        <>
         <Card className="w-full mb-5">
            <CardHeader floated={false} shadow={false} className="rounded-none">
                <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <Typography variant="h5" color="blue-gray">
                                Detail Tagihan
                            </Typography>
                        </div>
                        <Typography variant="small" color="blue-gray" className="mt-1 font-bold">
                            No Unit: {detailData[0]?.house_number}
                        </Typography>
                        <Typography variant="small" color="blue-gray" className=" font-bold">
                            Nama: {detailData[0]?.unit_name}
                        </Typography>
                        <Typography variant="small" color="blue-gray" className=" font-bold">
                            Jenis Iuran: {detailData[0]?.fee_name}
                        </Typography>
                    </div>
                    <div className="flex w-full shrink-0 gap-2 md:w-max">
                        <Button className="flex items-center gap-3" size="sm" onClick={onClose}>
                            Kembali
                        </Button>
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
                                    className={`border p-3 border-blue-gray-100 bg-blue-gray-50/50`}
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
                        {detailData[0]?.items.map((item, index) => (
                            <tr key={index} className="hover:bg-blue-gray-50/50 color-transition">
                                 <td className="py-2 px-3 border-x border-blue-gray-100 w-4">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {index +1}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3 border-x border-blue-gray-100 w-[80%]">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {item?.due_date && `${formatDate(item?.due_date)}`}
                                    </Typography>
                                </td>
                                <td className="py-2 px-3 border-x border-blue-gray-100">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        {formatRupiah(parseInt(item?.amount_due - item?.amount_paid))}
                                    </Typography>
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-blue-gray-50/50">
                            <td colSpan={2} className="py-2 px-3 border border-blue-gray-100 text-center">
                                <Typography variant="small" color="blue-gray" className="font-bold">
                                    Total
                                </Typography>
                            </td>
                            <td className="py-2 px-3 border border-blue-gray-100">
                                <Typography variant="small" color="blue-gray" className="font-bold">
                                    {formatRupiah(
                                        detailData[0]?.items.reduce(
                                            (total, item) =>
                                                total + (item?.amount_due - item?.amount_paid),
                                            0
                                        )
                                    )}
                                </Typography>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </CardBody>
            <CardFooter className="pt-2">
                    <div className="flex w-full items-end justify-end shrink-0 gap-2">
                        <Button className="flex items-center gap-3" size="sm" onClick={handleOpenDrawer}>
                            <EnvelopeIcon strokeWidth={2} className="h-4 w-4" /> Buat Surat
                        </Button>
                        <Button className="flex items-center gap-3" size="sm" onClick={handleDownload} disabled={isLoading}>
                        {isLoading ? (
                            <Spinner className="h-4 w-4"/>
                        ) : (
                            <ArrowDownTrayIcon strokeWidth={2} className="h-4 w-4" />
                        )}
                        {isLoading ? 'Mengunduh...' : 'Download'}
                        </Button>
                    </div>
            </CardFooter>
        </Card>
        <Drawer open={open} onClose={toggleDrawer} placement="right" size="100%" className="z-[9999] overflow-auto">
            <div className="flex items-center justify-between p-2 border-b fixed w-full z-50 bg-white">
                <Typography variant="h6">Preview Surat Tagihan</Typography>
                <IconButton variant="text" onClick={toggleDrawer}>
                    <XMarkIcon className="h-5 w-5" />
                </IconButton>
            </div>

            <div className="p-4 pt-16 overflow-auto max-h-screen">
            {dataLetter ? <LetterPreview data={dataLetter} /> : <p>Memuat...</p>}
            </div>
        </Drawer>
        </>
    );
}

export default Details;