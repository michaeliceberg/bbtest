// app/(main)/account/page.tsx

import { auth } from '@/lib/server-auth'
import { getUserProgress, getGangMembership } from '@/db/queries'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'
import { AccountLinking } from '@/components/account-linking'
import { AvatarReroll } from '@/components/avatar-reroll'
import { NameEditor } from '@/components/name-editor'
import { ParentBindCode } from '@/components/parent-bind-code'
import { ReferralCard } from '@/components/referral-card'
import { getOrCreateInvite } from '@/lib/invite'
import { getDdxState } from '@/lib/ddx'
import { learnSubjectOf } from '@/lib/learn-unlock'
import { getRank } from '@/lib/rank'
import { GangEmblem } from '@/components/gang-emblem'
import { getLevelInfo } from '@/lib/xp'
import { Button } from '@/components/ui/button'
import { PRO_ENABLED } from '@/lib/pro'
import { MAX_PIZZA_SLICES } from '@/lib/caseRewards'

const AccountPage = async () => {
    const session = await auth()
    if (!session?.user) redirect('/')

    const userProgress = await getUserProgress()
    if (!userProgress) redirect('/')

    const gangMembership = await getGangMembership(userProgress.userId)
    const invite = await getOrCreateInvite(userProgress.userId)
    const ddx = await getDdxState(userProgress.userId)
    const levelInfo = getLevelInfo(userProgress.xp)
    const pizzaCount = Math.min(MAX_PIZZA_SLICES, userProgress.pizzaSlices)
    const rank = getRank(levelInfo.level, gangMembership?.role)

    return (
        <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-8">
            {/* Профиль в духе игрового приложения: аватарка, позывной, звание,
                уровень, имя и банда — одной карточкой. */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#3A464E] bg-[#151F23] shadow-xl">
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#C385F7]/25 via-[#53ADEF]/10 to-transparent pointer-events-none" />
                <div className="relative px-5 pt-8 pb-5 flex flex-col items-center gap-5">
                    <AvatarReroll currentAvatar={userProgress.userImageSrc} points={userProgress.points}>
                        <div className="flex flex-col items-center gap-2.5 text-center">
                            <NameEditor currentName={userProgress.userName} />
                            {invite?.nickname && (
                                <h1 className="font-black text-lg sm:text-xl leading-tight bg-gradient-to-r from-[#F09B38] via-[#BC418A] to-[#C385F7] bg-clip-text text-transparent">
                                    {invite.nickname}
                                </h1>
                            )}
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <span
                                    title={rank.next ? `Следующее звание — «${rank.next.title}» с ${rank.next.minLevel} уровня` : undefined}
                                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#C385F7] bg-[#C385F7]/15 px-3.5 py-1 font-black text-base text-[#C385F7]"
                                >
                                    <Crown className="h-4 w-4" />
                                    {rank.title}
                                </span>
                                <span className="inline-flex items-center rounded-full border-2 border-[#53ADEF] bg-[#53ADEF]/15 px-3 py-1 font-black text-sm text-[#53ADEF]">
                                    Ур. {levelInfo.level}
                                </span>
                            </div>
                            <div className="w-56 h-2 rounded-full bg-[#232F34] overflow-hidden" title={`${levelInfo.xpIntoLevel} / ${levelInfo.xpForNextLevel} XP до следующего уровня`}>
                                <div className="h-full rounded-full bg-gradient-to-r from-[#53ADEF] to-[#5CC99F]" style={{ width: `${levelInfo.progressPercent}%` }} />
                            </div>
                        </div>
                    </AvatarReroll>

                    <div className="w-full border-t border-[#3A464E] pt-4 flex items-center gap-3">
                        {gangMembership ? (
                            <GangEmblem value={gangMembership.gang.emoji} color={gangMembership.gang.color} size={48} />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src="/gang/band.webp" alt="" className="h-12 w-12 shrink-0 rounded-full object-cover bg-[#1B252B]" />
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="font-bold text-[#F2F7FB] truncate">{gangMembership ? gangMembership.gang.name : 'Моя банда'}</div>
                            <div className="text-xs text-[#9AA7B0]">
                                {gangMembership ? 'Приглашай друзей, назначай капо, следи за рейтингом.' : 'Ты ещё не в банде — создай свою или вступи по ссылке друга.'}
                            </div>
                        </div>
                        <Link href="/gang">
                            <Button type="button" variant="secondary" size="sm">
                                {gangMembership ? 'Открыть' : 'Создать'}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Переключатель «Игровой / Тёплый» временно убран (2026-10-10): у всех игровой стиль,
                см. parseUiTheme в lib/uiTheme.ts. Вернуть — <ThemeSwitch hideLabel /> здесь. */}

            <div>
                <h2 className="font-bold text-lg text-[#F2F7FB] mb-1">Способы входа</h2>
                <p className="text-sm text-[#9AA7B0] mb-3">
                    Привяжите несколько способов входа, чтобы заходить в свой аккаунт с разных устройств.
                </p>
                <Suspense fallback={null}>
                    <AccountLinking />
                </Suspense>
            </div>

            {PRO_ENABLED && (
            <Link href="/pro?from=account" className="flex items-center justify-between rounded-xl border-2 border-[#F2C35B]/60 bg-[#1F1B10] px-4 py-3 hover:border-[#F2C35B]">
                <span className="flex items-center gap-3">
                    <Crown className="h-8 w-8 text-[#F2C35B]" />
                    <span>
                        <span className="block font-black text-[#F2F7FB]">ggege PRO</span>
                        <span className="block text-xs font-bold text-[#9AA7B0]">Ранний доступ со скидкой</span>
                    </span>
                </span>
                <span className="text-sm font-black text-[#F2C35B]">Узнать ›</span>
            </Link>
            )}

            {/* Слева — абонемент DDX, справа — пицца Додо. */}
            <div className="grid grid-cols-2 gap-3">
                <Link href="/gym" className="flex flex-col items-center gap-2 rounded-xl border-2 border-[#F47B20]/60 bg-[#033F48] p-3 text-center hover:border-[#F47B20]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/ddx/ddx-logo.svg" alt="DDX" className="h-16 w-16 rounded-lg" />
                    <span className="text-sm font-black leading-tight text-[#F2F7FB]">Собери абонемент</span>
                    <span className="text-xs font-bold text-[#9AA7B0]">Кусочки: {ddx.pieces.length}/9{ddx.promoCode ? ' · собран!' : ''}</span>
                    <span className="text-sm font-black text-[#F47B20]">Открыть ›</span>
                </Link>
                <Link href="/trainer" className="flex flex-col items-center gap-2 rounded-xl border-2 border-[#F2C35B]/60 bg-[#2A1F12] p-3 text-center hover:border-[#F2C35B]">
                    <span className="relative h-16 w-16">
                        {Array.from({ length: MAX_PIZZA_SLICES }, (_, k) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={k} src={`/pizzaSVG/pizza_8_${k + 1}.svg`} alt="" className="absolute inset-0 h-full w-full" style={k < pizzaCount ? undefined : { filter: 'grayscale(1)', opacity: 0.3 }} />
                        ))}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-black leading-tight text-[#F2F7FB]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/dodo-icon.svg" alt="" className="h-4 w-4" />
                        Пицца Додо
                    </span>
                    <span className="text-xs font-bold text-[#9AA7B0]">
                        Кусочки: {userProgress.pizzaSlices}/{MAX_PIZZA_SLICES}{userProgress.pizzaEighths > 0 ? ' + доля' : ''}
                    </span>
                    {userProgress.dodoPromoCode ? (
                        <code className="rounded bg-[#151F23] px-2 py-0.5 text-xs font-black text-[#F2C35B]">{userProgress.dodoPromoCode}</code>
                    ) : (
                        <span className="text-sm font-black text-[#F2C35B]">Собрать ›</span>
                    )}
                </Link>
            </div>

            {invite && <ReferralCard inviteCode={invite.code} defaultSubject={learnSubjectOf(userProgress.activeCourse?.title)} />}

            <ParentBindCode userId={userProgress.userId} userName={userProgress.userName} />

            <LogoutButton />
        </div>
    )
}

export default AccountPage
