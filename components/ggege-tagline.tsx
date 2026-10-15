// components/ggege-tagline.tsx — подпись приложения «Фармим баллы ЕГЭ» рядом с логотипом (ggege.ru).
// Раз в несколько секунд по тексту пробегает светлая полоса (.animate-tagline-shine:
// градиент обрезан по буквам, двигается только его позиция — текст маленький, это дёшево).

export const GgegeTagline = ({ className = '' }: { className?: string }) => (
  <span
    className={`animate-tagline-shine bg-clip-text font-black uppercase tracking-wide text-transparent ${className}`}
    style={{
      backgroundImage:
        'linear-gradient(110deg, #F2C35B 0%, #F2C35B 40%, #FFF6D6 50%, #F2C35B 60%, #F2C35B 100%)',
      backgroundSize: '250% 100%',
    }}
  >
    Фармим баллы ЕГЭ
  </span>
)
