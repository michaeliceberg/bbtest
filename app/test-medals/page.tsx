// Тестовая страница: варианты оформления медали юнита на баннере (выбирает пользователь).
/* eslint-disable @next/next/no-img-element */
type Kind = 'bronze' | 'silver' | 'gold'
type V = { n: number; title: string; white?: boolean; shine?: boolean; pin?: boolean; float?: boolean; shadow?: boolean; noPin?: boolean }

const VARIANTS: V[] = [
    { n: 1, title: 'Как сейчас: чёрная обводка', shadow: true },
    { n: 2, title: 'Белая обводка (стикер)', white: true, shadow: true },
    { n: 3, title: 'Чёрная обводка + блик раз в 4,5 с', shine: true, shadow: true },
    { n: 4, title: 'Белая обводка + блик', white: true, shine: true, shadow: true },
    { n: 5, title: '«Наколота» на баннер: тень вниз-вправо + булавка', white: true, pin: true },
    { n: 6, title: 'Белая + блик + «наколота»', white: true, shine: true, pin: true },
    { n: 8, title: 'Выбрано: чёрная обводка + блик + тень вниз-вправо (как в приложении)', shine: true, pin: true, noPin: true },
    { n: 7, title: 'Белая + блик + лёгкое покачивание', white: true, shine: true, float: true, shadow: true },
]

const src = (k: Kind, white?: boolean) => `/medals/medal-${k}${white ? '-white' : ''}.webp`

const Medal = ({ k, v, size }: { k: Kind; v: V; size: number }) => {
    const s = src(k, v.white)
    const shadow = v.pin
        ? 'drop-shadow(5px 7px 0 rgba(0,0,0,0.28)) drop-shadow(2px 3px 2px rgba(0,0,0,0.25))'
        : v.shadow ? 'drop-shadow(0 2px 0 rgba(0,0,0,0.35))' : 'none'
    return (
        <span className={`relative inline-block ${v.float ? 'medal-float' : ''}`} style={{ width: size, height: size, rotate: v.pin && !v.noPin ? '-6deg' : undefined }}>
            <img src={s} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: shadow }} draggable={false} />
            {v.shine && (
                <span className="medal-shine" style={{ WebkitMaskImage: `url(${s})`, maskImage: `url(${s})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
            )}
            {v.pin && !v.noPin && (
                <span className="absolute left-1/2 top-[14%] h-3 w-3 -translate-x-1/2 rounded-full"
                    style={{ background: 'radial-gradient(circle at 35% 30%, #FF8A8A, #C62828 60%, #7A1010)', boxShadow: '1px 2px 2px rgba(0,0,0,.45)' }} />
            )}
        </span>
    )
}

const Banner = ({ title, color, k, v }: { title: string; color: string; k: Kind; v: V }) => (
    <div className="flex items-center justify-between rounded-3xl px-5 py-3"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 6px 0 ${color}99` }}>
        <span className="text-xl font-extrabold text-white">{title}</span>
        <span className="flex items-center gap-3"><Medal k={k} v={v} size={80} /><span className="text-2xl text-white">›</span></span>
    </div>
)

export default function TestMedalsPage() {
    return (
        <div className="min-h-screen bg-[#161F23] px-4 py-6 text-white">
            <h1 className="mb-1 text-2xl font-black">Медали — варианты</h1>
            <p className="mb-6 text-sm text-[#9AA7B0]">Подписи «Бронза/Серебро/Золото» уже убраны. Выбери номер варианта.</p>
            <div className="mx-auto flex max-w-2xl flex-col gap-8">
                {VARIANTS.map((v) => (
                    <section key={v.n} className="flex flex-col gap-3">
                        <h2 className="text-lg font-black">{v.n}. {v.title}</h2>
                        <Banner title="Теорема Виета" color="#78C93C" k="bronze" v={v} />
                        <Banner title="Логарифмы" color="#53ADEF" k="silver" v={v} />
                        <Banner title="Окружность" color="#C385F7" k="gold" v={v} />
                        <div className="flex items-center gap-4 rounded-xl bg-[#1E2A30] px-4 py-2 text-sm text-[#9AA7B0]">
                            В меню: {(['bronze', 'silver', 'gold'] as Kind[]).map((k) => <Medal key={k} k={k} v={v} size={44} />)}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
