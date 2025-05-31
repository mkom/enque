// pages/dashboard.js
"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../../utils/redirect';
import Sidebar from "../../../components/Sidebar";
import { TopNavbar } from "../../../components/Navbar";
import TenantLoader from "@/components/TenantLoader";
import { FeeList } from "../components/Bills";

import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

import {
  Typography
  
} from "@material-tailwind/react";


export default function Fee() {
  const router = useRouter();
  useEffect(() => {
    redirectBasedOnAuth(router, ['Superadmin','Tenant'])
  }, [router]);


  return (
    <TenantLoader>
      <section className="grid  h-full ">
        <div className="w-full m-auto flex">
          <Sidebar/>
          <main className="transition-transform duration-500 ease-in-out flex  bg-gray-100 flex-col w-full justify-start">
            <TopNavbar/>
            <div className="p-4 h-full">
              <Typography variant="h4" className="mb-5">Daftar Tagihan</Typography>
              <FeeList/>
            </div>
          </main>
        </div>
      </section>
    </TenantLoader>
    
  );
}
