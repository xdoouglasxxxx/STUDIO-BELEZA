"use client"

import { createClient } from "@/lib/supabase"
import { useCallback, useEffect, useState } from "react"
import { Loader2, Check, Instagram, MapPin, Phone, Store, Info } from "lucide-react"

export default function PerfilPage() {
  const supabase = createClient()
  const [studioId, setStudioId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", address: "", instagram: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState("")

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("studios")
      .select("id, name, phone, address, instagram")
      .limit(1)
      .maybeSingle()
    if (data) {
      setStudioId(data.id)
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        instagram: data.instagram || "",
      })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const set = (campo: string, valor: string) => {
    setSalvo(false)
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const salvar = async () => {
    setErro("")
    const phone = form.phone.replace(/\D/g, "")
    if (!form.name.trim()) { setErro("Digite o nome do studio."); return }
    if (phone.length < 12) { setErro("WhatsApp deve ter DDI + DDD + número (ex: 5541996922171)."); return }

    setSaving(true)
    const { error } = await supabase
      .from("studios")
      .update({
        name: form.name.trim(),
        phone,
        address: form.address.trim() || null,
        instagram: form.instagram.replace("@", "").trim() || null,
      })
      .eq("id", studioId)
    setSaving(false)
    if (error) { setErro("Não foi possível salvar. Tente novamente."); return }
    setSalvo(true)
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#C9A86C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )

  const campos = [
    { key: "name", label: "Nome do studio", placeholder: "Myleine Hofmann Manicure", icon: Store, hint: "Aparece no topo do site." },
    { key: "phone", label: "WhatsApp", placeholder: "5541996922171", icon: Phone, hint: "Só números: DDI (55) + DDD + número. Usado nos botões de agendamento e contato." },
    { key: "address", label: "Endereço", placeholder: "Rua Eduardo Pinto da Rocha, 4001 - Curitiba", icon: MapPin, hint: "Usado no mapa e no botão \"Abrir no Google Maps\"." },
    { key: "instagram", label: "Instagram", placeholder: "myleinehofmann.nails", icon: Instagram, hint: "Só o usuário, sem @ e sem link." },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold">Perfil</h1>
        <p className="text-sm text-[#0A1F44]/60 mt-1">
          Informações que aparecem no seu site. Salvou, atualizou na hora.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#0A1F44]/5 space-y-5">
        {campos.map((c) => (
          <div key={c.key}>
            <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
              <c.icon className="w-4 h-4 text-[#C9A86C]" /> {c.label}
            </label>
            <input
              value={(form as any)[c.key]}
              onChange={(e) => set(c.key, e.target.value)}
              placeholder={c.placeholder}
              className="w-full h-11 rounded-xl border border-[#0A1F44]/10 px-3 text-sm focus:outline-none focus:border-[#C9A86C]"
            />
            <p className="text-xs text-[#0A1F44]/50 mt-1 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" /> {c.hint}
            </p>
          </div>
        ))}
      </div>

      {erro && <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>}

      <button
        onClick={salvar}
        disabled={saving}
        className="w-full sm:w-auto text-sm font-semibold px-8 py-3 rounded-full bg-[#0A1F44] text-white hover:bg-[#0A1F44]/90 inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : salvo ? <Check className="w-4 h-4" /> : null}
        {saving ? "Salvando..." : salvo ? "Salvo!" : "Salvar perfil"}
      </button>
    </div>
  )
}
