// app/lesson/card.tsx

import { challenges } from "@/db/schema"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useCallback } from "react"
import { useKey } from "react-use"

type Props = {
    id: number
    imageSrc: string | null
    text: string
    shortcut: string
    selected?: boolean
    onClick: () => void
    disabled?: boolean
    status?: "correct" | "wrong" | "none"  
    type: typeof challenges.$inferSelect["type"]
    isDoneWrongChallenge: boolean
}

export const Card = ({
    id,
    imageSrc,
    text,
    shortcut,
    selected,
    onClick,
    status,
    disabled,
    type,
    isDoneWrongChallenge,
}: Props) => {
    const handleClick = useCallback(() => {
        if (disabled) return
        onClick()
    }, [disabled, onClick])

    useKey(shortcut, handleClick, {}, [handleClick])

    return (
        <div
            onClick={handleClick}
            className={cn(
                'h-full border-2 rounded-xl bg-[#161F23] border-[#3A464E] hover:bg-[#1A252B] p-4 lg:p-6 cursor-pointer transition-colors',
                selected && "border-[#3E6883] bg-[#5183A4] hover:bg-[#5183A4]",
                selected && status === "correct" && "border-[#53692C] bg-[#678337] hover:bg-[#678337]",
                selected && status === "wrong" && "border-[#A3423E] bg-[#C8524E] hover:bg-[#C8524E]",
                disabled && "pointer-events-none hover:bg-[#161F23]",
                isDoneWrongChallenge && "border-[#A3423E] bg-[#C8524E] hover:bg-[#C8524E]",
                type === "ASSIST" && "lg:p-3 w-full"
            )}
        >
            {imageSrc && (
                <div className="relative aspect-square mb-4 max-h-[80px] lg:max-h-[100px] w-full mx-auto">
                    <Image
                        src={imageSrc}
                        fill
                        className="object-contain"
                        alt={text}
                    />
                </div>
            )}

            <div className={cn(
                "flex items-center justify-between",
                type === "ASSIST" && "flex-row-reverse",
            )}>
                {type === "ASSIST" && <div />}

                <p className={cn(
                    "text-[#F2F7FB] text-sm lg:text-base text-center flex-1",
                    (selected || isDoneWrongChallenge) && "text-white",
                )}>
                    {text}
                </p>

                <div className={cn(
                    "lg:w-[30px] lg:h-[30px] w-[20px] h-[20px] flex items-center justify-center rounded-lg text-[#9AA7B0]/70 lg:text-[15px] text-xs font-semibold",
                    (selected || isDoneWrongChallenge) && "text-white/70",
                )}>
                    {shortcut}
                </div>
            </div>
        </div>
    )
}


