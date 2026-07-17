import db from "@/db/drizzle"
import { t_units } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return Response.json({ error: "courseId is required" }, { status: 400 })
    }

    const unitsList = await db
      .select()
      .from(t_units)
      .where(eq(t_units.t_courseId, Number(courseId)))

    return Response.json(unitsList)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to fetch t-units" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { courseId, title, description, imageSrc, order } = body

    if (!courseId || !title) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [unit] = await db
      .insert(t_units)
      .values({
        t_courseId: courseId,
        title: title.trim(),
        description: description?.trim() || "",
        imageSrc: imageSrc || "/default-unit.svg",
        order: order || 1,
      })
      .returning({ id: t_units.id })

    return Response.json({
      success: true,
      unitId: unit.id,
      message: "T-Unit created successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to create t-unit" }, { status: 500 })
  }
}
