'use client'

// components/referral-gate.tsx — гость пришёл по приглашению: сначала экран «Тебя позвал…»,
// а сам урок монтируется только по кнопке «ГААААЗ». Иначе урок (и анимация первой сцены)
// стартовал за экраном приветствия, и ученик попадал уже в середину сцены.
import { useState } from 'react'
import { ReferralWelcome } from '@/components/referral-screens'
import type { TrialSubject } from '@/lib/trialTracks'

export const ReferralGate = ({ inviterNickname, subject, topic, children }: { inviterNickname: string | null; subject: TrialSubject; topic?: string; children: React.ReactNode }) => {
    const [started, setStarted] = useState(false)
    return (
        <>
            {!started && <ReferralWelcome inviterNickname={inviterNickname} theme="cozy" subject={subject} topic={topic} onStart={() => setStarted(true)} />}
            {started && children}
        </>
    )
}
