import db from "@/db/drizzle"
import { challenges, challengeOptions } from "@/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = Number(params.id)

    const challenge = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1)

    if (!challenge.length) {
      return Response.json({ error: "Challenge not found" }, { status: 404 })
    }

    const options = await db
      .select()
      .from(challengeOptions)
      .where(eq(challengeOptions.challengeId, challengeId))

    return Response.json({
      ...challenge[0],
      options,
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to fetch challenge" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const challengeId = Number(params.id)
    const body = await req.json()
    const { question, type, author, difficulty, points, options } = body

    // Обновляем саму задачу
    await db
      .update(challenges)
      .set({
        question,
        type,
        author: author || "",
        difficulty: difficulty || "",
        points: points || 10,
      })
      .where(eq(challenges.id, challengeId))

    // Удаляем старые опции
    await db
      .delete(challengeOptions)
      .where(eq(challengeOptions.challengeId, challengeId))

    // Добавляем новые опции
    if (options && options.length > 0) {
      const optionValues = options
        .filter((o: any) => o.text && o.text.trim())
        .map((o: any) => ({
          challengeId,
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
      message: "Challenge updated successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to update challenge" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const challengeId = Number(params.id)

    // Удаляем опции
    await db
      .delete(challengeOptions)
      .where(eq(challengeOptions.challengeId, challengeId))

    // Удаляем задачу
    await db.delete(challenges).where(eq(challenges.id, challengeId))

    return Response.json({
      success: true,
      message: "Challenge deleted successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to delete challenge" },
      { status: 500 }
    )
  }
}
