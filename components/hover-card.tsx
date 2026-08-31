import { MessageCircleQuestion } from "lucide-react"
import dynamic from "next/dynamic"
import LottieCoins from '@/public/Lottie/LottieCoins.json'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

const TELEGRAM_USERNAME = 'michaeldeve'

type Props = {
    challengeId: number
}

export function NoRightAnswer({ challengeId }: Props) {
  // Автоссылка t.me с уже подставленным номером задания — пользователю
  // остаётся только дописать сам ответ и отправить.
  const prefilledText = `Задание №${challengeId}: мой ответ — `
  const telegramLink = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(prefilledText)}`

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Нет правильного ответа?"
          className="flex items-center justify-center w-6 h-6 rounded-full text-[#9AA7B0] hover:text-[#F2F7FB] hover:bg-[#232F34] transition-colors"
        >
          <MessageCircleQuestion className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[320px] gap-3">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-lg">Ничего себе!</DialogTitle>
          <DialogDescription className="text-sm">
            Напишите нам в Telegram — укажем номер задания за вас, получите вознаграждение!
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 -my-1">
          <Lottie className="h-9 w-9 shrink-0" animationData={LottieCoins} loop={false} />
          <span className="text-xs text-[#9AA7B0]">Задание №{challengeId}</span>
        </div>

        <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button variant="primary" className="w-full">
            Написать в Telegram
          </Button>
        </a>
      </DialogContent>
    </Dialog>
  )
}
