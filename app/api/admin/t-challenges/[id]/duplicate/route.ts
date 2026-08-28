import db from "@/db/drizzle"
import { t_challenges, t_challengeOptions } from "@/db/schema"
import { eq } from "drizzle-orm"

// Копирует задачу (и все её варианты ответа) в другой t_lesson — не
// перенос (как lessonId в PUT .../[id]), а именно дубль: исходная
// задача остаётся на месте, появляется независимая копия во втором
// уроке. Нужно, когда одна и та же формула уместна в нескольких этапах
// (например, "второй закон Ньютона" пригодится и в "Динамике", и в
// "Импульсе").
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const challengeId = Number(params.id)
    const { lessonId } = await req.json()

    if (!lessonId) {
      return Response.json({ error: "lessonId is required" }, { status: 400 })
    }

    const [source] = await db
      .select()
      .from(t_challenges)
      .where(eq(t_challenges.id, challengeId))
      .limit(1)

    if (!source) {
      return Response.json({ error: "Challenge not found" }, { status: 404 })
    }

    const sourceOptions = await db
      .select()
      .from(t_challengeOptions)
      .where(eq(t_challengeOptions.t_challengeId, challengeId))

    const [copy] = await db
      .insert(t_challenges)
      .values({
        t_lessonId: lessonId,
        type: source.type,
        question: source.question,
        order: 999,
        points: source.points,
        author: source.author,
        numRans: source.numRans,
        difficulty: source.difficulty,
        imageSrc: source.imageSrc,
        stage: source.stage,
      })
      .returning({ id: t_challenges.id })

    if (sourceOptions.length > 0) {
      await db.insert(t_challengeOptions).values(
        sourceOptions.map((o) => ({
          t_challengeId: copy.id,
          text: o.text,
          correct: o.correct,
          imageSrc: o.imageSrc,
          audioSrc: o.audioSrc,
        }))
      )
    }

    return Response.json({
      success: true,
      challengeId: copy.id,
      message: "T-Challenge duplicated successfully",
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: "Failed to duplicate t-challenge" },
      { status: 500 }
    )
  }
}
