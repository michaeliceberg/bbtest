// components/parent-bind-code.tsx

'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { generateBindCode, getBindLink, BOT_USERNAME } from '@/utils/telegram';
import { Users, Copy, Check, Send } from 'lucide-react';

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

    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-[#F2F7FB] flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                Родителям
            </h3>
            <p className="text-sm text-[#9AA7B0]">
                Отправьте родителям ссылку — она сама откроет Telegram и привяжет аккаунт, вводить ничего не нужно.
            </p>

            <Button asChild variant="secondary" className="w-full">
                <a href={bindLink} target="_blank" rel="noopener noreferrer">
                    <Send className="h-4 w-4 mr-2" />
                    Открыть в Telegram и привязать
                </a>
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

            <p className="text-xs text-slate-400 text-center">
                Или вручную: код <code className="bg-[#232F34] px-1 rounded text-[#9AA7B0]">{bindCode}</code> боту{' '}
                <span className="font-mono text-amber-600">@{BOT_USERNAME}</span> командой{' '}
                <code className="bg-[#232F34] px-1 rounded text-[#9AA7B0]">/bind {bindCode}</code>
            </p>
        </div>
    );
};
