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
} from "@material-tailwind/react";
import {
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { Spinner } from "@material-tailwind/react";
import {EnvelopeIcon } from "@heroicons/react/24/solid";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatRupiah } from "@/utils/formatRupiah";

function LetterPreview({ data}){
    if (!data || !data[0]) return null;
    console.log(data);
    const unit = data[0]
    const total = unit.items.reduce(
      (sum, item) => sum + (item.amount_due - item.amount_paid),
      0
    )
  
    const formatRupiah = (angka) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(angka)

    const today = new Date().toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    
    return (
        <div className="p-6 mb-10 bg-white text-black max-w-screen-lg mx-auto text-sm">
            <header className="border-b-4 pb-4 mb-8 flex items-center justify-between gap-12">
                <div className=" w-[130px]">
                    <img src="/images/rt005.png" className="w-full h-auto"/>
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold uppercase">Rukun Tetangga 005 Rukun Warga 011</h1>
                    <h2 className="text-2xl font-extrabold uppercase mb-3">Villa Citayam</h2>
                    <p className="text-base">Kelurahan Susukan, Kecamatan Bojonggede, Kabupaten Bogor, Kode Pos 16929</p>
                </div>
            </header>
            <div className="flex items-start justify-between mb-10">
                <div>
                <p className="text-base">Nomor: {unit.house_number}/TAGIHAN/{new Date().getFullYear()}</p>
                <p className="text-base">Hal: Surat teguran dan penagihan Iuran warga</p>
                </div>
                <div>
                <p className="text-base">{today}</p>
                </div>
            </div>
           
           
            <p className="mb-2 text-base font-semibold ">Kepada Yth,</p>
            <p className="mb-4 text-base font-semibold">
                {unit.unit_name}/{unit.house_number}<br />
                Di Tempat
            </p>

            <p className="text-base">Dengan hormat,</p>
            <p className="mb-6 text-base">
            Melalui surat ini, kami bermaksud memberitahukan Bapak/Ibu mengenai kewajiban pembayaran iuran <strong> {unit.fee_name}</strong>. Dalam catatan kami untuk periode yang sampai saat ini belum dilunasi sebagai berikut.
            </p>
            <table className="w-full border border-gray-400 text-sm mb-6">
                <thead>
                <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left w-4">No</th>
                    <th className="border px-2 py-1 text-left w-[80%]">Periode</th>
                    <th className="border px-2 py-1 text-right">Jumlah</th>
                </tr>
                </thead>
                <tbody>
                {unit.items.map((item, i) => (
                    <tr key={i}>
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1">{item.due_date_formatted}</td>
                    <td className="border px-2 py-1 text-right">
                        {formatRupiah(item.amount_due - item.amount_paid)}
                    </td>
                    </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                    <td className="border px-2 py-1 text-right" colSpan={2}>
                    Total Tagihan
                    </td>
                    <td className="border px-2 py-1 text-right">{formatRupiah(total)}</td>
                </tr>
                </tbody>
            </table>
            <div>
                
                <p className="mb-2 text-base">Pembayaran dapat dilakukan melalui:</p>
                <p className="mb-4 text-base">
               <strong> Transfer bank ke rekening:</strong><br />
                Bank: [Nama Bank]<br />
                No. Rekening: [Nomor Rekening]<br />
                Atas Nama: [Nama Pemilik Rekening]<br /><br />
                <strong>Pembayaran tunai kepada:</strong><br />
                Nama: [Nama Petugas]<br />
                Jabatan: [Bendahara/Petugas Penagihan]<br />
                Kontak: [Nomor Telepon]<br />
                </p>
               
                <p className="mb-4 text-base">
                Mohon untuk dapat melakukan pembayaran sebelum tanggal 15 bulan berjalan. Konfirmasi pembayaran dengan mengirimkan bukti transfer ke nomor WhatsApp [nomor WhatsApp] atau email [alamat email].
                </p>
                <p className="mb-4 text-base">
                    Apabila Bapak/Ibu telah melakukan pembayaran sebelum surat ini diterima, harap abaikan pemberitahuan ini dan kami ucapkan terima kasih atas kerja sama yang baik.
                </p>
                <p className="mb-2 text-base">Kami mengingatkan Bapak/Ibu bahwa iuran itu sangat penting untuk menjaga lingkungan, kebersihan, sampah, penerangan dan keamanan
                    membutuhkan dana yang tidak sedikit. Karena itu partisipasi warga sangant diperlukan.
                </p>
                <p className="mb-4 text-base">
                Demikian pemberitahuan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami mengucapkan terima kasih.
                </p>
            </div>
            <div className="my-24 flex items-center justify-between">
                <div>
                    <p className="mb-10 text-base font-semibold">Bendahara</p>
                    <p className=" text-base">Muhammad Komar</p>
                </div>
                <div>
                    <p className="mb-10 text-base font-semibold">Ketua RT</p>
                    <p className=" text-base">Donald Arianto</p>
                </div>

            </div>
        </div>
    )
}
export default LetterPreview;