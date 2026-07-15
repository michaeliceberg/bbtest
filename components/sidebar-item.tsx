// components/sidebar-item.tsx

'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from './ui/button'
import { TransitionLink } from '@/utils/TransitionLink'

type Props = {
    label: string
    iconSrc: string
    href: string
}

export const SidebarItem = ({ label, iconSrc, href }: Props) => {
    const pathname = usePathname()
    const active = pathname === href
    
    return (
        <Button variant={active ? 'sidebarOutline' : 'sidebar'} className='justify-start h-[52px] w-full' asChild>
            <TransitionLink href={href}>
                <Image src={iconSrc} alt={label} className='mr-3' height={28} width={28} />
                <span className={active ? 'font-semibold' : ''}>{label}</span>
                {active && (
                    <div className="ml-auto w-1.5 h-6 bg-green-500 rounded-full" />
                )}
            </TransitionLink>
        </Button>
    )
}






// // components/sidebar-item.tsx

// 'use client';

// import Link from 'next/link'
// import { usePathname } from 'next/navigation'
// import { cn } from '@/lib/utils'
// import { ReactNode } from 'react'

// type Props = {
//     label: string
//     href: string
//     icon: ReactNode
//     description?: string
// }

// export const SidebarItem = ({ label, href, icon, description }: Props) => {
//     const pathname = usePathname()
//     const isActive = pathname === href || pathname?.startsWith(href + '/')
    
//     return (
//         <Link
//             href={href}
//             className={cn(
//                 'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
//                 isActive 
//                     ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-sm' 
//                     : 'text-[#9AA7B0] hover:bg-[#232F34] hover:text-[#F2F7FB]'
//             )}
//         >
//             <div className={cn(
//                 'transition-transform duration-200 group-hover:scale-110',
//                 isActive ? 'text-green-600' : 'text-[#9AA7B0]'
//             )}>
//                 {icon}
//             </div>
//             <div className="flex-1">
//                 <span className="font-medium">{label}</span>
//                 {description && (
//                     <p className="text-xs text-gray-400 hidden lg:block">{description}</p>
//                 )}
//             </div>
//             {isActive && (
//                 <div className="w-1.5 h-8 bg-green-500 rounded-full" />
//             )}
//         </Link>
//     )
// }



// // 'use client'

// // import Image from '@/node_modules/next/image'
// // import Link from '@/node_modules/next/link'
// // import { usePathname } from '@/node_modules/next/navigation'
// // import { Button } from './ui/button'
// // import { TransitionLink } from '@/utils/TransitionLink'

// // type Props = {
// // 	label: string
// // 	iconSrc: string
// // 	href: string
// // }

// // export const SidebarItem = ({ label, iconSrc, href }: Props) => {
// // 	const pathname = usePathname()
// // 	const active = pathname === href
// // 	return (
// // 		<Button variant={active ? 'sidebarOutline' : 'sidebar'} className='justify-start h-[52px]' asChild>
// // 			<TransitionLink href={href}>

			
// // 				<Image src={iconSrc} alt={label} className='mr-5' height={32} width={32} />
// // 				{label}
// // 			</TransitionLink>

// // 		</Button>
// // 	)
// // }
