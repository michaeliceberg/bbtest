'use client'

import Image from "next/image"
import { Check } from "lucide-react"

type Props = {
    missedCIds: number[]
    variant: "casual" | "trainer"
}

export const HwTopBanner = ({
    missedCIds,
    variant,
}: Props) => {

    if (variant === 'trainer') {
        return (
            <div className="mx-auto w-fit max-w-[280px]">
                {missedCIds.length > 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-game-border bg-game-card px-4 py-3">
                        <Image
                            src="/hwSvgs/friesW.svg"
                            height={36}
                            width={36}
                            alt="Домашнее задание"
                        />
                        <div className="text-left">
                            <p className="text-sm font-bold text-game-gold">ДЗ: реши {missedCIds.length}</p>
                            <p className="text-xs text-gray-400">Не пропусти дедлайн</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                        <Check className="h-4 w-4 text-emerald-400" />
                        <p className="text-sm font-bold text-emerald-400">ДЗ выполнено</p>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="content-center justify-center mx-auto text-center">
            {missedCIds.length > 0
                ? (
                    <section
                        style={{
                            width: "202px",
                            height: "65px",
                            backgroundImage: "url(/hwSvgs/ribbon.svg)",
                        }}
                        className="content-center justify-center mx-auto text-center"
                    >
                        <div className="justify-center w-[200px] text-lg font-bold p-1">
                            <div className="flex justify-center">
                                <p className="pt-2 pl-4 text-amber-900">
                                    ДЗ: реши {missedCIds.length}
                                </p>
                                <Image
                                    src="/hwSvgs/donut.svg"
                                    height={40}
                                    width={40}
                                    alt="Mascot"
                                    className="ml-2"
                                />
                            </div>
                        </div>
                    </section>
                )
                : (
                    <div className="mx-auto justify-center w-[200px] rounded-xl border-green-500 border-2 border-dashed text-lg font-bold p-1">
                        <div className="flex text-green-500 justify-center">
                            <p>
                                😍 ДЗ выполнено!
                            </p>
                        </div>
                    </div>
                )
            }
        </div>
    )
}
