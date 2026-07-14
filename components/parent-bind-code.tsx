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
        <div className="rounded-xl border border-game-border bg-game-card p-4 space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-game-gold" />
                Родителям
            </h3>
            <p className="text-sm text-gray-400">
                Поделитесь кодом с родителями — они смогут отслеживать прогресс в Telegram.
            </p>
            <div className="flex items-center gap-2 justify-center">
                <code className="bg-game-card-light text-game-gold px-6 py-3 rounded-lg font-mono text-2xl font-bold tracking-wider">
                    {bindCode}
                </code>
                <Button
                    onClick={copyToClipboard}
                    variant="secondaryOutline"
                    size="sm"
                    className="border border-game-border bg-game-card-light text-white hover:bg-game-border shrink-0"
                >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
                Команда боту: <code className="bg-game-card-light px-1 rounded text-gray-300">/bind {bindCode}</code>
            </p>
            <p className="text-xs text-gray-500 text-center">
                Telegram бот: <span className="font-mono text-game-gold">@{BOT_USERNAME}</span>
            </p>
        </div>
    );
};
