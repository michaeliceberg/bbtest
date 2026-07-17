import db from "@/db/drizzle"
import { lessons } from "@/db/schema"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { unitId, title, order } = body

    if (!unitId || !title) {
      return Response.json(
        { error: "unitId and title are required" },
        { status: 400 }
      )
    }

    const [lesson] = await db
      .insert(lessons)
      .values({
        unitId,
        title,
        order: order || 1,
      })
      .returning({ id: lessons.id })

    return Response.json({
      success: true,
      lessonId: lesson.id,
      message: "Lesson created successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    )
  }
}
