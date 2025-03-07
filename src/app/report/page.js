// pages/dashboard.js
"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../utils/redirect';
import Sidebar from "../../components/Sidebar";
import { TopNavbar } from "../../components/Navbar";

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
           
          </div>
        </main>
      </div>
    </section>
  );
}
