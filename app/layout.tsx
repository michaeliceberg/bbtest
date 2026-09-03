// app/layout.tsx

import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import dynamic from 'next/dynamic';
import Script from 'next/script';

import { SessionProvider } from 'next-auth/react';
import { Providers } from '@/components/for-vk-auth/providers';

import React from 'react';

// Динамические импорты для client-only компонентов
const ExitModal = dynamic(() => import('@/components/modals/exit-modal').then(mod => ({ default: mod.ExitModal })), { ssr: false });
const HeartsModal = dynamic(() => import('@/components/modals/hearts-modal copy').then(mod => ({ default: mod.HeartsModal })), { ssr: false });
const PracticeModal = dynamic(() => import('@/components/modals/practice-modal').then(mod => ({ default: mod.PracticeModal })), { ssr: false });
const WrongAnswerModal = dynamic(() => import('@/components/modals/wronganswer-modal').then(mod => ({ default: mod.WrongAnswerModal })), { ssr: false });
const RightAnswerModal = dynamic(() => import('@/components/modals/rightanswer-modal').then(mod => ({ default: mod.RightAnswerModal })), { ssr: false });
const AchievementToastProvider = dynamic(() => import('@/components/achievement-toast-provider').then(mod => ({ default: mod.AchievementToastProvider })), { ssr: false });
const StreakCelebrationToastProvider = dynamic(() => import('@/components/streak-celebration-toast-provider').then(mod => ({ default: mod.StreakCelebrationToastProvider })), { ssr: false });
const LevelUpModalProvider = dynamic(() => import('@/components/level-up-modal-provider').then(mod => ({ default: mod.LevelUpModalProvider })), { ssr: false });
const QuestCompleteModalProvider = dynamic(() => import('@/components/quest-complete-modal-provider').then(mod => ({ default: mod.QuestCompleteModalProvider })), { ssr: false });

// variable — даёт стабильную CSS-переменную --font-nunito (в отличие от
// font.className, чьё имя класса — сгенерированный хэш, разный между
// сборками) — нужна, чтобы сослаться на этот же Nunito из app/globals.css
// (переопределение шрифта внутри KaTeX, см. там же).
const font = Nunito({ subsets: ['latin'], variable: '--font-nunito' });

export const metadata: Metadata = {
	title: 'ggege',
	description: 'Физико-математическая школа',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<head>
			</head>
			<body className={`${font.className} ${font.variable}`}>
				<Providers>
					{children}
				</Providers>
				<Toaster />
				<ExitModal />
				<RightAnswerModal />
				<WrongAnswerModal />
				<HeartsModal />
				<PracticeModal />
				<AchievementToastProvider />
				<StreakCelebrationToastProvider />
				<LevelUpModalProvider />
				<QuestCompleteModalProvider />
			</body>
		</html>
	);
}


