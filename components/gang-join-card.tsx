'use client'

// components/gang-join-card.tsx — экран приглашения в банду (app/g/[code]).

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GangEmblem } from '@/components/gang-emblem'
import { LoginDialog } from '@/components/login-dialog'
import { joinGangByInvite } from '@/actions/gang'
import { setReferralCookie } from '@/actions/referral'
import { DEFAULT_GANG_COLOR } from '@/lib/gangEmblems'
import { declensionRu } from '@/usefulFunctions'

type Props = {
    code: string
    loggedIn: boolean
    invite: { gangName: string; emoji: string; color: string | null; inviter: string; inviterRole: string } | null
    isSelf: boolean
    stats?: { wins: number; members: number; points: number; weekPlace: number | null; weekTotal: number } | null
    currentGang: { name: string; sameGang: boolean; isLeader: boolean } | null
}

export const GangJoinCard = ({ code, loggedIn, invite, isSelf, currentGang, stats }: Props) => {
    const router = useRouter()
    const [loginOpen, setLoginOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    // Новичок: запоминаем приглашение — при регистрации он попадёт в банду сам.
    useEffect(() => {
        if (!loggedIn && invite) setReferralCookie(code).catch(() => {})
    }, [loggedIn, invite, code])

    const join = (switchGang: boolean) => startTransition(async () => {
        setError(null)
        const r = await joinGangByInvite(code, switchGang).catch(() => ({ error: 'Что-то пошло не так' }))
        if ('ok' in r) router.push('/gang')
        else setError(r.error)
    })

    const color = invite?.color || DEFAULT_GANG_COLOR
    const btn = 'w-full rounded-2xl py-3.5 text-base font-black uppercase tracking-wide disabled:opacity-60'

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#131D22] px-4">
            <div className="w-full max-w-sm rounded-3xl border-2 p-6 text-center"
                style={{ borderColor: `${color}88`, background: `radial-gradient(circle at 50% 0%, ${color}22, #161F23 60%)` }}>
                {!invite ? (
                    <>
                        <p className="text-4xl">🤷</p>
                        <p className="mt-2 text-xl font-black text-[#F2F7FB]">Приглашение недействительно</p>
                        <p className="mt-1 text-sm text-[#9AA7B0]">Попроси друга прислать новую ссылку со страницы его банды.</p>
                        <Link href="/trainer" className="mt-5 block text-sm font-bold text-[#9AA7B0]">На главную</Link>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center"><GangEmblem value={invite.emoji} color={color} size={110} /></div>
                        <p className="mt-4 text-sm font-bold text-[#9AA7B0]">
                            {invite.inviter} {invite.inviterRole === 'leader' ? '(глава)' : '(капо)'} зовёт тебя в банду
                        </p>
                        <p className="text-2xl font-black text-[#F2F7FB]">«{invite.gangName}»</p>

                        {/* Достижения банды */}
                        {stats && (
                            <div className="mt-4 flex flex-col gap-2">
                                {stats.wins > 0 && (
                                    <div className="flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2"
                                        style={{ borderColor: '#F2C35B', background: 'linear-gradient(180deg, rgba(242,195,91,0.2), rgba(242,195,91,0.04))', boxShadow: '0 4px 0 #7A5A12' }}>
                                        <span className="text-2xl">🏆</span>
                                        <span className="text-base font-black text-[#F2C35B]">
                                            {stats.wins} {declensionRu(stats.wins, 'победа', 'победы', 'побед')} в битве банд
                                        </span>
                                    </div>
                                )}
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { v: stats.members, l: declensionRu(stats.members, 'участник', 'участника', 'участников') },
                                        { v: stats.points, l: 'очков всего' },
                                        { v: stats.weekPlace ? `#${stats.weekPlace}` : '—', l: 'место недели' },
                                    ].map((x) => (
                                        <div key={x.l} className="rounded-xl border-2 border-[#2B373D] bg-[#0F171B] px-1 py-2">
                                            <p className="text-xl font-black text-[#F2F7FB]">{x.v}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#9AA7B0]">{x.l}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-5 flex flex-col gap-3">
                            {isSelf ? (
                                <p className="text-sm font-bold text-[#9AA7B0]">Это твоя ссылка — отправь её другу 🙂</p>
                            ) : !loggedIn ? (
                                <button type="button" className={`${btn} text-[#151F24]`} onClick={() => setLoginOpen(true)}
                                    style={{ backgroundColor: '#78C93C', boxShadow: '0 5px 0 #60A12F' }}>
                                    Войти и вступить
                                </button>
                            ) : currentGang?.sameGang ? (
                                <Link href="/gang" className={`${btn} block text-[#151F24]`} style={{ backgroundColor: '#78C93C', boxShadow: '0 5px 0 #60A12F' }}>
                                    Ты уже в этой банде ➜
                                </Link>
                            ) : currentGang?.isLeader ? (
                                <p className="text-sm font-bold text-[#DC605B]">Ты глава банды «{currentGang.name}» — главе уйти нельзя.</p>
                            ) : currentGang ? (
                                <>
                                    <p className="text-sm font-bold text-[#C9D3D9]">Сейчас ты в банде «{currentGang.name}».</p>
                                    <button type="button" disabled={pending} className={`${btn} text-[#151F24]`} onClick={() => join(true)}
                                        style={{ backgroundColor: '#F09B38', boxShadow: '0 5px 0 #C07C2B' }}>
                                        Перейти в «{invite.gangName}»
                                    </button>
                                </>
                            ) : (
                                <button type="button" disabled={pending} className={`${btn} text-[#151F24]`} onClick={() => join(false)}
                                    style={{ backgroundColor: '#78C93C', boxShadow: '0 5px 0 #60A12F' }}>
                                    Вступить в банду
                                </button>
                            )}
                            {error && <p className="text-sm font-bold text-[#DC605B]">{error}</p>}
                        </div>
                    </>
                )}
            </div>
            <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} callbackUrl={`/g/${code}`} />
        </div>
    )
}
