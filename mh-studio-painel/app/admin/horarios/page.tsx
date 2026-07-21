"use client"

import { createClient } from "@/lib/supabase"
import { useCallback, useEffect, useState } from "react"
import { Loader2, Check, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const DIAS = [
  { key: "1", label: "Segunda" },
  { key: "2", label: "Terça" },
  { key: "3", label: "Quarta" },
  { key: "4", label: "Quinta" },
  { key: "5", label: "Sexta" },
  { key: "6", label: "Sábado" },
  { key: "0", label: "Domingo" },
]

const DEFAULT_WH: any = {
  "0": null,
  "1": { start: "09:00", end: "19:00" },
  "2": { start: "09:00", end: "19:00" },
  "3": { start: "09:00", end: "19:00" },
  "4": { start: "09:00", end: "19:00" },
  "5": { start: "09:00", end: "19:00" },
  "6": { start: "09:00", end: "17:00" },
}

export default function HorariosPage() {
  const supabase = createClient()
  const [studioId, setStudioId] = useState<string | null>(null)
  const [wh, setWh] = useState<any>(DEFAULT_WH)
  const [intervalo, setIntervalo] = useState(30)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState("")

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("studios")
      .select("id, working_hours, slot_interval_minutes")
      .limit(1)
      .maybeSingle()
    if (data) {
      setStudioId(data.id)
      if (data.working_hours) setWh(data.working_hours)
      if (data.slot_interval_minutes) setIntervalo(data.slot_interval_minutes)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleDia = (key: string) => {
    setSalvo(false)
    setWh((prev: any) => ({
      ...prev,
      [key]: prev[key] ? null : { start: "09:00", end: "19:00" },
    }))
  }

  const setHora = (key: string, campo: "start" | "end", valor: string) => {
    setSalvo(false)
    setWh((prev: any) => ({ ...prev, [key]: { ...prev[key], [campo]: valor } }))
  }

  const salvar = async () => {
    setErro("")
    // valida: início antes do fim em todos os dias abertos
    for (const d of DIAS) {
      const cfg = wh[d.key]
      if (cfg && cfg.start >= cfg.end) {
        setErro(`${d.label}: o horário de abertura precisa ser antes do fechamento.`)
        return
      }
    }
    setSaving(true)
    const { error } = await supabase
      .from("studios")
      .update({ working_hours: wh, slot_interval_minutes: intervalo })
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold">Horários</h1>
        <p className="text-sm text-[#0A1F44]/60 mt-1">
          Configure seu expediente. O site recalcula os horários oferecidos na hora.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#0A1F44]/5 space-y-3">
        {DIAS.map((d) => {
          const cfg = wh[d.key]
          const aberto = !!cfg
          return (
            <div key={d.key} className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-[#0A1F44]/5 last:border-0">
              <button
                onClick={() => toggleDia(d.key)}
                className={cn(
                  "flex items-center gap-3 text-sm font-medium min-w-[140px]",
                )}
              >
                <span
                  className={cn(
                    "w-10 h-6 rounded-full relative transition-colors shrink-0",
                    aberto ? "bg-emerald-500" : "bg-[#0A1F44]/15",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
                      aberto ? "left-[18px]" : "left-0.5",
                    )}
                  />
                </span>
                {d.label}
              </button>
              {aberto ? (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={cfg.start}
                    onChange={(e) => setHora(d.key, "start", e.target.value)}
                    className="h-10 rounded-xl border border-[#0A1F44]/10 px-2 focus:outline-none focus:border-[#C9A86C]"
                  />
                  <span className="text-[#0A1F44]/40">até</span>
                  <input
                    type="time"
                    value={cfg.end}
                    onChange={(e) => setHora(d.key, "end", e.target.value)}
                    className="h-10 rounded-xl border border-[#0A1F44]/10 px-2 focus:outline-none focus:border-[#C9A86C]"
                  />
                </div>
              ) : (
                <span className="text-sm text-[#0A1F44]/40">Fechado</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#0A1F44]/5">
        <p className="text-sm font-medium mb-2">Oferecer horários a cada</p>
        <div className="flex gap-2">
          {[15, 30, 60].map((m) => (
            <button
              key={m}
              onClick={() => { setIntervalo(m); setSalvo(false) }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold border transition-colors",
                intervalo === m
                  ? "bg-[#0A1F44] text-white border-[#0A1F44]"
                  : "bg-white border-[#0A1F44]/10 hover:bg-[#FDF8F0]",
              )}
            >
              {m} min
            </button>
          ))}
        </div>
        <p className="text-xs text-[#0A1F44]/50 mt-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Ex.: a cada 30 min o site oferece 09:00, 09:30, 10:00... Só aparecem horários em que o serviço
          escolhido cabe inteiro antes do fechamento e sem conflitar com outros atendimentos.
        </p>
      </div>

      {erro && <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>}

      <button
        onClick={salvar}
        disabled={saving}
        className="w-full sm:w-auto text-sm font-semibold px-8 py-3 rounded-full bg-[#0A1F44] text-white hover:bg-[#0A1F44]/90 inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : salvo ? <Check className="w-4 h-4" /> : null}
        {saving ? "Salvando..." : salvo ? "Salvo!" : "Salvar horários"}
      </button>
    </div>
  )
}
