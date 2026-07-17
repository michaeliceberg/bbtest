"use client"

import { StructureBrowser } from "./structure-browser"

export default function TTrainerChallengesAdminPage() {
  return (
    <div className="h-screen flex flex-col">
      <h1 className="text-3xl font-bold text-white mb-4">🎓 Управление тренажерами</h1>

      <div className="flex-1 min-h-0">
        <StructureBrowser />
      </div>
    </div>
  )
}
