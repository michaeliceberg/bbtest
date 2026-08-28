import db from "@/db/drizzle"
import { t_lessons } from "@/db/schema"
import { eq, max } from "drizzle-orm"

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

    // Без явного order (обычный кейс — форма "Добавить урок" его не
    // присылает) новый этап встаёт в конец, а не всегда на order=1: было
    // так, что любой новый этап рисовался сразу вторым (внутри существующих),
    // а не последним, ломая и порядок этапов, и "змейку" карты скиллов.
    let resolvedOrder = order
    if (!resolvedOrder) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: max(t_lessons.order) })
        .from(t_lessons)
        .where(eq(t_lessons.t_unitId, unitId))
      resolvedOrder = (maxOrder ?? 0) + 1
    }

    const [lesson] = await db
      .insert(t_lessons)
      .values({
        t_unitId: unitId,
        title: title.trim(),
        order: resolvedOrder,
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
