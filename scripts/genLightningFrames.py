# Генерирует components/lightning-frames.ts из покадровых SVG пользователя.
# Запуск: python3 scripts/genLightningFrames.py
# Берутся только ЗАЛИТЫЕ пути (fill != none) — hairline-обводки экспорта
# (Layer0_0_1_STROKES, stroke-width 0.1) отбрасываются. Атрибут ищется как
# ' d="' (с пробелом) — иначе regex цепляет id="Layer0_0_FILL" (был баг).
import re, json, glob

SETS = {
    'yellow': 'public/SVGs/manyStrikes/strikes*.svg',
    'blue': 'public/SVGs/manyStrikesBlue/StrikeBlue*.svg',
}

out = ['// Сгенерировано scripts/genLightningFrames.py — не править руками.', '']
out.append('export type LightningFrame = { paths: { d: string; fill: string }[]; tx: number; ty: number }')
out.append('export type LightningSet = { viewBox: string; frames: LightningFrame[] }')
out.append('')
for name, pattern in SETS.items():
    files = sorted(glob.glob(pattern))
    vb = None
    frames = []
    for f in files:
        s = open(f).read()
        vb = vb or re.search(r'viewBox="([^"]*)"', s).group(1)
        paths = []
        for m in re.finditer(r'<path([^>]*)\sd="([^"]*)"', s):
            attrs, d = m.group(1), m.group(2)
            fill = re.search(r'fill="([^"]*)"', attrs)
            if not fill or fill.group(1) == 'none':
                continue
            d = re.sub(r'\s+', ' ', d).strip()
            assert d.startswith('M'), f
            paths.append({'d': d, 'fill': fill.group(1)})
        assert paths, f
        mt = re.search(r'matrix\(\s*1,\s*0,\s*0,\s*1,\s*([-\d.]+),\s*([-\d.]+)\)', s)
        frames.append({'paths': paths, 'tx': float(mt.group(1)), 'ty': float(mt.group(2))})
    out.append(f'export const LIGHTNING_{name.upper()}: LightningSet = {{')
    out.append(f'    viewBox: {json.dumps(vb)},')
    out.append('    frames: [')
    for fr in frames:
        out.append(f'        {{ paths: {json.dumps(fr["paths"], ensure_ascii=False)}, tx: {fr["tx"]}, ty: {fr["ty"]} }},')
    out.append('    ],')
    out.append('}')
    out.append('')
    print(name, len(frames), 'frames', vb)
open('components/lightning-frames.ts', 'w').write('\n'.join(out))
