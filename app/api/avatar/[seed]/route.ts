// SVG-аватарка Multiavatar по ключу. Ключ не секретный и ничего не значит
// сам по себе, поэтому ответ можно кэшировать навсегда.

import multiavatar from '@multiavatar/multiavatar'
import { isValidAvatarSeed } from '@/lib/avatar'

export async function GET(_req: Request, { params }: { params: { seed: string } }) {
    const seed = decodeURIComponent(params.seed)
    if (!isValidAvatarSeed(seed)) return new Response('bad seed', { status: 400 })
    return new Response(multiavatar(seed), {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    })
}
