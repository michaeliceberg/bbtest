// components/parent-bind-code.tsx

'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { generateBindCode } from '@/utils/telegram';

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
        <div className="border-2 rounded-xl p-4 space-y-3 bg-blue-50">
            <h3 className="font-bold text-lg flex items-center gap-2">
                👨‍👩‍👧 Привязать родителей
            </h3>
            <p className="text-sm text-neutral-600">
                Поделитесь этим кодом с родителями. Они смогут отслеживать ваш прогресс в Telegram.
            </p>
            <div className="flex items-center gap-2 justify-center">
                <code className="bg-white px-6 py-3 rounded-lg font-mono text-2xl font-bold tracking-wider">
                    {bindCode}
                </code>
                <Button onClick={copyToClipboard} variant="secondaryOutline" size="sm">
                    {copied ? '✅ Скопировано' : '📋 Скопировать'}
                </Button>
            </div>
            <p className="text-xs text-neutral-400 text-center">
                Родителям нужно отправить боту команду: <code className="bg-gray-100 px-1 rounded">/bind {bindCode}</code>
            </p>
            <p className="text-xs text-neutral-400 text-center">
                🤖 Telegram бот: <span className="font-mono">@YourBotName</span>
            </p>
        </div>
    );
};