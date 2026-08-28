'use client'

import Image from "next/image"

type Props = {
    missedCIds: number[]
    variant: "casual" | "trainer"
}

export const HwTopBanner = ({
    missedCIds,
    variant,
}: Props) => {

    if (variant === 'trainer') {
        // Пустое ДЗ здесь никак не показываем (раньше был зелёный баннер
        // на белом фоне — не в тон тёмной теме тренажёра, просто убрали).
        if (missedCIds.length === 0) return null

        return (
            <div className="mx-auto w-fit max-w-[280px]">
                <div className="flex items-center gap-3 rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm px-4 py-3">
                    <Image
                        src="/hwSvgs/friesW.svg"
                        height={36}
                        width={36}
                        alt="Домашнее задание"
                    />
                    <div className="text-left">
                        <p className="text-sm font-bold text-amber-600">ДЗ: реши {missedCIds.length}</p>
                        <p className="text-xs text-slate-400">Не пропусти дедлайн</p>
                    </div>
                </div>
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
