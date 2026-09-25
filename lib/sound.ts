// lib/sound.ts
//
// Проигрыватель коротких звуковых эффектов (клики, барабан кейса, молнии).
//
// Основной путь — Web Audio API: preloadSound() заранее скачивает и
// РАСКОДИРУЕТ файл в AudioBuffer, и playSound() стартует его практически
// мгновенно. HTMLAudioElement.play() давал заметную задержку (0,1–0,3 с,
// в Safari на iPhone больше) — звук молнии отставал от анимации.
// Если буфер ещё не готов (не успел загрузиться) или Web Audio недоступен —
// фолбэк на закэшированный HTMLAudioElement, как раньше.
//
// AudioContext в браузерах стартует «приостановленным» до первого жеста
// пользователя — при первом касании/клике/клавише он возобновляется
// (unlockAudio), чтобы потом звуки, запущенные не прямо из обработчика клика
// (молния на 5 подряд, барабан после ответа), играли без блокировки.

const elementCache = new Map<string, HTMLAudioElement>()
const bufferCache = new Map<string, AudioBuffer>()
const loading = new Map<string, Promise<AudioBuffer | null>>()

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (ctx) return ctx
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    // iOS 17+: тип аудиосессии «воспроизведение» — иначе Web Audio на iPhone
    // молчит при включённом беззвучном режиме (а прежние <audio> играли).
    const nav = navigator as unknown as { audioSession?: { type: string } }
    if (nav.audioSession) {
        try {
            nav.audioSession.type = 'playback'
        } catch {
            /* нет поддержки — не критично */
        }
    }
    ctx = new Ctor()
    const unlock = () => {
        if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {})
    }
    // На iOS контекст надёжно разблокируется только в touchend/click — слушаем всё.
    ;['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'].forEach((ev) =>
        window.addEventListener(ev, unlock, { passive: true }),
    )
    return ctx
}

function loadBuffer(src: string): Promise<AudioBuffer | null> {
    const existing = loading.get(src)
    if (existing) return existing
    const c = getContext()
    if (!c) return Promise.resolve(null)
    const p = fetch(src)
        .then((r) => r.arrayBuffer())
        .then(
            (data) =>
                // Промис-форма decodeAudioData есть не во всех старых Safari —
                // используем колбэк-форму, она работает везде.
                new Promise<AudioBuffer>((resolve, reject) => c.decodeAudioData(data, resolve, reject)),
        )
        .then((buf) => {
            bufferCache.set(src, buf)
            return buf
        })
        .catch(() => null)
    loading.set(src, p)
    return p
}

function playElement(src: string, volume: number) {
    let audio = elementCache.get(src)
    if (!audio) {
        audio = new Audio(src)
        elementCache.set(src, audio)
    }
    audio.volume = volume
    audio.currentTime = 0
    audio.play().catch(() => {})
}

export function playSound(src: string, volume = 1) {
    if (typeof window === 'undefined') return
    const c = getContext()
    const buf = bufferCache.get(src)
    if (c && buf) {
        if (c.state !== 'running') c.resume().catch(() => {})
        const node = c.createBufferSource()
        node.buffer = buf
        const gain = c.createGain()
        gain.gain.value = volume
        node.connect(gain).connect(c.destination)
        node.start()
        return
    }
    // Буфер ещё не готов — играем обычным способом и заодно грузим буфер
    // на следующий раз.
    playElement(src, volume)
    void loadBuffer(src)
}

// Заранее скачать и раскодировать звук, чтобы первый play() был мгновенным
// (звуки молний и барабана — при открытии урока тренажёра).
export function preloadSound(src: string) {
    if (typeof window === 'undefined') return
    void loadBuffer(src)
}

// Сыграть звук и узнать, когда он закончился (окна-мемы закрываются по концу
// звука). Возвращает stop() — остановить без вызова onEnded. Если звук не
// удалось запустить — onEnded вызывается сразу, чтобы окно не «зависло».
export function playSoundTracked(src: string, onEnded?: () => void, volume = 1): () => void {
    if (typeof window === 'undefined') return () => {}
    let stopped = false
    const done = () => {
        if (!stopped) onEnded?.()
    }
    const c = getContext()
    const buf = bufferCache.get(src)
    if (c && buf) {
        if (c.state !== 'running') c.resume().catch(() => {})
        const node = c.createBufferSource()
        node.buffer = buf
        const gain = c.createGain()
        gain.gain.value = volume
        node.connect(gain).connect(c.destination)
        node.onended = done
        node.start()
        return () => {
            stopped = true
            try {
                node.stop()
            } catch {
                /* уже остановлен */
            }
        }
    }
    const audio = new Audio(src)
    audio.volume = volume
    audio.onended = done
    audio.play().catch(done)
    void loadBuffer(src)
    return () => {
        stopped = true
        audio.onended = null
        audio.pause()
    }
}
