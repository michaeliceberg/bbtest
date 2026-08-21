// app/(marketing)/vk-auth-btn.tsx

'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/login-dialog';
import { Loader } from 'lucide-react';
import { useState } from 'react';

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

      <LoginDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
