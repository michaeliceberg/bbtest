import { useMemo } from "react";
import { useKey, useMedia } from "react-use";
import { CheckCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { vibrate } from "@/lib/haptics";
import { pickNextButtonLabel } from "@/usefulFunctions";

type Props = {
    onCheck: () => void
    status: "correct" | "wrong" | "none" | "completed"
    disabled?: boolean
    lessonId?: number

}

export const Footer = ({
    onCheck,
    status,
    disabled,
    lessonId
}: Props) => {
    useKey('Enter', onCheck, {}, [onCheck])
    const isMobile = useMedia("(max-width: 1024px)")


    const doneRightArray = ['Это верный ответ!', 'Чиназес! Сюда, сюда..', 'Веррррно!', 'Гениально!', 'Легчайшая для Величайшего!']


    var randomDoneRight = doneRightArray[Math.floor(Math.random() * doneRightArray.length)];

    // Мотивационная подпись самой кнопки "Дальше" на верном ответе — по
    // просьбе пользователя (тот же список, что и в тренажёре, см.
    // usefulFunctions.ts). useMemo на [status] — фраза выбирается один раз
    // за переход в "correct", не перевыбирается на каждый посторонний
    // ре-рендер, пока статус не сменится (иначе кнопка бы "дёргалась").
    const nextButtonLabel = useMemo(() => pickNextButtonLabel("Дальше"), [status]);



    return (
        <footer className={cn(
            "py-3",
            status === "correct" && "bg-green-500/10",
            status === "wrong" && "bg-rose-500/10",
        )}>
            <div className="max-w-xl mx-auto flex flex-col gap-2 px-4">
                {status === "correct" && (
                    <div className="text-green-400 font-bold text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {randomDoneRight}
                    </div>
                )}
                {status === "wrong" && (
                    <div className="text-rose-400 font-bold text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        О нет, похоже ошибка!
                    </div>
                )}

                <div className="flex gap-3">
                    {status === "completed" && (
                        <Button
                            variant='default'
                            className="flex-1 h-14 lg:h-16 text-base"
                            size={isMobile ? "sm" : "lg"}
                            onClick={() => { vibrate('medium'); window.location.href = `/lesson/${lessonId}`; }}
                        >
                            Practice again
                        </Button>
                    )}
                    <Button
                        disabled={disabled}
                        className="w-full h-14 lg:h-16 text-base"
                        onClick={() => { vibrate('medium'); onCheck(); }}
                        size={isMobile ? "sm" : "lg"}
                        variant={status === "wrong" ? "danger" : "secondary"}
                    >
                        {status === "none" && "Ответить"}
                        {status === "correct" && nextButtonLabel}
                        {status === "wrong" && "Дальше"}
                        {status === "completed" && "Продолжить"}
                    </Button>
                </div>
            </div>
        </footer>
    )
}
