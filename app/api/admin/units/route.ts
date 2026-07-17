import db from "@/db/drizzle"
import { units } from "@/db/schema"
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
      .from(units)
      .where(eq(units.courseId, Number(courseId)))

    return Response.json(unitsList)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to fetch units" }, { status: 500 })
  }
}
