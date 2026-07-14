// import { neon } from '@neondatabase/serverless';
// import 'dotenv/config';
// import { drizzle } from 'drizzle-orm/neon-http';
// import * as schema from '../db/schema';

// const sql = neon(process.env.DATABASE_URL!);
// // @ts-ignore
// const db = drizzle(sql, { schema });


import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import * as schema from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema });


const main = async () => {
	try {
		console.log('Seeding Trainer DB Math 3');

		// await db.delete(schema.t_courses);
		// await db.delete(schema.t_units);
		// await db.delete(schema.t_lessons);
		// await db.delete(schema.t_challenges);
		// await db.delete(schema.t_challengeOptions);


		await db.insert(schema.t_courses).values([
			{id:3,title:'М3 МАТЕМАТИКА-3',imageSrc:'lnip_mat_6.svg'},
		]);





		await db.insert(schema.t_units).values([{id:301,t_courseId:3,title:'Сложение Вычетание',description:'Описание 1',order:301,imageSrc:'LottieUnit1',},
{id:302,t_courseId:3,title:'Таблица умножения',description:'Описание 2',order:302,imageSrc:'LottieUnit2',},
{id:303,t_courseId:3,title:'2 x 1',description:'Описание 2',order:303,imageSrc:'LottieUnit3',},]);

await db.insert(schema.t_lessons).values([{id:301,t_unitId:301,title:'Положительные',order:301,},
{id:302,t_unitId:301,title:'Отрицательные',order:302,},
{id:303,t_unitId:302,title:'2 x 1 WorkBook',order:303,},
{id:304,t_unitId:303,title:'2 x 2',order:304,},



]);







await db.insert(schema.t_challenges).values([{id:301301001,t_lessonId:301,type:'R ASSIST',order:301301001,question:'random $ \\huge r1 + r1 = ? $',points:10,author:'М3 МАТЕМАТИКА-3',imageSrc:'0',difficulty:'1',numRans:'0'},
{id:301301002,t_lessonId:301,type:'R ASSIST',order:301301002,question:'random $ \\huge r1 + r2 = ? $',points:10,author:'М3 МАТЕМАТИКА-3',imageSrc:'0',difficulty:'2',numRans:'0'},
{id:301301003,t_lessonId:301,type:'R ASSIST',order:301301003,question:'random $ \\huge r2 + r2 = ? $',points:10,author:'М3 МАТЕМАТИКА-3',imageSrc:'',difficulty:'3',numRans:'0'},
{id:301301004,t_lessonId:301,type:'R SLIDER',order:301301004,question:'random $ \\huge r1 + r1 = ? $',points:10,author:'М3 МАТЕМАТИКА-3',imageSrc:'',difficulty:'1',numRans:'0'},
{id:301301005,t_lessonId:301,type:'R SLIDER',order:301301005,question:'random $ \\huge r1 + r2 = ? $',points:10,author:'М3 МАТЕМАТИКА-3',imageSrc:'',difficulty:'2',numRans:'0'},
{id:301301006,t_lessonId:301,type:'R SLIDER',order:301301006,question:'random $ \\huge r2 + r2 = ? $',points:10,author:'М3 МАТЕМАТИКА-3',imageSrc:'',difficulty:'3',numRans:'0'},
{id:301301007,t_lessonId:301,type:'R CONNECT',order:301301007,question:'random $ \\huge r1 + r1 = ? $',points:10,author:'М3 МАТЕМАТИКА-3',imageSrc:'',difficulty:'1',numRans:'0'},
{id:301301008,t_lessonId:301,type:'R CONNECT',order:301301008,question:'random $ \\huge r1 + r2 = ? $',points:10,author:'М3 МАТЕМАТИКА-3',imageSrc:'',difficulty:'2',numRans:'0'},
{id:301301009,t_lessonId:301,type:'R CONNECT',order:301301009,question:'random $ \\huge r2 + r2 = ? $',points:10,author:'М3 МАТЕМАТИКА-3',imageSrc:'',difficulty:'3',numRans:'0'},
{id:302303001,t_lessonId:303,type:'WORKBOOK',order:302303001,question:'Умножим $ \\huge 24 \\cdot 7 =$ . Для этого представим 24 = @ + @ . Тогда @ умножаем на 7 = @',points:15,author:'М3 МАТЕМАТИКА-3',imageSrc:'',difficulty:'1',numRans:'0'},
]);




await db.insert(schema.t_challengeOptions).values([{t_challengeId:301301001,correct:true,text:'r',imageSrc:''},{t_challengeId:301301001,correct:false,text:'r',imageSrc:''},{t_challengeId:301301001,correct:false,text:'r',imageSrc:''},{t_challengeId:301301001,correct:false,text:'r',imageSrc:''},{t_challengeId:301301001,correct:false,text:'r',imageSrc:''},{t_challengeId:301301001,correct:false,text:'r',imageSrc:''},
{t_challengeId:301301002,correct:true,text:'r',imageSrc:''},{t_challengeId:301301002,correct:false,text:'r',imageSrc:''},{t_challengeId:301301002,correct:false,text:'r',imageSrc:''},{t_challengeId:301301002,correct:false,text:'r',imageSrc:''},{t_challengeId:301301002,correct:false,text:'r',imageSrc:''},{t_challengeId:301301002,correct:false,text:'r',imageSrc:''},
{t_challengeId:301301003,correct:true,text:'r',imageSrc:''},{t_challengeId:301301003,correct:false,text:'r',imageSrc:''},{t_challengeId:301301003,correct:false,text:'r',imageSrc:''},{t_challengeId:301301003,correct:false,text:'r',imageSrc:''},{t_challengeId:301301003,correct:false,text:'r',imageSrc:''},{t_challengeId:301301003,correct:false,text:'r',imageSrc:''},
{t_challengeId:301301004,correct:true,text:'r',imageSrc:''},{t_challengeId:301301004,correct:false,text:'r',imageSrc:''},{t_challengeId:301301004,correct:false,text:'r',imageSrc:''},{t_challengeId:301301004,correct:false,text:'r',imageSrc:''},{t_challengeId:301301004,correct:false,text:'r',imageSrc:''},{t_challengeId:301301004,correct:false,text:'r',imageSrc:''},
{t_challengeId:301301005,correct:true,text:'r',imageSrc:''},{t_challengeId:301301005,correct:false,text:'r',imageSrc:''},{t_challengeId:301301005,correct:false,text:'r',imageSrc:''},{t_challengeId:301301005,correct:false,text:'r',imageSrc:''},{t_challengeId:301301005,correct:false,text:'r',imageSrc:''},{t_challengeId:301301005,correct:false,text:'r',imageSrc:''},
{t_challengeId:301301006,correct:true,text:'r',imageSrc:''},{t_challengeId:301301006,correct:false,text:'r',imageSrc:''},{t_challengeId:301301006,correct:false,text:'r',imageSrc:''},{t_challengeId:301301006,correct:false,text:'r',imageSrc:''},{t_challengeId:301301006,correct:false,text:'r',imageSrc:''},{t_challengeId:301301006,correct:false,text:'r',imageSrc:''},
{t_challengeId:301301007,correct:true,text:'r',imageSrc:''},{t_challengeId:301301007,correct:false,text:'r',imageSrc:''},{t_challengeId:301301007,correct:false,text:'r',imageSrc:''},{t_challengeId:301301007,correct:false,text:'r',imageSrc:''},{t_challengeId:301301007,correct:false,text:'r',imageSrc:''},{t_challengeId:301301007,correct:false,text:'r',imageSrc:''},
{t_challengeId:301301008,correct:true,text:'r',imageSrc:''},{t_challengeId:301301008,correct:false,text:'r',imageSrc:''},{t_challengeId:301301008,correct:false,text:'r',imageSrc:''},{t_challengeId:301301008,correct:false,text:'r',imageSrc:''},{t_challengeId:301301008,correct:false,text:'r',imageSrc:''},{t_challengeId:301301008,correct:false,text:'r',imageSrc:''},
{t_challengeId:301301009,correct:true,text:'r',imageSrc:''},{t_challengeId:301301009,correct:false,text:'r',imageSrc:''},{t_challengeId:301301009,correct:false,text:'r',imageSrc:''},{t_challengeId:301301009,correct:false,text:'r',imageSrc:''},{t_challengeId:301301009,correct:false,text:'r',imageSrc:''},{t_challengeId:301301009,correct:false,text:'r',imageSrc:''},
{t_challengeId:302303001,correct:true,text:'$ \\large 140 $',imageSrc:''},{t_challengeId:302303001,correct:false,text:'$ \\large 28 $',imageSrc:''},{t_challengeId:302303001,correct:false,text:'$ \\large 168 $',imageSrc:''},{t_challengeId:302303001,correct:false,text:'$ \\large 360 $',imageSrc:''},{t_challengeId:302303001,correct:false,text:'$ \\large 240 $',imageSrc:''},{t_challengeId:302303001,correct:false,text:'$ \\large 480 $',imageSrc:''},
]);






		console.log('Seeding Finished');
	} catch (error) {
		console.error(error);
		throw new Error('Не получилось получить БД');
	}
};

main();
