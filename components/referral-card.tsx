// components/referral-card.tsx

'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { getReferralLink } from '@/lib/referral';
import { Users, Copy, Check, Share2 } from 'lucide-react';

type Props = {
    userId: string;
};

// 1-в-1 UX-паттерн components/parent-bind-code.tsx (Share2/Copy, navigator.share
// с фолбэком на clipboard) — не изобретаем новый.
export const ReferralCard = ({ userId }: Props) => {
    const [copied, setCopied] = useState(false);

    const referralLink = getReferralLink(userId);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Приглашение в ggege',
                    text: `Заходи и пробуй бесплатно: ${referralLink}`,
                });
                return;
            } catch {
                return;
            }
        }
        copyToClipboard();
    };

    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-[#F2F7FB] flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-400" />
                Пригласи друга
            </h3>
            <p className="text-sm text-[#9AA7B0]">
                Отправь другу ссылку — когда он зарегистрируется, тебе достанется пицца 🍕
            </p>

            <Button type="button" variant="secondary" className="w-full" onClick={shareLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Отправить ссылку другу
            </Button>

            <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate bg-[#232F34] text-[#9AA7B0] border border-[#3A464E] px-3 py-2 rounded-lg text-xs">
                    {referralLink}
                </code>
                <Button
                    onClick={copyToClipboard}
                    variant="secondaryOutline"
                    size="sm"
                    className="shrink-0"
                >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
};
