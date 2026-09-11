'use client';

// app/test/test-picker-client.tsx
//
// Экран выбора предмета для анонимного диагностического теста: слева
// физика, справа математика — у каждой стороны свой случайный Lottie
// (серый и не играет, пока сторона не выбрана; цветной и в цикле, когда
// выбрана), снизу овальная кнопка-переключатель. "Погнали" ведёт на
// /test/{subject} с сохранением utm.

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

const SUBJECTS: { key: DiagnosticSubject; label: string }[] = [
	{ key: 'physics', label: 'Физика' },
	{ key: 'math', label: 'Математика' },
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
			<Image src="/ggegelogo.svg" alt="ggege" height={40} width={80} className="h-10 w-20 mb-6" />

			<h1 className="text-2xl font-extrabold mb-8 text-center">Выбери тест:</h1>

			<div className="w-full max-w-lg grid grid-cols-2 gap-4">
				<SubjectColumn
					lottieData={leftLottie}
					label="Физика"
					isSelected={selected === 'physics'}
					onSelect={() => setSelected('physics')}
				/>
				<SubjectColumn
					lottieData={rightLottie}
					label="Математика"
					isSelected={selected === 'math'}
					onSelect={() => setSelected('math')}
				/>
			</div>

			<Button
				variant="primary"
				size="lg"
				className="w-full max-w-lg mt-10"
				disabled={!selected}
				onClick={goStart}
			>
				Погнали
			</Button>
		</div>
	);
};

type SubjectColumnProps = {
	lottieData: unknown;
	label: string;
	isSelected: boolean;
	onSelect: () => void;
};

const SubjectColumn = ({ lottieData, label, isSelected, onSelect }: SubjectColumnProps) => (
	<button onClick={onSelect} className="flex flex-col items-center gap-4 group">
		<div
			className="w-full aspect-square rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-colors"
			style={{ borderColor: isSelected ? '#A78BFA' : '#3A464E', backgroundColor: '#151F23' }}
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
					? { backgroundColor: '#A78BFA', borderColor: '#7C3AED', color: '#0F171A' }
					: { backgroundColor: '#161F23', borderColor: '#3A464E', color: '#F2F7FB' }
			}
		>
			{label}
		</div>
	</button>
);
