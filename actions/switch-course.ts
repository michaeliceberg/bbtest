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
    
    // Перенаправляем на /learn с обновлением. Метка ?switched=1 — сигнал
    // клиенту один раз проскроллить к последнему уроку, которым занимались
    // в этом курсе (см. components/scroll-to-lesson.tsx).
    redirect('/learn?switched=1');
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