# Промпты Leonardo: худой котик (2026-11-26)

**Итог 2026-11-27:** уровень 1 принят и подключён (сидит на коробке вместо обычных сидячих поз, голодный котик больше не гуляет по ангару).
Уровень 2 («высушенный», `cat-sit-thin2`) вышел страшным (слёзы, торчащие кости, пугает детей) и **отклонён**: его промпт ниже не использовать,
вместо него та же картинка уровня 1, сплющенная по ширине.

Если котик 3 дня не ел (с последнего кормления прошло ≥ 3 суток, `catThinLevel` в `lib/catFood.ts`) — он худеет:

| Уровень | Когда | Название | Файлы |
|---|---|---|---|
| 1 | не ел 3 суток | «худенький» | `cat-sit-thin1.jpg` → `public/hangar/life/cat-sit-thin.webp` (подключено) |
| 2 | не ел 5 суток | «ещё худее» | та же картинка, сплющенная кодом (`THIN_SIT_SX`) |

Пока картинок нет, в `components/hangar-cat.tsx` (`THIN_SX`) котик просто сплющивается по ширине. Когда картинки готовы —
подменить `src` позы по уровню худобы в `CatImg` (имена `cat-<поза>-thin1.webp`, `cat-<поза>-thin2.webp`).

## Как делать

Тот же рецепт, что у нашего котика (`docs/hangar/leonardo-prompts-life.md`, раздел «Котик»): модель **FLUX.1 Kontext**, **Add Image =
`docs/hangar/leonardo/cat-sit.webp`**, сила высокая (0.8–0.9), чтобы поза, ракурс, цвет шерсти и контуры не сдвинулись.
Меняется только телосложение. Хвост стиля и «Avoid» — те же, что для всех картинок котика; фон плоский розовый magenta #FF00FF (убираю сам, Remove Background в Leonardo не нужен).

Главная цель: **хочется срочно накормить**, но без жести. Мультяшно и жалобно, не страшно: никаких торчащих рёбер
«как на фото», крови, язв, мёртвых глаз. Большие грустные глаза, просящий взгляд.

## Уровень 1: худенький (`cat-sit-thin1.jpg`)

> the same small scruffy ginger tabby kitten, exactly the same pose, same viewpoint, same colours and same outlines, same position and size of the picture;
> only change the body: the kitten is noticeably skinnier, narrow body, a little hollow belly, thin neck, visible hip bones as soft bumps under the fur,
> slightly messy fur, thin tail drooping lower than before, ears a bit lowered; big sad pleading green eyes looking up at the viewer, a tiny hopeful frown,
> cartoon cute and pitiful, not scary, in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, isolated on a flat solid pure magenta background #FF00FF, no text, no shadow on the ground

Avoid: `rib cage, skeleton, bones sticking out, blood, wounds, sick, dead eyes, scary, horror, realistic photo, 3D render, text, collar, clothes, background scenery`

## Уровень 2: супер-худой, высушенный (`cat-sit-thin2.jpg`)

> the same small scruffy ginger tabby kitten, exactly the same pose, same viewpoint, same colours and same outlines, same position and size of the picture;
> only change the body: extremely skinny and dried out, like a funny exaggerated cartoon "raisin kitten": tiny narrow body, sunken belly, head looks too big for the body,
> huge ears, very thin legs, dull dry fluffy-wispy fur sticking out in tufts, tail like a thin limp string, tiny pale paws;
> enormous watery sad green eyes with shiny tear highlights, ears drooping, mouth slightly open as if weakly meowing "feed me", exhausted but adorable,
> comic pitiful look that makes you want to feed it right now, not scary, not realistic, in the same art style as the reference image: cartoon illustration, thick uneven dark-brown outlines, muted dusty colours, flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, isolated on a flat solid pure magenta background #FF00FF, no text, no shadow on the ground

Avoid: `rib cage, skeleton, skull, bones sticking out, blood, wounds, corpse, dead eyes, scary, horror, gore, realistic photo, 3D render, text, collar, clothes, background scenery`

## Дополнительные позы (по желанию, по тем же правилам)

Для каждого уровня достаточно трёх поз, остальные код возьмёт из нормальных (сплющенных): `sit`, `sit-closed` (моргание), `meow` (слабое «мяу»).
Для `meow`: в конец промпта уровня добавить `head slightly raised, mouth open in a weak small meow`.
Для остальных поз (`walk-1…3`, `sleep`, `eat`, `sun`…) код пока оставит обычную картинку, сплющенную по ширине; при желании их можно сделать позже по тому же рецепту.


## Толстый котик (2026-11-27)

Вариант Б: 2 картинки сидячей позы, `docs/hangar/leonardo/cat-sit-fat1.jpg` (пухлый, с 10 зелий) и `cat-sit-fat2.jpg` (шарик, с 30 зелий) → `public/hangar/life/cat-sit-fat1.webp`, `cat-sit-fat2.webp`. Подключены в `hangar-cat.tsx` (`bedPose`) и в сцене кормления. Толстый котик не гуляет, только сидит на коробке. Худой имеет приоритет над толстым.
