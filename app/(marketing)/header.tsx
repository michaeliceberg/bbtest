// app/(marketing)/header.tsx

'use client';

import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import AuthButton from "@/app/(marketing)/vk-auth-btn";

type Props = {
  // Имя из userProgress (профиль в БД) — источник правды, в отличие от
  // session.user.name (для входа по телефону там номер, не имя из /account).
  dbUserName?: string | null;
};

export const Header = ({ dbUserName }: Props) => {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const userName = dbUserName || session?.user?.name;

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#151F23]/95 backdrop-blur-md shadow-lg border-b border-[#3A464E]' 
            : 'bg-[#151F23]/80 backdrop-blur-sm border-b-2 border-[#3A464E]'
        }`}
      >
        <div className='lg:max-w-screen-lg mx-auto px-4 h-20 flex items-center justify-between'>
          <Link href='/' className='group flex items-center gap-x-3 transition-transform hover:scale-105'>
            <Image
              src='/ggegelogo.svg'
              height={40}
              width={80}
              alt='ggege'
              className='h-10 w-20 transition-all group-hover:scale-105'
            />
          </Link>

          <div className='flex items-center gap-x-4'>
            {session && (
              <div className='flex items-center gap-x-2'>
                <div className='flex items-center gap-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full'>
                  <User className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-semibold text-green-700'>
                    {userName}
                  </span>
                </div>
              </div>
            )}
            <AuthButton />
          </div>
        </div>
      </header>

      <div className='h-20' />
    </>
  );
};
