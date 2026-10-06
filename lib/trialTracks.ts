// lib/trialTracks.ts
//
// Пробные уроки без регистрации и «реферальная пицца» — по двум предметам
// (2026-10-02). Гость может пройти первый урок трека без регистрации;
// приглашённый получает кусочек пиццы, когда прошёл все 3 пошаговых разбора
// своего трека (любого — физики или математики), см. lib/referralRewards.ts.
// Файл без server-only: используется и на клиенте (тексты, ссылки).

export type TrialSubject = 'physics' | 'math'

export type TrialTrack = {
	trial: number          // урок, открытый без регистрации
	lessons: number[]      // 3 разбора, за которые дают кусочек пиццы
	tCourseId: number      // курс тренажёра
	topicGen: string       // «3 урока Электродинамики»
	subjectAcc: string     // «прохожу физику»
	lessonGen: string      // «за урок физики»
	subjectPrep: string    // «кто круче в физике»
	steps: string[]        // названия уроков на экране «Тебя позвал…»
}

export const TRIAL_TRACKS: Record<TrialSubject, TrialTrack> = {
	physics: {
		trial: 485,
		lessons: [485, 484, 491],
		tCourseId: 21,
		topicGen: 'Электродинамики',
		subjectAcc: 'физику',
		lessonGen: 'физики',
		subjectPrep: 'физике',
		steps: ['Ток крутит поле 🌀', 'Фарадей — наш брат 🤝', 'Ленц — душнила, но база 🧱'],
	},
	math: {
		trial: 490,
		lessons: [490, 488, 489],
		tCourseId: 5,
		topicGen: 'тригонометрии',
		subjectAcc: 'математику',
		lessonGen: 'математики',
		subjectPrep: 'математике',
		steps: ['Окружность — наш дом 🏠', 'Три волшебных угла ✨', 'Тангенс — изи 😎'],
	},
}

export const TRIAL_SUBJECTS = Object.keys(TRIAL_TRACKS) as TrialSubject[]
export const PUBLIC_TRIAL_T_LESSON_IDS = TRIAL_SUBJECTS.map((s) => TRIAL_TRACKS[s].trial)
export const ALL_TRACK_LESSONS = TRIAL_SUBJECTS.flatMap((s) => TRIAL_TRACKS[s].lessons)

export const subjectByTCourse = (tCourseId: number | null | undefined): TrialSubject =>
	TRIAL_SUBJECTS.find((s) => TRIAL_TRACKS[s].tCourseId === tCourseId) ?? 'physics'

export const subjectByLesson = (tLessonId: number): TrialSubject =>
	TRIAL_SUBJECTS.find((s) => TRIAL_TRACKS[s].lessons.includes(tLessonId)) ?? 'physics'
