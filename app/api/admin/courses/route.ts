import db from "@/db/drizzle"
import { courses } from "@/db/schema"

export async function GET() {
  try {
    const coursesList = await db.select().from(courses)
    return Response.json(coursesList)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}
