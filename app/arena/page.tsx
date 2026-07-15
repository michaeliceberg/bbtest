// app/arena/page.tsx

import { Flame, Skull, Crown, Target, Sword, Shield } from 'lucide-react';

export default function ArenaPage() {
    return (
        <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] min-h-screen text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Шапка игрока */}
                <div className="bg-[#0f3460] rounded-xl p-4 mb-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-500 rounded-full p-2">
                            <Crown className="h-6 w-6 text-[#F2F7FB]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl">PLAYER_1337</h2>
                            <p className="text-sm text-gray-300">LVL 24 | РЕЙТИНГ: ПЛАТИНА</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1">
                            <Flame className="h-5 w-5 text-orange-400" />
                            <span className="font-bold">12</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Shield className="h-5 w-5 text-blue-400" />
                            <span className="font-bold">2500 XP</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Target className="h-5 w-5 text-red-400" />
                            <span className="font-bold">5 HP</span>
                        </div>
                    </div>
                </div>

                {/* Карта уровней (как в играх) */}
                <div className="grid gap-6">
                    <div className="bg-gradient-to-r from-purple-800 to-indigo-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold">⚔️ АРЕНА 1: АЛГЕБРА</h3>
                            <span className="bg-green-500 px-3 py-1 rounded-full text-sm">✅ 5/5 КВЕСТОВ</span>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="bg-white/10 rounded-lg p-3 text-center">
                                    <div className="text-xl mb-1">🗡️</div>
                                    <div className="text-sm">Квест {i}</div>
                                    <div className="text-xs text-green-400">✅</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-slate-800 to-gray-800 rounded-xl p-6 opacity-70">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold">🔒 АРЕНА 2: ГЕОМЕТРИЯ</h3>
                            <span className="bg-gray-600 px-3 py-1 rounded-full text-sm">🔒 ЗАКРЫТО</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            ⚔️ Завершите арену 1, чтобы открыть
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}