// pages/dashboard.js
"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../utils/redirect';
import Sidebar from "../../components/Sidebar";
import { TopNavbar } from "../../components/Navbar";
import { Select, Option,Card, Typography } from "@material-tailwind/react";

export default function Dashboard() {
  const router = useRouter();
  useEffect(() => {
    redirectBasedOnAuth(router, ['Superadmin','Tenant'])
  }, [router]);

  return (
    <section className="grid  h-screen ">
      <div className="w-full m-auto flex">
        {/* <TopNavbar/> */}
        <Sidebar/>
        <main className="transition-transform flex h-screen bg-gray-100 flex-col w-full justify-start">
          <TopNavbar/>
          <div className="p-4 h-full">
           <Card className=" gap-5 max-w-3xl rounded-sm shadow-sm p-5 flex-row">
              <div className="w-72">
                <Select 
                label="Pilih Iuran"
                size="md"
                variant="outlined">
                  <Option>Iuran 1</Option>
                  <Option>Iuran 2</Option>
                </Select>
              </div>
              <div className="w-72">
              <Select 
                label="Pilih Tahun"
                size="md"
                variant="outlined">
                  <Option>2024</Option>
                  <Option>2025</Option>
                </Select>
              </div>
              <div className="w-72">
                <Select 
                label="Pilih Bulan"
                size="md"
                variant="outlined">
                  <Option>Semua</Option>
                  <Option>Januari</Option>
                  <Option>Februari</Option>
                </Select>
              </div>
           </Card>
           <div className="mt-7  flex flex-row gap-5 justify-between">
              <Card className="px-5 py-7 w-1/4 rounded-sm shadow-sm ">
              <Typography variant="h6" color="blue">Total</Typography>
              </Card>
              <Card className="px-5 py-7 w-1/4 rounded-sm shadow-sm ">
              <Typography variant="h6" color="green">Lunas</Typography>
              </Card>
              <Card className="px-5 py-7 w-1/4 rounded-sm shadow-sm ">
              <Typography variant="h6" color="red">Belum Bayar</Typography>
              </Card>
              <Card className="px-5 py-7 w-1/4 rounded-sm shadow-sm ">
              <Typography variant="h6" color="orange">Bayar Sebagian</Typography>
              </Card>
           </div>
          </div>
        </main>
      </div>
    </section>
  );
}
