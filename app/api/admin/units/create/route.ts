import db from "@/db/drizzle"
import { units } from "@/db/schema"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { courseId, title, description, imageSrc, order } = body

    if (!courseId || !title) {
      return Response.json(
        { error: "courseId and title are required" },
        { status: 400 }
      )
    }

    const [unit] = await db
      .insert(units)
      .values({
        courseId,
        title,
        description: description || "",
        imageSrc: imageSrc || "/default-unit.svg",
        order: order || 1,
      })
      .returning({ id: units.id })

    return Response.json({
      success: true,
      unitId: unit.id,
      message: "Unit created successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to create unit" },
      { status: 500 }
    )
  }
}
