// components/login-dialog.tsx

'use client';

import { signIn } from 'next-auth/react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { TelegramLoginButton } from './telegram-login-button';
import { PhoneCallLogin } from './phone-call-login';
import { VkIcon } from './vk-icon';

const TELEGRAM_BOT_USERNAME = 'brickbrain007_bot';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const LoginDialog = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] min-w-0">
        <DialogHeader>
          <DialogTitle>Вход</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2 w-full min-w-0">
          <PhoneCallLogin callbackUrl="/learn" />

          <div className="flex items-center gap-2 w-full">
            <div className="h-px flex-1 bg-[#3A464E]" />
            <span className="text-xs text-[#9AA7B0]">или</span>
            <div className="h-px flex-1 bg-[#3A464E]" />
          </div>

          <TelegramLoginButton botUsername={TELEGRAM_BOT_USERNAME} />

          <div className="flex items-center gap-2 w-full">
            <div className="h-px flex-1 bg-[#3A464E]" />
            <span className="text-xs text-[#9AA7B0]">или</span>
            <div className="h-px flex-1 bg-[#3A464E]" />
          </div>

          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={() => signIn('vk', { callbackUrl: '/learn' })}
          >
            <VkIcon className="h-5 w-5 flex-shrink-0" />
            Войти через VK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
