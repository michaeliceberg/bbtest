// components/tg-send-msg-com.tsx — шлёт админу сообщение (через сервер, см. actions/notify-admin.ts).
'use client'

import React, { useEffect } from 'react'
import { notifyAdmin } from '@/actions/notify-admin'

type Props = {
    message: string
}

export const TgSendMsgCom = ({ message }: Props) => {
    useEffect(() => {
        notifyAdmin(message).catch(() => {})
    }, [message])
    return <div></div>
}
