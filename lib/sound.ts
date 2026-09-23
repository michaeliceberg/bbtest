// lib/sound.ts
//
// Простой переиспользуемый проигрыватель коротких звуковых эффектов
// (клики по вариантам, барабан кейса и т.п.) — по одному закэшированному
// `Audio`-экземпляру на файл (не пересоздаётся на каждый клик, тот же
// принцип, что уже используется в app/hooks/useQuizAudio.ts для correct/
// incorrect.wav). `currentTime` сбрасывается перед каждым play() — быстрые
// повторные клики проигрывают звук заново, а не обрываются на середине.
// Ошибки автовоспроизведения (браузер иногда блокирует play() без
// свежего user gesture) молча игнорируются, как и везде в проекте.

const cache = new Map<string, HTMLAudioElement>()

export function playSound(src: string, volume = 1) {
    if (typeof window === 'undefined') return
    let audio = cache.get(src)
    if (!audio) {
        audio = new Audio(src)
        cache.set(src, audio)
    }
    audio.volume = volume
    audio.currentTime = 0
    audio.play().catch(() => {})
}
