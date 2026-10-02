'use client'

// Тест облачка-мема после ответа (components/answer-meme-burst.tsx).
// Облачко вылетает из места, куда нажал.

import { AnswerMemeLayer, showAnswerMeme } from '@/components/answer-meme-burst'

const btn = 'rounded-xl px-5 py-4 font-black uppercase text-sm border-2 border-b-4 active:border-b-2'

export default function TestAnswerMemePage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#131D22] p-4 text-center">
			<AnswerMemeLayer />
			<p className="text-[#9AA7B0] font-bold max-w-sm">Жми кнопки в разных местах экрана — облачко вылетает из точки нажатия и исчезает через 2 секунды</p>
			<div className="grid grid-cols-2 gap-4 w-full max-w-md">
				<button className={btn + ' bg-[#DC605B22] border-[#DC605B] text-[#DC605B]'} onClick={() => showAnswerMeme(false)}>❌ Неверно</button>
				<button className={btn + ' bg-[#A1D15122] border-[#A1D151] text-[#A1D151]'} onClick={() => showAnswerMeme(true, { force: true })}>✅ Верно (всегда)</button>
			</div>
			<button className={btn + ' bg-[#232F34] border-[#3A464E] text-[#D5DEE5]'} onClick={() => showAnswerMeme(true)}>✅ Верно как в уроке (шанс 33%)</button>
			<div className="grid grid-cols-3 gap-3 w-full max-w-md mt-8">
				{Array.from({ length: 6 }, (_, i) => (
					<button key={i} className={btn + ' bg-[#161F23] border-[#3A464E] text-[#9AA7B0]'} onClick={() => showAnswerMeme(i % 2 === 0, { force: true })}>
						{i % 2 === 0 ? '✅' : '❌'} {i + 1}
					</button>
				))}
			</div>
		</div>
	)
}
