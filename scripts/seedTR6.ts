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
		console.log('Seeding Trainer DB Math');

		



		


		await db.insert(schema.t_courses).values([
			{id:13,title:'Р6 РУССКИЙ-6',imageSrc:'lnip_mat_6.svg'},
		]);





		


		


		



		await db.insert(schema.t_units).values([{id:1301,t_courseId:13,title:'Старинные улицы',description:'Описание 1',order:1301,imageSrc:'LottieUnit1',},

	]);
	
	await db.insert(schema.t_lessons).values([{id:1301,t_unitId:1301,title:'Часть 1',order:1301,},
	{id:1302,t_unitId:1301,title:'Часть 2',order:1302,},
	{id:1303,t_unitId:1301,title:'Часть 3',order:1303,},
	]);





	
	await db.insert(schema.t_challenges).values([{id:1302301001,t_lessonId:1301,type:'RUSSIANDICTANT',order:1302301001,question:'На ст*а%о*ри*нн%н*ые улицы зам*и%е*рающего NLгорода л*о%а*жился бл*и%е*стающий п*о%а*кров ночи.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302301002,t_lessonId:1301,type:'RUSSIANDICTANT',order:1302301002,question:'Т*а%о*инстве*нн%н*ый луч*␣%ь* лу*нн%н*ой доро*ж%ш*кой ро*б%п*ко NLблес*␣%т*нул на тр*а%о*вянистом ковре, пр*и%е*чудл*и%е*во NLоз*а%о*рил р*а%о*вни*нн%н*ую гла*д%т*ь на окраин*е%и*.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302301003,t_lessonId:1301,type:'RUSSIANDICTANT',order:1302301003,question:'Его  не*|%/*уверенный, а застенч*и%е*вый свет пр*е%и*вратил NLр*а%о**сс%с%зс*тилающееся про*о%а*стран*␣%т*ство в  NLсветло*-%/%|*серебр*я%е**н%нн*ое обл*а%о*ко*,% * NLпраз*д%␣*нич*␣%ь*но осв*е%я*тил всё вокруг NLгиган*т%␣*ским прожектором,  как*|%/%-*буд*/%|%-*то NLсо*нн%н*ая тиш*ь%␣* в*с%з*кинула пр*и%е*крытые рес*␣%т*ниц*ы%и*.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302301004,t_lessonId:1301,type:'RUSSIANDICTANT',order:1302301004,question:'Камыш*о%ё*вые зар*о%а*сли в окрес*т%␣*ностях NL пер*е%и*ш*ё%о*птывают*␣%ъ%ь*ся ш*е%и*лестящей л*и%е*ствой, NLпр*и%е*к*а%о*сают*␣%ъ%ь*ся к чу*в%␣*свтительным NLтр*а%о*винкам, р*о%а*ня*ю%я*т ст*е%и*кля*нн%н*ые NLр*о%а*синки на зелё*н%нн*ую пор*о%а*сль.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302302001,t_lessonId:1302,type:'RUSSIANDICTANT',order:1302302001,question:'Пол*/%-%|*ноч*␣%ь%ъ*ный час ур*а%о*внавешенно дыш*и%е%ы*т далеко  не*|%/*х*о%а*лодным воздухом.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302302002,t_lessonId:1302,type:'RUSSIANDICTANT',order:1302302002,question:'Ночь - время ра*з%с*думий.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302302003,t_lessonId:1302,type:'RUSSIANDICTANT',order:1302302003,question:'Мир свеж*␣%ъ%ь* и могуч*␣%ъ%ь*.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302302004,t_lessonId:1302,type:'RUSSIANDICTANT',order:1302302004,question:'Открываеш*ь%ъ%␣* настеж*ь%ъ%␣* д*е%и*р*е%и*вя*нн%н*ую NLраму, в*зс%c*матр*и%е*ва*е%и*ш*ь%ъ%␣*ся в вовсе NLне*/%|*бе*з%с*гранич*␣%ъ%ь*ную даль, NLстрас*т%␣*но гл*о%а*таеш*ь%ъ%␣* зап*а%о*хи NLбл*а%о*гоухающих трав и вопр*о%а*шаеш*ь%ъ%␣* NLу  кого*-%/%|*нибудь: «Почему*|%/%-*же так NLск*о%а*ротеч*␣%ь%ъ*ны и так пр*е%и*крас*␣%т*ны NLв*е%и*се*нн%н*ие сум*е%и*рки?»',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302302005,t_lessonId:1302,type:'RUSSIANDICTANT',order:1302302005,question:'А потом ещ*ё%о* не много посмотр*и%е*ш*ь%ъ%␣* NLна пр*и%е*гнувшиеся д*е%и*рев*ь%ъ%␣*я, на пр*и%е*крытые  NLколо*д%т%␣*ц*ы%и%а* с ключ*е%и*вой водой, на  NLне*/%|*глубокий овраж*е%и*к с земл*я%е**н%нн*ым NLмостом  - на всё, что в*и%е*дне*е%и*т*ь%ъ%␣*ся NLиз окошка.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302303001,t_lessonId:1303,type:'RUSSIANDICTANT',order:1302303001,question:'В меж*ъ%ь%␣*ярусных пер*е%и*крытиях NLчто*-%/%|*то хрус*т%␣*нет, когда подветре*нн%н*ой NLст*о%а*р*о%а*ны к дому NLподб*и%е*ра*е%и*т*␣%ь%ъ*ся мес*т%␣*ная NLсобач*о%ё*нка.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302303002,t_lessonId:1303,type:'RUSSIANDICTANT',order:1302303002,question:'Она выт*и%е*рает лапки о NLглин*я%е**н%нн*ую пл*а%о*стинку, которую  NLкое*-%/%|*кто забыл на крыльц*е%э*, и NLдом ей кажет*␣%ъ%ь*ся гиган*т%␣*ск*и%е*м, NLгромоз*д%␣%т*к*и%е*м *з%с*дан*и%е*ем.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302303003,t_lessonId:1303,type:'RUSSIANDICTANT',order:1302303003,question:'Вдрг, вып*а%о*д*е%и*т из гн*е%и*зда NLг*а%о*лч*о%ё*нок и поп*а%о*дёт прямо на NLхолщ*о%ё*вый мешок, который р*а%о**сс%зс%с*т*е%и*лили NLвечером хозяева, но собач*ь%ъ%␣*ка никогда NLне*|%/*трон*е%и*т птенц*о%ё*в, NLа лиш*ь%␣* пр*и%е*гл*я%и*дит*␣%ъ%ь*ся с NLсер*ь%ъ%␣*ёзност*ь%ъ*ю к малышу и NLстер*е%и*ж*ё%о*т его до NLутр*е%и**нн%н**е%и*й з*а%о*ри.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302303004,t_lessonId:1303,type:'RUSSIANDICTANT',order:1302303004,question:'Румя*н%нн*ое марево р*а%о**сс%с%зс*вета осв*е%я*ща*е%и*т чугу*нн%н*ую изг*о%а*ро*д%т*ь.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},
{id:1302303005,t_lessonId:1303,type:'RUSSIANDICTANT',order:1302303005,question:'Лики тума*нн%н*ых крыш*␣%ь%ъ* соч*е%и*таются NLвместе, сл*и%е*вают*␣%ь%ъ*ся в свинц*о%ё*вый NLг*о%а*р*и%е*зонт и уча*␣%в*ству*ю%я*т в NLспектакл*е%и* о начал*е%и* нового дня.',points:10,author:'Р6 РУССКИЙ-6',imageSrc:'0',difficulty:'1',numRans:'1'},]);




await db.insert(schema.t_challengeOptions).values([{t_challengeId:1302301001,correct:true,text:'1',imageSrc:''},{t_challengeId:1302301001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301001,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302301002,correct:true,text:'1',imageSrc:''},{t_challengeId:1302301002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301002,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302301003,correct:true,text:'1',imageSrc:''},{t_challengeId:1302301003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301003,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302301004,correct:true,text:'1',imageSrc:''},{t_challengeId:1302301004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302301004,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302302001,correct:true,text:'1',imageSrc:''},{t_challengeId:1302302001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302001,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302302002,correct:true,text:'1',imageSrc:''},{t_challengeId:1302302002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302002,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302302003,correct:true,text:'1',imageSrc:''},{t_challengeId:1302302003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302003,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302302004,correct:true,text:'1',imageSrc:''},{t_challengeId:1302302004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302004,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302302005,correct:true,text:'1',imageSrc:''},{t_challengeId:1302302005,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302005,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302005,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302005,correct:false,text:'1',imageSrc:''},{t_challengeId:1302302005,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302303001,correct:true,text:'1',imageSrc:''},{t_challengeId:1302303001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303001,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303001,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302303002,correct:true,text:'1',imageSrc:''},{t_challengeId:1302303002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303002,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303002,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302303003,correct:true,text:'1',imageSrc:''},{t_challengeId:1302303003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303003,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303003,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302303004,correct:true,text:'1',imageSrc:''},{t_challengeId:1302303004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303004,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303004,correct:false,text:'1',imageSrc:''},
{t_challengeId:1302303005,correct:true,text:'1',imageSrc:''},{t_challengeId:1302303005,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303005,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303005,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303005,correct:false,text:'1',imageSrc:''},{t_challengeId:1302303005,correct:false,text:'1',imageSrc:''},]);





		console.log('Seeding Finished');
	} catch (error) {
		console.error(error);
		throw new Error('Не получилось получить БД');
	}
};

main();
