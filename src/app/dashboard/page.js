// pages/dashboard.js
"use client";
import Cookies from "js-cookie";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../utils/redirect';
import Sidebar from "../../components/Sidebar";
import { TopNavbar } from "../../components/Navbar";
import { fetchTenantDetails } from "@/utils/fetchTenant";
import WelcomeCard from "@/components/WelcomeCard";
import { Spinner } from "@material-tailwind/react";

export default function Dashboard() {
  const router = useRouter();
  useEffect(() => {
    redirectBasedOnAuth(router)
  }, [router]);

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
          <main className="transition-transform flex h-screen bg-gray-100 flex-col w-full justify-start">
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
