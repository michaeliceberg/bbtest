import db from "@/db/drizzle"
import { t_challenges, t_challengeOptions } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = Number(params.id)

    const challenge = await db
      .select()
      .from(t_challenges)
      .where(eq(t_challenges.id, challengeId))
      .limit(1)

    if (!challenge.length) {
      return Response.json({ error: "Challenge not found" }, { status: 404 })
    }

    const options = await db
      .select()
      .from(t_challengeOptions)
      .where(eq(t_challengeOptions.t_challengeId, challengeId))

    return Response.json({
      ...challenge[0],
      options,
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to fetch t-challenge" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = Number(params.id)
    const body = await req.json()
    const { question, type, author, difficulty, points, numRans, options, lessonId, order } = body

    // question/type/... приходят из формы редактирования содержимого задачи;
    // lessonId/order — из пула переноса задач между этапами (unit-challenge-pool.tsx).
    // Оба вызова бьют в один и тот же PUT, поэтому оба набора полей опциональны —
    // обновляем только то, что реально прислали.
    const updateSet: Record<string, unknown> = {}
    if (question !== undefined) updateSet.question = question
    if (type !== undefined) updateSet.type = type
    if (author !== undefined) updateSet.author = author
    if (difficulty !== undefined) updateSet.difficulty = difficulty
    if (points !== undefined) updateSet.points = points
    if (numRans !== undefined) updateSet.numRans = numRans
    if (lessonId !== undefined) updateSet.t_lessonId = lessonId
    if (order !== undefined) updateSet.order = order

    if (Object.keys(updateSet).length > 0) {
      await db
        .update(t_challenges)
        .set(updateSet as any)
        .where(eq(t_challenges.id, challengeId))
    }

    // options не присланы (например, при переносе задачи между этапами
    // из пула — шлётся только lessonId/order) — не трогаем существующие
    // варианты ответа вообще. Раньше здесь безусловно удалялись ВСЕ
    // опции задачи при любом PUT, даже без options в теле запроса.
    if (options !== undefined) {
      await db
        .delete(t_challengeOptions)
        .where(eq(t_challengeOptions.t_challengeId, challengeId))

      if (options.length > 0) {
        const optionValues = options
          .filter((o: any) => o.text && o.text.trim())
          .map((o: any) => ({
            t_challengeId: challengeId,
            text: o.text,
            correct: o.correct || false,
          }))

        if (optionValues.length > 0) {
          await db.insert(t_challengeOptions).values(optionValues)
        }
      }
    }

    return Response.json({
      success: true,
      message: "T-Challenge updated successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to update t-challenge" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = Number(params.id)

    await db
      .delete(t_challenges)
      .where(eq(t_challenges.id, challengeId))

    return Response.json({
      success: true,
      message: "T-Challenge deleted successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to delete t-challenge" },
      { status: 500 }
    )
  }
}
