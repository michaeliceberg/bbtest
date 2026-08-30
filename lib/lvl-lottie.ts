// lib/lvl-lottie.ts
//
// Сервер-онли (использует node:fs) — считает, сколько lvlN.json реально
// лежит в public/Lottie/lvl/, чтобы components/level-card.tsx мог
// подобрать персонажа по уровню без необходимости трогать код каждый
// раз, когда добавляется новый файл (пользователь планирует докинуть
// ещё ~40 штук постепенно — жёстко зашитое число пришлось бы обновлять
// вручную на каждый новый файл).

import fs from 'fs';
import path from 'path';

export const getLvlLottieCount = (): number => {
    try {
        const dir = path.join(process.cwd(), 'public', 'Lottie', 'lvl');
        const files = fs.readdirSync(dir);
        const numbers = files
            .map((f) => f.match(/^lvl(\d+)\.json$/)?.[1])
            .filter((n): n is string => !!n)
            .map(Number);
        return numbers.length > 0 ? Math.max(...numbers) : 1;
    } catch {
        return 1;
    }
};
