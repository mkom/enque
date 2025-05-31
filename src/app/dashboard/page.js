// pages/dashboard.js
"use client";
import Cookies from "js-cookie";
import jwt from 'jsonwebtoken';
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../utils/redirect';
import Sidebar from "../../components/Sidebar";
import { TopNavbar } from "../../components/Navbar";
import { fetchTenantDetails } from "@/utils/fetchTenant";
import WelcomeCard from "@/components/WelcomeCard";
import { Spinner } from "@material-tailwind/react";
// import { pool } from '@/lib/db';
// import genarateBills from "@/lib/generateBills";

export default  function Dashboard() {
  const router = useRouter();
  useEffect(() => {
    const pathname = window.location.pathname;
    redirectBasedOnAuth(router, pathname, ['admin_tenant']);
  }, [router]);

  useEffect(() => {
    const today = new Date();
    const key = `bill-run-${today.getFullYear()}-${today.getMonth()}`;
    const token = Cookies.get("token.app_oq");
  
    if (!localStorage.getItem(key)) {
      fetch('/api/fee/bills/genarate', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Network response was not ok');
          }
          return res.text();
        })
        .then(msg => {
          //console.log(msg);
          localStorage.setItem(key, 'done');
        })
        .catch(console.error);
    }
  }, []);
  

  const [totalUnits, setTotalUnits] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const getTenantData = async () => {
      try {
        const tenantData = await fetchTenantDetails();
        setTotalUnits(tenantData.total_units || 0 );
        setTotalFees(tenantData.total_fees || 0 );
      } catch (error) {
        console.error('Failed to load tenant data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getTenantData();
  }, []);

  if (isLoading) {
    return (
      <section className="grid  h-screen ">
        <div className="w-full m-auto flex">
          <Sidebar/>
          <main className="transition-transform duration-500 ease-in-out flex h-screen bg-gray-100 flex-col w-full justify-start">
            <TopNavbar/>
            <div className="flex items-center justify-center h-screen">
              <Spinner className="h-10 w-10" color="purple"/>
            </div>
          </main>
        </div>
      </section>
    ) 
  }


  // if (totalUnits === 0 && totalFees === 0) {
  //   return (
  //     <section className="grid  h-screen ">
  //       <div className="w-full m-auto flex">
  //         {/* <TopNavbar/> */}
  //         <Sidebar/>
  //         <main className="transition-transform flex h-screen bg-gray-100 flex-col w-full justify-start">
  //           <TopNavbar/>
  //           <div className="p-4 h-full">
             
  //           </div>
  //         </main>
  //       </div>
  //     </section>
      
  //   );
  // }

  return (
    <section className="grid  h-screen ">
      <div className="w-full m-auto flex">
        {/* <TopNavbar/> */}
        <Sidebar/>
        <main className="transition-transform flex h-screen bg-gray-100 flex-col w-full justify-start">
          <TopNavbar/>
          <div className="p-4 h-full">

            {totalUnits === 0 && totalFees === 0 ? (
              <WelcomeCard />
            ):(
              <></>
            )} 
          
          </div>
        </main>
      </div>
    </section>
  );
}
