import { sendMessageToTelegram } from '@/utils/telegram'
import React, { useEffect } from 'react'

type Props = {
    message: string
}

export const TgSendMsgCom = ({message}: Props) => {


    useEffect(()=>{
        sendMessageToTelegram(message)
      }, [message])


  return (
    <div></div>
  )
}
