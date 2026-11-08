// Сравнение стикеров: белая обводка (сейчас) и мягкая тень без обводки (как у гуся Мигеля).
// Новые картинки собирает docs/stickers/tools/soft_shadow.py, лежат в public/sticker-trials/.
const PAIRS = [
    { name: 'Дуэйн: подозревает', before: '/stickers/rock/rock-suspicious.webp', after: '/sticker-trials/rock-suspicious.webp' },
    { name: 'Дуэйн: бровь', before: '/stickers/rock/rock-eyebrow.webp', after: '/sticker-trials/rock-eyebrow.webp' },
    { name: 'Мем на ошибку', before: '/answer-meme-wrong/1.webp', after: '/sticker-trials/wrong-1.webp' },
    { name: 'Сол Гудман', before: '/more-memes/saul-6.webp', after: '/sticker-trials/saul-6.webp' },
    { name: 'Мем справа от фразы', before: '/more-memes/meme-1.webp', after: '/sticker-trials/meme-1.webp' },
    { name: 'Гусь (эталон)', before: '/miguel/miguel-base.webp', after: '/miguel/miguel-base.webp' },
]

const BGS = [
    { name: 'Фон приложения', color: '#161F23' },
    { name: 'Карточка', color: '#1E2A30' },
    { name: 'Светлый', color: '#E9E3D3' },
]

export default function TestStickerStyle() {
    return (
        <div className="min-h-screen bg-[#131D22] text-white p-4">
            <h1 className="text-2xl font-extrabold text-center mt-4">Стикеры: обводка или тень</h1>
            <p className="text-white/60 text-sm text-center mt-1">Слева — сейчас (белая обводка), справа — без обводки с мягкой тенью, как гусь.</p>
            {BGS.map((bg) => (
                <section key={bg.name} className="mt-6">
                    <h2 className="text-sm font-black uppercase tracking-wide text-white/60 mb-2">{bg.name}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PAIRS.map((p) => (
                            <div key={p.name} className="rounded-2xl p-3" style={{ background: bg.color }}>
                                <p className="text-xs font-bold mb-2" style={{ color: bg.color === '#E9E3D3' ? '#3A464E' : '#9AA7B0' }}>{p.name}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.before} alt="" className="w-full aspect-square object-contain" />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.after} alt="" className="w-full aspect-square object-contain" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
