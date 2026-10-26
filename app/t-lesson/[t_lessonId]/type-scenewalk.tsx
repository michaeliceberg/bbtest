'use client'

// SCENEWALK — пошаговый разбор, собранный данными (движок components/geometry/scene-engine.tsx).
// Какой урок показать — по тексту задания (t_challenges.question), реестр SCENE_LESSONS в lib/scene-lessons.
// Новый урок = файл со сценами и тренировкой в lib/scene-lessons + строка в реестре + сид задания с этим question.

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickWrongTryPhrase, pickFunNextLabel, LocalAnswerConfetti, CORRECT_FEEDBACK_PHRASES, useWalkthroughCombo,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry, FieryFeedbackBanner } from '@/components/geometry/WalkthroughLog'
import { SceneRunner, SLOT_COL } from '@/components/geometry/scene-engine'
import { findSceneLesson } from '@/lib/scene-lessons'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { Typewriter } from '@/components/geometry/Typewriter'
import { hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}
const pickPraise = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 4) % CORRECT_FEEDBACK_PHRASES.length]

export const TypeSceneWalk = ({ question, onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    const lesson = findSceneLesson(question.question)
    const SCENES = lesson.scenes
    const TRIALS = lesson.trials
    const [startStep, setStartStep] = useState(0)
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<string[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    const [qShow, setQShow] = useState(false)
    const [qTyped, setQTyped] = useState(false)
    useEffect(() => {
        setQShow(false); setQTyped(false)
        if (phase !== 'practice' || checked) return
        const t = setTimeout(() => setQShow(true), 600)
        return () => clearTimeout(t)
    }, [phase, trialIndex, checked])
    const registerCombo = useWalkthroughCombo()
    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const { isActive, sceneRef } = useSceneFocus(latestSceneKey, phase === 'intro' ? stepReady : checked)

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (step + 1 >= SCENES.length) { setPhase('practice'); return }
            setStep((s) => s + 1)
            setStepReady(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }
    const handleReplay = () => { bumpNonce(latestSceneKey); setStepReady(false) }
    const handleBack = () => {
        if (advancing || step === 0) return
        bumpNonce(`step-${step - 1}`)
        setStep(step - 1)
        setStepReady(false)
    }
    const answer = (v: string) => {
        const t = TRIALS[trialIndex]
        if (checked || wrongTried.includes(v)) return
        if (v === t.answer) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setWrongFlash(null)
            setChecked(true)
            setTrialNextLabel(trialIndex + 1 >= TRIALS.length ? lesson.last : pickFunNextLabel())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((w) => [...w, v])
            setWrongFlash(`${pickWrongTryPhrase()} ${t.hint}`)
        }
    }
    const nextTrial = () => {
        if (advancing) return
        if (trialIndex + 1 >= TRIALS.length) { onComplete(!hadMistake); onAnswer(hadMistake ? 'wrong' : 'right'); return }
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            setTrialIndex((i) => i + 1); setChecked(false); setWrongTried([]); setWrongFlash(null)
        }, 300)
    }
    const jumpTo = (key: string) => {
        setAdvancing(false); setChecked(false); setWrongTried([]); setWrongFlash(null)
        if (key.startsWith('step-')) {
            const i = Number(key.slice(5))
            bumpNonce(key)
            setPhase('intro'); setStartStep(i); setStep(i); setStepReady(false)
            return
        }
        setStartStep(SCENES.length); setStep(SCENES.length - 1)
        setTrialIndex(Number(key.slice(6))); setPhase('practice')
    }
    const mapEntries: AdminMapEntry[] = [
        ...SCENES.map((s, i) => ({ dotKey: `s${i}`, label: s.title, jumpKey: `step-${i}`, isActive: phase === 'intro' && step === i, color: MAP_INTRO_COLOR })),
        ...TRIALS.map((tr, i) => ({ dotKey: `t${i}`, label: `Задание ${i + 1}: ${tr.tag}`, jumpKey: `trial-${i}`, isActive: phase === 'practice' && trialIndex === i, color: MAP_PRACTICE_COLOR })),
    ]

    const t = TRIALS[trialIndex]
    const long = t.options.some((o) => o.replace(/\$|\\[a-z]+|[{}]/g, '').length > 9)
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((s, i) => step >= i && i >= startStep ? (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <SceneRunner parts={s.parts} onSettled={() => i === step && setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                ) : null)}

                {phase === 'practice' && (
                    <SceneWrapper key={`trial-${trialIndex}`} innerRef={sceneRef(`trial-${trialIndex}`)} active={isActive(`trial-${trialIndex}`)}>
                        <div className="w-full flex items-center gap-3" aria-hidden>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                            <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Проверим себя</span>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                        </div>
                        <div className="w-full flex items-center justify-between">
                            <motion.div key={`cnt-${trialIndex}`} initial={trialIndex === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                                className="flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                style={{ borderColor: hexToRgba(SLOT_COL, 0.55), backgroundColor: hexToRgba(SLOT_COL, 0.16), color: SLOT_COL }}>
                                <span>{trialIndex + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIALS.length}</span>
                            </motion.div>
                            <span className="px-3 h-9 flex items-center rounded-full border-2 text-sm font-black"
                                style={{ borderColor: 'rgba(232,182,54,0.7)', color: '#F2C35B' }}>{t.tag}</span>
                        </div>
                        <div className="w-full text-lg md:text-xl font-bold text-[#F2F7FB] text-center min-h-[3.5rem]">
                            {(qShow || checked) && (t.text.includes('$')
                                ? <motion.div key={`q-${trialIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onAnimationComplete={() => setQTyped(true)}><Latex>{t.text}</Latex></motion.div>
                                : <Typewriter key={`q-${trialIndex}`} text={t.text} onDone={() => setQTyped(true)} />)}
                        </div>
                        {!checked && qTyped && (
                            <div key={`opts-${trialIndex}`} className={cn('drop-in-options grid gap-3 w-full', long ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2')}>
                                {t.options.map((v) => {
                                    const isWrong = wrongTried.includes(v)
                                    return (
                                        <button key={v} type="button" disabled={isWrong} onClick={() => answer(v)}
                                            className={cn('min-h-[60px] px-2 rounded-xl border-2 border-b-4 text-xl md:text-2xl font-black transition-colors',
                                                isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                            {v.includes('$') ? <Latex>{v}</Latex> : v}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {!checked && wrongFlash && (
                            <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">
                                {wrongFlash.includes('$') ? <Latex>{wrongFlash}</Latex> : wrongFlash}
                            </div>
                        )}
                        {checked && (
                            <FieryFeedbackBanner>
                                {pickPraise(trialIndex)} {t.answer.includes('$') ? <Latex>{t.answer}</Latex> : t.answer}
                            </FieryFeedbackBanner>
                        )}
                        {checked && <LocalAnswerConfetti />}
                    </SceneWrapper>
                )}
            </div>
            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || step === 0} />
                    <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                        className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {SCENES[step].next}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex">
                    <button type="button" onClick={nextTrial} disabled={advancing}
                        className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
