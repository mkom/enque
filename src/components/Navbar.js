"use client";
import Cookies from "js-cookie";
import React from "react";
import { logout } from "../utils/logout";
import { useRouter } from 'next/navigation';
import { useState,useEffect,useCallback  } from "react";
import { fetchTenantDetails } from "@/utils/fetchTenant";

import {
  Navbar,
  Typography,
  Button,
  IconButton,
} from "@material-tailwind/react";
 
export function TopNavbar() {
  const [openNav, setOpenNav] = React.useState(false);
  const router = useRouter();
  const [nameTenant, setNameTenant] = useState('');

  
  useEffect(() => {
      const getTenantData = async () => {
          try {
          const tenantData = await fetchTenantDetails();
          console.log("tenantData", tenantData);
          if (!tenantData) {
              console.error('Tenant data not found');
              return;
          }
          setNameTenant(tenantData.tenant_name || '');
          } catch (error) {
          console.error('Failed to load tenant data:', error);
          }
      };

      getTenantData();
  }, []);

  const handleLogout = () => {
    logout(router); // Panggil fungsi logout
  };



 
  // React.useEffect(() => {
  //   window.addEventListener(
  //     "resize",
  //     () => window.innerWidth >= 960 && setOpenNav(false),
  //   );
  // }, []);
 
  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <a href="#" className="flex items-center">
          Pages
        </a>
      </Typography>
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <a href="#" className="flex items-center">
          Account
        </a>
      </Typography>
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <a href="#" className="flex items-center">
          Blocks
        </a>
      </Typography>
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <a href="#" className="flex items-center">
          Docs
        </a>
      </Typography>
    </ul>
  );
 
  return (
    <Navbar className=" h-max max-w-full shadow-sm rounded-none px-4 py-3 lg:px-5 lg:py-3">
    <div className="flex items-center justify-between text-blue-gray-900">
      <Typography
        className="mr-4  py-1.5 font-extrabold uppercase"
        variant="h5"
      >
        {nameTenant}
      </Typography>
      <div className="flex items-center gap-4">
        {/* <div className="mr-4 hidden lg:block">{navList}</div> */}
        <div className="flex items-center gap-x-1">
          <Button
            variant="text"
            size="sm"
            className="hidden lg:inline-block"
            onClick={handleLogout}
          >
            <span>Log out</span>
          </Button>
          <Button
            variant="gradient"
            size="sm"
            className="hidden lg:inline-block"
          >
            <span>Profile</span>
          </Button>
        </div>
        <IconButton
          variant="text"
          className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
          ripple={false}
          onClick={() => setOpenNav(!openNav)}
        >
          {openNav ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </IconButton>
      </div>
    </div>
    {/* <MobileNav open={openNav}>
      {navList}
      <div className="flex items-center gap-x-1">
        <Button fullWidth variant="text" size="sm" className="">
          <span>Log In</span>
        </Button>
        <Button fullWidth variant="gradient" size="sm" className="">
          <span>Sign in</span>
        </Button>
      </div>
    </MobileNav> */}
    </Navbar>
  );
}