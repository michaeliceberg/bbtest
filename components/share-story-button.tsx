'use client';

// components/share-story-button.tsx
//
// "Поделиться в сторис": рисует вертикальную картинку 1080×1920 прямо в
// браузере (canvas) — лого, заголовок, крупная строка (позывной/результат),
// строка приза, QR-код со ссылкой и "Сможешь круче?". Затем отдаёт файл в
// системное меню "Поделиться" (сторис, Телеграм и т.п.), а если телефон не
// умеет делиться файлами — скачивает картинку. Серверу ничего не шлём.

import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Camera } from 'lucide-react';

export type StoryCardData = {
	title: string;      // мелкая строка сверху: "Мой позывной", "Урок пройден!"
	big: string;        // крупно: позывной или результат
	prize?: string;     // "Выбил 🍕 1 кусочек пиццы"
	caption?: string;   // над QR, по умолчанию "Сможешь круче? Сканируй 👇"
	url: string;        // куда ведёт QR
};

const W = 1080;
const H = 1920;
const LOGO_PURPLE = '#A74CE8';
const LOGO_GREEN = '#22A22F';

const loadImage = (src: string) =>
	new Promise<HTMLImageElement | null>((resolve) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => resolve(null);
		img.src = src;
	});

// Перенос по словам под заданную ширину.
const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
	const words = text.split(' ');
	const lines: string[] = [];
	let line = '';
	for (const w of words) {
		const test = line ? `${line} ${w}` : w;
		if (ctx.measureText(test).width > maxWidth && line) {
			lines.push(line);
			line = w;
		} else line = test;
	}
	if (line) lines.push(line);
	return lines;
};

const glow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
	const g = ctx.createRadialGradient(x, y, 0, x, y, r);
	g.addColorStop(0, `${color}66`);
	g.addColorStop(1, `${color}00`);
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
};

const FONT = `-apple-system, "Segoe UI", Roboto, "Nunito", sans-serif`;

export const renderStoryCard = async (data: StoryCardData, qrCanvas: HTMLCanvasElement | null): Promise<Blob | null> => {
	const canvas = document.createElement('canvas');
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;

	ctx.fillStyle = '#131D22';
	ctx.fillRect(0, 0, W, H);
	glow(ctx, 150, 250, 800, LOGO_PURPLE);
	glow(ctx, 950, 1650, 850, LOGO_GREEN);

	const logo = await loadImage('/ggegelogo.svg');
	if (logo) {
		const lw = 420;
		const lh = (logo.height / logo.width) * lw || 210;
		ctx.drawImage(logo, (W - lw) / 2, 150, lw, lh);
	}

	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';

	ctx.fillStyle = '#9AA7B0';
	ctx.font = `700 54px ${FONT}`;
	ctx.fillText(data.title, W / 2, 520);

	ctx.fillStyle = '#F2F7FB';
	ctx.font = `900 108px ${FONT}`;
	const bigLines = wrap(ctx, data.big, W - 140).slice(0, 3);
	let y = 660;
	for (const l of bigLines) {
		ctx.fillText(l, W / 2, y);
		y += 124;
	}

	if (data.prize) {
		ctx.font = `800 60px ${FONT}`;
		const pw = Math.min(W - 120, ctx.measureText(data.prize).width + 100);
		roundRect(ctx, (W - pw) / 2, y + 10, pw, 110, 55);
		ctx.fillStyle = 'rgba(167, 76, 232, 0.25)';
		ctx.fill();
		ctx.strokeStyle = LOGO_PURPLE;
		ctx.lineWidth = 5;
		ctx.stroke();
		ctx.fillStyle = '#F2F7FB';
		ctx.fillText(data.prize, W / 2, y + 86);
	}

	// QR — белая карточка внизу.
	const qrSize = 460;
	const boxPad = 40;
	const boxY = 1250;
	ctx.fillStyle = '#F2F7FB';
	ctx.font = `800 56px ${FONT}`;
	ctx.fillText(data.caption ?? 'Сможешь круче? Сканируй 👇', W / 2, boxY - 50);
	roundRect(ctx, (W - qrSize) / 2 - boxPad, boxY, qrSize + boxPad * 2, qrSize + boxPad * 2, 48);
	ctx.fillStyle = '#FFFFFF';
	ctx.fill();
	if (qrCanvas) ctx.drawImage(qrCanvas, (W - qrSize) / 2, boxY + boxPad, qrSize, qrSize);

	ctx.fillStyle = '#9AA7B0';
	ctx.font = `700 48px ${FONT}`;
	ctx.fillText('ggege.ru', W / 2, H - 70);

	return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
};

// Рисует картинку и отдаёт её в меню "Поделиться" (или скачивает).
export const shareStoryImage = async (data: StoryCardData, qrCanvas: HTMLCanvasElement | null) => {
	const blob = await renderStoryCard(data, qrCanvas);
	if (!blob) return;
	const file = new File([blob], 'ggege.png', { type: 'image/png' });
	if (navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file], text: `${data.big} — ${data.url}` });
		} catch { /* закрыли меню — ок */ }
		return;
	}
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'ggege.png';
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

type Props = {
	data: StoryCardData;
	label?: string;
	className?: string;
};

export const ShareStoryButton = ({ data, label = 'Поделиться в сторис', className }: Props) => {
	const qrWrapRef = useRef<HTMLDivElement>(null);
	const [busy, setBusy] = useState(false);

	const share = async () => {
		if (busy) return;
		setBusy(true);
		try {
			await shareStoryImage(data, qrWrapRef.current?.querySelector('canvas') ?? null);
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<div ref={qrWrapRef} className="hidden" aria-hidden>
				<QRCodeCanvas value={data.url} size={460} marginSize={1} />
			</div>
			<button
				type="button"
				onClick={share}
				disabled={busy}
				className={className ?? 'w-full h-12 rounded-2xl bg-[#232F34] text-[#F2F7FB] font-bold border-2 border-b-4 border-[#3A464E] active:border-b-2 flex items-center justify-center gap-2 disabled:opacity-60'}
			>
				<Camera className="h-5 w-5" />
				{busy ? 'Готовлю картинку…' : label}
			</button>
		</>
	);
};
