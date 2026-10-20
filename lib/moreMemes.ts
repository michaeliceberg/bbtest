// Мемы-стикеры из public/more-memes (белая обводка, прозрачный фон).
// face — куда смотрит/показывает персонаж на исходной картинке (со стороны зрителя): 'left' | 'right' | 'center'.
// mood: wow — удивляется/«ого, правило», yay — радуется успеху.
export type MoreMeme = { src: string; face: 'left' | 'right' | 'center'; mood: 'wow' | 'yay' }

export const MORE_MEMES: MoreMeme[] = [
    { src: '/more-memes/meme-1.webp', face: 'right', mood: 'wow' },
    { src: '/more-memes/meme-2.webp', face: 'left', mood: 'yay' },
    { src: '/more-memes/meme-3.webp', face: 'center', mood: 'yay' },
    { src: '/more-memes/meme-4.webp', face: 'center', mood: 'wow' },
    { src: '/more-memes/meme-5.webp', face: 'center', mood: 'wow' },
    { src: '/more-memes/meme-6.webp', face: 'right', mood: 'wow' },
    { src: '/more-memes/meme7.webp', face: 'center', mood: 'wow' },
    { src: '/more-memes/meme8.webp', face: 'center', mood: 'wow' },
    { src: '/more-memes/meme9.webp', face: 'right', mood: 'yay' },
    { src: '/more-memes/meme-10.webp', face: 'left', mood: 'yay' },
    { src: '/more-memes/meme-11.webp', face: 'left', mood: 'wow' },
    { src: '/more-memes/meme-12.webp', face: 'left', mood: 'wow' },
    { src: '/more-memes/saul-1.webp', face: 'center', mood: 'wow' },
    { src: '/more-memes/saul-2.webp', face: 'center', mood: 'wow' },
    { src: '/more-memes/saul-3.webp', face: 'left', mood: 'yay' },
    { src: '/more-memes/saul-4.webp', face: 'left', mood: 'yay' },
    { src: '/more-memes/saul-5.webp', face: 'center', mood: 'yay' },
    { src: '/more-memes/saul-6.webp', face: 'left', mood: 'wow' },
    { src: '/more-memes/saul-7.webp', face: 'center', mood: 'wow' },
    { src: '/more-memes/saul-8.webp', face: 'center', mood: 'yay' },
]

let last = ''
export const pickMoreMeme = (mood?: MoreMeme['mood']) => {
    const pool = mood ? MORE_MEMES.filter((m) => m.mood === mood) : MORE_MEMES
    let m = pool[Math.floor(Math.random() * pool.length)]
    if (m.src === last && pool.length > 1) m = pool[(pool.indexOf(m) + 1) % pool.length]
    last = m.src
    return m
}

// Нужно ли отразить картинку, чтобы персонаж смотрел в сторону `toward`.
export const memeFlip = (m: MoreMeme, toward: 'left' | 'right') => m.face !== 'center' && m.face !== toward
