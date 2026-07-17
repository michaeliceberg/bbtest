'use client'

import { useState } from 'react'

export interface FormData {
  question: string
  type: string
  points: number
  author: string
  difficulty: string
  numRans: string
  options: Array<{ text: string; correct: boolean }>
}

const CHALLENGE_TYPES = [
  'M_ASC',
  'SELECT',
  'ASSIST',
  'CONNECT',
  'SLIDER',
  'CONSTRUCT',
  'WORKBOOK',
  'R ASSIST',
  'R CONNECT',
  'R SLIDER',
  'GEOSIN',
  'RUSSIANDICTANT',
  'SWIPE',
]

interface ChallengeFormProps {
  lessonId: number
  formData: FormData
  onFormChange: (data: FormData) => void
  onSuccess: () => void
}

export function ChallengeForm({
  lessonId,
  formData,
  onFormChange,
  onSuccess,
}: ChallengeFormProps) {
  const [loading, setLoading] = useState(false)

  const handleAddOption = () => {
    onFormChange({
      ...formData,
      options: [...formData.options, { text: '', correct: false }],
    })
  }

  const handleRemoveOption = (index: number) => {
    onFormChange({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    })
  }

  const handleOptionChange = (index: number, field: string, value: any) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    onFormChange({ ...formData, options: newOptions })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/t-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          ...formData,
        }),
      })

      if (res.ok) {
        alert('✅ Challenge added!')
        onSuccess()
      } else {
        alert('❌ Error creating challenge')
      }
    } catch (err) {
      console.error(err)
      alert('❌ Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Question */}
      <div>
        <label className="block text-white font-semibold mb-2 text-sm">
          Question (LaTeX OK)
        </label>
        <textarea
          value={formData.question}
          onChange={e => onFormChange({ ...formData, question: e.target.value })}
          placeholder="$ x^2 + 5x + 6 = 0 $"
          className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-2 text-white placeholder-[#5A6A72] text-sm h-20"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-white font-semibold mb-2 text-sm">Type</label>
        <select
          value={formData.type}
          onChange={e => onFormChange({ ...formData, type: e.target.value })}
          className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-2 text-white text-sm"
        >
          {CHALLENGE_TYPES.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Points & NumRans */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white font-semibold mb-1 text-xs">
            Points
          </label>
          <input
            type="number"
            value={formData.points}
            onChange={e =>
              onFormChange({ ...formData, points: Number(e.target.value) })
            }
            min="1"
            className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-2 py-1.5 text-white text-xs"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-1 text-xs">
            NumRans
          </label>
          <input
            type="text"
            value={formData.numRans}
            onChange={e =>
              onFormChange({ ...formData, numRans: e.target.value })
            }
            className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-2 py-1.5 text-white text-xs"
          />
        </div>
      </div>

      {/* Author & Difficulty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white font-semibold mb-1 text-xs">
            Author
          </label>
          <input
            type="text"
            value={formData.author}
            onChange={e => onFormChange({ ...formData, author: e.target.value })}
            placeholder="М9 МАТЕМАТИКА-9"
            className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-2 py-1.5 text-white placeholder-[#5A6A72] text-xs"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-1 text-xs">
            Difficulty
          </label>
          <input
            type="text"
            value={formData.difficulty}
            onChange={e =>
              onFormChange({ ...formData, difficulty: e.target.value })
            }
            className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-2 py-1.5 text-white text-xs"
          />
        </div>
      </div>

      {/* Options */}
      <div>
        <label className="block text-white font-semibold mb-2 text-xs">
          Options (for SELECT type)
        </label>
        <div className="space-y-2">
          {formData.options.map((option, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <button
                type="button"
                onClick={() =>
                  handleOptionChange(
                    idx,
                    'correct',
                    !option.correct
                  )
                }
                className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${
                  option.correct
                    ? 'bg-green-500/20 text-green-400 border border-green-500'
                    : 'bg-red-500/20 text-red-400 border border-red-500'
                }`}
              >
                {option.correct ? '✓' : '✗'}
              </button>
              <input
                type="text"
                value={option.text}
                onChange={e => handleOptionChange(idx, 'text', e.target.value)}
                placeholder={`Option ${idx + 1}...`}
                className="flex-1 bg-[#232F34] border border-[#3A464E] rounded-lg px-2 py-1.5 text-white placeholder-[#5A6A72] text-xs"
              />
              <button
                type="button"
                onClick={() => handleRemoveOption(idx)}
                className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddOption}
          className="mt-2 px-3 py-1.5 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded text-xs"
        >
          ➕ Add Option
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? '⏳ Creating...' : '💾 Create Challenge'}
      </button>
    </form>
  )
}
