// components/parent-bind-code.tsx

'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { generateBindCode, BOT_USERNAME } from '@/utils/telegram';
import { Users, Copy, Check } from 'lucide-react';

type Props = {
    userId: string;
    userName: string;
};

export const ParentBindCode = ({ userId, userName }: Props) => {
    const [copied, setCopied] = useState(false);

    const bindCode = generateBindCode(userId);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bindCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                Родителям
            </h3>
            <p className="text-sm text-slate-500">
                Поделитесь кодом с родителями — они смогут отслеживать прогресс в Telegram.
            </p>
            <div className="flex items-center gap-2 justify-center">
                <code className="bg-amber-50 text-amber-600 border border-amber-200 px-6 py-3 rounded-lg font-mono text-2xl font-bold tracking-wider">
                    {bindCode}
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
                Команда боту: <code className="bg-slate-100 px-1 rounded text-slate-600">/bind {bindCode}</code>
            </p>
            <p className="text-xs text-slate-400 text-center">
                Telegram бот: <span className="font-mono text-amber-600">@{BOT_USERNAME}</span>
            </p>
        </div>
    );
};
