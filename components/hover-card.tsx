import { MessageCircleQuestion, Send } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const TELEGRAM_USERNAME = 'michaeldeve'

type Props = {
    challengeId: number
}

// Раньше заголовок модалки ("Ничего себе!") и монетка-Lottie никак не
// объясняли, ПО ПОВОДУ ЧЕГО открылось это окно — пользователь кликал на
// "?" рядом с задачей и видел непонятный тост про вознаграждение. Текст
// переписан так, чтобы заголовок буквально повторял вопрос, на который
// отвечает иконка-триггер ("Нет правильного ответа?") — сразу понятно,
// что это форма жалобы на конкретную задачу, а не что-то про бонусы.
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
          <DialogTitle className="text-lg">Нет правильного ответа?</DialogTitle>
          <DialogDescription className="text-sm">
            Отправьте сообщение с правильным ответом в Telegram — мы проверим и поправим задание №{challengeId}.
          </DialogDescription>
        </DialogHeader>

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
