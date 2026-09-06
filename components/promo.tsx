'use client'

// import Image from "next/image"
import dynamic from "next/dynamic"
import { Button } from "./ui/button"
import Link from "next/link"
import { Clock } from "lucide-react"
// import LottieAnimationFine from '@/public/LottieProgressFine.json'
// import LottieAnimationLate from '@/public/LottieProgressLate.json'
import LottieKapiGood1 from '@/public/Lottie/LottieKapiGood1.json'
// import LottieKapiCry from '@/public/Lottie/LottieKapiCry.json'
// import LottieKapiAngry from '@/public/Lottie/LottieKapiAngry.json'
import LottieKapiSad1 from '@/public/Lottie/LottieKapiSad1.json'
// import LottieTriangle3 from '@/public/Lottie/hints/Triangle3.json'
// import LottieCroco from '@/public/Lottie/characters/LottieCroco.json'

// import LegoDetail from '@/public/Lego/LegoDetail.json'
// import AETriangle from '@/public/Lottie/hints/AETriangle.json'

// Статический import "lottie-react" здесь падал на SSR при холодном
// старте dev-сервера ("document is not defined" — lottie-react трогает
// document на уровне модуля, 'use client' сам по себе SSR модуля не
// исключает) — тот же класс бага, что уже чинили в TrainerMascot.tsx/
// question-bubble.tsx этим же способом.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

type Props= {
    YourDaysLate: number
    formattedDate: string
}

export const Promo = ({
    YourDaysLate,
    formattedDate,
}: Props) => {

    let sendMsg:string = ''

    const lastNumber:number = Math.abs(YourDaysLate) % 10
    let finalWord:string = ''
    if (lastNumber == 1) {
        finalWord = 'день'
    } else if ([2, 3, 4].includes(lastNumber)){
        finalWord = 'дня'
    } else if ([5, 6, 7, 8, 9, 0].includes(lastNumber)){
        finalWord = 'дней'
    }

    let isLate = false
    if (YourDaysLate > 0) {
	    sendMsg = "Опаздываете на"
        isLate = true
	} else {
		sendMsg = "Опережаете на"
        YourDaysLate = - YourDaysLate
	}

  // Дизайн приведён к тому же языку, что и "Квест дня"
  // (components/trainer-quest-card.tsx) — тёмная карточка
  // rounded-xl/border-[#3A464E]/bg-[#151F23], маскот-Lottie 9×9 рядом с
  // заголовком, большое число вынесено в цветную пилюлю (амбер/фиолет-
  // язык проекта был бы неверным сигналом здесь — "опаздываете" это
  // тревога, "опережаете" похвала, поэтому rose/violet), а не отдельная
  // растянутая на всю ширину кнопка с одним числом внутри.
  return (
    <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 shrink-0 -my-1">
                    <Lottie
                        animationData={isLate ? LottieKapiSad1 : LottieKapiGood1}
                        loop
                        autoplay
                    />
                </div>
                <h3 className="font-bold text-lg text-[#F2F7FB] truncate">
                    {sendMsg}
                </h3>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full shrink-0 ${isLate ? 'bg-rose-500/15' : 'bg-violet-500/15'}`}>
                <span className={`text-xs font-bold whitespace-nowrap ${isLate ? 'text-rose-400' : 'text-violet-300'}`}>
                    {YourDaysLate} {finalWord}
                </span>
            </div>
        </div>

        {/* Тот же формат "дедлайн-строки", что и в "Квест дня"
            (Clock-иконка + текст, дата — акцентом справа) */}
        <div className={`flex items-center gap-1.5 text-xs ${isLate ? 'text-rose-400' : 'text-[#9AA7B0]'}`}>
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Будете готовы к экзамену</span>
            <span className="ml-auto font-bold text-[#F2F7FB]">{formattedDate}</span>
        </div>

        <Button
            asChild
            className="w-full"
            variant='super'
            size='lg'
        >
            <Link href="/progress">
                Прогресс
            </Link>
        </Button>
    </div>
  )
}
