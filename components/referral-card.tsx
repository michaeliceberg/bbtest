// components/referral-card.tsx

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { getReferralLink } from '@/lib/referral';
import { Users, Copy, Check, Share2 } from 'lucide-react';

type Props = {
    inviteCode: string;
};

// 1-в-1 UX-паттерн components/parent-bind-code.tsx (Share2/Copy, navigator.share
// с фолбэком на clipboard) — не изобретаем новый.
export const ReferralCard = ({ inviteCode }: Props) => {
    const [copied, setCopied] = useState(false);

    const referralLink = getReferralLink(inviteCode);

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
                Друг сканирует QR-код с твоего экрана или открывает ссылку. Когда он пройдёт 3 урока (Электродинамики
                или тригонометрии), тебе достанется кусочек пиццы 🍕, а другу — 1–2 кусочка. Если твой друг
                позовёт своих — тебе ещё ½ и ¼ кусочка.
            </p>

            {/* QR — чтобы в классе просто сканировать экран друг друга камерой, без пересылки ссылки в мессенджере. */}
            <div className="flex justify-center py-3 bg-white rounded-lg">
                <QRCodeSVG value={referralLink} size={200} marginSize={2} />
            </div>

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
