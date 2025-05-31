// pages/dashboard.js
"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../utils/redirect';
import Sidebar from "../../components/Sidebar";
import { TopNavbar } from "../../components/Navbar";
import {Typography } from "@material-tailwind/react";
import TenantLoader from "../../components/TenantLoader";
import IuranSetup from "./components/IuranSetup";

export default function Dashboard() {
  const router = useRouter();
  useEffect(() => {
        const pathname = window.location.pathname;
        redirectBasedOnAuth(router, pathname, ['admin_tenant']);
  }, [router]);

  return (
    <TenantLoader>
      <section className="grid  h-full ">
        <div className="w-full m-auto flex">
          {/* <TopNavbar/> */}
          <Sidebar/>
          <main className="transition-transform flex bg-gray-100 flex-col w-full justify-start">
            <TopNavbar/>
            <div className="p-4 h-full">
            <Typography variant="h4" className="mb-5">Pengaturan Iuran</Typography>
            <IuranSetup/>
            </div>
          </main>
        </div>
      </section>
    </TenantLoader>
  );
}
