// components/trainer-grade-tree.tsx
//
// Карта скиллов тренажёра: темы (t_unit) — вертикальный список карточек,
// все сразу доступны (темы друг от друга не зависят). Внутри темы —
// этапы (t_lesson, обычно 4), открывающиеся последовательно по мере
// тренировки именно этой темы.
//
// Раньше здесь ещё был переключатель класса (9/10/11) поверх тем — с
// переходом на модель "класс = отдельный t_course, а не t_unit внутри
// одного трейнера" переключатель класса больше не нужен НА ЭТОМ уровне:
// выбор класса происходит выше, на уровне выбора самого t_course.

'use client';

import { COZY, type UiTheme } from '@/lib/cozyTheme';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Egg, Shield, Sword, Crown, Gift, Library, Dumbbell, Footprints, Rocket, Flame, Target, Trophy, Pencil, Lock, ChevronDown, BookOpen } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { TrainerStageLink } from './trainer-stage-link';
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors';
import { getBossRank } from '@/lib/bossRank';
import { isReviewStage, isMythicStage, getStageQueryParams } from '@/lib/trainerStageFlags';

// Больше разнообразия по прямой просьбе пользователя ("яйцо щит меч —
// хочется большее количество разных иконок, чтобы было интереснее") —
// цикл теперь на 10 значков вместо 4, повторяется только на действительно
// длинных темах (>10 этапов, редкость).
const STAGE_ICONS = [Egg, Shield, Sword, Crown, Dumbbell, Footprints, Rocket, Flame, Target, Trophy];

// Один из промежуточных (не боссовских) этапов темы — "сундук" вместо
// обычной иконки, с мигающей золотой подсветкой. Пройти его — отдельная
// небольшая награда (см. awardChestReward/ChestBonusPanel в TQUIZ.tsx),
// сверх обычного прогресса. Позиция — середина списка этапов, чисто по
// индексу (без новых полей в БД, тот же принцип конвенции "по позиции",
// что уже применяется у STAGE_ICONS/isReviewStage рядом).
// 90%, как у последовательной разблокировки уроков в юните, для одного
// короткого круга (3-6 вопросов) на этап оказалось слишком жёстко —
// один неверный ответ уже не даёт пройти дальше. Порог ниже.
const UNLOCK_THRESHOLD = 50;

// Этапов на тему может стать больше 4 (обсуждалось — вплоть до 8) — в
// один горизонтальный ряд столько не влезает, особенно на телефоне.
// Поэтому ряды по COLUMNS_PER_ROW штук, "змейкой" — чётный ряд (0, 2, ...)
// слева направо, нечётный — справа налево, с коротким вертикальным
// соединителем на том краю, где заканчивается предыдущий ряд.
const COLUMNS_PER_ROW = 4;

// Цвета "премиального done" — те же значения, что заданы в inline-style
// ниже, вынесены в константы, т.к. теперь используются в двух местах
// (обычный статичный рендер + анимированный crossfade при reveal).
import { hexToRgba } from '@/src/constants/lessonButtonColors';
type GroupAccent = { button: string; bottom: string };
// Цвета блоков/тем по кругу из общей палитры ggege (CLAUDE.md).
const GROUP_ACCENTS: GroupAccent[] = [GGEGE_PALETTE.blue];
const mixWithWhite = (hex: string, k: number): string => {
    const n = parseInt(hex.slice(1), 16);
    const mix = (c: number) => Math.round(c + (255 - c) * k);
    return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
};
// Юниты, переименованные на карте, но с прежним названием темы в справочнике.
const REFERENCE_ALIAS: Record<string, string> = { '8 свойств логарифмов': 'Логарифмы' };
const DONE_GRADIENT = 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)';
const DONE_BORDER = '#C4B5FD';
const DONE_GLOW = '0 0 12px -2px rgba(167, 139, 250, 0.55)';
const DONE_ICON_COLOR = 'var(--tg-done-icon)';
const UNLOCKED_BORDER = '#4897D1';
const UNLOCKED_BG = 'var(--tg-unlocked-bg)';
const LOCKED_BORDER = 'var(--tg-locked)';
const LOCKED_ICON_COLOR = 'var(--tg-locked-icon)';
// Премиальный золотой фон для этапов-разборов "по шагам" (isStepByStep) —
// по прямой просьбе пользователя ("фон золотым, иконку белой, чтобы лучше
// отличалось от остальных tlessons") красится сам квадратик, а не только
// иконка книги внутри — во ВСЕХ состояниях, где этап вообще виден цветом
// (unlocked/done), поверх обычной сине-фиолетовой пары UNLOCKED_BG/
// DONE_GRADIENT. Locked-состояние — приглушённая золотая рамка (не
// сплошная серая LOCKED_BORDER) — тот же принцип, что уже даёт увидеть
// ТИП этапа (сундук/босс) даже до разблокировки, просто тусклым.
// Приглушено по прямой просьбе пользователя ("слишком слепит") — тот же
// металлический принцип (тёмный→светлый→тёмный по диагонали), но и
// светлая точка градиента, и рамка, и свечение заметно темнее/тусклее
// исходной ярко-жёлтой версии.
const STEPBYSTEP_GRADIENT = 'linear-gradient(135deg, #8A6A1E 0%, #C9A544 50%, #8A6A1E 100%)';
const STEPBYSTEP_BORDER = '#D9BC72';
const STEPBYSTEP_GLOW = '0 0 10px -2px rgba(201, 165, 68, 0.4)';
const STEPBYSTEP_ICON_COLOR = '#FFFFFF';
const STEPBYSTEP_LOCKED_BORDER = 'rgba(201, 165, 68, 0.3)';
// Цвет подсказки "сюда нажать дальше" (см. RippleGlow ниже) — намеренно
// отдельный, третий акцент, не пересекающийся ни с violet "done", ни с
// gold "chest", ни с обычной синей рамкой разблокированного этапа.
const FRONTIER_RING_COLOR = 'var(--tg-frontier)';

export type SkillStage = {
    id: number;
    percentage: number;
    title: string;
    // Точечная доп. блокировка ПОВЕРХ обычной последовательной
    // разблокировки внутри своего юнита (см. t_lessons.extraUnlockAfterTUnitId
    // в db/schema.ts) — например, этап 8 "Тригонометрической окружности"
    // ждёт не только этап 7 своего же юнита, но и юнит "Таблица 30,45,60"
    // целиком. extraLockedPrereqTitle — название юнита-предка, для
    // сообщения на карточке.
    extraLocked?: boolean;
    extraLockedPrereqTitle?: string | null;
    // Этап целиком — интерактивный разбор "по шагам" (SINWALK/LOGWALK/
    // LOGDEFWALK, см. lib/trainerStageFlags.ts) — золотая иконка книги
    // вместо обычной цикличной, по прямой просьбе пользователя, чтобы
    // такие уроки сильно выделялись на карте скиллов.
    isStepByStep?: boolean;
    isBossExam?: boolean;
    bossWins?: number;
};

export type SkillTopic = {
    id: number;
    title: string;
    percentage: number;
    stages: SkillStage[];
    // Межюнитная блокировка ВСЕЙ темы целиком (см. t_units.unlockAfterTUnitId
    // в db/schema.ts) — тема недоступна, пока в теме-предке не набрано 100%
    // (см. GetTUnitCompletionPercent) по нужному диапазону этапов.
    locked?: boolean;
    lockPrereqTitle?: string | null;
    // true — предок нужен не целиком, только первые его этапы
    // (unlockAfterLessonOrder задан); false/undefined — предок целиком.
    lockPrereqPartial?: boolean;
    // Тема участвует в видимой межюнитной цепочке (сама от кого-то зависит
    // ИЛИ кто-то зависит от неё) — используется только для визуальной
    // группировки соседних карточек в одну рамку, на логику разблокировки
    // не влияет.
    chainLinked?: boolean;
    blockTitle?: string | null;
    isLastActive?: boolean;
};

interface Props {
    topics: SkillTopic[];
    // Админ видит все этапы разблокированными, без последовательного
    // прохождения — по прямой просьбе пользователя ("чтобы не надо было
    // последовательно все проходить"), тот же принцип, что уже применён
    // для юнитов основного курса (app/(main)/learn/unit.tsx).
    isAdmin?: boolean;
    // Стиль оформления: игровой (по умолчанию) или тёплый «cozy».
    theme?: UiTheme;
}

// Цвета карты в двух стилях — через CSS-переменные на корне карты, чтобы
// вложенные компоненты (иконки, подсказки) не таскали проп стиля.
const TREE_VARS: Record<UiTheme, React.CSSProperties> = {
    metal: {
        '--tg-unlocked-bg': '#232F35',
        '--tg-locked': '#3A464E',
        '--tg-locked-icon': '#56646C',
        '--tg-done-icon': '#F5F0FF',
        '--tg-frontier': '#2DD4BF',
    } as React.CSSProperties,
    cozy: {
        '--tg-unlocked-bg': '#3A342D',
        '--tg-locked': '#4A433B',
        '--tg-locked-icon': '#6B645B',
        '--tg-done-icon': '#3A2412',
        '--tg-frontier': '#7CC456',
    } as React.CSSProperties,
}
// Акцент юнитов в тёплом стиле — медовый.
const COZY_TREE_ACCENT: GroupAccent = { button: '#F2C35B', bottom: '#B8862E' };

const chunkStages = (stages: SkillStage[], size: number): SkillStage[][] => {
    const rows: SkillStage[][] = [];
    for (let i = 0; i < stages.length; i += size) {
        rows.push(stages.slice(i, i + size));
    }
    return rows;
};

// Сама иконка этапа (яйцо/щит/меч/корона/... или 👹 для босса, 🎁 для
// сундука) — вынесена в функцию, чтобы не дублировать JSX в трёх разных
// визуальных состояниях одного и того же квадратика (locked / unlocked-
// not-done / done). Сундук — отдельная ветка ПЕРЕД боссом: мегасундук
// (isChest не выставляется на боссовском этапе, см. вычисление ниже)
// сюда не попадает — тот остаётся 👹, просто с более нарядной подсветкой
// вокруг квадратика (см. ChestGlow).
const SkullIcon = ({ dim, hue = 0 }: { dim?: boolean; hue?: number }) => {
    const [data, setData] = useState<unknown>(null)
    useEffect(() => {
        fetch('/Lottie/trainerLessonButtons/fireSkull.json').then((r) => r.json()).then(setData).catch(() => {})
    }, [])
    return (
        <span className={`w-10 h-10 inline-block ${dim ? 'grayscale opacity-50' : ''}`} style={hue && !dim ? { filter: `hue-rotate(${hue}deg)` } : undefined}>
            {data ? <Lottie animationData={data} loop autoplay /> : null}
        </span>
    )
}

const StageIcon = ({
    accent = '#EF9F27',
    isBoss,
    isBossExam = false,
    skullHue = 0,
    isMythic = false,
    isChest = false,
    isStepByStep = false,
    stepNumber = null,
    Icon,
    color,
    dim = false,
}: {
    accent?: string;
    isBoss: boolean;
    isBossExam?: boolean;
    skullHue?: number;
    isMythic?: boolean;
    isChest?: boolean;
    isStepByStep?: boolean;
    // Порядковый номер урока-разбора СРЕДИ ДРУГИХ степбайстеп-этапов
    // этой же темы (1, 2, 3...) — по прямой просьбе пользователя
    // ("подряд несколько lessons stepbystep, у них одинаковые иконки
    // книжки... хочется дать понять что это урок и что у него есть
    // номер"), т.к. золотая книга сама по себе не различает соседние
    // LOGWALK/LOGSUBWALK/LOGPOWWALK/... этапы между собой. null — этап
    // не степбайстеп, бейдж не рисуется вовсе.
    stepNumber?: number | null;
    Icon: typeof Egg;
    color: string;
    dim?: boolean;
}) => (
    isStepByStep
        // Белая книга на золотом фоне квадратика (см. STEPBYSTEP_GRADIENT
        // выше) — интерактивный разбор "по шагам", отдельный визуальный
        // акцент, приоритетнее сундука/босса (по прямой просьбе
        // пользователя, "особую иконку которая сильно выделяется" — а
        // затем "фон золотым, иконку белой... премиально"). Номер —
        // маленький "корешок книги"-бейдж В УГЛУ (не замена символа книги
        // целиком — пользователь явно хотел сохранить читаемость "это
        // урок", просто добавить порядок), тёмно-коричневый на золотой
        // окантовке, тот же принцип контраста, что уже у BossGiftBadge
        // ниже (тёмная иконка на светлом фоне бейджа).
        ? (
            <span className="relative inline-flex">
                <BookOpen className={`w-4 h-4 transition-[filter,opacity] duration-300 ${dim ? 'grayscale opacity-60' : ''}`} style={{ color: '#FFFFFF' }} fill="#FFFFFF" fillOpacity={dim ? 0 : 0.3} />
                {stepNumber != null && (
                    <span
                        className={`absolute -bottom-1.5 -right-1.5 min-w-[13px] h-[13px] px-0.5 rounded-full flex items-center justify-center text-[9px] font-black leading-none transition-[filter,opacity] duration-300 ${dim ? 'grayscale opacity-60' : ''}`}
                        style={{ backgroundColor: '#0F171A', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.7)' }}
                    >
                        {stepNumber}
                    </span>
                )}
            </span>
        )
        : isBossExam
            ? <SkullIcon dim={dim} hue={skullHue} />
        : isMythic
            ? <img src="/chests/myth0001.svg" alt="" className={`w-6 h-6 transition-[filter,opacity] duration-300 ${dim ? 'grayscale opacity-50' : ''}`} />
        : isBoss
                ? <span className={`text-base leading-none transition-[filter,opacity] duration-300 ${dim ? 'grayscale opacity-50' : ''}`}>👹</span>
                : <Icon className="w-4 h-4 transition-colors duration-300" style={{ color }} />
);

const BossGiftBadge = ({ color = '#EF9F27' }: { color?: string }) => (
    <span
        className="absolute -top-2 -right-2 w-4 h-4 rounded flex items-center justify-center"
        style={{ backgroundColor: color }}
    >
        <Gift className="w-2.5 h-2.5" style={{ color: '#412402' }} />
    </span>
);

// Мигающая золотая подсветка вокруг квадратика-сундука (и, чуть щедрее, у
// мегасундука на финальном этапе темы) — та же "дышащая" радиальная
// подсветка, что уже используется в question-bubble.tsx, просто в
// золотой палитре вместо цвета юнита, и с более быстрым пульсом (чтобы
// сразу бросалось в глаза на карте, а не только при наведении).
const ChestGlow = ({ mega = false, color = '#EF9F27', children }: { mega?: boolean; color?: string; children: React.ReactNode }) => (
    <div className="relative w-9 h-9">
        <motion.div
            animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.9, mega ? 1.35 : 1.15, 0.9] }}
            transition={{ duration: mega ? 1.6 : 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-2 rounded-full pointer-events-none"
            style={{
                background: `radial-gradient(circle, ${hexToRgba(color, mega ? 0.6 : 0.5)} 0%, ${hexToRgba(color, 0)} 70%)`,
            }}
        />
        {children}
    </div>
);

// Подсказка "сюда нажать дальше" — по прямой просьбе пользователя, НЕ
// пульсирующий градиент (как у сундука/ChestGlow), а расходящиеся "круги
// на воде": три тонких контура поочерёдно "убегают" наружу от квадратика
// этапа и гаснут, зациклено. По уточнению пользователя — контур повторяет
// ФОРМУ самой кнопки (скруглённый квадрат, rounded-lg, как у stageBox), а
// не идеальный круг — расходится сама фигура кнопки, а не окружность
// вокруг неё. Премиальный, спокойный эффект — обычная скорость и мягкая
// прозрачность, не "кричащее" мигание.
const RippleGlow = ({ children }: { children: React.ReactNode }) => (
    <div className="relative w-9 h-9 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{ border: `1.5px solid ${FRONTIER_RING_COLOR}` }}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: [0, 0.6, 0], scale: [1, 1.6, 2.05] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: i * 0.8 }}
            />
        ))}
        {children}
    </div>
);

// Сколько ждать после запуска плавного scrollIntoView, прежде чем начинать
// сами фазы reveal — достаточно с запасом для скролла на любое расстояние
// внутри одной карточки-темы (реальный smooth-scroll обычно укладывается в
// 300-500мс), чтобы анимация не началась "за кадром", пока страница ещё едет.
const SCROLL_SETTLE_MS = 500;

export const TrainerGradeTree = ({ topics, isAdmin = false, theme = 'metal' }: Props) => {
    const cozy = theme === 'cozy';
    const ACC: GroupAccent = cozy ? COZY_TREE_ACCENT : GROUP_ACCENTS[0];
    // Reveal-анимация "только что прошёл этот этап" — сигнал приходит из
    // app/t-lesson/[t_lessonId]/TQUIZ.tsx (handleFinishLesson) через
    // sessionStorage, читается ровно один раз при монтировании и сразу
    // стирается (обновление страницы после этого не повторяет анимацию).
    // Три фазы с нарастающей задержкой — цепная реакция "квадратик
    // засветился → фитиль добежал → следующий квадратик разблокировался",
    // а не всё одновременно.
    const [pendingRevealId, setPendingRevealId] = useState<number | null>(null);
    const [stageRevealed, setStageRevealed] = useState(false);
    const [connectorRevealed, setConnectorRevealed] = useState(false);
    const [nextRevealed, setNextRevealed] = useState(false);
    // React 18 Strict Mode в dev нарочно вызывает setup→cleanup→setup ещё
    // раз при монтировании (проверка чистоты эффектов) — с обычным
    // return-cleanup, отменяющим setTimeout, ПЕРВЫЙ набор таймеров
    // отменялся до срабатывания, а ВТОРОЙ setup уже не находил флаг в
    // sessionStorage (он был потреблён первым же вызовом) и просто ничего
    // не планировал заново — итог: pendingRevealId выставлялся, а сама
    // цепочка reveal-фаз никогда не срабатывала (проверено живьём — все
    // квадратики застревали в "исходном" состоянии). Ref-гвард не даёт
    // повторному setup что-либо перезапускать; без cleanup-отмены таймеры
    // спокойно доживают до срабатывания.
    const startedRef = React.useRef(false);
    // Узел квадратика "только что пройденного" этапа — чтобы проскроллить и
    // отцентрировать его на экране ДО начала самой анимации (пользователь
    // мог вернуться на /trainer со скроллом страницы в произвольном месте —
    // например, тема с только что пройденным этапом ниже видимой области).
    const targetStageRef = React.useRef<HTMLDivElement | null>(null);
    const scrollStartedRef = React.useRef(false);

    // Переход из /reference?topic=... — скроллим к нужной теме и на
    // секунду подсвечиваем её карточку рамкой, чтобы было видно, куда
    // именно приехали (тем на странице может быть много). Сопоставление
    // по НАЗВАНИЮ темы (topic.title), не по id — со стороны справочника
    // это единственное общее поле (reference_entries.topic — просто
    // текст, id темы трейнера справочнику не известен).
    const searchParams = useSearchParams();
    const topicParam = searchParams.get('topic');
    const topicRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
    const [highlightedTopic, setHighlightedTopic] = useState<string | null>(null);
    const topicScrollStartedRef = React.useRef(false);


    useEffect(() => {
        if (startedRef.current) return;
        let raw: string | null = null;
        try {
            raw = sessionStorage.getItem('justCompletedTLesson');
        } catch {
            return;
        }
        if (!raw) return;
        sessionStorage.removeItem('justCompletedTLesson');
        const id = Number(raw);
        // Анимируем, только если этап РЕАЛЬНО сейчас числится решённым —
        // иначе (например, урок пройден без 90%+ или id устарел) молча
        // ничего не делаем, а не показываем анимацию "в никуда".
        const isActuallyDone = topics.some((t) => t.stages.some((s) => s.id === id && s.percentage >= UNLOCK_THRESHOLD));
        if (!isActuallyDone) return;

        startedRef.current = true;
        setPendingRevealId(id);
        // Сами фазы (stageRevealed/connectorRevealed/nextRevealed) запускает
        // ОТДЕЛЬНЫЙ эффект ниже, после того как узел квадратика реально
        // появится в DOM и страница проскроллится к нему — иначе анимация
        // могла бы начаться, пока целевой квадратик ещё не виден.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (pendingRevealId === null || scrollStartedRef.current) return;
        if (!targetStageRef.current) return;
        scrollStartedRef.current = true;

        targetStageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        setTimeout(() => setStageRevealed(true), SCROLL_SETTLE_MS + 150);
        setTimeout(() => setConnectorRevealed(true), SCROLL_SETTLE_MS + 600);
        setTimeout(() => setNextRevealed(true), SCROLL_SETTLE_MS + 1100);
    }, [pendingRevealId]);

    // Группировка соседних chainLinked-тем в одну общую рамку (простая
    // версия визуальной связи — юниты остаются отдельными карточками,
    // просто визуально обёрнуты вместе + подпись "единая цепочка"). Темы,
    // не входящие в цепочку, рендерятся как раньше, поодиночке. Работает
    // на ЛЮБОМ наборе юнитов с t_units.unlockAfterTUnitId — не завязано
    // на конкретные id/названия.
    type RenderGroup = { kind: 'solo'; topic: SkillTopic } | { kind: 'block'; title: string; topics: SkillTopic[] };
    const renderGroups: RenderGroup[] = [];
    for (const topic of topics) {
        if (topic.blockTitle) {
            const last = renderGroups[renderGroups.length - 1];
            if (last && last.kind === 'block' && last.title === topic.blockTitle) { last.topics.push(topic); continue; }
            renderGroups.push({ kind: 'block', title: topic.blockTitle, topics: [topic] });
        } else {
            renderGroups.push({ kind: 'solo', topic });
        }
    }

    // Табы юнитов (блоков): активен тот, где пользователь решал последним
    // (иначе первый). Показывается содержимое только активного таба.
    const groupKey = (g: RenderGroup) => (g.kind === 'block' ? g.title : `solo-${g.topic.id}`);
    const groupLabel = (g: RenderGroup) => (g.kind === 'block' ? g.title : g.topic.title);
    const groupTopics = (g: RenderGroup) => (g.kind === 'block' ? g.topics : [g.topic]);
    const defaultGroup = renderGroups.find((g) => groupTopics(g).some((t) => t.isLastActive)) ?? renderGroups[0];
    const [activeGroupKey, setActiveGroupKey] = useState<string | null>(defaultGroup ? groupKey(defaultGroup) : null);
    // Переход из справочника — переключаемся на таб с нужной темой.
    useEffect(() => {
        if (!topicParam) return;
        const g = renderGroups.find((b) => groupTopics(b).some((t) => t.title === topicParam || REFERENCE_ALIAS[t.title] === topicParam));
        if (g) setActiveGroupKey(groupKey(g));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topicParam]);

    useEffect(() => {
        if (!topicParam || topicScrollStartedRef.current) return;
        const key = Object.keys(topicRefs.current).find((k) => k === topicParam || REFERENCE_ALIAS[k] === topicParam);
        const node = key ? topicRefs.current[key] : null;
        if (!node) return;
        topicScrollStartedRef.current = true;
        setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
        setHighlightedTopic(key ?? topicParam);
        const t = setTimeout(() => setHighlightedTopic(null), 2200);
        return () => clearTimeout(t);
    }, [topicParam, topics, activeGroupKey]);

    // Карточка одной темы — вынесена в функцию (не отдельный компонент:
    // нужен доступ по замыканию к состоянию reveal-анимации/рефам выше,
    // без прокидывания десятка пропсов), вызывается из ДВУХ мест —
    // одиночная тема и тема внутри chain-группы (см. return ниже).
    const renderTopicCard = (topic: SkillTopic, accent: GroupAccent, nested = false, blockTitle?: string) => {
        // Тёплый стиль: пройденный этап — плоский медовый блок с нижней гранью.
        const doneGradient = cozy ? accent.button : `linear-gradient(135deg, ${accent.button} 0%, ${accent.bottom} 100%)`;
        const doneBorder = cozy ? accent.bottom : mixWithWhite(accent.button, 0.5);
        const doneGlow = cozy ? `0 3px 0 ${accent.bottom}` : `0 0 12px -2px ${hexToRgba(accent.button, 0.6)}`;
        // Тема залочена целиком (межюнитная зависимость, см.
        // t_units.unlockAfterTUnitId) — вместо обычной сетки этапов
        // показываем один плейсхолдер с пояснением, что именно нужно
        // пройти сначала. Первый этап темы НЕ считается "автоматически
        // открытым", в отличие от обычной внутриюнитной логики ниже.
        if (topic.locked) {
            return (
                <div
                    key={topic.id}
                    className={cozy ? "rounded-xl px-4 py-3 border-2 border-dashed" : "bg-[#161B20] rounded-2xl px-4 py-3 border border-dashed border-[#333F47]"}
                    style={cozy ? { background: '#262320', borderColor: '#4A433B' } : undefined}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Lock className="w-3.5 h-3.5 text-[#56646C] flex-shrink-0" />
                        <span className="text-sm font-medium text-[#6B7880] truncate">{topic.title}</span>
                    </div>
                    <p className="text-xs text-[#56646C] mt-1.5 leading-snug">
                        Откроется после {topic.lockPrereqPartial ? 'первых этапов' : 'полного прохождения'} «{topic.lockPrereqTitle}»
                    </p>
                </div>
            );
        }

        return (
                    <div
                        key={topic.id}
                        ref={(el) => { topicRefs.current[topic.title] = el; }}
                        className={cozy ? "rounded-xl px-4 py-3 transition-shadow duration-300" : "bg-[#1A252B] rounded-2xl px-4 py-3 transition-shadow duration-300"}
                        style={cozy ? {
                            background: COZY.card,
                            border: `3px solid ${COZY.cardBorder}`,
                            boxShadow: highlightedTopic === topic.title ? `0 0 0 3px ${accent.button}, 0 6px 0 ${COZY.cardEdge}` : `0 6px 0 ${COZY.cardEdge}`,
                        } : {
                            ...(nested ? {} : { border: `2px solid ${hexToRgba(accent.button, 0.7)}`, backgroundImage: `linear-gradient(180deg, ${hexToRgba(accent.button, 0.09)}, transparent 60%)` }),
                            ...(highlightedTopic === topic.title ? { boxShadow: '0 0 0 2px #4A90D9' } : {}),
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2.5 min-w-0">
                            <span className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ background: `linear-gradient(180deg, ${accent.button}, ${accent.bottom})` }} />
                            {topic.title !== blockTitle && <span className="text-base font-extrabold truncate" style={{ color: accent.button }}>{topic.title}</span>}
                            {(() => {
                                const examStage = topic.stages.find((st) => st.isBossExam);
                                if (!examStage) return <span className="text-xs font-bold flex-shrink-0 ml-auto" style={{ color: hexToRgba(accent.button, 0.85) }}>{topic.percentage}%</span>;
                                const rank = getBossRank(examStage.bossWins ?? 0);
                                return rank ? <span className="text-xs font-black flex-shrink-0 px-2 py-0.5 rounded-full ml-auto" style={{ color: rank.color, backgroundColor: hexToRgba(rank.color, 0.15) }}>{rank.title}</span> : null;
                            })()}
                        </div>

                        {topic.stages.length > 0 && (() => {
                            // "Фронтир" темы — самый первый ещё не пройденный этап
                            // по порядку. Благодаря последовательной разблокировке
                            // это ВСЕГДА ровно тот единственный этап, что сейчас
                            // реально разблокирован и не done (кроме админа — там
                            // разблокировано всё сразу, но "что делать дальше по
                            // порядку" всё равно однозначно определяется так же).
                            // -1, если тема уже пройдена целиком — тогда подсказка
                            // никому не показывается.
                            const frontierIdx = topic.stages.findIndex((st) => st.percentage < UNLOCK_THRESHOLD);
                            // Порядковый номер СРЕДИ степбайстеп-этапов этой темы
                            // (1, 2, 3...) — по индексу в topic.stages, не по trueIdx
                            // напрямую (обычные этапы номер не получают, null).
                            const stepByStepNumbers: (number | null)[] = [];
                            let stepByStepCounter = 0;
                            topic.stages.forEach((st) => {
                                if (st.isStepByStep) {
                                    stepByStepCounter += 1;
                                    stepByStepNumbers.push(stepByStepCounter);
                                } else {
                                    stepByStepNumbers.push(null);
                                }
                            });
                            return (
                            <div className="flex flex-col">
                                {chunkStages(topic.stages, COLUMNS_PER_ROW).map((row, rowIdx, allRows) => {
                                    const rowStartIdx = rowIdx * COLUMNS_PER_ROW;
                                    const isReversed = rowIdx % 2 === 1;
                                    const isLastRow = rowIdx === allRows.length - 1;

                                    // Фиксированная сетка на COLUMNS_PER_ROW колонок
                                    // боксов, между ними — колонки-"щели" под линию
                                    // соединителя (бокс,щель,бокс,щель,...,бокс).
                                    // Раньше ряд был обычным flex — при НЕПОЛНОМ
                                    // ряду (последняя тема, этапов не кратно 4) он
                                    // просто сжимался до фактического числа боксов
                                    // и растягивался на всю ширину карточки, из-за
                                    // чего элементы уезжали не в свои колонки. Сетка
                                    // с явными колонками, где недостающие боксы —
                                    // просто пустая ячейка, решает это: у каждого
                                    // этапа всегда его "настоящая" колонка, даже
                                    // если ряд не заполнен целиком.
                                    const gridTemplate = Array.from({ length: COLUMNS_PER_ROW }, () => '36px').join(' 1fr ');

                                    // Колонка бокса под порядковым номером внутри
                                    // ряда j (0-индекс) — при развороте ряда змейкой
                                    // считаем от конца, независимо от того, сколько
                                    // боксов реально есть в ряду (иначе неполный
                                    // развёрнутый ряд не дотягивался бы до правого
                                    // края, где должен продолжать предыдущий ряд).
                                    const boxColumn = (j: number) => (isReversed ? COLUMNS_PER_ROW - 1 - j : j) * 2 + 1;

                                    return (
                                        <div key={rowIdx}>
                                            <div className="grid items-center" style={{ gridTemplateColumns: gridTemplate }}>
                                                {row.map((s, j) => {
                                                    const trueIdx = rowStartIdx + j;
                                                    const prevStage = trueIdx > 0 ? topic.stages[trueIdx - 1] : null;
                                                    // extraLocked — точечная доп. блокировка ПОВЕРХ обычной
                                                    // последовательной (см. SkillStage.extraLocked выше) —
                                                    // например, этап 8 темы "Тригонометрическая окружность"
                                                    // ждёт ещё и отдельный юнит целиком. isAdmin обходит и её.
                                                    const unlockedReal = isAdmin || ((trueIdx === 0 || (prevStage !== null && prevStage.percentage >= UNLOCK_THRESHOLD)) && !s.extraLocked);
                                                    const doneReal = s.percentage >= UNLOCK_THRESHOLD;
                                                    const isLastOverall = trueIdx === topic.stages.length - 1;
                                                    // Финальный этап темы — всегда босс; промежуточный
                                                    // "контрольная"-урок (по названию, см. isReviewStage
                                                    // выше) — тоже, мини-босс с миксом уже пройденных формул.
                                                    const isBoss = isLastOverall || isReviewStage(s.title);
                                                    // Сундук — один промежуточный (не боссовский) этап в
                                                    // середине списка, чисто по позиции (без нового поля в
                                                    // БД — тот же принцип конвенции, что isReviewStage выше).
                                                    // Мегасундук — всегда финальный этап (тот же, что уже
                                                    // "босс") — награда щедрее, иконка остаётся 👹 (см.
                                                    // StageIcon), просто подсветка вокруг богаче.
                                                    const isChest = !isBoss && topic.stages.length >= 3 && trueIdx === Math.floor((topic.stages.length - 1) / 2);
                                                    const isMegaChest = isLastOverall && !s.isBossExam;
                                                    const isMythic = isMythicStage(s.title);
                                                    const isBossExam = s.isBossExam === true;
                                                    // Подсказка "сюда нажать дальше" — только на самом фронтире,
                                                    // и только если это не сундук/мегасундук (у тех уже есть
                                                    // своя, более наглая подсветка — дублировать её кольцами
                                                    // было бы избыточно).
                                                    const isFrontier = trueIdx === frontierIdx && !isChest && !isMegaChest && !isMythic;
                                                    const isStepByStep = s.isStepByStep === true;
                                                    const stepNumber = isStepByStep ? stepByStepNumbers[trueIdx] : null;
                                                    const stageHref = `/t-lesson/${s.id}${getStageQueryParams(trueIdx, topic.stages.length, s.title)}`;
                                                    const Icon = STAGE_ICONS[trueIdx % STAGE_ICONS.length];
                                                    const col = boxColumn(j);

                                                    // Этот квадратик — тот самый, что пользователь только
                                                    // что прошёл (reveal "locked-visual → done-visual"), или
                                                    // следующий за ним (reveal "locked → unlocked"). Оба флага
                                                    // взаимоисключающие для одного и того же трюка id.
                                                    const isRevealTarget = pendingRevealId !== null && s.id === pendingRevealId;
                                                    const isRevealNext = pendingRevealId !== null && prevStage !== null && prevStage.id === pendingRevealId;

                                                    // "Видимое" (возможно, ещё задержанное анимацией)
                                                    // состояние — используется для всего остального в этой
                                                    // итерации (цвет соединителя дальше по коду).
                                                    const done = isRevealTarget ? (stageRevealed && doneReal) : doneReal;
                                                    const unlocked = isRevealNext ? (nextRevealed && unlockedReal) : unlockedReal;

                                                    let stageBox: React.ReactNode;

                                                    if (isRevealTarget) {
                                                        // Кроссфейд между "было" (обычный незавершённый вид)
                                                        // и "стало" (премиальный градиент) — CSS/framer-motion
                                                        // не умеют плавно интерполировать МЕЖДУ двумя разными
                                                        // background-градиентами напрямую, поэтому оба слоя
                                                        // рендерятся одновременно друг над другом и один гаснет,
                                                        // пока другой проявляется.
                                                        stageBox = (
                                                            <div className="relative w-9 h-9">
                                                                <motion.div
                                                                    className="absolute inset-0"
                                                                    animate={{ opacity: stageRevealed ? 0 : 1 }}
                                                                    transition={{ duration: 0.35 }}
                                                                >
                                                                    <TrainerStageLink
                                                                        href={stageHref}
                                                                        className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                                        style={{
                                                                            background: isBossExam ? 'transparent' : UNLOCKED_BG,
                                                                            border: isBossExam ? '2px solid transparent' : `2px solid ${accent.button}`,
                                                                            boxShadow: isBossExam ? 'none' : undefined,
                                                                        }}
                                                                        icon={<StageIcon accent={accent.button} isBoss={isBoss} isBossExam={isBossExam} skullHue={getBossRank(s.bossWins ?? 0)?.hue ?? 0} isMythic={isMythic} isChest={isChest} isStepByStep={isStepByStep} stepNumber={stepNumber} Icon={Icon} color={accent.button} />}
                                                                    />
                                                                </motion.div>
                                                                <motion.div
                                                                    className="absolute inset-0"
                                                                    initial={{ opacity: 0, scale: 1 }}
                                                                    animate={stageRevealed ? { opacity: 1, scale: [1, 1.2, 1] } : { opacity: 0 }}
                                                                    transition={{ duration: 0.55, ease: 'easeOut' }}
                                                                >
                                                                    <TrainerStageLink
                                                                        href={stageHref}
                                                                        className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                                        style={{
                                                                            background: isBossExam ? 'transparent' : doneGradient,
                                                                            border: isBossExam ? '2px solid transparent' : `2px solid ${doneBorder}`,
                                                                            boxShadow: isBossExam ? 'none' : doneGlow,
                                                                        }}
                                                                        icon={<StageIcon accent={accent.button} isBoss={isBoss} isBossExam={isBossExam} skullHue={getBossRank(s.bossWins ?? 0)?.hue ?? 0} isMythic={isMythic} isChest={isChest} isStepByStep={isStepByStep} stepNumber={stepNumber} Icon={Icon} color={DONE_ICON_COLOR} />}
                                                                        extra={isBoss ? null : null}
                                                                    />
                                                                </motion.div>
                                                            </div>
                                                        );
                                                    } else if (isRevealNext) {
                                                        // Locked-заглушка (даже не ссылка) гаснет, под ней
                                                        // проявляется настоящая рабочая TrainerStageLink —
                                                        // ровно момент "теперь сюда можно зайти".
                                                        stageBox = (
                                                            <div className="relative w-9 h-9">
                                                                <motion.div
                                                                    className="absolute inset-0"
                                                                    animate={{ opacity: nextRevealed ? 0 : 1 }}
                                                                    transition={{ duration: 0.3 }}
                                                                >
                                                                    <div
                                                                        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                                                                        style={{ border: isBossExam ? '2px solid transparent' : `2px solid ${LOCKED_BORDER}` }}
                                                                    >
                                                                        <StageIcon accent={accent.button} isBoss={isBoss} isBossExam={isBossExam} skullHue={getBossRank(s.bossWins ?? 0)?.hue ?? 0} isMythic={isMythic} isChest={isChest} isStepByStep={isStepByStep} stepNumber={stepNumber} Icon={Icon} color={LOCKED_ICON_COLOR} dim />
                                                                    </div>
                                                                </motion.div>
                                                                <motion.div
                                                                    className="absolute inset-0"
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={nextRevealed ? { opacity: 1, scale: [0.8, 1.12, 1] } : { opacity: 0 }}
                                                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                                                >
                                                                    <TrainerStageLink
                                                                        href={stageHref}
                                                                        className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                                        style={{
                                                                            background: isBossExam ? 'transparent' : UNLOCKED_BG,
                                                                            border: isBossExam ? '2px solid transparent' : `2px solid ${accent.button}`,
                                                                            boxShadow: isBossExam ? 'none' : undefined,
                                                                        }}
                                                                        icon={<StageIcon accent={accent.button} isBoss={isBoss} isBossExam={isBossExam} skullHue={getBossRank(s.bossWins ?? 0)?.hue ?? 0} isMythic={isMythic} isChest={isChest} isStepByStep={isStepByStep} stepNumber={stepNumber} Icon={Icon} color={accent.button} />}
                                                                    />
                                                                </motion.div>
                                                            </div>
                                                        );
                                                    } else if (unlocked) {
                                                        stageBox = (
                                                            <TrainerStageLink
                                                                href={stageHref}
                                                                className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                                                                style={{
                                                                    background: isBossExam ? 'transparent' : (done ? doneGradient : UNLOCKED_BG),
                                                                    border: isBossExam ? '2px solid transparent' : `2px solid ${(done ? doneBorder : accent.button)}`,
                                                                    boxShadow: isBossExam ? 'none' : (done ? doneGlow : (cozy ? `0 3px 0 ${accent.bottom}` : undefined)),
                                                                }}
                                                                icon={<StageIcon accent={accent.button} isBoss={isBoss} isBossExam={isBossExam} skullHue={getBossRank(s.bossWins ?? 0)?.hue ?? 0} isMythic={isMythic} isChest={isChest} isStepByStep={isStepByStep} stepNumber={stepNumber} Icon={Icon} color={done ? DONE_ICON_COLOR : accent.button} />}
                                                                extra={isBoss && done ? null : null}
                                                            />
                                                        );
                                                    } else {
                                                        stageBox = (
                                                            <div
                                                                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                                                                style={{ border: isBossExam ? '2px solid transparent' : `2px solid ${LOCKED_BORDER}` }}
                                                                title={s.extraLocked && s.extraLockedPrereqTitle ? `Сначала пройди «${s.extraLockedPrereqTitle}»` : undefined}
                                                            >
                                                                <StageIcon accent={accent.button} isBoss={isBoss} isBossExam={isBossExam} skullHue={getBossRank(s.bossWins ?? 0)?.hue ?? 0} isMythic={isMythic} isChest={isChest} isStepByStep={isStepByStep} stepNumber={stepNumber} Icon={Icon} color={LOCKED_ICON_COLOR} dim />
                                                            </div>
                                                        );
                                                    }

                                                    // "Фитиль" — соединитель ДО следующего бокса в этом же
                                                    // ряду. Реальный прогрессивный залив (scaleX от 0 до 1)
                                                    // только для конкретно того соединителя, что идёт СРАЗУ
                                                    // после только что пройденного этапа — остальные просто
                                                    // статично в своём цвете, без анимации на каждый рендер.
                                                    const isFuseHere = isRevealTarget && j < row.length - 1;

                                                    return (
                                                        <React.Fragment key={s.id}>
                                                            <div
                                                                ref={isRevealTarget ? targetStageRef : undefined}
                                                                style={{ gridColumn: col, gridRow: 1 }}
                                                                className="flex justify-center relative"
                                                            >
                                                                {isBossExam && (s.bossWins ?? 0) > 0 && (
                                                                    <span className={`absolute top-1/2 -translate-y-1/2 flex flex-col leading-tight whitespace-nowrap ${isReversed ? 'right-full mr-1.5 items-end' : 'left-full ml-1.5'}`}>
                                                                        <span className="text-sm font-black text-[#F09B38]">×{s.bossWins}</span>
                                                                        <span className="text-[10px] font-bold" style={{ color: getBossRank(s.bossWins ?? 0)?.color }}>{getBossRank(s.bossWins ?? 0)?.title}</span>
                                                                    </span>
                                                                )}
                                                                {isMythic
                                                                        ? <ChestGlow mega color={accent.button}>{stageBox}</ChestGlow>
                                                                    : isChest
                                                                        ? <ChestGlow color={accent.button}>{stageBox}</ChestGlow>
                                                                        : isMegaChest
                                                                            ? <ChestGlow mega color={accent.button}>{stageBox}</ChestGlow>
                                                                            : isFrontier
                                                                                ? <RippleGlow>{stageBox}</RippleGlow>
                                                                                : stageBox}
                                                            </div>

                                                            {j < row.length - 1 && (
                                                                <div
                                                                    style={{
                                                                        gridColumn: Math.min(col, boxColumn(j + 1)) + 1,
                                                                        gridRow: 1,
                                                                        backgroundColor: LOCKED_BORDER,
                                                                    }}
                                                                    className="h-0.5 relative overflow-hidden rounded-full"
                                                                >
                                                                    {(done || isFuseHere) && (
                                                                        <motion.div
                                                                            className="absolute inset-0 rounded-full"
                                                                            style={{ backgroundColor: accent.button, transformOrigin: isReversed ? 'right' : 'left' }}
                                                                            initial={isFuseHere ? { scaleX: 0 } : false}
                                                                            animate={{ scaleX: isFuseHere ? (connectorRevealed ? 1 : 0) : 1 }}
                                                                            transition={isFuseHere ? { duration: 0.45, ease: 'easeInOut' } : { duration: 0 }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                            {!isLastRow && (() => {
                                                // Тот же "фитиль" для вертикального соединителя между
                                                // рядами — срабатывает, только когда только что пройденный
                                                // этап оказался ПОСЛЕДНИМ в своём ряду (следующий этап уже
                                                // на новой строке змейки).
                                                const lastInRow = row[row.length - 1];
                                                const isFuseHereVertical = pendingRevealId !== null && lastInRow.id === pendingRevealId;
                                                const doneHere = lastInRow.percentage >= UNLOCK_THRESHOLD;
                                                return (
                                                    <div className={`flex ${isReversed ? 'justify-start' : 'justify-end'}`}>
                                                        <div className="w-9 flex justify-center">
                                                            <div
                                                                className="w-0.5 h-6 relative overflow-hidden rounded-full"
                                                                style={{ backgroundColor: LOCKED_BORDER }}
                                                            >
                                                                {(doneHere || isFuseHereVertical) && (
                                                                    <motion.div
                                                                        className="absolute inset-0 rounded-full"
                                                                        style={{ backgroundColor: accent.button, transformOrigin: 'top' }}
                                                                        initial={isFuseHereVertical ? { scaleY: 0 } : false}
                                                                        animate={{ scaleY: isFuseHereVertical ? (connectorRevealed ? 1 : 0) : 1 }}
                                                                        transition={isFuseHereVertical ? { duration: 0.45, ease: 'easeInOut' } : { duration: 0 }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}
                            </div>
                            );
                        })()}

                        {/* Иконка-ссылка на справочник — теперь настоящая маленькая
                            кнопка (не голая иконка), на отдельной строке СРАЗУ ПОД
                            рядом этапов и выровненная по тому же правому краю, что и
                            сами этапы (ряд этапов растянут на всю ширину карточки —
                            justify-end здесь автоматически даёт тот же правый край). */}
                        <div className="flex justify-end mt-2">
                            <Link
                                href={`/reference?topic=${encodeURIComponent(REFERENCE_ALIAS[topic.title] ?? topic.title)}`}
                                // h-8 фиксирует ОБЩУЮ высоту кнопки — иначе при
                                // нажатии (active:border-b-2, было border-b-4) сама
                                // высота элемента сокращалась на 2px и весь контент
                                // страницы НИЖЕ (следующая тема/группа) подскакивал —
                                // с явной высотой border-box просто "съедает" разницу
                                // толщины нижней рамки, сама кнопка не меняет размер.
                                className={cozy
                                    ? "flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg border-2 border-b-4 active:border-b-2 transition-colors text-xs font-bold text-[#FFE8C7] hover:text-white"
                                    : "flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg border-2 border-b-4 active:border-b-2 bg-[#161F23] border-[#3A464E] text-[#9AA7B0] hover:text-[#F2F7FB] transition-colors text-xs font-bold"}
                                style={cozy ? { background: COZY.wood, borderColor: COZY.woodEdge } : undefined}
                                title={`Справочник — ${topic.title}`}
                            >
                                <Library className="w-3.5 h-3.5" />
                                Справочник
                            </Link>
                        </div>
                    </div>
        );
    };

    return (
        <div className="w-full max-w-xl mx-auto" style={TREE_VARS[theme]}>
            <div className="flex flex-col gap-3">
                {renderGroups.length > 1 && (
                    <div
                        className={cozy ? "flex flex-wrap gap-1 p-1 rounded-xl" : "flex flex-wrap gap-1 p-1 rounded-2xl bg-[#232F34]"}
                        style={cozy ? { background: COZY.card, border: `3px solid ${COZY.cardBorder}`, boxShadow: `0 5px 0 ${COZY.cardEdge}` } : undefined}
                    >
                        {renderGroups.map((g) => {
                            const key = groupKey(g);
                            const isActive = key === activeGroupKey;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActiveGroupKey(key)}
                                    className="relative flex-grow whitespace-nowrap px-3 py-2 rounded-xl text-sm font-extrabold transition-colors"
                                    style={{ color: isActive ? (cozy ? COZY.darkText : '#FFFFFF') : (cozy ? '#D9C4A3' : '#9AA7B0') }}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="trainer-unit-tab-pill"
                                            className={cozy ? "absolute inset-0 rounded-lg" : "absolute inset-0 rounded-xl"}
                                            style={cozy
                                                ? { background: ACC.button, boxShadow: `0 3px 0 ${ACC.bottom}` }
                                                : { background: `linear-gradient(135deg, ${GROUP_ACCENTS[0].button}, ${GROUP_ACCENTS[0].bottom})`, boxShadow: `0 4px 14px -4px ${hexToRgba(GROUP_ACCENTS[0].button, 0.7)}` }}
                                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                        />
                                    )}
                                    <span className="relative z-10">{groupLabel(g)}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
                {renderGroups.map((g) => {
                    const key = groupKey(g);
                    if (key !== activeGroupKey) return null;
                    const accent = ACC;
                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                            className="flex flex-col gap-2.5"
                        >
                            {groupTopics(g).map((t) => renderTopicCard(t, accent, false, groupLabel(g)))}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
