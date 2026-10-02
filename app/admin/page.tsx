import { redirect } from "next/navigation"

// Главная админки — сразу воронка (остальные разделы по прямой ссылке).
export default function AdminPage() {
  redirect("/admin/funnel")
}
