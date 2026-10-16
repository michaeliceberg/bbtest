import { promises as fs } from 'fs'
import { PHOTO_TMP_ID_RE, PHOTO_TMP_TYPES, photoTmpPath } from '@/lib/photoTmp'

export const dynamic = 'force-dynamic'

// Одноразовая ссылка на фото задачи — её скачивает Anthropic (см. lib/photoTmp.ts).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const id = params.id
    if (!PHOTO_TMP_ID_RE.test(id)) return new Response('Not found', { status: 404 })
    try {
        const buf = await fs.readFile(photoTmpPath(id))
        return new Response(buf, { headers: { 'Content-Type': PHOTO_TMP_TYPES[id.split('.').pop()!], 'Cache-Control': 'no-store' } })
    } catch {
        return new Response('Not found', { status: 404 })
    }
}
