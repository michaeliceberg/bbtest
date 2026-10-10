'use client'

// components/no-video-popout.tsx — убирает кнопки «видео в отдельном окне», которые Opera (и др.)
// рисуют поверх видео-реакций в уроках. Ставит всем <video> на странице disablePictureInPicture
// (и новым, появившимся позже). Подключён один раз в app/layout.tsx.
import { useEffect } from 'react'

const mark = (root: ParentNode) => {
    root.querySelectorAll('video:not([disablepictureinpicture])').forEach((v) => {
        v.setAttribute('disablepictureinpicture', '')
        v.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback')
        ;(v as HTMLVideoElement & { disablePictureInPicture?: boolean }).disablePictureInPicture = true
    })
}

export const NoVideoPopout = () => {
    useEffect(() => {
        mark(document)
        // Не чаще раза за кадр: печать текста в уроках даёт много мелких изменений DOM.
        let queued = false
        const obs = new MutationObserver(() => {
            if (queued) return
            queued = true
            requestAnimationFrame(() => { queued = false; mark(document) })
        })
        obs.observe(document.body, { childList: true, subtree: true })
        return () => obs.disconnect()
    }, [])
    return null
}
