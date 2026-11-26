# Промпт Leonardo: флакон зелья толстости (2026-11-26)

Готово и подключено: `docs/hangar/leonardo/cat-fat-potion.png` → `public/hangar/life/cat-fat-potion.webp` (`PotionFlask` в `components/cat-fridge-modal.tsx`). Маленькая иконка в углу сцены кормления (~36×44 px), поэтому форма простая, силуэт читаемый.

Рецепт как у остальных предметов ангара (`docs/hangar/leonardo-prompts-life.md`): FLUX.1 Kontext → Add Image = `public/hangar/life/cat-fridge.webp`
(образец стиля), сила средняя; фон плоский розовый (magenta #FF00FF) — по нему убираю фон бесплатно, без «Remove Background» в Leonardo.

## Промпт

> a small round-bottomed glass potion flask with a cork stopper, filled with thick glossy lavender-purple liquid that looks like melted ice cream,
> inside the liquid float a tiny pizza slice, a glazed donut and a little burger as if they are dissolving, a few round bubbles on the surface,
> a small paper tag tied to the neck with a string showing a simple drawn round chubby belly (no text), a sticky drip running down the glass,
> funny "make-it-fat" magic potion, cartoon illustration, thick uneven dark-brown outlines, muted dusty colours with one bright purple accent,
> flat cel shading with soft texture, slightly worn comic look, single object, full view, centered, isolated on a flat solid pure magenta background #FF00FF,
> no text, no letters, no shadow on the ground, no frame

## Negative prompt (Avoid)

`text, letters, numbers, watermark, signature, skull, poison sign, crossbones, skeleton, blood, glowing aura, sparkles, lightning, background scenery, table, hands, cat, multiple objects, cropped, blurry, photo, realistic, 3D render`
