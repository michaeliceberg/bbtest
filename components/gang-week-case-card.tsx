'use client';

// components/gang-week-case-card.tsx
//
// Приз за победу банды в недельной битве — редкий кейс (actions/gang-week.ts).
// Кнопка открывает тот же барабан CaseReel, что и в тренажёре.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { CaseReel } from '@/components/CaseReel';
import { claimGangWeekCase } from '@/actions/gang-week';
import { getLessonCasePool } from '@/lib/caseRewards';
import { useUiTheme } from '@/lib/uiTheme';

export const GangWeekCaseCard = () => {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const theme = useUiTheme();

	if (open) {
		return (
			<div className="fixed inset-0 z-50 overflow-y-auto bg-[#131D22]">
				<div className="max-w-xl mx-auto">
					<CaseReel
						theme={theme}
						isMega
						tier="rare"
						pool={getLessonCasePool('rare')}
						spinAction={claimGangWeekCase}
						onDone={() => {
							setOpen(false);
							router.refresh();
						}}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-xl border-2 border-amber-400/60 bg-amber-400/10 p-4 text-center space-y-3">
			<Trophy className="h-8 w-8 text-amber-300 mx-auto" />
			<p className="font-bold text-[#F2F7FB]">Твоя банда победила в битве недели!</p>
			<p className="text-sm text-[#C7D0D6]">Каждому участнику — редкий кейс 🎁</p>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="w-full h-12 rounded-2xl bg-amber-400 text-[#3A2A05] font-extrabold uppercase tracking-wide border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition"
			>
				Открыть кейс
			</button>
		</div>
	);
};
