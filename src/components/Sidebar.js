//component/Sidebar.js
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { 
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";

import {
    PresentationChartBarIcon,
    Cog6ToothIcon,
    BanknotesIcon,
    Bars4Icon,
    DocumentCurrencyDollarIcon,
    DocumentTextIcon
  } from "@heroicons/react/24/solid";

  import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(0);
  const pathname = usePathname();

  const handleOpen = (value) => {
    setOpen(open  === value ? 0 : value);
  };

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  // Reset open to 0 when sidebar is collapsed
  if (isOpen && open !== 0) {
    setOpen(0);
  }

  // Reset open to 0 when screen is below 'md'
  if (typeof window !== "undefined") {
    if (window.innerWidth < 768 && open !== 0) {
      setOpen(0);
    }
  }

  return (
    <Card className={`
      transition-all duration-500 ease-in-out  min-h-[100vh] rounded-none shadow-none  overflow-hidden
      ${isOpen ? "w-[268px] lg:w-[71px]" : "w-[71px] lg:w-[268px]"}
    `}
    >
     
     <div className={` mb-2 flex justify-between  items-center py-4 px-4 bg-light-blue-200 `}>
          
        <div className={ `flex transition-transform w-full justify-between items-center content-center`}>
          <button
              className=" text-gray rounded-md"
              onClick={toggleSidebar}
            >
            <Bars4Icon className="h-8 w-8" />
          </button>
          <Typography variant="h4" color="blue-gray" 
            className={`
              ml-5
            transition-all duration-500 ease-in-out font-bold`}>
            ENQUE
          </Typography>
        </div>

      </div>

      <List className="transition-all duration-500 ease-in-out !min-w-[60px] !max-w-[236px] !py-1">
        <ListItem className={`${pathname === "/dashboard" ? "bg-blue-gray-50 bg-opacity-80 " : ""}`} >
          <Typography
          as="a"
          href="/dashboard"
          className={`w-full flex font-medium overflow-hidden `}
          >
            <ListItemPrefix className="mr-0" >
              <PresentationChartBarIcon className="h-6 w-6 md:h-7 md:w-7" />
            </ListItemPrefix>
            <span className="ml-4 font-semibold">Dashboard</span>
          </Typography>
        </ListItem>

        <Accordion
          open={open === 1}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 1 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className={`p-0 ${pathname === "/dues" || pathname === "/dues/bills" || pathname === "/dues/payments" || pathname === "/dues/invoices" ? "bg-blue-gray-50 bg-opacity-80 " : ""}`} selected={open === 1}>
            <AccordionHeader onClick={() => handleOpen(1)} className="border-b-0 p-3">
              <ListItemPrefix className="mr-0">
                <BanknotesIcon className="h-6 w-6 md:h-7 md:w-7" />
              </ListItemPrefix>
              <Typography color="blue-gray" className="mr-auto font-semibold ml-5">
                Iuran
              </Typography>
            </AccordionHeader>
          </ListItem>

          <AccordionBody className="py-1">
            <List className="p-0 transition-all duration-500 ease-in-out !min-w-[60px] !max-w-[236px] !py-1">
              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                <Typography
                  as="a"
                  href="/dues"
                className={`font-normal text-blue-gray-700 leading-tight text-start ${pathname === "/dues" ? "text-blue-500 font-semibold" : ""}`}>
                  Pengaturan Iuran
                </Typography>
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                <Typography
                  as="a"
                  href="/dues/bills"
                  className={`font-normal text-blue-gray-700 leading-tight text-start ${pathname === "/dues/bills" ? "text-blue-500 font-semibold" : ""}`}>
                  Tagihan
                </Typography>
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                <Typography 
                  as ="a"
                  href="/dues/payments"
                  className={`font-normal text-blue-gray-700 leading-tight text-start ${pathname === "/dues/payments" ? "text-blue-500 font-semibold" : ""}`}>
                  Pembayaran
                </Typography>
              </ListItem>
              <ListItem className={`${ pathname === "/dues/invoices" ? "bg-blue-gray-50 bg-opacity-80 " : ""}`}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                <Typography 
                  as ="a"
                  href="/dues/invoices"
                  className={`font-normal text-blue-gray-700 leading-tight text-start ${pathname === "/dues/invoices" ? "text-blue-500 font-semibold" : ""}`}>
                  Invoices
                </Typography>
              </ListItem>
            </List>
          </AccordionBody>
        </Accordion>
        
        <ListItem className={`${pathname === "/transactions" ? "bg-blue-gray-50 bg-opacity-80 " : ""}`} >
          <Typography
          as="a"
          href="/transactions"
          className={`w-full flex font-medium overflow-hidden `}
          >
            <ListItemPrefix className="mr-0" >
              <DocumentCurrencyDollarIcon className="h-6 w-6 md:h-7 md:w-7" />
            </ListItemPrefix>
            <span className="ml-4 font-semibold">Aruskas</span>
          </Typography>
        </ListItem>
        
        <ListItem >
          <Typography
          as="a"
          href="/dashboard"
          className={`w-full flex font-medium overflow-hidden `}
          >
            <ListItemPrefix className="mr-0" >
              <DocumentTextIcon className="h-6 w-6 md:h-7 md:w-7" />
            </ListItemPrefix>
            <span className="ml-4 font-semibold">Laporan</span>
          </Typography>
        </ListItem>

        <Accordion
          open={open === 2}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 2}>
            <AccordionHeader onClick={() => handleOpen(2)} className="border-b-0 p-3">
              <ListItemPrefix className="mr-0">
                <Cog6ToothIcon className="h-6 w-6 md:h-7 md:w-7" />
              </ListItemPrefix>
              <Typography color="blue-gray" className="mr-auto font-semibold ml-5">
                Pengaturan
              </Typography>
            </AccordionHeader>
          </ListItem>

          <AccordionBody className="py-1">
            <List className="p-0 transition-all duration-500 ease-in-out !min-w-[60px] !max-w-[236px] !py-1">
              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                <Typography 
                as ="a"
                href="/dues"
                className="font-normal text-blue-gray-700 leading-tight text-start">
                  Pengaturan Umum
                </Typography>
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                <Typography 
                  as ="a"
                  href="/setting/dues"
                  className="font-normal text-blue-gray-700 leading-tight text-start">
                  Iuran
                </Typography>
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                <Typography 
                  as ="a"
                  href="/dues/payments"
                  className="font-normal text-blue-gray-700 leading-tight text-start">
                  Transaksi
                </Typography>
              </ListItem>
              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                <Typography 
                  as ="a"
                  href="/dues/invoices"
                  className="font-normal text-blue-gray-700 leading-tight text-start">
                  Laporan
                </Typography>
              </ListItem>
            </List>
          </AccordionBody>
        </Accordion>

          <hr className="my-2 border-blue-gray-50" />
        
        {/* <hr className="my-2 border-blue-gray-50" />
        <ListItem>
          <ListItemPrefix>
            <InboxIcon className="h-5 w-5" />
          </ListItemPrefix>
          Inbox
          <ListItemSuffix>
            <Chip value="14" size="sm" variant="ghost" color="blue-gray" className="rounded-full" />
          </ListItemSuffix>
        </ListItem>
        <ListItem>
          <ListItemPrefix>
            <UserCircleIcon className="h-5 w-5" />
          </ListItemPrefix>
          Profile
        </ListItem>
        <ListItem>
          <ListItemPrefix>
            <Cog6ToothIcon className="h-5 w-5" />
          </ListItemPrefix>
          Settings
        </ListItem>
        <ListItem>
          <ListItemPrefix>
            <PowerIcon className="h-5 w-5" />
          </ListItemPrefix>
          Log Out
        </ListItem> */}
      </List> 
      
    </Card>
  );
}
