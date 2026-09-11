'use client';

// app/test/[subject]/diagnostic-client.tsx
//
// Интерактивный флоу анонимного диагностического теста: интро → вопросы
// (клик по варианту → мгновенная подсветка верно/неверно → авто-переход) →
// результат (процент, слабая тема со ссылкой прямо в тренажёр, шеринг,
// мягкий сбор телефона в двух точках со skip, промокод после отправки).

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Latex from 'react-latex-next';
import Image from 'next/image';
import { ChevronRight, Loader2, Phone, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitDiagnosticLead } from '@/actions/diagnostic';
import { DIAGNOSTIC_SUBJECT_LABEL, shuffle, type DiagnosticQuestion, type DiagnosticSubject } from '@/lib/diagnostic';
import {
	LOTTIE_TEST_RESULT_GOOD_LIST,
	LOTTIE_TEST_RESULT_ZERO,
	LOTTIE_TEST_INTRO,
	LOTTIE_TEST_PIZZA,
	getRandomLottie,
} from '@/src/constants/lottieConstants';
import dynamic from 'next/dynamic';

const LoginDialog = dynamic(() => import('@/components/login-dialog').then((m) => ({ default: m.LoginDialog })), { ssr: false });
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type Phase = 'intro' | 'quiz' | 'result';

type AnsweredQuestion = {
	question: DiagnosticQuestion;
	correct: boolean;
};

type Props = {
	subject: DiagnosticSubject;
	questions: DiagnosticQuestion[];
	utm: { source: string | null; medium: string | null; campaign: string | null };
};

const CORRECT_COLOR = '#A1D151';
const WRONG_COLOR = '#DC605B';

export const DiagnosticClient = ({ subject, questions, utm }: Props) => {
	const router = useRouter();
	const { data: session } = useSession();

	const [phase, setPhase] = useState<Phase>('intro');
	// "Начать" в 50% случаев на монтировании становится "Я ПОБЕДЮ" — старт
	// ВСЕГДА "Начать" (совпадает на сервере и клиенте), переключение только
	// после mount через useEffect, чтобы не словить hydration mismatch (тот
	// же класс бага, что уже не раз ловили в проекте на случайном тексте).
	const [startLabel, setStartLabel] = useState('Начать');
	useEffect(() => {
		if (Math.random() < 0.5) setStartLabel('Я ПОБЕДЮ');
	}, []);
	const [index, setIndex] = useState(0);
	const [selected, setSelected] = useState<string | null>(null);
	const [checked, setChecked] = useState(false);
	const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);

	const [phoneSkippedOnce, setPhoneSkippedOnce] = useState(false);
	const [leadSubmitted, setLeadSubmitted] = useState(false);
	const [promoCode, setPromoCode] = useState<string | null>(null);
	const [phoneInput, setPhoneInput] = useState('');
	const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);
	const [phoneError, setPhoneError] = useState<string | null>(null);
	const [showSecondAsk, setShowSecondAsk] = useState(false);
	const [loginOpen, setLoginOpen] = useState(false);

	// Опции текущего вопроса перемешиваются один раз на вопрос (не на
	// каждый ре-рендер), иначе порядок скакал бы при подсветке ответа.
	const shuffledOptions = useMemo(() => {
		const q = questions[index];
		return q ? shuffle(q.options) : [];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [index]);

	const currentQuestion = questions[index];

	const handlePick = (optionText: string) => {
		if (checked) return;
		setSelected(optionText);
		setChecked(true);
		const isCorrect = currentQuestion.options.find((o) => o.text === optionText)?.correct ?? false;
		setAnswered((prev) => [...prev, { question: currentQuestion, correct: isCorrect }]);

		setTimeout(() => {
			if (index + 1 < questions.length) {
				setIndex((i) => i + 1);
				setSelected(null);
				setChecked(false);
			} else {
				setPhase('result');
			}
		}, 900);
	};

	const score = answered.filter((a) => a.correct).length;

	// Ролик экрана результата — выбирается ОДИН раз при первом попадании на
	// result (не на каждый ре-рендер): ни одного верного ответа → "final
	// dojd", иначе случайно "final theend"/"final spasibo".
	const [resultLottieData, setResultLottieData] = useState<unknown>(null);
	useEffect(() => {
		if (phase === 'result' && !resultLottieData) {
			setResultLottieData(score === 0 ? LOTTIE_TEST_RESULT_ZERO : getRandomLottie(LOTTIE_TEST_RESULT_GOOD_LIST));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [phase]);

	const weakTopic = useMemo(() => {
		const byTopic = new Map<string, { title: string; firstTLessonId: number | null; correct: number; total: number; lastOrder: number }>();
		for (const a of answered) {
			const key = a.question.tUnitTitle;
			const entry = byTopic.get(key) ?? {
				title: a.question.tUnitTitle,
				firstTLessonId: a.question.firstTLessonId,
				correct: 0,
				total: 0,
				lastOrder: a.question.order,
			};
			entry.total += 1;
			if (a.correct) entry.correct += 1;
			entry.lastOrder = Math.max(entry.lastOrder, a.question.order);
			byTopic.set(key, entry);
		}
		const topics = [...byTopic.values()];
		if (topics.length === 0) return null;
		// Худшая тема — самое низкое отношение верных к всего, при равенстве — самая "поздняя" (обычно сложнее)
		topics.sort((a, b) => a.correct / a.total - b.correct / b.total || b.lastOrder - a.lastOrder);
		return topics[0];
	}, [answered]);

	const isPerfect = score === questions.length;

	const ctaTopic = weakTopic; // при идеальном результате — тоже показываем последнюю (самую сложную) тему как "закрепить"

	const goToTrainer = () => {
		if (!ctaTopic?.firstTLessonId) return;
		if (session?.user?.id) {
			router.push(`/t-lesson/${ctaTopic.firstTLessonId}`);
		} else {
			setLoginOpen(true);
		}
	};

	const handleCtaClick = () => {
		if (!leadSubmitted && phoneSkippedOnce) {
			setShowSecondAsk(true);
			return;
		}
		goToTrainer();
	};

	const submitPhone = async () => {
		const digits = phoneInput.replace(/\D/g, '');
		if (digits.length < 10) {
			setPhoneError('Проверьте номер телефона');
			return;
		}
		setPhoneError(null);
		setIsSubmittingPhone(true);
		try {
			const { promoCode } = await submitDiagnosticLead({
				subject,
				phone: phoneInput,
				score,
				totalQuestions: questions.length,
				weakUnitTitle: weakTopic?.title ?? null,
				utmSource: utm.source,
				utmMedium: utm.medium,
				utmCampaign: utm.campaign,
			});
			setPromoCode(promoCode);
			setLeadSubmitted(true);
			setShowSecondAsk(false);
		} catch (e) {
			setPhoneError('Не получилось отправить, попробуйте ещё раз');
		} finally {
			setIsSubmittingPhone(false);
		}
	};

	const handleShare = async () => {
		const url = typeof window !== 'undefined' ? window.location.href.split('?')[0] + '?utm_source=share' : '';
		const text = `Прошёл диагностику по предмету «${DIAGNOSTIC_SUBJECT_LABEL[subject]}»: ${score} из ${questions.length}. Проверь себя!`;
		if (typeof navigator !== 'undefined' && (navigator as any).share) {
			try {
				await (navigator as any).share({ title: 'ggege — диагностика', text, url });
				return;
			} catch {
				// пользователь отменил — просто откатываемся на телеграм-ссылку ниже
			}
		}
		window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
	};

	return (
		<div className="min-h-screen bg-[#0F171A] text-[#F2F7FB] flex flex-col items-center px-4 py-8">
			<div className="w-full max-w-md">
				{phase === 'intro' && (
					<div className="text-center flex flex-col items-center gap-4 mt-10">
						<Lottie animationData={LOTTIE_TEST_INTRO} loop autoplay className="w-32 h-32" />
						<h1 className="text-2xl font-extrabold">{DIAGNOSTIC_SUBJECT_LABEL[subject]}</h1>
						<p className="text-[#9AA7B0]">
							{questions.length} вопросов, около {Math.max(2, Math.round(questions.length * 0.5))} минут. Узнайте, к чему готовы уже сейчас — и что стоит подтянуть.
						</p>
						<div className="flex items-center justify-center gap-2">
							<Lottie animationData={LOTTIE_TEST_PIZZA} loop autoplay className="w-10 h-10 shrink-0" />
							<p className="text-[#9AA7B0] font-semibold">Так же вы можете выиграть пиццу!</p>
						</div>
						<Button variant="primary" size="lg" className="w-full mt-4" onClick={() => setPhase('quiz')}>
							{startLabel}
						</Button>
					</div>
				)}

				{phase === 'quiz' && currentQuestion && (
					<div>
						<div className="flex items-center gap-2 mb-6">
							<div className="h-2 flex-1 bg-[#232F34] rounded-full overflow-hidden">
								<div
									className="h-full bg-violet-400 transition-all duration-300"
									style={{ width: `${((index + (checked ? 1 : 0)) / questions.length) * 100}%` }}
								/>
							</div>
							<span className="text-xs text-[#9AA7B0] shrink-0">{index + 1}/{questions.length}</span>
						</div>

						<div className="text-lg font-semibold mb-4 leading-snug">
							<Latex>{currentQuestion.question}</Latex>
						</div>

						{currentQuestion.imageSrc && (
							<Image
								className="mx-auto w-full max-w-[420px] h-auto max-h-[32vh] object-contain mb-4"
								src={`/trainer-images/${currentQuestion.imageSrc}`}
								alt=""
								height={280}
								width={420}
							/>
						)}

						<div className={`grid gap-3 ${shuffledOptions.length % 2 === 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
							{shuffledOptions.map((opt) => {
								const isSelected = selected === opt.text;
								const showAsCorrect = checked && opt.correct;
								const showAsWrong = checked && isSelected && !opt.correct;
								return (
									<button
										key={opt.text}
										disabled={checked}
										onClick={() => handlePick(opt.text)}
										className="rounded-xl border-2 border-b-4 px-4 py-3 text-left transition-colors disabled:opacity-100"
										style={{
											borderColor: showAsCorrect ? CORRECT_COLOR : showAsWrong ? WRONG_COLOR : '#3A464E',
											backgroundColor: showAsCorrect ? `${CORRECT_COLOR}22` : showAsWrong ? `${WRONG_COLOR}22` : '#161F23',
											color: showAsCorrect ? CORRECT_COLOR : showAsWrong ? WRONG_COLOR : '#F2F7FB',
										}}
									>
										<Latex>{opt.text}</Latex>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{phase === 'result' && ctaTopic && (
					<div className="flex flex-col gap-6">
						{resultLottieData ? (
							<Lottie animationData={resultLottieData} loop autoplay className="w-full max-w-[280px] h-auto mx-auto" />
						) : null}

						<div className="text-center">
							<p className="text-sm text-[#9AA7B0]">Ваш результат</p>
							<p className="text-4xl font-extrabold mt-1">{score} из {questions.length}</p>
							<p className="text-[#9AA7B0] mt-1">{Math.round((score / questions.length) * 100)}% готовности</p>
						</div>

						<div className="rounded-xl border-2 border-[#3A464E] bg-[#151F23] p-4">
							<p className="text-sm text-[#9AA7B0] mb-1">{isPerfect ? 'Отлично справились! Закрепите ещё дальше:' : 'Стоит подтянуть тему:'}</p>
							<p className="font-bold mb-3">{ctaTopic.title}</p>
							<Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2" onClick={handleCtaClick}>
								Попробовать бесплатно
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>

						<Button variant="default" size="lg" className="w-full flex items-center justify-center gap-2" onClick={handleShare}>
							<Share2 className="h-4 w-4" />
							Поделиться результатом
						</Button>

						{!leadSubmitted && !phoneSkippedOnce && (
							<PhoneCaptureCard
								phoneInput={phoneInput}
								setPhoneInput={setPhoneInput}
								onSubmit={submitPhone}
								onSkip={() => setPhoneSkippedOnce(true)}
								isSubmitting={isSubmittingPhone}
								error={phoneError}
							/>
						)}

						{promoCode && (
							<div className="rounded-xl border-2 border-violet-400/40 bg-violet-400/10 p-4 text-center">
								<p className="text-sm text-[#9AA7B0] mb-1">Ваш промокод на скидку 20%</p>
								<p className="text-2xl font-extrabold tracking-widest text-violet-300">{promoCode}</p>
							</div>
						)}

						{showSecondAsk && (
							<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowSecondAsk(false)}>
								<div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
									<PhoneCaptureCard
										title="Последний шанс на скидку 20%"
										phoneInput={phoneInput}
										setPhoneInput={setPhoneInput}
										onSubmit={submitPhone}
										onSkip={goToTrainer}
										skipLabel="Нет, просто перейти →"
										isSubmitting={isSubmittingPhone}
										error={phoneError}
									/>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			<LoginDialog open={loginOpen} onOpenChange={setLoginOpen} callbackUrl={ctaTopic?.firstTLessonId ? `/t-lesson/${ctaTopic.firstTLessonId}` : '/learn'} />
		</div>
	);
};

type PhoneCaptureCardProps = {
	title?: string;
	phoneInput: string;
	setPhoneInput: (v: string) => void;
	onSubmit: () => void;
	onSkip: () => void;
	skipLabel?: string;
	isSubmitting: boolean;
	error: string | null;
};

const PhoneCaptureCard = ({
	title = 'Оставьте номер — получите скидку 20% на первый месяц',
	phoneInput,
	setPhoneInput,
	onSubmit,
	onSkip,
	skipLabel = 'Пропустить →',
	isSubmitting,
	error,
}: PhoneCaptureCardProps) => (
	<div className="rounded-xl border-2 border-[#3A464E] bg-[#151F23] p-4">
		<div className="flex items-center gap-2 mb-3">
			<Phone className="h-4 w-4 text-violet-400 shrink-0" />
			<p className="text-sm font-semibold">{title}</p>
		</div>
		<input
			type="tel"
			inputMode="tel"
			placeholder="+7 999 999-99-99"
			value={phoneInput}
			onChange={(e) => setPhoneInput(e.target.value)}
			className="w-full rounded-lg bg-[#0F171A] border-2 border-[#3A464E] px-3 py-2 text-[#F2F7FB] mb-1 outline-none focus:border-violet-400"
		/>
		{error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
		<Button variant="primary" size="lg" className="w-full mt-2 flex items-center justify-center gap-2" onClick={onSubmit} disabled={isSubmitting}>
			{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Получить скидку'}
		</Button>
		<button onClick={onSkip} className="w-full text-center text-xs text-[#9AA7B0] mt-2 hover:text-[#F2F7FB]">
			{skipLabel}
		</button>
	</div>
);
