// app/(marketing)/header.tsx

'use client';

import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { GgegeTagline } from '@/components/ggege-tagline'
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
            ? 'bg-[#151F23]/95 lg:backdrop-blur-md shadow-lg border-b border-[#3A464E]' 
            : 'bg-[#151F23]/95 lg:bg-[#151F23]/80 lg:backdrop-blur-sm border-b-2 border-[#3A464E]'
        }`}
      >
        <div className='lg:max-w-screen-lg mx-auto px-4 h-20 flex items-center justify-between'>
          <Link href='/' className='group flex items-center gap-x-3 transition-transform hover:scale-105'>
            <Image
              src='/ggege-logo.webp'
              height={120}
              width={160}
              alt='ggege'
              className='h-14 w-auto transition-all group-hover:scale-105'
            />
            <GgegeTagline className='hidden lg:inline text-base' />
          </Link>

          <div className='flex items-center gap-x-4'>
            {session && (
              <div className='flex items-center gap-x-2'>
                <div className='flex items-center gap-x-2 rounded-full border border-[#3A464E] bg-[#1C282E] px-3 py-1.5'>
                  <User className='h-4 w-4 text-[#78C93C]' />
                  <span className='text-sm font-semibold text-[#F2F7FB]'>
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
