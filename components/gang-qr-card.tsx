// components/gang-qr-card.tsx

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { getReferralLink } from '@/lib/referral';
import { Copy, Check, Share2, QrCode } from 'lucide-react';

type Props = {
    inviteCode: string;
    gangName: string;
};

// Та же ссылка, что уже используется ReferralCard (components/referral-card.tsx) —
// у главы/капо она ДОПОЛНИТЕЛЬНО удваивается как приглашение в банду (см.
// actions/user-progress.ts, upsertUserProgress) — новая, отдельная механика
// приглашения не нужна, тут только визуал (QR + copy/share, тот же UX-паттерн).
export const GangQrCard = ({ inviteCode, gangName }: Props) => {
    const [copied, setCopied] = useState(false);

    const link = getReferralLink(inviteCode);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Банда «${gangName}»`,
                    text: `Вступай в мою банду «${gangName}»: ${link}`,
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
                <QrCode className="h-5 w-5 text-violet-400" />
                Приглашение в банду
            </h3>
            <p className="text-sm text-[#9AA7B0]">
                Друг сканирует QR или переходит по ссылке — если он зарегистрируется, он попадёт прямо в банду «{gangName}».
            </p>

            <div className="flex justify-center py-2 bg-white rounded-lg">
                <QRCodeSVG value={link} size={160} marginSize={2} />
            </div>

            <Button type="button" variant="secondary" className="w-full" onClick={shareLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Отправить ссылку
            </Button>

            <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate bg-[#232F34] text-[#9AA7B0] border border-[#3A464E] px-3 py-2 rounded-lg text-xs">
                    {link}
                </code>
                <Button onClick={copyToClipboard} variant="secondaryOutline" size="sm" className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
};
