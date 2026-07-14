// app/actions/switch-course.ts

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function switchCourse(courseId: number) {
    // Сохраняем выбранный курс в cookies
    cookies().set('activeCourseId', courseId.toString());
    
    // Очищаем кеш всех страниц
    revalidatePath('/');
    revalidatePath('/learn');
    revalidatePath('/trainer');
    revalidatePath('/progress');
    revalidatePath('/leaderboard');
    
    // Перенаправляем на /learn с обновлением
    redirect('/learn');
}


// // app/actions/switch-course.ts

// 'use server';

// import { cookies } from 'next/headers';
// import { revalidatePath } from 'next/cache';

// export async function switchCourse(courseId: number) {
//     cookies().set('activeCourseId', courseId.toString());
//     revalidatePath('/');
//     revalidatePath('/learn');
//     revalidatePath('/trainer');
//     revalidatePath('/progress');
    
//     return { success: true };
// }