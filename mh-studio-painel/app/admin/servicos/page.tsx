"use client"

import { createClient } from "@/lib/supabase"
import { useCallback, useEffect, useState } from "react"
import { Plus, Pencil, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

const emptyForm = { name: "", price: "", duration_minutes: "60", category: "", description: "" }

export default function ServicosPage() {
  const supabase = createClient()
  const [servicos, setServicos] = useState<any[]>([])
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null) // "new" para criar
  const [form, setForm] = useState<any>(emptyForm)
  const [erro, setErro] = useState("")

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: studio } = await supabase.from("studios").select("id").limit(1).maybeSingle()
    if (studio) setStudioId(studio.id)
    const { data } = await supabase
      .from("services")
      .select("id, name, price, duration_minutes, category, description, active")
      .order("created_at")
    setServicos(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const startEdit = (s: any) => {
    setErro("")
    setEditingId(s.id)
    setForm({
      name: s.name,
      price: String(s.price),
      duration_minutes: String(s.duration_minutes),
      category: s.category || "",
      description: s.description || "",
    })
  }

  const startNew = () => { setErro(""); setEditingId("new"); setForm(emptyForm) }
  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); setErro("") }

  const save = async () => {
    setErro("")
    const price = parseFloat(String(form.price).replace(",", "."))
    const dur = parseInt(form.duration_minutes, 10)
    if (!form.name.trim()) { setErro("Digite o nome do serviço."); return }
    if (isNaN(price) || price <= 0) { setErro("Digite um preço válido (ex: 89,90)."); return }
    if (isNaN(dur) || dur <= 0) { setErro("Digite a duração em minutos (ex: 60)."); return }

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      price,
      duration_minutes: dur,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
    }
    let error
    if (editingId === "new") {
      ;({ error } = await supabase.from("services").insert({ ...payload, studio_id: studioId, active: true }))
    } else {
      ;({ error } = await supabase.from("services").update(payload).eq("id", editingId))
    }
    setSaving(false)
    if (error) { setErro("Não foi possível salvar. Tente novamente."); return }
    cancelEdit()
    fetchAll()
  }

  const toggleActive = async (s: any) => {
    const { error } = await supabase.from("services").update({ active: !s.active }).eq("id", s.id)
    if (!error) setServicos((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)))
  }

  const FormCard = (
    <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-[#C9A86C]/40 space-y-3">
      <p className="font-serif font-semibold">{editingId === "new" ? "Novo serviço" : "Editar serviço"}</p>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome (ex: Alongamento em Gel)" className="w-full h-11 rounded-xl border border-[#0A1F44]/10 px-3 text-sm focus:outline-none focus:border-[#C9A86C]" />
      <div className="grid grid-cols-2 gap-3">
        <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Preço (ex: 89,90)" inputMode="decimal" className="h-11 rounded-xl border border-[#0A1F44]/10 px-3 text-sm focus:outline-none focus:border-[#C9A86C]" />
        <input value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} placeholder="Duração (min)" inputMode="numeric" className="h-11 rounded-xl border border-[#0A1F44]/10 px-3 text-sm focus:outline-none focus:border-[#C9A86C]" />
      </div>
      <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Categoria (ex: alongamento)" className="w-full h-11 rounded-xl border border-[#0A1F44]/10 px-3 text-sm focus:outline-none focus:border-[#C9A86C]" />
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição curta que aparece no site" rows={2} className="w-full rounded-xl border border-[#0A1F44]/10 px-3 py-2 text-sm focus:outline-none focus:border-[#C9A86C]" />
      {erro && <p className="text-xs text-red-600">{erro}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-xs font-semibold px-4 py-2 rounded-full bg-[#0A1F44] text-white hover:bg-[#0A1F44]/90 inline-flex items-center gap-1 disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Salvar
        </button>
        <button onClick={cancelEdit} className="text-xs font-semibold px-4 py-2 rounded-full bg-white border border-[#0A1F44]/10 hover:bg-[#FDF8F0] inline-flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
      </div>
    </div>
  )

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#C9A86C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Serviços</h1>
          <p className="text-sm text-[#0A1F44]/60 mt-1">Alterações aparecem no site na hora.</p>
        </div>
        {editingId === null && (
          <button onClick={startNew} className="text-xs font-semibold px-4 py-2.5 rounded-full bg-[#C9A86C] text-[#0A1F44] hover:bg-[#C9A86C]/80 inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Novo serviço
          </button>
        )}
      </div>

      {editingId === "new" && FormCard}

      <div className="space-y-3">
        {servicos.map((s) =>
          editingId === s.id ? (
            <div key={s.id}>{FormCard}</div>
          ) : (
            <div key={s.id} className={cn("bg-white rounded-2xl p-4 shadow-sm border border-[#0A1F44]/5 flex flex-wrap items-center justify-between gap-3", !s.active && "opacity-50")}>
              <div className="min-w-0">
                <p className="font-medium truncate">{s.name}</p>
                <p className="text-xs text-[#0A1F44]/60 truncate">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.price)} • {s.duration_minutes} min
                  {s.category ? ` • ${s.category}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(s)} className={cn("text-xs font-semibold px-3 py-1.5 rounded-full border", s.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#0A1F44]/10 bg-white text-[#0A1F44]/60")}>
                  {s.active ? "Ativo no site" : "Oculto do site"}
                </button>
                <button onClick={() => startEdit(s)} className="p-2 rounded-full hover:bg-[#FDF8F0]" aria-label="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
