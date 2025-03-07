"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { 
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";

import {
    PresentationChartBarIcon,
    ShoppingBagIcon,
    UserCircleIcon,
    Cog6ToothIcon,
    InboxIcon,
    PowerIcon,
    BanknotesIcon,
    Bars4Icon,
    NewspaperIcon,
    HomeIcon
  } from "@heroicons/react/24/solid";

  import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [open, setOpen] = useState(0);
  const pathname = usePathname();

  const handleOpen = (value) => {
    setOpen(open  === value ? 0 : value);
  };

  return (
    <Card className={`${
      isOpen ? " w-full" : " w-16" 
    } transition-transform min-h-[100vh]   max-w-[236px]  shadow-xl shadow-blue-gray-900/5`}>
     
     <div className={` mb-2 pl-5 pr-5 py-4 bg-light-blue-200 `}>
          
        <div className={`${
          isOpen ? "translate-x-0" : "-translate-x-20 ml-1" 
          } flex transition-transform justify-between items-center content-center`}>
          
          <Typography variant="h4" color="blue-gray" 
            className={`${
            isOpen ? "translate-x-0" : "-translate-x-20 " 
            } transition-transform font-bold`}>
            OQOE
          </Typography>
        
          <button
              className=" text-gray rounded-md"
              onClick={() => setIsOpen(!isOpen)}
            >
            <Bars4Icon className="h-8 w-8" />
          </button>
        </div>

      </div>
        

      <List className={`transition-transform   max-w-[236px]`}>

       

        <ListItem className={`${
          isOpen ? "w-full" : " w-11 overflow-hidden " 
          } ${pathname === "/dashboard" ? "bg-blue-gray-50 bg-opacity-80 text-blue-gray-900 outline-none": ""} p-0 transition-transform`}>

            <Typography
              as="a"
              href="/dashboard"
              className="w-full flex p-3"
            >

            <ListItemPrefix>
              <PresentationChartBarIcon className="h-5 w-5" />
            </ListItemPrefix>

            <span className={`${
              isOpen ? "flex opacity-1 font-medium" : "hidden opacity-0" 
              } transition-transform` }>
                  Dashboard
            </span>
              
            </Typography>
        
                 
            
        </ListItem>

       
        <Accordion
          open={open === 1}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
            />
          }
          className={`${
            isOpen ? "w-full" : " w-11 overflow-hidden rounded" 
            } ${pathname === "/dues" ? "": ""} p-0 transition-transform`}
        >
          <ListItem className="p-0" selected={open === 1}>
            <AccordionHeader onClick={() => handleOpen(1)} className={`${pathname === "/dues"  ? "bg-blue-gray-50 bg-opacity-80 rounded-lg text-blue-gray-900 outline-none": ""} border-b-0 p-3`} >
              <ListItemPrefix>
                <BanknotesIcon className="h-5 w-5" />
              </ListItemPrefix>
              <Typography  color="blue-gray" className="mr-auto font-normal">
                Iuran
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0">
              <Typography
                as="a"
                href="/dues"
                className="w-full flex font-medium"
              >

              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Iuran
              </ListItem>

              </Typography>

              <Typography
                as="a"
                href="/dues/invoice"
                className="w-full flex font-medium"
              >

              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Tagihan
              </ListItem>

              </Typography>

              <Typography
                as="a"
                href="/dues/payment"
                className="w-full flex font-medium"
              >

              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Pembayaran
              </ListItem>

              </Typography>
              
              
            </List>
          </AccordionBody>

        </Accordion>

        {/* <ListItem  className={`${
            isOpen ? "w-full" : " w-11 overflow-hidden " 
            } ${pathname === "/contribution" ? "bg-blue-gray-50 bg-opacity-80 text-blue-gray-900 outline-none": ""} p-0 transition-transform`}>
            
            <Typography
                as="a"
                href="/contribution"
                className="w-full flex p-3"
              >
            <ListItemPrefix >
              <BanknotesIcon className="h-5 w-5" />
            </ListItemPrefix>
            <span className={`${
              isOpen ? "flex opacity-1 font-medium" : "hidden opacity-0" 
              } transition-transform` }>
                Iuran
            </span>
            </Typography>
        </ListItem>
        */}
       
        {/* <ListItem  className={`${
          isOpen ? "w-full" : " w-11 overflow-hidden " 
          } ${pathname === "/houses" ? "bg-blue-gray-50 bg-opacity-80 text-blue-gray-900 outline-none": ""} p-0 transition-transform`}>
          
          <Typography
              as="a"
              href="/houses"
              className="w-full flex p-3"
            >
              <ListItemPrefix>
                <HomeIcon className="h-5 w-5" />
              </ListItemPrefix>
              <span className={`${
               isOpen ? "flex opacity-1 font-medium" : "hidden opacity-0" 
              } transition-transform` }>
                Rumah
              </span>

          </Typography>
        </ListItem> */}

        <ListItem  className={`${
          isOpen ? "w-full" : " w-11 overflow-hidden " 
          } ${pathname === "/report" ? "bg-blue-gray-50 bg-opacity-80 text-blue-gray-900 outline-none": ""} p-0 transition-transform`}>
          
          <Typography
              as="a"
              href="/report"
              className="w-full flex p-3"
            >
              <ListItemPrefix>
                <NewspaperIcon className="h-5 w-5" />
              </ListItemPrefix>
              <span className={`${
               isOpen ? "flex opacity-1 font-medium" : "hidden opacity-0" 
              } transition-transform` }>
                Laporan
              </span>

          </Typography>
        </ListItem>

        

        <ListItem  className={`${
          isOpen ? "w-full" : " w-11 overflow-hidden " 
          } transition-transform`}>
          <ListItemPrefix>
            <ShoppingBagIcon className="h-5 w-5" />
          </ListItemPrefix>
          <span className={`${
           isOpen ? "flex opacity-1 font-medium" : "hidden opacity-0" 
          } transition-transform` }>Catatan Keuangan</span>
        </ListItem>


        <Accordion
          open={open === 4}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
            />
          }
          className={`${
            isOpen ? "w-full" : " w-11 overflow-hidden rounded" 
            } ${pathname === "/setting" || pathname === "/setting/genaral" || pathname === "/setting/dues" ? "": ""} p-0 transition-transform`}
        >
          <ListItem className="p-0" selected={open === 4}>
            <AccordionHeader onClick={() => handleOpen(4)} className={`${pathname === "/setting" || pathname === "/setting/genaral" || pathname === "/setting/dues" ? "bg-blue-gray-50 bg-opacity-80 rounded-lg text-blue-gray-900 outline-none": ""} border-b-0 p-3`} >
              <ListItemPrefix>
                <Cog6ToothIcon className="h-5 w-5" />
              </ListItemPrefix>
              <Typography  color="blue-gray" className="mr-auto font-normal">
                Pengaturan
              </Typography>
            </AccordionHeader>
          </ListItem>
          
          <AccordionBody className="py-1">
            <List className="p-0">
              <Typography
                as="a"
                href="/setting/genaral"
                className="w-full flex font-medium"
              >

              <ListItem>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Pengaturan Umum
              </ListItem>

              </Typography>
              <Typography
                as="a"
                href="/setting/dues"
                className="w-full flex font-medium"
              >
              <ListItem className={`${pathname === "/setting/dues"  ? "bg-blue-gray-50 bg-opacity-80 rounded-lg text-blue-gray-900 outline-none": ""}`}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Iuran
              </ListItem>
              </Typography>
              

              <Typography
                as="a"
                href="/setting/report"
                className="w-full flex font-medium"
              >

                <ListItem className={`${pathname === "/" || pathname === "/" ? "bg-blue-gray-50 bg-opacity-80 rounded-lg text-blue-gray-900 outline-none": ""}`}>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Laporan
                </ListItem>

              </Typography>

              <Typography
                as="a"
                href="/setting/cashflow"
                className="w-full flex font-medium"
              >

                <ListItem className={`${pathname === "/setting" || pathname === "/setting/cashflow" ? "bg-blue-gray-50 bg-opacity-80 rounded-lg text-blue-gray-900 outline-none": ""}`}>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Catatan Keuangan
                </ListItem>

              </Typography>
             
            </List>
          </AccordionBody>

        </Accordion>
       
        {/* <ListItem  className={`${
          isOpen ? "w-full" : " w-11 overflow-hidden " 
          } transition-transform`}>
          <ListItemPrefix>
            <Cog6ToothIcon className="h-5 w-5" />
          </ListItemPrefix>
          <span className={`${
          isOpen ? "flex justify-between w-full opacity-1 transition-transform " : "hidden opacity-0" 
          } `}>Pengaturan</span>
         
        </ListItem> */}
        <ListItem  className={`${
          isOpen ? "w-full" : " w-11 overflow-hidden " 
          } transition-transform`}>
          <ListItemPrefix>
            <PowerIcon className="h-5 w-5" />
          </ListItemPrefix>
          <span className={`${
          isOpen ? "flex justify-between w-full opacity-1 transition-transform " : "hidden opacity-0" 
          } `}>Log Out</span>
          
        </ListItem>
      </List>
      
      
    </Card>
  );
}
