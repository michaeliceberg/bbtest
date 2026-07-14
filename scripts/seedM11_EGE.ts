// import { neon } from '@neondatabase/serverless';
// import 'dotenv/config';
// import { drizzle } from 'drizzle-orm/neon-http';
// import * as schema from '../db/schema';

// const sql = neon(process.env.DATABASE_URL!);
// // @ts-ignore
// const db = drizzle(sql, { schema });
// const main = async () => {
// 	try {
// 		console.log('Seeding DB M11_EGE');
// 		// await db.delete(schema.courses);
// 		// await db.delete(schema.userProgress);
// 		// await db.delete(schema.units);
// 		// await db.delete(schema.lessons);
// 		// await db.delete(schema.challenges);
// 		// await db.delete(schema.challengeOptions);
// 		// await db.delete(schema.challengeProgress);

// 		//тетрис

// 		// собирается фигурка из лего

// 		// ADD COURSES
// 		//
// 		// await db.insert(schema.courses).values([{id:1,title:'ЛНИП Физика 7',imageSrc:'lnip_phy_7.svg'},
// 		// {id:2,title:'ЛНИП Математика 7',imageSrc:'lnip_mat_7.svg'},
// 		// {id:3,title:'ЛНИП Математика 6',imageSrc:'lnip_mat_6.svg'},]);


		







// 		await db.insert(schema.courses).values([{id:11,title:'М11-ЕГЭ',imageSrc:'CourseImgs/m11_ege.jpeg'},
// ]);


		






// await db.insert(schema.units).values([{id:1101,courseId:11,title:'пусто',description:'Описание 1',order:1101,imageSrc:'LottieUnit1',},
// {id:1102,courseId:11,title:'Векторы',description:'Описание 2',order:1102,imageSrc:'LottieUnit2',},]);

// await db.insert(schema.lessons).values([{id:1101,unitId:1101,title:'пусто',order:1101,},
// {id:1102,unitId:1101,title:'пусто',order:1102,},
// {id:1103,unitId:1102,title:'Длина вектора',order:1103,},
// {id:1104,unitId:1102,title:'пусто',order:1104,},]);

// await db.insert(schema.challenges).values([{id:1102101001,lessonId:1101,type:'ASSIST',order:1102101001,question:'На горизонтальном участке пути автомобиль ехал со скоростью 72 км/ч в течение 10 мин, а подъем проехал со скоростью 36 км/ч за 20 мин. Чему равна средняя скорость на всем пути?',points:10,author:'М11-ЕГЭ',},
// {id:1102102001,lessonId:1102,type:'ASSIST',order:1102102001,question:'Теплоход плывет из Самары до Волгограда со скоростью 25 км/ч и обратно со скоростью 15 км/ч. Найти среднюю скорость теплохода за все время движения.',points:15,author:'М11-ЕГЭ',},
// {id:1103103001,lessonId:1103,type:'ASSIST',order:1103103001,question:'Найдите длину вектора $ \\large -5\\overrightarrow{a}$, если $\\large \\overrightarrow{a}(8;-66)$',points:15,author:'М11-ЕГЭ',},
// {id:1103104001,lessonId:1104,type:'ASSIST',order:1103104001,question:'Расстояние от деревни до города машина проехала со скоростью 40 км/ч. На обратный путь она затратила в 1,5 раза меньшее время. Какова средняя скорость машины на всем пути до города и обратно?',points:30,author:'М11-ЕГЭ',},]);


// await db.insert(schema.challengeOptions).values([{challengeId:1102101001,correct:true,text:'48 км/ч'},{challengeId:1102101001,correct:false,text:'44 км/ч'},{challengeId:1102101001,correct:false,text:'40 км/ч'},{challengeId:1102101001,correct:false,text:'38 км/ч'},{challengeId:1102101001,correct:false,text:'42 км/ч'},{challengeId:1102101001,correct:false,text:'46 км/ч'},
// {challengeId:1102102001,correct:true,text:'18,75 км/ч'},{challengeId:1102102001,correct:false,text:'16.25 км/ч'},{challengeId:1102102001,correct:false,text:'16.3 км/ч'},{challengeId:1102102001,correct:false,text:'10.9 км/ч'},{challengeId:1102102001,correct:false,text:'13.6 км/ч'},{challengeId:1102102001,correct:false,text:'16 км/ч'},
// {challengeId:1103103001,correct:true,text:'$ \\huge 500'},{challengeId:1103103001,correct:false,text:'$ \\huge -500'},{challengeId:1103103001,correct:false,text:'$ \\huge 5'},{challengeId:1103103001,correct:false,text:'$ \\huge -5'},{challengeId:1103103001,correct:false,text:'$ \\huge 50'},{challengeId:1103103001,correct:false,text:'$ \\huge -50'},
// {challengeId:1103104001,correct:true,text:'48 км/ч'},{challengeId:1103104001,correct:false,text:'50 км/ч'},{challengeId:1103104001,correct:false,text:'46 км/ч'},{challengeId:1103104001,correct:false,text:'52 км/ч'},{challengeId:1103104001,correct:false,text:'44 км/ч'},{challengeId:1103104001,correct:false,text:'42 км/ч'},]);

		
		










// 		console.log('Seeding Finished');
// 	} catch (error) {
// 		console.error(error);
// 		throw new Error('Не получилось получить БД');
// 	}
// };

// main();
