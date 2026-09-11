'use client';

// app/test/test-picker-client.tsx
//
// Экран выбора предмета для анонимного диагностического теста: слева
// физика (голубой акцент), справа математика (фиолетовый) — у каждой
// стороны свой случайный Lottie (серый и не играет, пока сторона не
// выбрана; цветной и в цикле, когда выбрана), снизу овальная
// кнопка-переключатель в цвет предмета. "Погнали" ведёт на /test/{subject}
// с сохранением utm.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { LOTTIE_TEST_PICKER_LIST, getDistinctRandomLotties } from '@/src/constants/lottieConstants';
import { Button } from '@/components/ui/button';
import type { DiagnosticSubject } from '@/lib/diagnostic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type Props = {
	utm: { source: string | null; medium: string | null; campaign: string | null };
};

type ColorScheme = { fill: string; border: string; text: string };

// Физика — голубой (тот же акцент, что уже используют диаграммы физики/
// геометрии по всему проекту, см. public/geometry/*), математика —
// фиолетовый (уже был здесь изначально, не менялся).
const PHYSICS_COLORS: ColorScheme = { fill: '#38BDF8', border: '#0284C7', text: '#0F171A' };
const MATH_COLORS: ColorScheme = { fill: '#A78BFA', border: '#7C3AED', text: '#0F171A' };

const SUBJECTS: { key: DiagnosticSubject; label: string; colors: ColorScheme }[] = [
	{ key: 'physics', label: 'Физика', colors: PHYSICS_COLORS },
	{ key: 'math', label: 'Математика', colors: MATH_COLORS },
];

export const TestPickerClient = ({ utm }: Props) => {
	const router = useRouter();
	// useState(() => ...) — безопасно даже при SSR-рендере этого клиентского
	// компонента, т.к. само значение уходит только в <Lottie>, который
	// смонтирован через dynamic(ssr:false) и в серверный HTML не попадает
	// вообще (тот же принцип, что уже используется для inProgressMascot в
	// components/trainer-quest-card.tsx).
	const [[leftLottie, rightLottie]] = useState(() => getDistinctRandomLotties(LOTTIE_TEST_PICKER_LIST, 2));
	const [selected, setSelected] = useState<DiagnosticSubject | null>(null);

	const goStart = () => {
		if (!selected) return;
		const params = new URLSearchParams();
		if (utm.source) params.set('utm_source', utm.source);
		if (utm.medium) params.set('utm_medium', utm.medium);
		if (utm.campaign) params.set('utm_campaign', utm.campaign);
		const qs = params.toString();
		router.push(`/test/${selected}${qs ? `?${qs}` : ''}`);
	};

	return (
		<div className="min-h-screen bg-[#0F171A] text-[#F2F7FB] flex flex-col items-center px-4 py-8">
			<div className="w-full flex flex-col items-center gap-2 mb-4">
				<Image src="/ggegelogo.svg" alt="ggege" height={96} width={192} className="h-24 w-48" />
				<span className="text-3xl font-extrabold tracking-wide text-[#9AA7B0]">GGEGE.RU</span>
			</div>

			<div className="flex-1 w-full flex flex-col items-center justify-center">
				<h1 className="text-2xl font-extrabold mb-8 text-center">Выбери тест:</h1>

				<div className="w-full max-w-lg grid grid-cols-2 gap-4">
					{SUBJECTS.map((s, i) => (
						<SubjectColumn
							key={s.key}
							lottieData={i === 0 ? leftLottie : rightLottie}
							label={s.label}
							colors={s.colors}
							isSelected={selected === s.key}
							onSelect={() => setSelected(s.key)}
						/>
					))}
				</div>

				<Button
					variant="secondary"
					size="lg"
					className="w-full max-w-lg mt-10"
					disabled={!selected}
					onClick={goStart}
				>
					Погнали
				</Button>
			</div>
		</div>
	);
};

type SubjectColumnProps = {
	lottieData: unknown;
	label: string;
	colors: ColorScheme;
	isSelected: boolean;
	onSelect: () => void;
};

const SubjectColumn = ({ lottieData, label, colors, isSelected, onSelect }: SubjectColumnProps) => (
	<button onClick={onSelect} className="flex flex-col items-center gap-4 group">
		<div
			className="w-full aspect-square rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-colors"
			style={{ borderColor: isSelected ? colors.fill : '#3A464E', backgroundColor: '#151F23' }}
		>
			<div
				className="w-full h-full transition-all duration-300"
				style={{ filter: isSelected ? 'none' : 'grayscale(1)', opacity: isSelected ? 1 : 0.45 }}
			>
				{/* key меняет идентичность узла при смене выбора — гарантированно
				  сбрасывает анимацию на первый кадр у невыбранной стороны и
				  запускает её заново с начала у выбранной. */}
				<Lottie key={isSelected ? 'on' : 'off'} animationData={lottieData} autoplay={isSelected} loop />
			</div>
		</div>

		<div
			className="w-full rounded-full border-2 border-b-4 px-4 py-3 text-center font-bold uppercase tracking-wide transition-colors active:border-b-2"
			style={
				isSelected
					? { backgroundColor: colors.fill, borderColor: colors.border, color: colors.text }
					: { backgroundColor: '#161F23', borderColor: '#3A464E', color: '#F2F7FB' }
			}
		>
			{label}
		</div>
	</button>
);
