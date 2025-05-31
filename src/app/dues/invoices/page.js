// pages/dashboard.js
"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../../utils/redirect';
import Sidebar from "../../../components/Sidebar";
import { TopNavbar } from "../../../components/Navbar";
import TenantLoader from "@/components/TenantLoader";
import { InvoiceList } from "../components/InvoiceList";

import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

import {
  Card,
  CardHeader,
  Input,
  Typography,
  Button,
  
} from "@material-tailwind/react";


export default function Invoices() {
  const router = useRouter();
  useEffect(() => {
    redirectBasedOnAuth(router, ['admin_tenant'])
  }, [router]);


  return (
    <TenantLoader>
      <section className="grid  h-full ">
        <div className="w-full m-auto flex">
          <Sidebar/> 
          <main className="transition-transform duration-500 ease-in-out flex  bg-gray-100 flex-col w-full justify-start">
            <TopNavbar/>
            <div className="p-4 h-full">
              <Typography variant="h4" className="mb-5">Daftar Invoices</Typography>
              <InvoiceList/>
            </div>
          </main>
        </div>
      </section>
    </TenantLoader>
    
  );
}
