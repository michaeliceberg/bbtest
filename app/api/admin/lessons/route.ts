import db from "@/db/drizzle"
import { lessons } from "@/db/schema"
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
      .from(lessons)
      .where(eq(lessons.unitId, Number(unitId)))

    return Response.json(lessonsList)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to fetch lessons" }, { status: 500 })
  }
}
