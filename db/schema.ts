// db/schema.ts

import { relations } from 'drizzle-orm';
import { boolean, integer, json, pgEnum, pgTable, primaryKey, real, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';

// ===== TYPES =====

export interface progressType {
	[index_progress: number]: {
		date: string;
		hw: number[];
		selfDoneRight: number;
		selfDoneWrong: number;
		dateReady: string;
		hearts: number;
		pts: number;
		gems: number;
	};
}[]

export interface SuperType {
	[index_super: number]: {
		course: string;
		progress: progressType;
	};
}[]

// ===== ENUMS =====

export type allTypesCT = "M_ASC" | "SELECT" | "ASSIST" | "CONNECT" | "SLIDER" | "CONSTRUCT" | "WORKBOOK" | "R ASSIST" | "R CONNECT" | "R SLIDER" | "GEOSIN" | "RUSSIANDICTANT" | "SWIPE";

export const challengesEnum = pgEnum("type", [
	"M_ASC", "SELECT", "ASSIST", "CONNECT", "SLIDER", "CONSTRUCT", "WORKBOOK",
	"R ASSIST", "R CONNECT", "R SLIDER", "GEOSIN", "RUSSIANDICTANT", "SWIPE"
]);


// export const challengesEnum = pgEnum("type");

export const t_challengesEnum = pgEnum("type", [
	"M_ASC", "SELECT", "ASSIST", "CONNECT", "SLIDER", "CONSTRUCT", "WORKBOOK",
	"R ASSIST", "R CONNECT", "R SLIDER", "GEOSIN", "RUSSIANDICTANT", "SWIPE"
]);

// ===== COURSES =====

export const courses = pgTable('courses', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	imageSrc: text('image_src').notNull(),
});

// ===== USER PROGRESS (глобальный) =====

export const userProgress = pgTable('user_progress', {
	userId: text('user_id').primaryKey(),
	userName: text('user_name').notNull().default('User'),
	userImageSrc: text('user_image_src').notNull().default('/mascot.svg'),
	activeCourseId: integer('active_course_id').references(() => courses.id, { onDelete: 'cascade' }),
	hearts: integer('hearts').notNull().default(500),
	points: integer('points').notNull().default(0),
	gems: integer('gems').notNull().default(0), // 👈 ДОБАВЛЕНО глобальные гемы
	isAdmin: integer('is_admin').notNull().default(0),
	classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }),
	isOnMeme: integer('is_on_meme').notNull().default(1),
	
	// @deprecated - используй userDailyStats и userCourseProgress вместо этого
	courseProgress: json('course_progress').$type<SuperType>().notNull().default([
		{
			course: "book1",
			progress: [{
				date: "date1",
				hw: [10, 0, 0],
				selfDoneRight: 0,
				selfDoneWrong: 0,
				dateReady: "",
				hearts: 0,
				pts: 0,
				gems: 0,
			}]
		}
	]),
});

// ===== USER COURSE PROGRESS (прогресс по конкретному курсу) =====

export const userCourseProgress = pgTable('user_course_progress', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	courseId: integer('course_id').references(() => courses.id),
	
	points: integer('points').notNull().default(0),
	gems: integer('gems').notNull().default(0),
	progressPercent: integer('progress_percent').notNull().default(0),
	
	streak: integer('streak').notNull().default(0),
	longestStreak: integer('longest_streak').notNull().default(0),
	lastActiveDate: timestamp('last_active_date'),
	
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
	uniqueUserCourse: unique('unique_user_course').on(table.userId, table.courseId),
}));

// ===== USER DAILY STATS (ежедневная статистика по курсам) =====

export const userDailyStats = pgTable('user_daily_stats', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	courseId: integer('course_id').notNull().references(() => courses.id),
	date: timestamp('date').notNull(),
	
	pointsEarned: integer('points_earned').notNull().default(0),
	gemsEarned: integer('gems_earned').notNull().default(0),
	gemsSpent: integer('gems_spent').notNull().default(0),
	
	challengesDone: integer('challenges_done').notNull().default(0),
	challengesRight: integer('challenges_right').notNull().default(0),
	challengesWrong: integer('challenges_wrong').notNull().default(0),
	
	hwAssigned: integer('hw_assigned').notNull().default(0),
	hwDone: integer('hw_done').notNull().default(0),
	hwCompleted: boolean('hw_completed').default(false),
	
	// 🔥 ДОБАВИТЬ ЭТУ СТРОЧКУ:
	hwChallengeIds: text('hw_challenge_ids'), // строка с ID задач через запятую
	
	accuracy: real('accuracy').default(0),
	
	lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	
}, (table) => ({
	uniqueUserCourseDate: unique('unique_user_course_date').on(table.userId, table.courseId, table.date),
}));

// ===== UNITS =====

export const units = pgTable('units', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	imageSrc: text('image_src').notNull(),
	courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
	order: integer('order').notNull(),
});

// ===== LESSONS =====

export const lessons = pgTable('lessons', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	unitId: integer('unit_id').references(() => units.id, { onDelete: 'cascade' }).notNull(),
	order: integer('order').notNull(),
});

// ===== CHALLENGES =====

export const challenges = pgTable('challenges', {
	id: serial('id').primaryKey(),
	lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
	type: challengesEnum('type').notNull(),
	question: text('question').notNull(),
	order: integer('order').notNull(),
	points: integer('points').notNull(),
	author: text('author').notNull(),
	difficulty: text('difficulty').notNull(),
	imageSrc: text('image_src').notNull(),
});

// ===== CHALLENGE OPTIONS =====

export const challengeOptions = pgTable('challenge_options', {
	id: serial('id').primaryKey(),
	challengeId: integer('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
	text: text('text').notNull(),
	correct: boolean('correct').notNull(),
	imageSrc: text('image_src'),
	audioSrc: text('audio_src'),
});

// ===== CHALLENGE PROGRESS =====

export const challengeProgress = pgTable('challenge_progress', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	challengeId: integer('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
	completed: boolean('completed').notNull().default(false),
	doneRight: boolean('done_right').notNull().default(false),
	dateDone: timestamp('date_done').notNull().defaultNow(),
});

// ===== USER SUBSCRIPTION =====

export const userSubscription = pgTable("user_subscription", {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull().unique(),
	stripeCustomerId: text('stripe_customer_id').notNull().unique(),
	stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
	stripePriceId: text('stripe_price_id').notNull(),
	stripeCurrentPeriodEnd: timestamp('stripe_current_period_end').notNull(),
});



// ===== USER HOMEWORK =====

export const userHomework = pgTable('user_homework', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
    
    // Для задачника (challenges) - может быть null
    challengeIds: text('challenge_ids'),  // ← убрать .notNull()
    
    // Для тренажера (t_lessons) - может быть null
    tLessonIds: text('t_lesson_ids'),     // ← добавить новую колонку
    
    totalCount: integer('total_count').notNull().default(0),
    assignedAt: timestamp('assigned_at').notNull(),
    dueDate: timestamp('due_date').notNull(),
    
    status: text('status').notNull().default('pending'),
    completedAt: timestamp('completed_at'),
    
    correctCount: integer('correct_count').notNull().default(0),
    wrongCount: integer('wrong_count').notNull().default(0),
    
    lastNotifiedAt: timestamp('last_notified_at'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),

    // 🔥 Тип домашнего задания: 'teacher' (от учителя) или 'daily' (ежедневный челлендж)
    type: text('type').notNull().default('teacher'),
});


// Добавь индексы для быстрых запросов
export const userHomeworkIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_user_homework_user_id ON user_homework(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_user_homework_course_id ON user_homework(course_id);`,
    `CREATE INDEX IF NOT EXISTS idx_user_homework_status ON user_homework(status);`,
    `CREATE INDEX IF NOT EXISTS idx_user_homework_due_date ON user_homework(due_date);`,
    `CREATE INDEX IF NOT EXISTS idx_user_homework_user_status ON user_homework(user_id, status);`,
];




export const userHomeworkRelations = relations(userHomework, ({ one }) => ({
    user: one(userProgress, {
        fields: [userHomework.userId],
        references: [userProgress.userId],
    }),
    course: one(courses, {
        fields: [userHomework.courseId],
        references: [courses.id],
    }),
}));









// ===== TRAINER (ТРЕНАЖЕР) =====

export const t_courses = pgTable('t_courses', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	imageSrc: text('image_src').notNull(),
});

export const t_units = pgTable('t_units', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	imageSrc: text('image_src').notNull(),
	t_courseId: integer('t_course_id').references(() => t_courses.id, { onDelete: 'cascade' }).notNull(),
	order: integer('order').notNull(),
});

export const t_lessons = pgTable('t_lessons', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	t_unitId: integer('t_unit_id').references(() => t_units.id, { onDelete: 'cascade' }).notNull(),
	order: integer('order').notNull(),
});

export const t_challenges = pgTable('t_challenges', {
	id: serial('id').primaryKey(),
	t_lessonId: integer('lesson_id').references(() => t_lessons.id, { onDelete: 'cascade' }).notNull(),
	type: t_challengesEnum('type').notNull(),
	question: text('question').notNull(),
	order: integer('order').notNull(),
	points: integer('points').notNull(),
	author: text('author').notNull(),
	numRans: text('num_r_ans').notNull(),
	difficulty: text('difficulty').notNull(),
	imageSrc: text('image_src').notNull(),
});

export const t_challengeOptions = pgTable('t_challenge_options', {
	id: serial('id').primaryKey(),
	t_challengeId: integer('t_challenge_id').references(() => t_challenges.id, { onDelete: 'cascade' }).notNull(),
	text: text('text').notNull(),
	correct: boolean('correct').notNull(),
	imageSrc: text('image_src'),
	audioSrc: text('audio_src'),
});

export const t_lessonProgress = pgTable('t_lesson_progress', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	t_lessonId: integer('t_lesson_id').references(() => t_lessons.id, { onDelete: 'cascade' }).notNull(),
	doneRightPercent: integer('done_right_percent').notNull().default(0),
	doneRight: integer('done_right').notNull().default(0),
	doneWrong: integer('done_wrong').notNull().default(0),
	dateDone: timestamp('date_done').notNull().defaultNow(),
	trainingPts: integer('training_pts').notNull().default(0),
});

// ===== CLASSES =====

export const classes = pgTable('classes', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	imageSrc: text('image_src').notNull(),
	courseListIds: text('course_list_ids'),
	tCourseListIds: text('t_course_list_ids'),
});

export const classesHw = pgTable('classes_hw', {
	id: serial('id').primaryKey(),
	task: text('task'),
	taskTrainer: text('task_trainer'),
	dateHw: timestamp('date_hw').notNull().defaultNow(),
	classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
});

// =============================================
// ========== ОТНОШЕНИЯ (RELATIONS) ============
// =============================================

// COURSES RELATIONS
export const coursesRelations = relations(courses, ({ many }) => ({
	userProgress: many(userProgress),
	units: many(units),
	userCourseProgress: many(userCourseProgress),
	userDailyStats: many(userDailyStats),
}));

// USER PROGRESS RELATIONS (глобальный)
export const userProgressRelations = relations(userProgress, ({ one, many }) => ({
	activeCourse: one(courses, {
		fields: [userProgress.activeCourseId],
		references: [courses.id],
	}),
	class: one(classes, {
		fields: [userProgress.classId],
		references: [classes.id],
	}),
	courseProgress: many(userCourseProgress),
	dailyStats: many(userDailyStats),
}));

// USER COURSE PROGRESS RELATIONS
export const userCourseProgressRelations = relations(userCourseProgress, ({ one }) => ({
	user: one(userProgress, {
		fields: [userCourseProgress.userId],
		references: [userProgress.userId],
	}),
	course: one(courses, {
		fields: [userCourseProgress.courseId],
		references: [courses.id],
	}),
}));

// USER DAILY STATS RELATIONS
export const userDailyStatsRelations = relations(userDailyStats, ({ one }) => ({
	user: one(userProgress, {
		fields: [userDailyStats.userId],
		references: [userProgress.userId],
	}),
	course: one(courses, {
		fields: [userDailyStats.courseId],
		references: [courses.id],
	}),
}));

// UNITS RELATIONS
export const unitsRelations = relations(units, ({ many, one }) => ({
	course: one(courses, {
		fields: [units.courseId],
		references: [courses.id],
	}),
	lessons: many(lessons),
}));

// LESSONS RELATIONS
export const lessonsRelations = relations(lessons, ({ one, many }) => ({
	unit: one(units, {
		fields: [lessons.unitId],
		references: [units.id],
	}),
	challenges: many(challenges),
}));

// CHALLENGES RELATIONS
export const challengesRelations = relations(challenges, ({ one, many }) => ({
	lesson: one(lessons, {
		fields: [challenges.lessonId],
		references: [lessons.id],
	}),
	challengeOptions: many(challengeOptions),
	challengeProgress: many(challengeProgress),
}));

// CHALLENGE OPTIONS RELATIONS
export const challengeOptionsRelations = relations(challengeOptions, ({ one }) => ({
	challenge: one(challenges, {
		fields: [challengeOptions.challengeId],
		references: [challenges.id],
	}),
}));

// CHALLENGE PROGRESS RELATIONS
export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
	challenge: one(challenges, {
		fields: [challengeProgress.challengeId],
		references: [challenges.id],
	}),
	user: one(userProgress, {
		fields: [challengeProgress.userId],
		references: [userProgress.userId],
	}),
}));









// TRAINER COURSES RELATIONS
export const t_coursesRelations = relations(t_courses, ({ many }) => ({
	t_units: many(t_units),
}));

// TRAINER UNITS RELATIONS
export const t_unitsRelations = relations(t_units, ({ many, one }) => ({
	t_course: one(t_courses, {
		fields: [t_units.t_courseId],
		references: [t_courses.id],
	}),
	t_lessons: many(t_lessons),
}));

// TRAINER LESSONS RELATIONS
export const t_lessonsRelations = relations(t_lessons, ({ one, many }) => ({
	t_unit: one(t_units, {
		fields: [t_lessons.t_unitId],
		references: [t_units.id],
	}),
	t_challenges: many(t_challenges),
	t_lessonProgress: many(t_lessonProgress),
}));

// // TRAINER CHALLENGES RELATIONS (ВРОДЕ РАБОТАЛО)
// export const t_challengesRelations = relations(t_challenges, ({ one, many }) => ({
// 	t_lesson: one(t_lessons, {
// 		fields: [t_challenges.t_lessonId],
// 		references: [t_lessons.id],
// 	}),
// 	t_challengeOptions: many(t_challengeOptions),
// 	t_lessonProgress: many(t_lessonProgress),
// }));

// TRAINER CHALLENGES RELATIONS (ИСПРАВЛЕНО)
export const t_challengesRelations = relations(t_challenges, ({ one, many }) => ({
  t_lesson: one(t_lessons, {
    fields: [t_challenges.t_lessonId],
    references: [t_lessons.id],
  }),
  t_challengeOptions: many(t_challengeOptions),
  // ❌ Удалите эту строку - t_lessonProgress не относится к t_challenges
  // t_lessonProgress: many(t_lessonProgress),
}));




// TRAINER CHALLENGE OPTIONS RELATIONS
export const t_challengeOptionsRelations = relations(t_challengeOptions, ({ one }) => ({
	t_challenge: one(t_challenges, {
		fields: [t_challengeOptions.t_challengeId],
		references: [t_challenges.id],
	}),
}));

// TRAINER LESSON PROGRESS RELATIONS
export const t_lessonProgressRelations = relations(t_lessonProgress, ({ one }) => ({
	t_lesson: one(t_lessons, {
		fields: [t_lessonProgress.t_lessonId],
		references: [t_lessons.id],
	}),
	user: one(userProgress, {
		fields: [t_lessonProgress.userId],
		references: [userProgress.userId],
	}),
}));

// CLASSES RELATIONS
export const classesRelations = relations(classes, ({ many }) => ({
	userProgress: many(userProgress),
	classesHw: many(classesHw),
}));

// CLASSES HW RELATIONS
export const classesHwRelations = relations(classesHw, ({ one }) => ({
	class: one(classes, {
		fields: [classesHw.classId],
		references: [classes.id],
	}),
}));

// =============================================
// ========== ИНДЕКСЫ (для миграций) ==========
// =============================================

export const indexes = {
	userDailyStats: [
		`CREATE INDEX IF NOT EXISTS idx_user_daily_stats_date ON user_daily_stats(date);`,
		`CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_id ON user_daily_stats(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_user_daily_stats_course_date ON user_daily_stats(course_id, date);`,
		`CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_course_date ON user_daily_stats(user_id, course_id, date);`,
	],
	userCourseProgress: [
		`CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_id ON user_course_progress(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_user_course_progress_course_id ON user_course_progress(course_id);`,
	],
	challengeProgress: [
		`CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON challenge_progress(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge_id ON challenge_progress(challenge_id);`,
		`CREATE INDEX IF NOT EXISTS idx_challenge_progress_date ON challenge_progress(date_done);`,
	],
	t_lessonProgress: [
		`CREATE INDEX IF NOT EXISTS idx_t_lesson_progress_user_id ON t_lesson_progress(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_t_lesson_progress_t_lesson_id ON t_lesson_progress(t_lesson_id);`,
	],
		userHomework: [
		`CREATE INDEX IF NOT EXISTS idx_user_homework_user_id ON user_homework(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_user_homework_course_id ON user_homework(course_id);`,
		`CREATE INDEX IF NOT EXISTS idx_user_homework_status ON user_homework(status);`,
		`CREATE INDEX IF NOT EXISTS idx_user_homework_due_date ON user_homework(due_date);`,
		`CREATE INDEX IF NOT EXISTS idx_user_homework_user_status ON user_homework(user_id, status);`,
		`CREATE INDEX IF NOT EXISTS idx_user_homework_user_course_due ON user_homework(user_id, course_id, due_date);`,
	],

};




// Таблицы родителей и Telegram рассылки родителям
//
export const parentLinks = pgTable('parent_links', {
    id: serial('id').primaryKey(),
    studentId: text('student_id').notNull().references(() => userProgress.userId, { onDelete: 'cascade' }),
    parentTelegramId: text('parent_telegram_id').notNull(), // Telegram ID родителя как текст
    parentName: text('parent_name'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    lastNotifiedAt: timestamp('last_notified_at'),
});

export const parentLinksRelations = relations(parentLinks, ({ one }) => ({
    student: one(userProgress, {
        fields: [parentLinks.studentId],
        references: [userProgress.userId],
    }),
}));




// КВЕСТЫ ДЛЯ ТРЕНАЖЕРА (ежедневное задание в тренажере)
//
export const trainerQuests = pgTable('trainer_quests', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    tCourseId: integer('t_course_id').references(() => t_courses.id),  // ← tCourseId!
    date: timestamp('date').notNull(),
    
    tLessonIds: text('t_lesson_ids').notNull(),
    completedCount: integer('completed_count').notNull().default(0),
    totalCount: integer('total_count').notNull().default(0),
    isCompleted: boolean('is_completed').default(false),
    completedAt: timestamp('completed_at'),
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Стрик по тренажеру
export const trainerStreaks = pgTable('trainer_streaks', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    tCourseId: integer('t_course_id').references(() => t_courses.id),  // ← tCourseId!
    currentStreak: integer('current_streak').default(0),
    longestStreak: integer('longest_streak').default(0),
    lastCompletedDate: timestamp('last_completed_date'),
    updatedAt: timestamp('updated_at').defaultNow(),
});












// db/schema.ts

export const achievements = pgTable('achievements', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),           // "Домашняя крыса"
    description: text('description'),       // "Выполни первое домашнее задание"
    category: text('category').notNull(),   // "homework", "streak", "trainer", "special"
    requirement: integer('requirement').notNull(), // сколько нужно
    rewardPoints: integer('reward_points').default(10),
    rewardGems: integer('reward_gems').default(5),
    imageSrc: text('image_src'),
    isHidden: boolean('is_hidden').default(false),
    sortOrder: integer('sort_order').default(0),
});

export const userAchievements = pgTable('user_achievements', {
    userId: text('user_id').notNull(),
    achievementId: integer('achievement_id').references(() => achievements.id),
    progress: integer('progress').notNull().default(0),
    isCompleted: boolean('is_completed').default(false),
    completedAt: timestamp('completed_at'),
    claimed: boolean('claimed').default(false),
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.achievementId] }),
}));













// Типы шахт (можно улучшать)
export const mineTypes = pgTable('mine_types', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(), // "Копейка", "Серебряная шахта", "Золотая шахта"
    gemPerDay: integer('gem_per_day').notNull().default(1),
    priceGems: integer('price_gems').notNull(),
    pricePoints: integer('price_points').notNull(),
    imageSrc: text('image_src'),
    requiredStreak: integer('required_streak').default(0),
});


// Шахты пользователя
export const userMines = pgTable('user_mines', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    mineTypeId: integer('mine_type_id').references(() => mineTypes.id),
    purchaseDate: timestamp('purchase_date').defaultNow(),
    lastCollectedAt: timestamp('last_collected_at').defaultNow(),
    totalCollected: integer('total_collected').notNull().default(0),
    
    // Уровень шахты (если прокачка)
    level: integer('level').notNull().default(1),
});


// db/schema.ts

export const userMinesRelations = relations(userMines, ({ one }) => ({
    mineType: one(mineTypes, {
        fields: [userMines.mineTypeId],
        references: [mineTypes.id],
    }),
}));


// Заказы пиццы
export const pizzaOrders = pgTable('pizza_orders', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    orderDate: timestamp('order_date').defaultNow(),
    deliveryAddress: text('delivery_address').notNull(),
    deliveryTime: timestamp('delivery_time').notNull(),
    phoneNumber: text('phone_number').notNull(),
    status: text('status').notNull().default('pending'), // pending, confirmed, delivered, cancelled
    gemsSpent: integer('gems_spent').notNull(),
    streakAtOrder: integer('streak_at_order').notNull(),
});




// db/schema.ts - добавить в файл после определения таблиц

// Индексы
// export const indexes = {

// };

// В миграции или при инициализации БД выполнить:
// for (const index of Object.values(indexes)) {
//   await db.execute(index);
// }