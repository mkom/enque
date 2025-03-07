import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { TopNavbar } from "./Navbar";
import { Spinner } from "@material-tailwind/react";
import { fetchTenantDetails } from "@/utils/fetchTenant";

const TenantLoader = ({ children }) => {
  const [tenantId, setTenantId] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getTenantData = async () => {
      try {
        const tenantData = await fetchTenantDetails();
        setTenantId(tenantData.tenant_id || '0');
      } catch (error) {
        console.error("Failed to load tenant data:", error);
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

//   if (totalUnits === 0 && totalFees === 0) {
//     return (
//       <section className="grid h-screen">
//         <div className="w-full m-auto flex">
//           <Sidebar />
//           <main className="transition-transform flex h-screen bg-gray-100 flex-col w-full justify-start">
//             <TopNavbar />
//             <div className="p-4 h-full">
//               <WelcomeCard />
//             </div>
//           </main>
//         </div>
//       </section>
//     );
//   }

  return <>{children}</>;
};

export default TenantLoader;
