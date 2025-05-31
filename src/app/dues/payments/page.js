// pages/dashboard.js
"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../../utils/redirect';
import Sidebar from "../../../components/Sidebar";
import { TopNavbar } from "../../../components/Navbar";
import { PaymentList } from "../components/PaymentList";
import PaymentForm from "../components/PaymentForm";
import TenantLoader from "@/components/TenantLoader";

import { XCircleIcon,DocumentPlusIcon } from "@heroicons/react/24/solid";
import {
  Card,
  CardHeader,
  Typography,
  Button,
} from "@material-tailwind/react";

export default function Payment() {
  const router = useRouter();
  useEffect(() => {
    redirectBasedOnAuth(router, ['admin_tenant'])
  }, [router]);

  const [openForm, setOpenForm] = useState(false);
  const [editData, setEditData] = useState(null);
  // const handleForm = () => setOpenForm(true);
  // const closeForm = () => setOpenForm(false);
  // const toggleForm = () => setOpenForm(prev => !prev);


  const toggleForm = () => {
    setEditData(null); // reset kalau klik "Buat Baru"
    setOpenForm(!openForm);
  };

  return (
    <TenantLoader>
      <section className="grid  h-full ">
        <div className="w-full m-auto flex">
          <Sidebar/>
          <main className="transition-transform duration-500 ease-in-out flex  bg-gray-100 flex-col w-full justify-start">
            <TopNavbar/>
            <div className="p-4 h-full">
              <Typography variant="h4" className="mb-5">Pembayaran Iuran</Typography>

              <Card className=" w-full mb-8">
                <CardHeader floated={false} shadow={false} className="rounded-none ">
                  <div className="mb-4  flex flex-col justify-between gap-8 md:flex-row items-start">
                    <div>
                      <Typography variant="h5" color="blue-gray">
                        {!openForm ? 'Riwayat Pembayaran' :'Form Pembayaran Tagihan'}
                      </Typography>
                      <Typography color="gray" className="mt-1 font-normal">
                        {!openForm ?'Rekap transaksi tagihan terbaru.' :'Gunakan form ini untuk melakukan pembayaran tagihan sesuai dengan ketentuan yang berlaku.'}
                      </Typography>
                    </div>
                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row">

                      <Button onClick={toggleForm} variant="gradient" className="flex items-center gap-3" size="sm">
                        {openForm ?
                        <XCircleIcon strokeWidth={2} className="h-4 w-4" />
                        :
                        <DocumentPlusIcon strokeWidth={2} className="h-4 w-4" /> 
                        }
                        {openForm ? "Batal" : "Tambah Transaksi"}
                      </Button>

                      
                    </div>
                  </div>
                </CardHeader>
                
                {!openForm && (
                  <PaymentList 
                   onEdit={(data) => {
                     setEditData(data);
                     setOpenForm(true);
                   }}
                 />
                 
                )}
                {openForm && (
                  <PaymentForm 
                    data={editData}
                    onCancel={() => {
                      setEditData(null);
                      setOpenForm(false);
                    }}
                  />
                
                )}
                
              </Card>
                  
            
                  
            
            </div>
          </main>
        </div>
      </section>
    </TenantLoader>
    
  );
}
