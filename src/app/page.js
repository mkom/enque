"use client";
import {useEffect } from "react";
import { useRouter,usePathname  } from 'next/navigation';
import { redirectBasedOnAuth } from "../utils/redirect";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    redirectBasedOnAuth(router, pathname);
  }, [router]);

  return (
    
    <section className="grid text-center h-screen items-center p-8 bg-light-blue-200">
      <div className="w-full max-w-md m-auto">
      
      </div>
    </section>
  );
}
