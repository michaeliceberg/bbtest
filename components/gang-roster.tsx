// components/gang-roster.tsx

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { setGangMemberRole, kickGangMember } from '@/actions/gang';
import { Crown, Shield, User, UserMinus, ShieldPlus, ShieldMinus } from 'lucide-react';

export type GangRosterMember = {
    userId: string;
    role: string;
    userName: string;
    ggStickers: number;
    questsTotal: number;
};

type Props = {
    gangId: number;
    members: GangRosterMember[];
    currentUserId: string;
    isLeader: boolean;
};

const ROLE_LABEL: Record<string, string> = { leader: 'Глава', kapo: 'Капо', member: 'Участник' };
const ROLE_ICON: Record<string, React.ElementType> = { leader: Crown, kapo: Shield, member: User };
const ROLE_COLOR: Record<string, string> = { leader: 'text-yellow-400', kapo: 'text-sky-400', member: 'text-[#9AA7B0]' };

export const GangRoster = ({ gangId, members, currentUserId, isLeader }: Props) => {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [busyUserId, setBusyUserId] = useState<string | null>(null);

    const runAction = (userId: string, action: () => Promise<unknown>) => {
        setBusyUserId(userId);
        startTransition(async () => {
            try {
                await action();
                router.refresh();
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Что-то пошло не так');
            } finally {
                setBusyUserId(null);
            }
        });
    };

    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-1">
            <h3 className="font-bold text-[#F2F7FB] mb-2">Состав банды ({members.length})</h3>
            {members.map((m) => {
                const RoleIcon = ROLE_ICON[m.role] ?? User;
                const isSelf = m.userId === currentUserId;
                const isMemberBusy = pending && busyUserId === m.userId;
                return (
                    <div key={m.userId} className="flex items-center gap-2 py-2 border-b border-[#232F34] last:border-0">
                        <RoleIcon className={`h-4 w-4 shrink-0 ${ROLE_COLOR[m.role] ?? ''}`} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-[#F2F7FB] truncate">{m.userName}{isSelf && ' (ты)'}</p>
                            <p className="text-xs text-[#9AA7B0]">{ROLE_LABEL[m.role] ?? m.role} · 🎴{m.ggStickers} · {m.questsTotal} квестов</p>
                        </div>
                        {isLeader && !isSelf && m.role !== 'leader' && (
                            <div className="flex items-center gap-1 shrink-0">
                                {m.role === 'member' ? (
                                    <Button
                                        size="sm"
                                        variant="secondaryOutline"
                                        disabled={isMemberBusy}
                                        onClick={() => runAction(m.userId, () => setGangMemberRole(gangId, m.userId, 'kapo'))}
                                        title="Сделать капо"
                                    >
                                        <ShieldPlus className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="secondaryOutline"
                                        disabled={isMemberBusy}
                                        onClick={() => runAction(m.userId, () => setGangMemberRole(gangId, m.userId, 'member'))}
                                        title="Снять капо"
                                    >
                                        <ShieldMinus className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="secondaryOutline"
                                    disabled={isMemberBusy}
                                    onClick={() => runAction(m.userId, () => kickGangMember(gangId, m.userId))}
                                    title="Выгнать из банды"
                                >
                                    <UserMinus className="h-4 w-4 text-rose-400" />
                                </Button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
