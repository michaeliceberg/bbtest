// app/(marketing)/vk-auth-btn.tsx

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TelegramLoginButton } from '@/components/telegram-login-button';
import { Loader } from 'lucide-react';
import { useState } from 'react';

const TELEGRAM_BOT_USERNAME = 'brickbrain007_bot';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === 'loading') {
    return <Loader className='h-5 w-5 text-muted-foreground animate-spin' />;
  }

  if (session) {
    return (
      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        Выйти
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Войти
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Вход</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <TelegramLoginButton botUsername={TELEGRAM_BOT_USERNAME} />

            <div className="flex items-center gap-2 w-full">
              <div className="h-px flex-1 bg-[#3A464E]" />
              <span className="text-xs text-[#9AA7B0]">или</span>
              <div className="h-px flex-1 bg-[#3A464E]" />
            </div>

            <Button className="w-full" onClick={() => signIn('vk', { callbackUrl: '/learn' })}>
              Войти через ВКонтакте
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
