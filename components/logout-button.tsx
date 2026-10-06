'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export const LogoutButton = () => (
    <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="w-full h-12 rounded-xl border-2 border-b-4 border-[#A9453F] bg-[#DC605B] text-white font-extrabold uppercase tracking-wide flex items-center justify-center gap-2 active:border-b-2 transition-colors hover:bg-[#E5706B]"
    >
        <LogOut className="h-5 w-5" />
        Выйти из аккаунта
    </button>
)
