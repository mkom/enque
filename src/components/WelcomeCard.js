"use client";
import { Card, CardBody, CardHeader, Typography, Button } from "@material-tailwind/react";
import { useRouter } from "next/navigation";

export default function WelcomeCard() {
  const router = useRouter();

  return (
    <Card className="w-full pb-8">
        <CardHeader floated={false} shadow={false} className="rounded-none">
            <div className="flex items-start justify-between gap-8">
                <div>
                    <Typography
                        variant="h1"
                        color="blue-gray"
                        className="mx-auto my-6 w-full leading-snug  !text-2xl"
                    >
                    🎉 Selamat Datang di Aplikasi Kami!
                    </Typography>
                </div>
               
            </div>
        </CardHeader>
        <CardBody className="pt-0 ">
            <Typography variant="h3" color="blue-gray" className="!text-lg">
                Akun Anda telah berhasil dibuat. Saat ini, Anda belum memiliki unit rumah dan iuran yang terdaftar.
            </Typography>
            <div className="mt-4 space-y-3">
                <Typography variant="paragraph" className="flex items-center gap-2">
                ✅ <span>Tambahkan Unit Rumah (Member) 🏡</span>
                </Typography>
                <Typography variant="paragraph" className="flex items-center gap-2">
                ✅ <span>Buat Iuran Baru 💰</span>
                </Typography>
            </div>
            <div className="mt-6">
                <Button 
                 variant="gradient"
                 size="sm"
                 onClick={() => router.push("/setting/dues")}
                >
                Buat Iuran Baru
                </Button>
            </div>
        </CardBody>
    </Card>
  );
}
