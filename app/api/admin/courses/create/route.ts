import db from "@/db/drizzle"
import { courses } from "@/db/schema"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, imageSrc } = body

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }

    const [course] = await db
      .insert(courses)
      .values({
        title,
        imageSrc: imageSrc || "/default-course.svg",
      })
      .returning({ id: courses.id })

    return Response.json({
      success: true,
      courseId: course.id,
      message: "Course created successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to create course" },
      { status: 500 }
    )
  }
}
