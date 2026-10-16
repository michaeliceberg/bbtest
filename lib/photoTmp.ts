import 'server-only'
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

// Временное хранение фото задачи для «Билда на задачу». С хостинга в России соединение к прокси
// Anthropic (Cloudflare) рвётся, если тело запроса больше ~30 КБ (проверено 2026-10-16: 30 КБ проходит,
// 40 КБ — обрыв ECONNRESET). Поэтому фото не кладём в запрос base64, а отдаём по одноразовой ссылке
// (/api/photo-tmp/<id>) — Anthropic скачивает его сам. Файл удаляется сразу после разбора.

const DIR = path.join(os.tmpdir(), 'ggege-photo')
const TTL_MS = 10 * 60 * 1000
export const PHOTO_TMP_ID_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export const PHOTO_TMP_TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

export const photoTmpPath = (id: string) => path.join(DIR, id)

export const savePhotoTmp = async (b64: string, mediaType: string): Promise<string> => {
    await fs.mkdir(DIR, { recursive: true })
    // заодно подчищаем забытые файлы (если разбор упал и не удалил свой)
    const now = Date.now()
    for (const f of await fs.readdir(DIR).catch(() => [] as string[])) {
        const st = await fs.stat(path.join(DIR, f)).catch(() => null)
        if (st && now - st.mtimeMs > TTL_MS) await fs.rm(path.join(DIR, f), { force: true })
    }
    const id = `${randomUUID()}.${EXT[mediaType] ?? 'jpg'}`
    await fs.writeFile(path.join(DIR, id), Buffer.from(b64, 'base64'))
    return id
}

export const deletePhotoTmp = (id: string) => fs.rm(path.join(DIR, id), { force: true })
