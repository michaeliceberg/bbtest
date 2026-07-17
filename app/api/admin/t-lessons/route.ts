import db from "@/db/drizzle"
import { t_lessons } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const unitId = searchParams.get("unitId")

    if (!unitId) {
      return Response.json({ error: "unitId is required" }, { status: 400 })
    }

    const lessonsList = await db
      .select()
      .from(t_lessons)
      .where(eq(t_lessons.t_unitId, Number(unitId)))

    return Response.json(lessonsList)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to fetch t-lessons" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { unitId, title, order } = body

    if (!unitId || !title) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [lesson] = await db
      .insert(t_lessons)
      .values({
        t_unitId: unitId,
        title: title.trim(),
        order: order || 1,
      })
      .returning({ id: t_lessons.id })

    return Response.json({
      success: true,
      lessonId: lesson.id,
      message: "T-Lesson created successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to create t-lesson" }, { status: 500 })
  }
}
