import db from "@/db/drizzle"
import { t_challenges, t_challengeOptions } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get("lessonId")

    if (!lessonId) {
      return Response.json({ error: "lessonId is required" }, { status: 400 })
    }

    const challengesList = await db
      .select()
      .from(t_challenges)
      .where(eq(t_challenges.t_lessonId, Number(lessonId)))

    return Response.json(challengesList)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to fetch t-challenges" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { lessonId, question, type, author, difficulty, points, numRans, options } = body

    if (!lessonId || !question || !type) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Insert challenge
    const [challenge] = await db
      .insert(t_challenges)
      .values({
        t_lessonId: lessonId,
        type: type as any,
        question,
        author: author || "",
        imageSrc: "0",
        difficulty: difficulty || "",
        points: points || 12,
        numRans: numRans || "1",
        order: 999,
      })
      .returning({ id: t_challenges.id })

    // Insert challenge options
    if (options && options.length > 0) {
      const optionValues = options
        .filter((o: any) => o.text && o.text.trim())
        .map((o: any) => ({
          t_challengeId: challenge.id,
          text: o.text,
          correct: o.correct || false,
        }))

      if (optionValues.length > 0) {
        await db.insert(t_challengeOptions).values(optionValues)
      }
    }

    return Response.json({
      success: true,
      challengeId: challenge.id,
      message: "T-Challenge created successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to create t-challenge" },
      { status: 500 }
    )
  }
}
