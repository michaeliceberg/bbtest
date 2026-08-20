// components/parent-bind-code.tsx

'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { generateBindCode, getBindLink } from '@/utils/telegram';
import { Users, Copy, Check, Share2 } from 'lucide-react';

type Props = {
    userId: string;
    userName: string;
};

export const ParentBindCode = ({ userId, userName }: Props) => {
    const [copied, setCopied] = useState(false);

    const bindCode = generateBindCode(userId);
    const bindLink = getBindLink(bindCode);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bindLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLink = async () => {
        if (navigator.share) {
            try {
                // Некоторые приложения (в т.ч. Telegram) при получении Web Share
                // с раздельными text и url показывают только text, а url теряется —
                // поэтому ссылку кладём прямо в текст одним полем.
                await navigator.share({
                    title: 'Привязка родителя',
                    text: `Перейдите по ссылке в своём Telegram, чтобы получать уведомления о моей учёбе:\n${bindLink}`,
                });
                return;
            } catch {
                // пользователь отменил шаринг — просто ничего не делаем
                return;
            }
        }
        copyToClipboard();
    };

    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-[#F2F7FB] flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                Привязать родителя
            </h3>

            <Button type="button" variant="secondary" className="w-full" onClick={shareLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Отправить ссылку родителю
            </Button>

            <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate bg-[#232F34] text-[#9AA7B0] border border-[#3A464E] px-3 py-2 rounded-lg text-xs">
                    {bindLink}
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
