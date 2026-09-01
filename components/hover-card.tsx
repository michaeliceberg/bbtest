import { Send } from "lucide-react"
import dynamic from "next/dynamic"
import LottieGems from '@/public/Lottie/LottieGems.json'

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

// Заголовок модалки буквально повторяет вопрос, на который отвечает сам
// триггер ("Нет правильного ответа?") — сразу понятно, что это форма
// жалобы на конкретную задачу. Триггер — снова текстовая кнопка (не
// голая иконка "?"), по просьбе пользователя: иконка одна не объясняла,
// что на неё вообще стоит нажимать. Награда — гемы (LottieGems, тот же
// файл, что уже крутится в шапке и в магазине), не монеты — просьба
// заменить именно на гемы.
export function NoRightAnswer({ challengeId }: Props) {
  // Автоссылка t.me с уже подставленным номером задания — пользователю
  // остаётся только дописать сам ответ и отправить.
  const prefilledText = `Задание №${challengeId}: мой ответ — `
  const telegramLink = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(prefilledText)}`

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Форма — та же, что у клавиш KEYBOARD (app/lesson/keyboard-input.tsx):
            rounded-xl (не пилюля), border-2 border-b-4/active:border-b-2 —
            узнаваемая "псевдо-3D" кнопка вместо круглого бейджа. Без
            иконки слева (убрана по просьбе пользователя). */}
        <button
          type="button"
          className="px-3 py-1.5 rounded-xl bg-[#161F23] border-2 border-b-4 active:border-b-2 border-[#3A464E] text-[#9AA7B0] hover:text-[#F2F7FB] hover:bg-[#232F34] transition-colors text-xs font-bold"
        >
          Нет правильного ответа?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[320px] gap-3">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-lg">Нет правильного ответа?</DialogTitle>
          <DialogDescription className="text-sm">
            Отправьте сообщение с правильным ответом в Telegram к заданию №{challengeId}. И вы получите награду!
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center -my-1">
          <Lottie className="h-16 w-16" animationData={LottieGems} loop />
        </div>

        <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button variant="primary" className="w-full gap-2">
            <Send className="w-4 h-4" />
            Отправить в Telegram
          </Button>
        </a>
      </DialogContent>
    </Dialog>
  )
}
