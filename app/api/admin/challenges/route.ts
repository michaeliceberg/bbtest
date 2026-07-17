import db from "@/db/drizzle"
import { challenges, challengeOptions } from "@/db/schema"
import { auth } from "@/lib/auth"
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
      .from(challenges)
      .where(eq(challenges.lessonId, Number(lessonId)))

    return Response.json(challengesList)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to fetch challenges" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { lessonId, question, type, author, difficulty, points, options } = body

    if (!lessonId || !question || !type) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Вставляем задачу
    const [challenge] = await db
      .insert(challenges)
      .values({
        lessonId,
        type: type as any,
        question,
        author: author || "",
        imageSrc: "",
        difficulty: difficulty || "",
        points: points || 10,
        order: 999, // Временный order
      })
      .returning({ id: challenges.id })

    // Вставляем опции ответов
    if (options && options.length > 0) {
      const optionValues = options
        .filter((o: any) => o.text && o.text.trim())
        .map((o: any) => ({
          challengeId: challenge.id,
          text: o.text,
          imageSrc: "",
          correct: o.correct || false,
        }))

      if (optionValues.length > 0) {
        await db.insert(challengeOptions).values(optionValues)
      }
    }

    return Response.json({
      success: true,
      challengeId: challenge.id,
      message: "Challenge created successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    )
  }
}
