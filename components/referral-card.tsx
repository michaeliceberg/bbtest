// components/referral-card.tsx

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { getInviteLink } from '@/lib/referral';
import { getTelegramShareLink } from '@/lib/telegramLinks';
import type { TrialSubject } from '@/lib/trialTracks';
import { Users, Copy, Check, Share2, Send } from 'lucide-react';

type Props = {
    inviteCode: string;
    defaultSubject?: TrialSubject;
};

// Две ссылки — на пробный урок математики (тригонометрия) и физики (электродинамика):
// друг сразу попадает в урок своего предмета с экраном «Тебя позвал…».
const SUBJECTS: { key: TrialSubject; label: string }[] = [
    { key: 'math', label: 'Математика' },
    { key: 'physics', label: 'Физика' },
];

// 1-в-1 UX-паттерн components/parent-bind-code.tsx (Share2/Copy, navigator.share
// с фолбэком на clipboard) — не изобретаем новый.
export const ReferralCard = ({ inviteCode, defaultSubject = 'math' }: Props) => {
    const [copied, setCopied] = useState(false);
    const [subject, setSubject] = useState<TrialSubject>(defaultSubject);

    const referralLink = getInviteLink(inviteCode, undefined, subject);

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
                Выбери предмет — друг сканирует QR-код с твоего экрана или открывает ссылку и сразу попадает в первый
                урок. Когда он пройдёт 3 урока (тригонометрии или Электродинамики), тебе достанется кусочек пиццы 🍕,
                а другу — 1–2 кусочка. Если твой друг позовёт своих — тебе ещё ½ и ¼ кусочка.
            </p>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#232F34] p-1">
                {SUBJECTS.map((x) => (
                    <button key={x.key} type="button" onClick={() => { setSubject(x.key); setCopied(false); }}
                        className={`rounded-lg py-2 text-sm font-bold transition-colors ${subject === x.key ? 'bg-violet-500 text-white' : 'text-[#9AA7B0] hover:text-[#F2F7FB]'}`}>
                        {x.label}
                    </button>
                ))}
            </div>

            {/* QR — чтобы в классе просто сканировать экран друг друга камерой, без пересылки ссылки в мессенджере. */}
            <div className="flex justify-center py-3 bg-white rounded-lg">
                <QRCodeSVG value={referralLink} size={200} marginSize={2} />
            </div>

            <Button type="button" variant="secondary" className="w-full" onClick={shareLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Отправить ссылку другу
            </Button>

            {/* В Telegram превью по ссылке не строится (их сервера не достают до ggege.ru) —
                бот присылает готовую карточку с картинкой, её пересылают другу. */}
            <a href={getTelegramShareLink(inviteCode, subject)} target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-[#1C7FB8] bg-[#2AABEE] py-2.5 text-sm font-black uppercase tracking-wide text-white active:border-b-2">
                <Send className="h-4 w-4" /> В Telegram с картинкой
            </a>

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
