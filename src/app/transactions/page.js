// pages/dashboard.js
"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirectBasedOnAuth } from '../../utils/redirect';
import Sidebar from "../../components/Sidebar";
import { TopNavbar } from "../../components/Navbar";
import TenantLoader from "@/components/TenantLoader";
import TransactionList from "./components/TransactionList";
import { XCircleIcon, DocumentPlusIcon } from "@heroicons/react/24/solid";
import TransactionForm from "./components/TransactionForm";
import TransactionCategories from "./components/TransactionCategories";
import {
  Card,
  CardHeader,
  Typography,
  Button,
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  IconButton,
} from "@material-tailwind/react";

export default function Transition() {
  const router = useRouter();

  useEffect(() => {
      const pathname = window.location.pathname;
      redirectBasedOnAuth(router, pathname, ['admin_tenant']);
  }, [router]);

  const [openForm, setOpenForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  
  const toggleDrawer = () => {
    setOpenDrawer(!openDrawer);
  };

  const toggleForm = () => {
    setEditData(null);
    setOpenForm(!openForm);
  };

  return (
    <TenantLoader>
      <section className="grid  h-full ">
      <div className="w-full m-auto flex">
        {/* <TopNavbar/> */}
        <Sidebar/>
        <main className="transition-transform flex  bg-gray-100 flex-col w-full justify-start">
          <TopNavbar/>
          <div className="p-4 h-full">
            <Typography variant="h4" className="mb-5">Arus Kas</Typography>

            <Card className="w-full mb-8">
                <CardHeader floated={false} shadow={false} className="rounded-none ">
                  <div className="mb-4  flex flex-col justify-between gap-8 md:flex-row items-start">
                    <div>
                      <Typography variant="h5" color="blue-gray">
                        {!openForm ? 'Transaksi' :'Form Transaksi'}
                      </Typography>
                      <Typography color="gray" className="mt-1 font-normal">
                        {!openForm ?'Semua Transaksi' :'Gunakan form ini untuk mencatat transaksi arus kas.'}
                      </Typography>
                    </div>
                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row">

                    { !openForm && (
                      <Button onClick={toggleDrawer}  variant="gradient" className="flex items-center gap-3" size="sm">
                       <DocumentPlusIcon strokeWidth={2} className="h-4 w-4" />
                        Tambah Kategori
                      </Button>
                    )}
                      

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
                  <TransactionList 
                    onEdit={(data) => {
                      setEditData(data);
                      setOpenForm(true);
                    }}
                  />
                  
                )}
                {openForm && (
                  <TransactionForm 
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

     <Drawer
        open={openDrawer}
        onClose={toggleDrawer}
        className="w-full p-4"
        placement="right"
        size="450px"
      >
        <div className="flex items-center justify-between mb-4">
          <Typography variant="h5" color="blue-gray">
            Kategori Transaksi
          </Typography>
          <IconButton variant="text" color="blue-gray" onClick={toggleDrawer}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </IconButton>
        </div>

        <TransactionCategories resetForm={openDrawer} />
      </Drawer>
    </TenantLoader>
  );
}
