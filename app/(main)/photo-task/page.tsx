// app/(main)/photo-task/page.tsx — «Сфоткай задачу»: фото задачи → какие уроки тренажёра пройти (lib/photoTask.ts).
// Пока нет ключа API, экран видят только админы (с пометкой «ключ не настроен»).

import { redirect } from 'next/navigation';
import { auth } from '@/lib/server-auth';
import { getUserProgress } from '@/db/queries';
import { photoTaskConfigured } from '@/lib/photoTask';
import { getPhotoTasksLeft } from '@/actions/photo-task';
import { PhotoTaskClient } from './photo-task-client';

const PhotoTaskPage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');
    const up = await getUserProgress();
    const isAdmin = up?.isAdmin === 1;
    const configured = photoTaskConfigured();
    if (!configured && !isAdmin) redirect('/trainer');
    const quota = await getPhotoTasksLeft();
    return (
        <div className="w-full max-w-lg mx-auto px-4 pt-6 pb-16">
            <PhotoTaskClient configured={configured} quota={quota} />
        </div>
    );
};

export default PhotoTaskPage;
