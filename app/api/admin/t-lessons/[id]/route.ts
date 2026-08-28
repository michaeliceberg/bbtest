import db from "@/db/drizzle"
import { t_lessons } from "@/db/schema"
import { eq } from "drizzle-orm"

// FK t_challenges -> t_lessons и t_challengeOptions -> t_challenges (и
// t_lessonProgress -> t_lessons) объявлены с onDelete: 'cascade' в
// db/schema.ts — удаление урока само по себе унесёт все его задачи,
// их варианты ответа и прогресс учеников по этому уроку.
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = Number(params.id)

    await db
      .delete(t_lessons)
      .where(eq(t_lessons.id, lessonId))

    return Response.json({
      success: true,
      message: "T-Lesson deleted successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to delete t-lesson" },
      { status: 500 }
    )
  }
}
