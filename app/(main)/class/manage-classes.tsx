'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClass, assignStudentToClass } from '@/actions/manage-classes'
import { Loader2, Plus } from 'lucide-react'

type Student = {
    userId: string
    userName: string
    points: number
    classId: number | null
}

type ClassRow = {
    id: number
    title: string
}

type Props = {
    allUsers: Student[]
    allClasses: ClassRow[]
}

const NO_CLASS = 'none'

export const ManageClasses = ({ allUsers, allClasses }: Props) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [newClassTitle, setNewClassTitle] = useState('')
    const [search, setSearch] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleCreateClass = () => {
        setError(null)
        const title = newClassTitle.trim()
        if (!title) return

        startTransition(async () => {
            try {
                await createClass(title)
                setNewClassTitle('')
                router.refresh()
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Не удалось создать класс')
            }
        })
    }

    const handleAssign = (studentUserId: string, value: string) => {
        setError(null)
        const classId = value === NO_CLASS ? null : Number(value)

        startTransition(async () => {
            try {
                await assignStudentToClass(studentUserId, classId)
                router.refresh()
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Не удалось назначить класс')
            }
        })
    }

    const filteredUsers = allUsers.filter((u) =>
        u.userName.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="w-full max-w-3xl border rounded-xl p-5 space-y-6">
            <div>
                <h2 className="font-bold text-lg mb-2">Классы</h2>
                <div className="flex gap-2">
                    <Input
                        placeholder="Название нового класса"
                        value={newClassTitle}
                        onChange={(e) => setNewClassTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateClass()}
                    />
                    <Button onClick={handleCreateClass} disabled={isPending || !newClassTitle.trim()}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>
                {allClasses.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                        Классов пока нет — создайте первый, чтобы можно было добавить в него учеников.
                    </p>
                )}
            </div>

            <div>
                <h2 className="font-bold text-lg mb-2">Ученики</h2>
                <Input
                    placeholder="Поиск по имени"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-3"
                />
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {filteredUsers.map((student) => (
                        <div key={student.userId} className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2">
                            <span className="text-sm truncate flex-1">{student.userName}</span>
                            <Select
                                value={student.classId ? String(student.classId) : NO_CLASS}
                                onValueChange={(value) => handleAssign(student.userId, value)}
                                disabled={isPending}
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Без класса" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_CLASS}>Без класса</SelectItem>
                                    {allClasses.map((cls) => (
                                        <SelectItem key={cls.id} value={String(cls.id)}>
                                            {cls.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <p className="text-sm text-muted-foreground">Никто не найден</p>
                    )}
                </div>
            </div>

            {error && <p className="text-sm text-rose-500">{error}</p>}
        </div>
    )
}
