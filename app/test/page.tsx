// app/test/page.tsx
//
// Единая точка входа в диагностический тест — выбор предмета (физика
// слева, математика справа), затем переход на /test/physics|math. Вся
// интерактивность (случайные Lottie, выбор) — на клиенте, см.
// test-picker-client.tsx.

import { TestPickerClient } from './test-picker-client';

type Props = {
	searchParams: { utm_source?: string; utm_medium?: string; utm_campaign?: string };
};

export default function TestPickerPage({ searchParams }: Props) {
	return (
		<TestPickerClient
			utm={{
				source: searchParams.utm_source ?? null,
				medium: searchParams.utm_medium ?? null,
				campaign: searchParams.utm_campaign ?? null,
			}}
		/>
	);
}
