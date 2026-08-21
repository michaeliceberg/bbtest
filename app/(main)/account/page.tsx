// app/(main)/account/page.tsx

import { auth } from '@/lib/server-auth'
import { getUserProgress } from '@/db/queries'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AccountLinking } from '@/components/account-linking'
import { FaceBuilder } from '@/components/face-builder'
import { NameEditor } from '@/components/name-editor'
import { ParentBindCode } from '@/components/parent-bind-code'

const AccountPage = async () => {
    const session = await auth()
    if (!session?.user) redirect('/')

    const userProgress = await getUserProgress()
    if (!userProgress) redirect('/')

    return (
        <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-8">
            <div>
                <h1 className="text-2xl font-bold text-[#F2F7FB] mb-1">Настройки</h1>
                <p className="text-sm text-[#9AA7B0]">Профиль, вход в аккаунт и родительский доступ.</p>
            </div>

            <div>
                <h2 className="font-bold text-lg text-[#F2F7FB] mb-3">Профиль</h2>
                <div className="flex flex-col gap-4">
                    <NameEditor currentName={userProgress.userName} />
                    <FaceBuilder currentAvatar={userProgress.userImageSrc} />
                </div>
            </div>

            <div>
                <h2 className="font-bold text-lg text-[#F2F7FB] mb-1">Способы входа</h2>
                <p className="text-sm text-[#9AA7B0] mb-3">
                    Привяжите несколько способов входа, чтобы заходить в свой аккаунт с разных устройств.
                </p>
                <Suspense fallback={null}>
                    <AccountLinking />
                </Suspense>
            </div>

            <ParentBindCode userId={userProgress.userId} userName={userProgress.userName} />
        </div>
    )
}

export default AccountPage
