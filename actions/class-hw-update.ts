'use server'

import db from "@/db/drizzle"
import { classesHw } from "@/db/schema"
import { auth } from "@/lib/auth"
// import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export const upsertClassHW = async (
        classId: number, 
        lessonsIdsHw: number[], 
        challengeIdsHw: number[],
    ) => {
    
    const session = await auth();  
    // Проверяем авторизацию
    if (!session?.user?.id) {
        throw new Error('Вы не авторизованы!');
    }	
    const userId = session.user.id;
    
    // ВСТАВЛЯЕМ hw (обычный) и hw-trainer (тренажер)
    //
    await db.insert(classesHw).values({
        classId,
        taskTrainer: lessonsIdsHw.toString(),
        task: challengeIdsHw.toString(),
    })
}

