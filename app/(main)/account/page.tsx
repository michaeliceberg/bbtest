// app/(main)/account/page.tsx

import { auth } from '@/lib/server-auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AccountLinking } from '@/components/account-linking'

const AccountPage = async () => {
    const session = await auth()
    if (!session?.user) redirect('/')

    return (
        <div className="max-w-[600px] mx-auto pb-10">
            <h1 className="text-2xl font-bold text-[#F2F7FB] mb-1">Способы входа</h1>
            <p className="text-sm text-[#9AA7B0] mb-6">
                Привяжите несколько способов входа, чтобы заходить в свой аккаунт с разных устройств.
            </p>
            <Suspense fallback={null}>
                <AccountLinking />
            </Suspense>
        </div>
    )
}

export default AccountPage
