# Команданте в Баллометре: 5 новых поз (2026-11-06)

Leonardo: Image Guidance — `public/miguel/miguel-base.webp`, сила 0.45, формат 1:1. Каждый промпт вставлять целиком
(блок «Avoid» в конце — это негатив). Готовую картинку прислать как есть: фон вырежет
`python3 docs/miguel/tools/make_sticker_v2.py вход.jpg public/miguel/<имя>.webp`.

Куда встанут (components/ballometer.tsx, `MOOD`): заменить `src` у нужного настроения.

| Файл | Настроение | Когда |
|---|---|---|
| miguel-chill.webp | chill | успеваем раньше срока (оценка ≥ 4,8 или цель взята) |
| miguel-calm.webp | calm | зелёная зона, идём по плану |
| miguel-mobilize.webp | mobilize | жёлтая зона, надо собраться |
| miguel-panic-watch.webp | alarm | красная зона, паника, часы |
| miguel-glare.webp | angry | почти стоим, злится крупным планом |

## 1. miguel-chill — шезлонг и коктейль

```
Cartoon character illustration of a goose commander mascot: long neck, white feathers, frowning eyebrows relaxed into a happy squint, black military peaked cap with a small red star, red bandana scarf with a small golden "GG" emblem and a tiny golden star on the front knot, olive green field jacket unbuttoned, exactly two white gloved arms, no wings. A yellow pencil in the corner of the beak, pink eraser end sticking out, sharpened tip hidden inside the mouth. He lies back on a striped beach deck chair, legs crossed, one hand behind his head, the other hand holding a tall orange cocktail with a straw, a tiny paper umbrella and a lemon slice. Big satisfied smile, totally relaxed, vacation mood. Full body, centered, thick clean black outline, flat cel shading, soft gray shading, bold simple shapes, kid-friendly. Flat solid pure magenta background #FF00FF.
Avoid: sticker, die-cut, white border, frame, text, letters on the cocktail, alcohol bottle, cigarette, cigar, smoke, sand, sea, palm tree, background scenery, spread wings, extra wings, four arms, extra fingers, realistic, 3d render, gradient background.
```

## 2. miguel-calm — спокоен, всё по плану

```
Cartoon character illustration of a goose commander mascot: long neck, white feathers, calm confident eyebrows, slight smirk, black military peaked cap with a small red star, red bandana scarf with a small golden "GG" emblem and a tiny golden star on the front knot, olive green field jacket, exactly two white gloved arms, no wings. A yellow pencil in the corner of the beak, pink eraser end sticking out, sharpened tip hidden inside the mouth. He stands relaxed, holding a clipboard with a big green checkmark in one hand and giving an OK sign with the other hand, looking directly at the viewer, eye contact. Full body, centered, thick clean black outline, flat cel shading, soft gray shading, bold simple shapes, kid-friendly. Flat solid pure magenta background #FF00FF.
Avoid: sticker, die-cut, white border, frame, text, letters, numbers, cigarette, cigar, smoke, spread wings, extra wings, four arms, extra fingers, realistic, 3d render, gradient background.
```

## 3. miguel-mobilize — собраться, засучить рукава

```
Cartoon character illustration of a goose commander mascot: long neck, white feathers, determined frowning eyebrows, focused eyes, black military peaked cap with a small red star, red bandana scarf with a small golden "GG" emblem and a tiny golden star on the front knot, olive green field jacket with sleeves being rolled up, exactly two white gloved arms, no wings. A yellow pencil in the corner of the beak, pink eraser end sticking out, sharpened tip hidden inside the mouth. He rolls up his sleeve with one hand while clenching the other fist in front of his chest, leaning slightly forward, ready to work hard, looking directly at the viewer, eye contact. Small sweat drop on the forehead. Full body, centered, thick clean black outline, flat cel shading, soft gray shading, bold simple shapes, kid-friendly. Flat solid pure magenta background #FF00FF.
Avoid: sticker, die-cut, white border, frame, text, letters, cigarette, cigar, smoke, weapon, spread wings, extra wings, four arms, extra fingers, realistic, 3d render, gradient background.
```

## 4. miguel-panic-watch — паника, тычет в часы

```
Cartoon character illustration of a goose commander mascot: long neck, white feathers, panicked raised eyebrows, wide shocked eyes, beak wide open shouting, black military peaked cap with a small red star jumping off his head, red bandana scarf with a small golden "GG" emblem and a tiny golden star on the front knot, olive green field jacket, exactly two white gloved arms, no wings. A yellow pencil flying out of his beak. He holds his wrist up toward the viewer and points hard at a big round wristwatch with the other hand, alarmed, several sweat drops flying around his head, small motion lines of shaking. Full body, centered, thick clean black outline, flat cel shading, soft gray shading, bold simple shapes, kid-friendly. Flat solid pure magenta background #FF00FF.
Avoid: sticker, die-cut, white border, frame, text, letters, numbers on the watch face, cigarette, cigar, smoke, spread wings, extra wings, four arms, extra fingers, realistic, 3d render, gradient background.
```

## 5. miguel-glare — злой взгляд крупным планом

```
Cartoon character illustration of a goose commander mascot, extreme close-up of the head and shoulders filling the frame: long neck, white feathers, very angry deep frowning eyebrows, narrowed eyes staring straight at the viewer, intense eye contact, slight leaning toward the viewer, black military peaked cap with a small red star pulled low over the eyes, red bandana scarf with a small golden "GG" emblem and a tiny golden star on the front knot, olive green field jacket collar. A yellow pencil clenched in the corner of the beak, pink eraser end sticking out, sharpened tip hidden inside the mouth. One white gloved hand points a finger right at the viewer. A small angry vein mark near the cap. Strict but funny, cartoon anger, kid-friendly. Thick clean black outline, flat cel shading, soft gray shading, bold simple shapes. Flat solid pure magenta background #FF00FF.
Avoid: sticker, die-cut, white border, frame, text, letters, blood, weapon, cigarette, cigar, smoke, full body, spread wings, extra wings, extra fingers, realistic, 3d render, gradient background.
```
