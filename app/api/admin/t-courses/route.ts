import db from "@/db/drizzle"
import { t_courses } from "@/db/schema"

export async function GET() {
  try {
    const coursesList = await db.select().from(t_courses)
    return Response.json(coursesList)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to fetch t-courses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, imageSrc } = body

    if (!title) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [course] = await db
      .insert(t_courses)
      .values({
        title: title.trim(),
        imageSrc: imageSrc || "/default-course.svg",
      })
      .returning({ id: t_courses.id })

    return Response.json({
      success: true,
      courseId: course.id,
      message: "T-Course created successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to create t-course" },
      { status: 500 }
    )
  }
}
