// lib/fonts.ts
//
// Nunito с КИРИЛЛИЦЕЙ в самом жирном начертании (900) — для крупных игровых
// надписей вроде «КОМБО x5» (components/LightningStrike.tsx). Основной шрифт
// приложения (app/layout.tsx) грузит Nunito только с subsets: ['latin'] —
// русский текст там рисуется системным фолбэком, поэтому для надписи
// кириллицей нужен отдельный экземпляр. Не подключается глобально.
import { Nunito } from 'next/font/google'

export const nunitoCyrillicBlack = Nunito({ subsets: ['cyrillic', 'latin'], weight: ['900'], display: 'swap' })
