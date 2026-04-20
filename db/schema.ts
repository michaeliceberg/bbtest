import { relations } from 'drizzle-orm';
// import { bigint } from 'drizzle-orm/mysql-core';
import { boolean, integer, json, jsonb, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';



 export interface progressType {
	[index_progress: number]:
			{
				date: string,
				hw: number[],
				selfDoneRight: number,
				selfDoneWrong: number,
				dateReady: string,
				hearts: number,
				pts: number,
				gems: number,
			}	
  }[]

 export interface SuperType  {
	[index_super: number]:
		{
			course: string;
			progress: progressType;
		}
  }[]


 


export const courses = pgTable('courses', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	imageSrc: text('image_src').notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
	userProgress: many(userProgress),
	units: many(units),
}));





export const userProgress = pgTable('user_progress', {
	userId: text('user_id').primaryKey(),
	userName: text('user_name').notNull().default('User'),
	userImageSrc: text('user_image_src').notNull().default('/mascot.svg'),
	activeCourseId: integer('active_course_id').references(() => courses.id, { onDelete: 'cascade' }),
	hearts: integer('hearts').notNull().default(500),
	points: integer('points').notNull().default(0),

	isAdmin: integer('is_admin').notNull().default(0),


	classId: integer('class_id')
	.references(() => classes.id, { onDelete: 'cascade' }),


	// isOnMeme: boolean('is_on_meme').notNull().default(true),
	isOnMeme: integer('is_on_meme').notNull().default(1),

	// courseProgress: json('course_progress').$type<SuperType>().notNull().default(
	courseProgress: json('course_progress').$type<SuperType>()
	.notNull().default
	(
		[{
			course: "book1",
			progress: 
				[{
					date: "date1",
					hw: [10, 0, 0],
					selfDoneRight: 0,
					selfDoneWrong: 0,
					dateReady: "",
					hearts: 0,
					pts: 0,
					gems: 0,
				},]
		},]
	)
});



export const userProgressRelations = relations(userProgress, ({ one }) => ({
	activeCourse: one(courses, {
		fields: [userProgress.activeCourseId],
		references: [courses.id],
	}),


	class: one(classes, {
		fields: [userProgress.classId],
		references: [classes.id],
	}),


	
}));





export const units = pgTable('units', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(), // Unit 1
	description: text('description').notNull(), // Learn the basics
	imageSrc: text('image_src').notNull(),
	courseId: integer('course_id')
		.references(() => courses.id, { onDelete: 'cascade' })
		.notNull(),
	order: integer('order').notNull(),
});

export const unitsRelations = relations(units, ({ many, one }) => ({
	course: one(courses, {
		fields: [units.courseId],
		references: [courses.id],
	}),
	lessons: many(lessons),
}));




export const lessons = pgTable('lessons', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	unitId: integer('unit_id')
		.references(() => units.id, { onDelete: 'cascade' })
		.notNull(),
	order: integer('order').notNull(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
	unit: one(units, {
		fields: [lessons.unitId],
		references: [units.id],
	}),
	challenges: many(challenges),
}));



// export const allTypesCasualTrainer = ["SELECT", "ASSIST", "CONNECT", "SLIDER", "CONSTRUCT", "WORKBOOK",
// "R ASSIST", "R CONNECT", "R SLIDER", "GEOSIN", "RUSSIANDICTANT"] as const;

// export const allTypesCasualTrainer = "SELECT", "ASSIST", "CONNECT", "SLIDER", "CONSTRUCT", "WORKBOOK",
// "R ASSIST", "R CONNECT", "R SLIDER", "GEOSIN", "RUSSIANDICTANT"




export type allTypesCT = "M_ASC" | "SELECT" | "ASSIST" | "CONNECT" | "SLIDER" | "CONSTRUCT" | "WORKBOOK" | "R ASSIST" | "R CONNECT" | "R SLIDER" | "GEOSIN" | "RUSSIANDICTANT" | "SWIPE";
// CT? что значит


export const challengesEnum = pgEnum("type", ["M_ASC", "SELECT", "ASSIST", "CONNECT", "SLIDER", "CONSTRUCT", "WORKBOOK",
												        "R ASSIST", "R CONNECT", "R SLIDER", "GEOSIN", "RUSSIANDICTANT", "SWIPE",
])


export const t_challengesEnum = pgEnum("type", ["M_ASC", "SELECT", "ASSIST", "CONNECT", "SLIDER", "CONSTRUCT", "WORKBOOK",
															"R ASSIST", "R CONNECT", "R SLIDER", "GEOSIN", "RUSSIANDICTANT", "SWIPE",
])


// export const typeChallenges = "SELECT" | "ASSIST" | "CONNECT" | "SLIDER" | "CONSTRUCT" | "WORKBOOK" | "R ASSIST" | "R CONNECT" | "R SLIDER" | "GEOSIN"

// export const challengesEnumAllVariants:[string, ...string[]] = ["SELECT", "ASSIST", "CONNECT", "SLIDER", "CONSTRUCT", "WORKBOOK",
// "R ASSIST", "R CONNECT", "R SLIDER", "GEOSIN",]


// export const challengesEnum = pgEnum("type", challengesEnumAllVariants)


// export const t_challengesEnum = pgEnum("type", challengesEnumAllVariants)


export const challenges = pgTable('challenges', {
	// id: serial('id').primaryKey(),
	id: serial('id').primaryKey(),
	lessonId: integer('lesson_id').references(()=>lessons.id, {onDelete: 'cascade'}).notNull(),
	type: challengesEnum('type').notNull(),
	question: text('question').notNull(),
	order: integer('order').notNull(),
	points: integer('points').notNull(),
	author: text('author').notNull(),

	difficulty: text('difficulty').notNull(),
	imageSrc: text('image_src').notNull(),
});

export const challengesRelations = relations(challenges, ({ one, many }) => ({
	lesson: one(lessons, {
		fields: [challenges.lessonId],
		references:[lessons.id],
	}),
	challengeOptions: many(challengeOptions),
	challengeProgress: many(challengeProgress),
}));




export const challengeOptions = pgTable('challenge_options', {
	id: serial('id').primaryKey(),
	challengeId: integer('challenge_id').references(()=>challenges.id, {onDelete: 'cascade'}).notNull(),	
	text: text('text').notNull(),
	correct: boolean('correct').notNull(),
	imageSrc: text('image_src'),
	audioSrc: text('audio_src'),
});


export const challengeOptionsRelations = relations(challengeOptions, ({ one }) => ({
	
	challenge: one(challenges, {
		fields: [challengeOptions.challengeId],
		references:[challenges.id],
	})
}));





export const challengeProgress = pgTable('challenge_progress', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(), // TODO: confirm this 
	challengeId: integer('challenge_id').references(()=>challenges.id, {onDelete: 'cascade'}).notNull(),	
	completed: boolean('completed').notNull().default(false),
	doneRight: boolean('done_right').notNull().default(false),
	dateDone: timestamp('date_done').notNull().defaultNow(),
});


export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
	
	challenge: one(challenges, {
		fields: [challengeProgress.challengeId],
		references:[challenges.id],
	})
}));






export const userSubscription = pgTable("user_subscription", {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull().unique(),
	stripeCustomerId: text('stripe_customer_id').notNull().unique(),
	stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
	stripePriceId: text('stripe_price_id').notNull(),
	stripeCurrentPeriodEnd: timestamp('stripe_current_period_end').notNull(),
})






// TODO: Trainer Trainer Trainer Trainer Trainer Trainer Trainer Trainer Trainer Trainer



export const t_courses = pgTable('t_courses', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	imageSrc: text('image_src').notNull(),
});

export const t_coursesRelations = relations(t_courses, ({ many }) => ({
	userProgress: many(userProgress),
	t_units: many(t_units),
}));









export const t_units = pgTable('t_units', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(), // Unit 1
	description: text('description').notNull(), // Learn the basics
	imageSrc: text('image_src').notNull(),
	t_courseId: integer('t_course_id')
		.references(() => t_courses.id, { onDelete: 'cascade' })
		.notNull(),
	order: integer('order').notNull(),
});

export const t_unitsRelations = relations(t_units, ({ many, one }) => ({
	t_course: one(t_courses, {
		fields: [t_units.t_courseId],
		references: [t_courses.id],
	}),
	t_lessons: many(t_lessons),
}));




export const t_lessons = pgTable('t_lessons', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	t_unitId: integer('t_unit_id')
		.references(() => t_units.id, { onDelete: 'cascade' })
		.notNull(),
	order: integer('order').notNull(),
});

export const t_lessonsRelations = relations(t_lessons, ({ one, many }) => ({
	t_unit: one(t_units, {
		fields: [t_lessons.t_unitId],
		references: [t_units.id],
	}),
	t_challenges: many(t_challenges),
}));




// export const t_challengesEnum = pgEnum("type", ["SELECT", "ASSIST", "CONNECT", "SLIDER", "CONSTRUCT", "WORKBOOK",
// 															"R ASSIST", "R CONNECT", "R SLIDER", "GEOSIN",
// ])




export const t_challenges = pgTable('t_challenges', {
	id: serial('id').primaryKey(),
	// id: bigint('id').primaryKey(),
	// id: bigint('id').primaryKey(),
	t_lessonId: integer('lesson_id').references(()=>t_lessons.id, {onDelete: 'cascade'}).notNull(),
	type: t_challengesEnum('type').notNull(),
	question: text('question').notNull(),
	order: integer('order').notNull(),
	points: integer('points').notNull(),
	author: text('author').notNull(),

	numRans: text('num_r_ans').notNull(),
	difficulty: text('difficulty').notNull(),
	imageSrc: text('image_src').notNull(),

});

export const t_challengesRelations = relations(t_challenges, ({ one, many }) => ({
	t_lesson: one(t_lessons, {
		fields: [t_challenges.t_lessonId],
		references:[t_lessons.id],
	}),
	t_challengeOptions: many(t_challengeOptions),
	t_lessonProgress: many(t_lessonProgress),
}));



// 



export const t_challengeOptions = pgTable('t_challenge_options', {
	id: serial('id').primaryKey(),
	t_challengeId: integer('t_challenge_id').references(()=>t_challenges.id, {onDelete: 'cascade'}).notNull(),	
	text: text('text').notNull(),
	correct: boolean('correct').notNull(),
	imageSrc: text('image_src'),
	audioSrc: text('audio_src'),
});


export const t_challengeOptionsRelations = relations(t_challengeOptions, ({ one }) => ({
	
	t_challenge: one(t_challenges, {
		fields: [t_challengeOptions.t_challengeId],
		references:[t_challenges.id],
	})
}));




export const t_lessonProgress = pgTable('t_lesson_progress', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(), // TODO: confirm this 
	t_lessonId: integer('t_lesson_id').references(()=>t_lessons.id, {onDelete: 'cascade'}).notNull(),	
	doneRightPercent: integer('done_right_percent').notNull().default(0),
	doneRight: integer('done_right').notNull().default(0),
	doneWrong: integer('done_wrong').notNull().default(0),
	dateDone: timestamp('date_done').notNull().defaultNow(),
	trainingPts: integer('training_pts').notNull().default(0),
});


export const t_lessonProgressRelations = relations(t_lessonProgress, ({ one }) => ({
	
	t_lesson: one(t_lessons, {
		fields: [t_lessonProgress.t_lessonId],
		references:[t_lessons.id],
	})
}));











export const classes = pgTable('classes', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	imageSrc: text('image_src').notNull(),
	courseListIds: text('course_list_ids'),
	tCourseListIds: text('t_course_list_ids'),
});

export const classesRelations = relations(classes, ({ many }) => ({
	userProgress: many(userProgress),
	classesHw: many(classesHw),
}));

// export const coursesRelations = relations(courses, ({ many }) => ({
// 	userProgress: many(userProgress),
// 	units: many(units),
// }));





export const classesHw = pgTable('classes_hw', {
	id: serial('id').primaryKey(),
	task: text('task'),
	taskTrainer: text('task_trainer'),
	

	dateHw: timestamp('date_hw').notNull().defaultNow(),

	classId: integer('class_id')
	.references(() => classes.id, { onDelete: 'cascade' })
	.notNull(),

});




export const classesHwRelations = relations(classesHw, ({ one }) => ({
	class: one(classes, {
		fields: [classesHw.classId],
		references: [classes.id],
	}),
	
}));

// export const classesHwRelations = relations(courses, ({ many }) => ({
// 	userProgress: many(userProgress),
// }));





// export const units = pgTable('units', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(), // Unit 1
// 	description: text('description').notNull(), // Learn the basics
// 	imageSrc: text('image_src').notNull(),
// 	courseId: integer('course_id')
// 		.references(() => courses.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	order: integer('order').notNull(),
// });

// export const unitsRelations = relations(units, ({ many, one }) => ({
// 	course: one(courses, {
// 		fields: [units.courseId],
// 		references: [courses.id],
// 	}),
// 	lessons: many(lessons),
// }));




// export const lessons = pgTable('lessons', {
// 	id: serial('id').primaryKey(),
// 	title: text('title').notNull(),
// 	unitId: integer('unit_id')
// 		.references(() => units.id, { onDelete: 'cascade' })
// 		.notNull(),
// 	order: integer('order').notNull(),
// });

// export const lessonsRelations = relations(lessons, ({ one, many }) => ({
// 	unit: one(units, {
// 		fields: [lessons.unitId],
// 		references: [units.id],
// 	}),
// 	challenges: many(challenges),
// }));
