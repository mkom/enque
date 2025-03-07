// pages/dashboard.js
"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../../utils/redirect';
import Sidebar from "../../../components/Sidebar";
import { TopNavbar } from "../../../components/Navbar";
import { PaymentList } from "./components/PaymentList";
import PaymentForm from "./components/PaymentForm";
import TenantLoader from "@/components/TenantLoader";

import { PencilIcon } from "@heroicons/react/24/solid";
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardHeader,
  Typography,
  Button,
} from "@material-tailwind/react";

export default function Payment() {
  const router = useRouter();
  useEffect(() => {
    redirectBasedOnAuth(router, ['Superadmin','Tenant'])
  }, [router]);

  const [openForm, setOpenForm] = useState(false);
  const handleForm = () => setOpenForm(true);
  const closeForm = () => setOpenForm(false);
  const toggleForm = () => setOpenForm(prev => !prev);

  return (
    <TenantLoader>
      <section className="grid  h-screen ">
        <div className="w-full m-auto flex">
          {/* <TopNavbar/> */}
          <Sidebar/>
          <main className="transition-transform flex h-screen bg-gray-100 flex-col w-full justify-start">
            <TopNavbar/>
            <div className="p-4 h-full">
              <Typography variant="h4" className="mb-5">Pembayaran Iuran</Typography>

              <Card className=" w-full">
                <CardHeader floated={false} shadow={false} className="rounded-none ">
                  <div className="mb-4 p-4  flex flex-col justify-between gap-8 md:flex-row md:items-center">
                    <div>
                      <Typography variant="h5" color="blue-gray">
                        {!openForm ? 'Riwayat Pembayaran' :'Formulir Pembayaran Iuran'}
                      </Typography>
                      <Typography color="gray" className="mt-1 font-normal">
                        {!openForm ?'Rekap transaksi iuran terbaru.' :'Gunakan formulir ini untuk melakukan pembayaran iuran sesuai dengan ketentuan yang berlaku.'}
                      </Typography>
                    </div>
                    <div className="flex w-full shrink-0 gap-2 md:w-max">

                        {/* {!openForm && (
                          <div className="w-full md:w-72">
                          <Input
                            label="Search"
                            icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                          />
                          </div>
                        )} */}

                          <Button onClick={toggleForm} className="flex items-center gap-3" size="sm">
                            <ArrowDownTrayIcon strokeWidth={2} className="h-4 w-4" /> {openForm ? "Batal" : "Buat Baru"}
                          </Button>

                      
                    </div>
                  </div>
                </CardHeader>
                
                {!openForm && (
                    <PaymentList/>
                  )}
                  {openForm && (
                    <PaymentForm onCancel={() => setOpenForm(false)}/>
                  )}
                
              </Card>
                  
            
                  
            
            </div>
          </main>
        </div>
      </section>
    </TenantLoader>
    
  );
}
