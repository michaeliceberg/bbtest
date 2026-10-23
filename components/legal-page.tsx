// components/legal-page.tsx — общая вёрстка юридических страниц (/offer, /privacy): тёмный фон,
// ширина для чтения, пункты с номерами.
import Link from 'next/link'

export const LegalPage = ({ title, updatedAt, children }: { title: string; updatedAt: string; children: React.ReactNode }) => (
    <article className='w-full max-w-2xl px-4 py-10 text-[15px] leading-relaxed text-[#C9D3D9]'>
        <h1 className='text-2xl sm:text-3xl font-extrabold text-white'>{title}</h1>
        <p className='mt-2 text-sm text-[#7F8C93]'>Редакция от {updatedAt}</p>
        <div className='mt-8 flex flex-col gap-7'>{children}</div>
        <p className='mt-10 text-sm text-[#7F8C93]'>
            <Link href='/offer' className='underline hover:text-white'>Оферта</Link>
            {' · '}
            <Link href='/privacy' className='underline hover:text-white'>Политика обработки персональных данных</Link>
        </p>
    </article>
)

export const LegalSection = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <section>
        <h2 className='text-lg font-bold text-white'>{n}. {title}</h2>
        <div className='mt-2 flex flex-col gap-2'>{children}</div>
    </section>
)
