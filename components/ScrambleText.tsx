'use client';

// components/ScrambleText.tsx
//
// "Scramble text" эффект (как на motion.dev/examples/react-scramble-text):
// при смене пропа `text` символы сначала быстро перебирают случайные
// глифы (катакана — тот самый "иероглифический" вид), затем по очереди,
// слева направо со случайным разбросом, фиксируются на нужной букве.
// Первый рендер — сразу финальный текст, без анимации (нечего
// "перематывать" из пустоты, плюс исключает SSR/hydration-рассинхрон).

import { useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from 'framer-motion';

const SCRAMBLE_CHARS =
	'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('');

const randomChar = () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];

type CharPlan = { from: string; to: string; start: number; end: number };

type Props = {
	text: string;
	className?: string;
};

export const ScrambleText = ({ text, className }: Props) => {
	const [display, setDisplay] = useState(text);
	const prevText = useRef(text);
	const plan = useRef<CharPlan[] | null>(null);
	const frame = useRef(0);

	useEffect(() => {
		if (prevText.current === text) return;
		const from = prevText.current;
		const to = text;
		const length = Math.max(from.length, to.length);
		const next: CharPlan[] = [];
		for (let i = 0; i < length; i++) {
			// Разброс по позиции — левые буквы обычно фиксируются раньше правых,
			// но с достаточным случайным шумом, чтобы не выглядело механически.
			const start = i * 2 + Math.floor(Math.random() * 14);
			const end = start + 8 + Math.floor(Math.random() * 16);
			next.push({ from: from[i] ?? '', to: to[i] ?? '', start, end });
		}
		plan.current = next;
		frame.current = 0;
		prevText.current = text;
	}, [text]);

	useAnimationFrame(() => {
		const current = plan.current;
		if (!current) return;
		frame.current += 1;
		let output = '';
		let settled = 0;
		for (const c of current) {
			if (frame.current >= c.end) {
				output += c.to;
				settled += 1;
			} else if (frame.current >= c.start) {
				output += c.to === ' ' && c.from === ' ' ? ' ' : randomChar();
			} else {
				output += c.from;
			}
		}
		setDisplay(output);
		if (settled === current.length) plan.current = null;
	});

	return <span className={className}>{display}</span>;
};
