'use client';

// app/test/[subject]/diagnostic-client.tsx
//
// Интерактивный флоу анонимного диагностического теста: интро → вопросы
// (клик по варианту → мгновенная подсветка верно/неверно → авто-переход) →
// результат (процент, слабая тема со ссылкой прямо в тренажёр, мягкий сбор
// телефона в двух точках со skip, кейс-барабан с призом — пицца/гемы —
// после отправки, см. actions/open-diagnostic-case.ts).

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { ChevronRight, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrambleText } from '@/components/ScrambleText';
import { AnimatedOptionButton } from '@/components/AnimatedOptionButton';
import { TrainerMascot } from '@/components/TrainerMascot';
import { CaseReel } from '@/components/CaseReel';
import { submitDiagnosticLead } from '@/actions/diagnostic';
import { openDiagnosticCase } from '@/actions/open-diagnostic-case';
import { DIAGNOSTIC_CASE_POOL, rewardEmoji, rewardLabel, type CaseReward } from '@/lib/caseRewards';
import { DIAGNOSTIC_SUBJECT_LABEL, shuffle, type DiagnosticQuestion, type DiagnosticSubject } from '@/lib/diagnostic';
import {
	LOTTIE_TEST_RESULT_BEST_LIST,
	LOTTIE_TEST_RESULT_SOSO_LIST,
	LOTTIE_TEST_RESULT_BAD_LIST,
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

// Текст кнопки старта — по кругу, в этом порядке (см. обсуждение с
// пользователем, геймерский/зумерский сленг под настроение).
const START_LABELS = ['Я ПОБЕДЮ', 'ВПЕРЁД ВПЕРЁД ВПЕРЁД', 'ГАААААЗ', 'РАШИМ', 'ПОЕХАЛИ', 'ГРИНДИМ', 'ГЛ ХФ'];

// Мемные фразы экрана результата — по тиру (см. resultTier), одна случайно.
const BEST_PHRASES = ['ТЫ ОГОНЬ!', 'ИМБА!', 'ТЫ МАШИНА!', 'ЛЕГЕНДА!'];
const SOSO_PHRASES = ['НУ ТИПО ОКЭЙ', 'СОЙДЁТ'];
const BAD_PHRASES = ['ЭТО ДНО', 'ТИЛЬТ...', 'НАДО ФАРМИТЬ', 'РЕСПАВН И ЗАНОВО'];

export const DiagnosticClient = ({ subject, questions, utm }: Props) => {
	const router = useRouter();
	const { data: session } = useSession();
	const windowSize = useWindowSize();

	const [phase, setPhase] = useState<Phase>('intro');
	// Текст кнопки старта чередуется через scramble-эффект (ScrambleText) —
	// только пока виден интро-экран, чтобы не гонять таймер впустую на
	// остальных фазах.
	const [startLabelIndex, setStartLabelIndex] = useState(0);
	useEffect(() => {
		if (phase !== 'intro') return;
		const id = setInterval(() => {
			setStartLabelIndex((prev) => (prev + 1) % START_LABELS.length);
		}, 2600);
		return () => clearInterval(id);
	}, [phase]);
	const [index, setIndex] = useState(0);
	const [selected, setSelected] = useState<string | null>(null);
	const [checked, setChecked] = useState(false);
	const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);

	const [phoneSkippedOnce, setPhoneSkippedOnce] = useState(false);
	const [leadSubmitted, setLeadSubmitted] = useState(false);
	const [leadId, setLeadId] = useState<number | null>(null);
	const [wonReward, setWonReward] = useState<CaseReward | null>(null);
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

	// Тир результата по проценту верных: 100% — BEST, 50-99% — SOSO
	// (ровно половина намеренно считается "средне", не "дном" — в
	// исходном ТЗ границы ">50%"/"<50%" не покрывали случай "ровно
	// половина"), меньше 50% — BAD.
	const resultTier = useMemo<'best' | 'soso' | 'bad'>(() => {
		if (questions.length === 0) return 'bad';
		const ratio = score / questions.length;
		if (ratio === 1) return 'best';
		if (ratio >= 0.5) return 'soso';
		return 'bad';
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [score, questions.length]);

	// Ролик + фраза экрана результата — выбираются ОДИН раз при первом
	// попадании на result (не на каждый ре-рендер), из пула своего тира.
	const [resultLottieData, setResultLottieData] = useState<unknown>(null);
	const [resultPhrase, setResultPhrase] = useState<string | null>(null);
	useEffect(() => {
		if (phase !== 'result' || resultLottieData) return;
		if (resultTier === 'best') {
			setResultLottieData(getRandomLottie(LOTTIE_TEST_RESULT_BEST_LIST));
			setResultPhrase(BEST_PHRASES[Math.floor(Math.random() * BEST_PHRASES.length)]);
		} else if (resultTier === 'soso') {
			setResultLottieData(getRandomLottie(LOTTIE_TEST_RESULT_SOSO_LIST));
			setResultPhrase(SOSO_PHRASES[Math.floor(Math.random() * SOSO_PHRASES.length)]);
		} else {
			setResultLottieData(getRandomLottie(LOTTIE_TEST_RESULT_BAD_LIST));
			setResultPhrase(BAD_PHRASES[Math.floor(Math.random() * BAD_PHRASES.length)]);
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
			const { leadId } = await submitDiagnosticLead({
				subject,
				phone: phoneInput,
				score,
				totalQuestions: questions.length,
				weakUnitTitle: weakTopic?.title ?? null,
				utmSource: utm.source,
				utmMedium: utm.medium,
				utmCampaign: utm.campaign,
			});
			setLeadId(leadId);
			setLeadSubmitted(true);
			setShowSecondAsk(false);
		} catch (e) {
			setPhoneError('Не получилось отправить, попробуйте ещё раз');
		} finally {
			setIsSubmittingPhone(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#0F171A] text-[#F2F7FB] flex flex-col items-center px-4 py-8">
			<div className="w-full max-w-md flex-1 flex flex-col">
				{phase === 'intro' && (
					// Вертикально центрировано в доступной высоте — тот же приём, что
					// у "Выбери тест"-блока на предыдущей странице (/test), чтобы
					// верхний Lottie оказывался примерно на той же высоте экрана, где
					// на предыдущей странице была кнопка "Погнали".
					<div className="flex-1 text-center flex flex-col items-center justify-center gap-5">
						<Lottie animationData={LOTTIE_TEST_INTRO} loop autoplay className="w-48 h-48" />
						<h1 className="text-2xl font-extrabold">{DIAGNOSTIC_SUBJECT_LABEL[subject]}</h1>
						<p className="text-[#9AA7B0]">
							{questions.length} вопросов, около {Math.max(2, Math.round(questions.length * 0.5))} минут. Узнайте, к чему готовы уже сейчас — и что стоит подтянуть.
						</p>
						<div className="flex items-center justify-center gap-2">
							<Lottie animationData={LOTTIE_TEST_PIZZA} loop autoplay className="w-10 h-10 shrink-0" />
							<p className="text-[#9AA7B0] font-semibold">А еще вы можете выиграть пиццу!</p>
						</div>
						<Button variant="primary" size="lg" className="w-full h-14 mt-4 animate-cta-pulse" onClick={() => setPhase('quiz')}>
							<ScrambleText text={START_LABELS[startLabelIndex]} />
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

						{/* Тот же облако-маскот, что в обычном тренажёре (components/
						  TrainerMascot.tsx) — вместо голого текста вопроса. Эмоция
						  зафиксирована на "thinking" (верно/неверно уже показывают
						  сами кнопки варианта, отдельная эмоциональная реакция здесь
						  не нужна), taskMessage меняется на каждый новый вопрос. */}
						<div className="mb-4">
							<TrainerMascot
								emotion="thinking"
								lottieAnimations={{ default: LOTTIE_TEST_INTRO }}
								taskMessage={currentQuestion.question}
							/>
						</div>

						{currentQuestion.imageSrc && (
							<Image
								className="pt-1 mx-auto w-full max-w-[520px] h-auto max-h-[38vh] object-contain mb-4"
								src={`/trainer-images/${currentQuestion.imageSrc}`}
								alt=""
								height={320}
								width={520}
							/>
						)}

						{/* Та же кнопка варианта ответа, что в обычном тренажёре
						  (components/AnimatedOptionButton.tsx, см. type-assist.tsx) —
						  вместо самодельных <button>. */}
						<div className={`grid gap-3 ${shuffledOptions.length % 2 === 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
							{shuffledOptions.map((opt, idx) => (
								<AnimatedOptionButton
									key={opt.text}
									option={opt.text}
									index={idx}
									onClick={() => handlePick(opt.text)}
									isSelected={selected === opt.text}
									isCorrect={checked && opt.correct}
									isWrong={checked && selected === opt.text && !opt.correct}
									disabled={checked}
								/>
							))}
						</div>
					</div>
				)}

				{phase === 'result' && ctaTopic && (
					<div className="flex flex-col gap-6">
						{resultTier === 'best' && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={260} />}

						{resultLottieData ? (
							<Lottie animationData={resultLottieData} loop autoplay className="w-full max-w-[280px] h-auto mx-auto" />
						) : null}

						<div className="text-center">
							<p className="text-sm text-[#9AA7B0]">Ваш результат</p>
							<p className="text-4xl font-extrabold mt-1">{score} из {questions.length}</p>
							{resultPhrase && (
								<p
									className="text-xl font-extrabold mt-1"
									style={{ color: resultTier === 'best' ? '#A1D151' : resultTier === 'bad' ? '#DC605B' : '#F2C879' }}
								>
									{resultPhrase}
								</p>
							)}
						</div>

						<div className="rounded-xl border-2 border-[#3A464E] bg-[#151F23] p-4">
							<p className="text-sm text-[#9AA7B0] mb-1">{isPerfect ? 'Отлично справились! Закрепите ещё дальше:' : 'Стоит подтянуть тему:'}</p>
							<p className="font-bold mb-3">{ctaTopic.title}</p>
							<Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2" onClick={handleCtaClick}>
								Попробовать бесплатно
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>

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

						{leadId && !wonReward && (
							<div className="rounded-xl border-2 border-[#3A464E] bg-[#151F23]">
								<CaseReel
									isMega={false}
									pool={DIAGNOSTIC_CASE_POOL}
									title="Твой приз"
									spinAction={() => openDiagnosticCase(leadId)}
									onDone={({ reward }) => setWonReward(reward)}
								/>
							</div>
						)}

						{wonReward && (
							<div className="rounded-xl border-2 border-violet-400/40 bg-violet-400/10 p-4 text-center">
								<p className="text-sm text-[#9AA7B0] mb-1">Твой приз</p>
								<p className="text-2xl font-extrabold tracking-wide text-violet-300">
									{rewardEmoji(wonReward)} {rewardLabel(wonReward)}
								</p>
							</div>
						)}

						{showSecondAsk && (
							<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowSecondAsk(false)}>
								<div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
									<PhoneCaptureCard
										title="Последний шанс — 1 вращение слота"
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
	title = 'Оставь номер и получи 1 вращение слота',
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
			{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Получить приз'}
		</Button>
		<button onClick={onSkip} className="w-full text-center text-xs text-[#9AA7B0] mt-2 hover:text-[#F2F7FB]">
			{skipLabel}
		</button>
	</div>
);
