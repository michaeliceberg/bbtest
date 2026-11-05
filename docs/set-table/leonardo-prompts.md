# Стол сета — промпты для Leonardo (2026-11-05)

Где используется: панель сета (`components/set-bar.tsx`, `SET_TABLECLOTH`). Сейчас там `public/set-tablecloth/cloth-1.webp`:
бордовый, почти квадратный, с розой, вилкой и салфеткой. Минусы: на телефоне по бокам пустые полосы, бордовый больше нигде
на сайте не встречается, а роза и салфетка — «ресторан», не наш армейский стиль (гранаты, тушёнка, котик, провиант).

Нужен **горизонтальный** стол (≈ 2:1, на всю ширину панели), посередине — пустое место под 3 блюда (их кладём кодом),
по углам — предметы «разоружились и сели есть».

## Как делать
Модель FLUX.1 Kontext → Add Image: образец стиля (кусок ангара `public/hangar/bg.webp`), чтобы совпали контуры и цвета.
Соотношение сторон 16:9 или 2:1. Потом Remove Background (Full, тень None).

## Общий хвост стиля (дописывать к каждому)
cartoon game illustration, thick uneven dark-brown outlines, flat cel shading, muted dusty colors, slightly worn and
cozy military mess-hall mood, top-down three-quarter view of a long low table, isolated on pure white background,
no text, no letters, no people, kid-friendly.
Avoid: realistic photo, gore, real weapon brands, logos, text, letters, people, hands, square table, round table,
cluttered center, food in the center of the table.

## Вариант 1 — армейский зелёный (рекомендую)
A long horizontal wooden mess table covered with an olive-green canvas tablecloth with darker stitched edges and a
slightly frayed hem. The center of the table is EMPTY and flat (space for three dishes). Top-left corner: an old
army helmet lying upside down like a bowl (rounded battle-royale style helmet with a strap, cartoon, unbranded),
and a small dented tin vase with one red flower and a few red petals scattered nearby. Top-right corner: a toy-like
cartoon pineapple grenade without the pin, used as a salt shaker. Bottom-right corner: a crossed fork and knife on a
folded khaki napkin. Bottom-left corner: two tin cans of stew with plain labels and a cup of milk. + хвост стиля

## Вариант 2 — тёмно-синий «праздничный», в тон сайта
A long horizontal table covered with a deep navy-blue festive tablecloth with a thin golden embroidered border and a
small gold star pattern, edges hanging down with tassels. EMPTY flat center. Top-left: a small tin vase with one red
flower and red petals. Top-right: an unbranded cartoon combat helmet put aside with goggles on it. Bottom-right:
fork and knife crossed on a folded napkin. Bottom-left: a can of stew and a small bottle of milk. + хвост стиля

## Вариант 3 — клетчатая скатерть «пикник у ангара»
A long horizontal table with a red-and-cream checkered picnic tablecloth (muted, faded colors), slightly wrinkled.
EMPTY flat center. Corners: an unbranded cartoon helmet with a canteen next to it (top-left), a red flower in a tin
cup (top-right), crossed fork and knife on a napkin (bottom-right), a tin can of stew and a bread loaf (bottom-left).
+ хвост стиля

## Вариант 4 — ящик-стол из ангара
A long horizontal table made of a big wooden military supply crate with stencil marks (no readable text), a strip
of green canvas laid across it as a runner. EMPTY flat center on the canvas. Corners: unbranded cartoon helmet
(top-left), toy grenade (top-right), fork and knife on a napkin (bottom-right), tin can of stew and a milk carton
(bottom-left). + хвост стиля

Каску не называть «PUBG» в промпте и не копировать её точно: каска из игры — чужой дизайн. Просим просто
«rounded battle-royale style helmet» — узнаваемо, но своё.

После выбора: положить в `public/set-tablecloth/cloth-2.webp` (ширина ~900px), в `set-bar.tsx` поменять `SET_TABLECLOTH`
и подогнать рамку блюд (`inset-x-[9%] top-[27%] h-[31%]`) под пустой центр нового стола; ширину стола —
`w-full` вместо `w-[min(70%,250px)]`.
