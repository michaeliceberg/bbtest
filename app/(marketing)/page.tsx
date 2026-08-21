// app/(marketing)/page.tsx
'use client'
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useMedia } from 'react-use';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/login-dialog';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LottieHelloBread from '@/public/LottieHelloBread.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function Home() {
  const { data: session } = useSession();
  const userName = session?.user?.name;
  const [loginOpen, setLoginOpen] = useState(false);
  const isMobile = useMedia('(max-width: 1024px)');

  return (
    <div className='max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2'>
      <div className='relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0'>
        <Lottie
          animationData={LottieHelloBread}
          loop={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className='flex flex-col items-center gap-y-8'>
        {userName ? (
          <h1 className='text-xl lg:text-3xl font-bold text-[#F2F7FB] max-w-[480px] text-center'>
            С возвращением,
            <br />
            {userName}! 👋
            <br />
            Готов продолжить?
          </h1>
        ) : (
          <h1 className='text-xl lg:text-3xl font-bold text-[#F2F7FB] max-w-[480px] text-center'>
            Привет! Давай
            <br />
            учиться вместе!
          </h1>
        )}

        <div className='flex flex-col items-center gap-y-3 max-w-[330px] w-full'>
          {userName ? (
            <Button
              size={isMobile ? 'sm' : 'lg'}
              variant='secondary'
              className='w-full h-14 lg:h-16 text-base'
              asChild
            >
              <Link href='/learn'>Продолжаем учиться</Link>
            </Button>
          ) : (
            <Button
              size={isMobile ? 'sm' : 'lg'}
              variant='secondary'
              className='w-full h-14 lg:h-16 text-base'
              onClick={() => setLoginOpen(true)}
            >
              Начать учиться
            </Button>
          )}

          <p className='text-sm text-muted-foreground text-center mt-2'>
            {userName
              ? `${userName}, у тебя отлично получается! 🌟`
              : 'У тебя всё получится! ❤️'}
          </p>
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
