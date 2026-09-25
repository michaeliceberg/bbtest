'use client'
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LoginDialog } from '@/components/login-dialog';
import LottieHelloBread from '@/public/LottieHelloBread.json';
import { COZY, type UiTheme } from '@/lib/cozyTheme';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Цвета логотипа ggege (сэмплированы из public/ggegelogo.svg, см. sidebar.tsx).
const LOGO_PURPLE = '#A74CE8';
const LOGO_GREEN = '#22A22F';
const CTA_ACCENT = '#78C93C';

const COURSE_BANNERS = [
  { src: '/CourseImgs/ege_math.jpg', title: 'ЕГЭ Математика' },
  { src: '/CourseImgs/ege_physics.jpg', title: 'ЕГЭ Физика' },
  { src: '/CourseImgs/oge_math.jpg', title: 'ОГЭ Математика' },
  { src: '/CourseImgs/lnip_physics.jpg', title: 'ЛНИП Физика' },
  { src: '/CourseImgs/lnip_math.jpg', title: 'ЛНИП Математика' },
];

type Props = {
  // Имя из userProgress (профиль в БД) — источник правды, в отличие от
  // session.user.name, который NextAuth заполняет один раз при входе и не
  // обновляет (для входа по телефону там номер, а не имя из /account).
  dbUserName?: string | null;
  // 'metal' — текущий игровой стиль (по умолчанию), 'cozy' — тёплый
  // мультяшный (пробный, /test-home-cozy).
  theme?: UiTheme;
};

// Кнопка в стиле кнопок кейса (components/CaseReel.tsx): металлическая
// градиентная рамка, тёмное "стекло", цветной текст, пульсирующее свечение, блик.
const PremiumButton = ({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) => {
  const inner = (
    <span
      className='animate-shine-sweep flex w-full items-center justify-center gap-2.5 px-8 py-4 rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] font-black text-base lg:text-lg uppercase tracking-[0.1em] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
      style={{ color: CTA_ACCENT, textShadow: `0 0 12px ${CTA_ACCENT}99` }}
    >
      {children}
    </span>
  );
  const frame: HTMLMotionProps<'div'> & HTMLMotionProps<'button'> = {
    className: 'relative block w-full rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.5)]',
    style: { background: `linear-gradient(180deg, ${CTA_ACCENT} 0%, #2A363C 55%, #141C20 100%)` },
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.97, y: 2 },
  };
  // Свечение — отдельный статичный слой с тенью, пульсирует только его
  // opacity (CSS), а не сам box-shadow: на iPhone анимация box-shadow лагала.
  const glow = (
    <span
      aria-hidden
      className='animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl'
      style={{ boxShadow: `0 0 28px ${CTA_ACCENT}AA` }}
    />
  );
  if (href) {
    return (
      <motion.div {...frame}>
        {glow}
        <Link href={href} className='relative block'>{inner}</Link>
      </motion.div>
    );
  }
  return (
    <motion.button type='button' onClick={onClick} {...frame}>
      {glow}
      <span className='relative block'>{inner}</span>
    </motion.button>
  );
};

// Кнопка тёплого стиля: плоский блок с толстой нижней гранью, «утапливается».
const CozyCta = ({ children, onClick, href, fill = COZY.grass, edge = COZY.grassEdge, color = COZY.darkText }: {
  children: React.ReactNode; onClick?: () => void; href?: string; fill?: string; edge?: string; color?: string;
}) => {
  const props = {
    whileTap: { y: 5, boxShadow: `0 1px 0 ${edge}` },
    className: 'flex w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-xl px-5 py-4 font-black text-base lg:text-lg uppercase tracking-[0.08em]',
    style: { background: fill, color, boxShadow: `0 6px 0 ${edge}` },
  };
  if (href) {
    return (
      <Link href={href} className='block'>
        <motion.span {...props}>{children}</motion.span>
      </Link>
    );
  }
  return <motion.button type='button' onClick={onClick} {...props}>{children}</motion.button>;
};

export const MarketingHero = (props: Props) =>
  props.theme === 'cozy' ? <CozyMarketingHero {...props} /> : <MetalMarketingHero {...props} />;

// ── Тёплый стиль «cozy» ───────────────────────────────────────────────────
const CozyMarketingHero = ({ dbUserName }: Props) => {
  const { data: session } = useSession();
  const userName = dbUserName || session?.user?.name;
  const [loginOpen, setLoginOpen] = useState(false);
  const headline = { color: COZY.title, textShadow: `0 3px 0 ${COZY.headlineShadow}, 0 6px 0 rgba(0,0,0,0.35)` };
  const accentLine = { color: COZY.headline, textShadow: `0 3px 0 ${COZY.headlineShadow}, 0 6px 0 rgba(0,0,0,0.35)` };

  return (
    <div className='relative w-full flex-1 flex flex-col items-center overflow-x-clip'>
      {/* Тёплый фон: тёмный «камень» + мягкий свет, как от лампы */}
      <div className='pointer-events-none fixed inset-0 -z-10' style={{ backgroundColor: '#221E1A' }}>
        <div className='absolute inset-0' style={{ background: 'radial-gradient(ellipse at 50% 20%, #FFB67A2E, transparent 60%)' }} />
        <div className='absolute inset-0' style={{ background: 'radial-gradient(ellipse at 50% 35%, transparent 35%, rgba(0,0,0,0.5) 100%)' }} />
      </div>

      <div className='relative z-10 max-w-[988px] w-full flex flex-col lg:flex-row items-center justify-center px-4 pt-6 lg:pt-14 gap-4 lg:gap-10'>
        <motion.div
          className='relative w-[220px] h-[220px] lg:w-[380px] lg:h-[380px] shrink-0 rounded-3xl'
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.45, duration: 0.8 }}
          style={{ background: COZY.card, border: `4px solid ${COZY.cardBorder}`, boxShadow: `0 8px 0 ${COZY.cardEdge}` }}
        >
          <div className='absolute inset-0 rounded-3xl' style={{ background: 'radial-gradient(closest-side, #FFB67A33, transparent)' }} />
          <Lottie animationData={LottieHelloBread} loop style={{ width: '100%', height: '100%', position: 'relative' }} />
        </motion.div>

        <motion.div
          className='flex flex-col items-center lg:items-start gap-y-6 max-w-[440px] w-full'
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <span
            className='inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em]'
            style={{ background: COZY.wood, color: '#FFE8C7', border: `2px solid ${COZY.woodBorder}`, boxShadow: `0 3px 0 ${COZY.woodEdge}` }}
          >
            <Sparkles className='h-3.5 w-3.5' style={{ color: COZY.honey }} />
            ЕГЭ · ОГЭ · ЛНИП
          </span>

          <h1 className='text-3xl lg:text-5xl font-black leading-tight text-center lg:text-left' style={headline}>
            {userName ? 'С возвращением,' : 'Привет! Давай'}
            <br />
            <span style={accentLine}>{userName ? `${userName}!` : 'учиться вместе!'}</span>
          </h1>

          <p className='text-base lg:text-lg font-semibold text-center lg:text-left' style={{ color: '#D9C4A3' }}>
            {userName
              ? 'Готов продолжить? У тебя отлично получается 🌟'
              : 'Задачи, тренажёры и разборы по шагам — как игра, только к экзамену. У тебя всё получится ❤️'}
          </p>

          <div className='flex flex-col items-stretch gap-y-4 w-full max-w-[340px]'>
            {userName ? (
              <CozyCta href='/learn'>
                Продолжаем учиться
                <ArrowRight className='h-5 w-5' />
              </CozyCta>
            ) : (
              <>
                <CozyCta onClick={() => setLoginOpen(true)}>
                  Начать учиться
                  <ArrowRight className='h-5 w-5' />
                </CozyCta>
                <CozyCta href='/test' fill={COZY.card} edge={COZY.cardEdge} color={COZY.title}>
                  <span className='whitespace-normal text-center text-sm normal-case tracking-normal'>Пройти бесплатный тест без регистрации</span>
                </CozyCta>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Витрина курсов — баннеры в деревянных рамках */}
      <div className='relative z-10 w-full max-w-[988px] px-4 pt-12 pb-10'>
        <div className='mb-4 flex items-center gap-3'>
          <h2 className='text-sm font-black uppercase tracking-[0.15em]' style={{ color: COZY.headline }}>Курсы</h2>
          <div className='h-[3px] flex-1 rounded-full' style={{ background: `linear-gradient(90deg, ${COZY.woodBorder}, transparent)` }} />
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4'>
          {COURSE_BANNERS.map((c, i) => (
            <motion.div
              key={c.src}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              whileHover={{ y: -3 }}
              className='overflow-hidden rounded-xl'
              style={{ background: COZY.wood, border: `3px solid ${COZY.woodBorder}`, boxShadow: `0 6px 0 ${COZY.woodEdge}` }}
            >
              <div className='relative aspect-square w-full overflow-hidden'>
                <Image src={c.src} alt={c.title} fill sizes='(max-width: 640px) 50vw, 200px' className='object-cover' />
              </div>
              <p className='px-2 py-2 text-center text-xs lg:text-sm font-black' style={{ color: '#FFE8C7' }}>{c.title}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
};

// ── Игровой стиль (текущий) ───────────────────────────────────────────────
const MetalMarketingHero = ({ dbUserName }: Props) => {
  const { data: session } = useSession();
  const userName = dbUserName || session?.user?.name;
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className='relative w-full flex-1 flex flex-col items-center overflow-x-clip'>
      {/* Фон: свечения в цветах логотипа + затемнение к краям */}
      <div className='pointer-events-none absolute inset-0 -z-0'>
        <div
          className='absolute left-1/2 top-[8%] h-[560px] w-[560px] -translate-x-[85%] opacity-40'
          style={{ background: `radial-gradient(closest-side, ${LOGO_PURPLE}, ${LOGO_PURPLE}55 45%, transparent)` }}
        />
        <div
          className='absolute left-1/2 top-[18%] h-[520px] w-[520px] -translate-x-[10%] opacity-30'
          style={{ background: `radial-gradient(closest-side, ${LOGO_GREEN}, ${LOGO_GREEN}55 45%, transparent)` }}
        />
        <div className='absolute inset-0' style={{ background: 'radial-gradient(ellipse at 50% 35%, transparent 35%, rgba(0,0,0,0.55) 100%)' }} />
      </div>

      <div className='relative z-10 max-w-[988px] w-full flex flex-col lg:flex-row items-center justify-center px-4 pt-6 lg:pt-14 gap-4 lg:gap-10'>
        <motion.div
          className='relative w-[220px] h-[220px] lg:w-[400px] lg:h-[400px] shrink-0'
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.45, duration: 0.8 }}
        >
          <div
            className='absolute inset-0'
            style={{ background: `radial-gradient(closest-side, rgba(255,255,255,0.16), transparent)` }}
          />
          <Lottie animationData={LottieHelloBread} loop style={{ width: '100%', height: '100%', position: 'relative' }} />
        </motion.div>

        <motion.div
          className='flex flex-col items-center lg:items-start gap-y-6 max-w-[440px] w-full'
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <span className='inline-flex items-center gap-1.5 rounded-full border border-[#3A464E] bg-[#151F23]/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#9AA7B0]'>
            <Sparkles className='h-3.5 w-3.5' style={{ color: CTA_ACCENT }} />
            ЕГЭ · ОГЭ · ЛНИП
          </span>

          {userName ? (
            <h1 className='text-3xl lg:text-5xl font-black leading-tight text-[#F2F7FB] text-center lg:text-left [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]'>
              С возвращением,
              <br />
              <span
                className='bg-clip-text text-transparent'
                style={{ backgroundImage: `linear-gradient(90deg, ${LOGO_PURPLE}, ${CTA_ACCENT})` }}
              >
                {userName}!
              </span>
            </h1>
          ) : (
            <h1 className='text-3xl lg:text-5xl font-black leading-tight text-[#F2F7FB] text-center lg:text-left [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]'>
              Привет! Давай
              <br />
              <span
                className='bg-clip-text text-transparent'
                style={{ backgroundImage: `linear-gradient(90deg, ${LOGO_PURPLE}, ${CTA_ACCENT})` }}
              >
                учиться вместе!
              </span>
            </h1>
          )}

          <p className='text-base lg:text-lg text-[#9AA7B0] text-center lg:text-left'>
            {userName
              ? 'Готов продолжить? У тебя отлично получается 🌟'
              : 'Задачи, тренажёры и разборы по шагам — как игра, только к экзамену. У тебя всё получится ❤️'}
          </p>

          <div className='flex flex-col items-stretch gap-y-3 w-full max-w-[340px]'>
            {userName ? (
              <PremiumButton href='/learn'>
                Продолжаем учиться
                <ArrowRight className='h-5 w-5' />
              </PremiumButton>
            ) : (
              <>
                <PremiumButton onClick={() => setLoginOpen(true)}>
                  Начать учиться
                  <ArrowRight className='h-5 w-5' />
                </PremiumButton>
                <Link
                  href='/test'
                  className='text-center rounded-2xl border-2 border-[#3A464E] bg-[#151F23]/70 px-6 py-3 text-sm font-bold text-[#F2F7FB] transition-colors hover:border-[#5A6B76] hover:bg-[#1C282E]'
                >
                  Пройти бесплатный тест без регистрации
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Витрина курсов — те же баннеры, что на /courses */}
      <div className='relative z-10 w-full max-w-[988px] px-4 pt-12 pb-10'>
        <div className='mb-4 flex items-center gap-3'>
          <h2 className='text-sm font-extrabold uppercase tracking-[0.15em] text-[#9AA7B0]'>Курсы</h2>
          <div className='h-px flex-1 bg-gradient-to-r from-[#3A464E] to-transparent' />
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4'>
          {COURSE_BANNERS.map((c, i) => (
            <motion.div
              key={c.src}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className='group rounded-2xl p-[2px] bg-gradient-to-b from-[#5A6B76] via-[#2A363C] to-[#141C20] shadow-[0_10px_28px_rgba(0,0,0,0.45)]'
            >
              <div className='overflow-hidden rounded-[14px] bg-[#151F23]'>
                <div className='relative aspect-square w-full overflow-hidden'>
                  <Image src={c.src} alt={c.title} fill sizes='(max-width: 640px) 50vw, 200px' className='object-cover transition-transform duration-300 group-hover:scale-105' />
                  <div className='pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#151F23] to-transparent' />
                </div>
                <p className='px-2 pb-2.5 pt-0.5 text-center text-xs lg:text-sm font-extrabold text-[#F2F7FB]'>{c.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
};
