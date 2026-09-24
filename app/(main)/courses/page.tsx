import { getCourses, getUserProgress } from '@/db/queries';
import { List } from './list';

const CoursePage = async () => {
	const coursesData = getCourses();
	const userProgressData = getUserProgress();

	const [courses, userProgress] = await Promise.all([coursesData, userProgressData]);

	return (
		<div className='h-full max-w-[640px] px-3 mx-auto'>
			<h1 className='text-2xl font-extrabold text-[#F2F7FB]'>Выберите курс</h1>
			<List courses={courses} activeCourseId={userProgress?.activeCourseId} />
		</div>
	);
};

export default CoursePage;
