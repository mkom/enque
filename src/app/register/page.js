"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  Typography,
  Input,
  Button,
  Select,
  Option
} from "@material-tailwind/react";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";


export default function Register() {
    const [passwordShown, setPasswordShown] = useState(false);
    const togglePasswordVisiblity = () => setPasswordShown((cur) => !cur);
    
    const [tenantName, setTenantName] = useState('');
    const [tenantType, setTenantType] = useState('Perumahan');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const [error, setError] = useState([
      {
        tenantName: '',
        tenantType: '',
        email: '',
        password:''
      },
    ]);

    const validateForm = async  () => {
      let valid = true;
      const newError = {
        tenantName: '',
        tenantType: '',
        email: '',
        password:''
      };
  
      if (!tenantName) {
          newError.tenantName = "Nama lingkungan wajib diisi";
          valid = false;
      }
  
      if (!tenantType) {
          newError.tenantType = "Jenis lingkungan wajib dipilih";
          valid = false;
      }
  
      if (!email) {
          newError.email = "Email wajib diisi";
          valid = false;
      }
  
      if (!password) {
          newError.password = "Email wajib diisi";
          valid = false;
      }
      setError(newError);
      return valid;
    };

    useEffect(() => {
        if (tenantName) {
          setError((prevError) => ({
            ...prevError,
            tenantName: '',
          }));
          setMessage('');
        }
        if (tenantType) {
          setError((prevError) => ({
            ...prevError,
            tenantType: '',
          }));
        }
        if (email) {
          setError((prevError) => ({
            ...prevError,
            email: '',
          }));
          setMessage('');
        }
        if (password) {
          setError((prevError) => ({
            ...prevError,
            password: '',
          }));
          setMessage('');
        }
      }, [tenantName,tenantType,email,password]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setMessage('')
      const isValid = await validateForm();
      //console.log(isValid)

      if (isValid) {
        setLoading(true)

        try {
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
            },
            body: JSON.stringify({
              tenant_name: tenantName,
              tenant_type: tenantType,
              email: email,
              password: password,
            }),
          });
  
          const data = await response.json();
          if (response.status === 201) {
            //setMessage('Tenant registered successfully');
            router.push('/');
          } else {
            setMessage(`${data.message}`);
          }
        } catch (error) {
          setMessage(`${error.message}`);
        } finally {
          setLoading(false); // Nonaktifkan status loading setelah proses selesai
        }
      }
    };

    return (
        <section className="grid text-center h-screen items-center p-8 bg-light-blue-200">
          <div className="w-full max-w-md m-auto">
          <Card className="pb-10">
            <CardBody>
              <Typography variant="h3" color="blue-gray" className="mb-2">
                Registrasi
              </Typography>
              <Typography variant="paragraph" className="mb-10 text-gray-600 font-normal ">
              Email dan Password  dibutuhkan untuk login ke Portal Omque.
              </Typography>
              <form onSubmit={handleSubmit} className="mx-auto max-w-[24rem] text-left">
                <div className="mb-6">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="mb-2 font-medium"
                  >
                   Jenis Lingkungan
                  </Typography>
                  <Select 
                    id="tenantType"
                    size="lg"
                    value={tenantType}
                    onChange={(value) => setTenantType(value)}
                    labelProps={{
                      className: "hidden",
                    }}
                    className="w-full pl-9 placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                  >
                    <Option value="Perumahan">Perumahan</Option>
                    <Option value="Cluster">Cluster</Option>
                    <Option value="RT/RW">RT/RW</Option>
                    <Option value="Lainnya">Lainnya</Option>
                  </Select>
                  {error.tenantType && <p className="text-red-500 text-sm mt-1 ml-1">{error.tenantType}</p>}
                </div>
                <div className="mb-6">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="mb-2 font-medium"
                  >
                   Nama Lingkungan
                  </Typography>
                  <Input
                    id="tenantName"
                    color="gray"
                    size="lg"
                    type="text"
                    name="tenantName"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Perumahan Griyaku"
                    labelProps={{
                      className: "hidden",
                    }}
                    className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                  />
                  {error.tenantName && <p className="text-red-500 text-sm mt-1 ml-1">{error.tenantName}</p>}
                </div>
               

                <hr className="py-3"></hr>
                <div className="mb-6">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="mb-2 font-medium"
                  >
                   Email
                  </Typography>
                  <Input
                    id="email"
                    color="gray"
                    size="lg"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@mail.com"
                    labelProps={{
                      className: "hidden",
                    }}
                    className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                  />

                  {error.email && <p className="text-red-500 text-sm mt-1 ml-1">{error.email}</p>}
                </div>
                <div className="mb-6">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="mb-2 font-medium"
                  >
                   Password
                  </Typography>
                  <Input
                    size="lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    labelProps={{
                      className: "hidden",
                    }}
                    className="w-full placeholder:opacity-100 focus:border-t-blue-gray-900 !border-blue-gray-200"
                    type={passwordShown ? "text" : "password"}
                    icon={
                      <i onClick={togglePasswordVisiblity}>
                        {passwordShown ? (
                          <EyeIcon className="h-5 w-5" />
                        ) : (
                          <EyeSlashIcon className="h-5 w-5" />
                        )}
                      </i>
                    }
                  />
                  <Typography
                    variant="small"
                    color="gray"
                    className="mt-2 flex text-[11px] items-center gap-1 font-normal"
                  >
                    Gunakan minimal 8 karakter
                  </Typography>
                  {error.password && <p className="text-red-500 text-sm mt-1 ml-1">{error.password}</p>}
                </div>
      
                {message && 
                  <Typography
                    color="red"
                    className="mt-2 flex items-center gap-2 font-normal"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    {message}
                  </Typography>
                }
                <Button 
                type="submit" 
                color="gray" 
                size="lg" 
                className="mt-6 justify-center" 
                fullWidth
                loading={loading}
                >
                  {loading ? 'Loading...' : 'Daftar'}
                </Button>
                <div className="!mt-4 flex justify-end">
                  <Typography
                    as="a"
                    href="#"
                    color="blue-gray"
                    variant="small"
                    className="font-medium"
                  >
                    Lupa password
                  </Typography>
                </div>
                <Typography
                  variant="small"
                  color="gray"
                  className="!mt-4 text-center font-normal"
                >
                  Sudah punya akun?{" "}
                  <a href="/" className="font-medium text-gray-900">
                    Kembali ke Login
                  </a>
                </Typography>
              </form>

            </CardBody>
          </Card>
            
          </div>
        </section>
    );
}