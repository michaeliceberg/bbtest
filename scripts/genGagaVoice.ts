// scripts/genGagaVoice.ts
//
// Озвучка банка реплик Га-Га (lib/gagaVoice.ts) в public/gaga-voice/<id>.mp3 голосом ElevenLabs.
// Ключ не хранится в репозитории ggege: передаётся переменной окружения при запуске, например
//   ELEVENLABS_API_KEY=... ELEVENLABS_API_BASE=https://elevenlabs-proxy.abziceberg.workers.dev npx tsx scripts/genGagaVoice.ts
// Уже озвученные файлы пропускаются (перегенерировать — удалить файл). FORCE=1 — перегенерировать всё.

import fs from 'node:fs'
import path from 'node:path'
import { GAGA_LINES } from '../lib/gagaVoice'

const BASE = process.env.ELEVENLABS_API_BASE || 'https://api.elevenlabs.io'
const VOICE = process.env.GAGA_VOICE_ID || 'dABPButoaSloTSZcHPof'
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_v4'
const KEY = process.env.ELEVENLABS_API_KEY
const OUT = path.join(process.cwd(), 'public', 'gaga-voice')

async function main() {
    if (!KEY) throw new Error('Нет ELEVENLABS_API_KEY')
    fs.mkdirSync(OUT, { recursive: true })
    for (const l of GAGA_LINES) {
        const file = path.join(OUT, `${l.id}.mp3`)
        if (fs.existsSync(file) && !process.env.FORCE) { console.log('есть', l.id); continue }
        const r = await fetch(`${BASE}/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: l.text, model_id: MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        })
        if (!r.ok || !r.headers.get('content-type')?.startsWith('audio/')) {
            console.error('ошибка', l.id, r.status, (await r.text()).slice(0, 300))
            process.exitCode = 1
            break
        }
        fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
        console.log('ok', l.id)
    }
}
main()
