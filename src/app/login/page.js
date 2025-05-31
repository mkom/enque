"use client";
import { useState,useEffect } from "react";
import { useRouter } from 'next/navigation';
import Cookies from "js-cookie";
import { redirectBasedOnAuth } from "../../utils/redirect";
import {
  Card,
  CardBody,
  Typography,
  Input,
  Button,
} from "@material-tailwind/react";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";
import { Spinner } from "@material-tailwind/react";

export default function Login() {
    const router = useRouter();
    useEffect(() => {
        redirectBasedOnAuth(router);
    }, [router]);

  const [passwordShown, setPasswordShown] = useState(false);
  const togglePasswordVisiblity = () => setPasswordShown((cur) => !cur);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState([
    {
      email: '',
      password:''
    },
  ]);

  const validateForm = async  () => {
    let valid = true;
    const newError = {
      email: '',
      password:''
    };
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
  }, [email,password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
   
    setMessage('')

    const isValid = await validateForm();

    if (isValid) {
      setLoading(true)
      try {
        const response = await fetch('/api/login/tenant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });
  
        const data = await response.json();
        if (response.status === 200) {
         // console.log(data)
          Cookies.set("token.app_oq", data.data, { expires: 7, secure: true });
  
          router.push('/dashboard');
          setMessage(data.message);
  
          if (data.data) {
            setToken(true)
          }
  
          //console.log(data)
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
              Log In
            </Typography>
            <Typography variant="paragraph" className="mb-10 text-gray-600 font-normal">
            Masuk ke dashboard OQUE sebagai Tenant, untuk melihat tagihan IPL, Cashflow, download laporan, dan lainnya.
            </Typography>

            <form onSubmit={handleSubmit}  className="mx-auto max-w-[24rem] text-left">
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
              </div>

                {message &&  !token && 
                  <Typography
                    color="red"
                    className="mt-2 flex items-center gap-2  font-normal"
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

                {token && 
                  <div className="flex justify-center">
                    <Spinner color="blue" />
                  </div>
                }

              <Button 
                type="submit" 
                color="gray" 
                size="lg" 
                className="mt-6 justify-center" 
                fullWidth
                loading={loading}
                >
                  {loading ? 'Loading...' : 'Masuk'}
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
                Belum ada akun?{" "}
                <a href="/register" className="font-medium text-gray-900">
                  Buat akun
                </a>
              </Typography>
            </form>


          </CardBody>
          
        </Card>

        
        
      </div>
    </section>
  );
}
