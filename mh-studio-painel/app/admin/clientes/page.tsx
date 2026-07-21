"use client"

import { createClient } from "@/lib/supabase"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, MessageCircle } from "lucide-react"

export default function ClientesPage() {
  const supabase = createClient()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("clients")
      .select("id, name, phone, created_at, appointments(id, date, status, price_at_time)")
      .order("created_at", { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) => c.name?.toLowerCase().includes(q) || String(c.phone || "").includes(q),
    )
  }, [clientes, busca])

  const resumo = (c: any) => {
    const apps = c.appointments || []
    const pagos = apps.filter((a: any) => a.status === "pago")
    const total = pagos.reduce((acc: number, a: any) => acc + (a.price_at_time || 0), 0)
    return { visitas: pagos.length, agendamentos: apps.length, total }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#C9A86C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold">Clientes</h1>
        <p className="text-sm text-[#0A1F44]/60 mt-1">{clientes.length} cadastradas pelo site e agendamentos.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#0A1F44]/40" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full h-12 rounded-2xl border border-[#0A1F44]/10 bg-white pl-11 pr-4 text-sm focus:outline-none focus:border-[#C9A86C]"
        />
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-[#0A1F44]/5 text-center text-[#0A1F44]/60">
          Nenhuma cliente encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((c) => {
            const r = resumo(c)
            return (
              <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#0A1F44]/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#C9A86C]/15 flex items-center justify-center text-[#0A1F44] font-serif font-bold shrink-0">
                    {(c.name || "?").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-[#0A1F44]/60">
                      {r.agendamentos} agendamento{r.agendamentos === 1 ? "" : "s"} • {r.visitas} visita{r.visitas === 1 ? "" : "s"} paga{r.visitas === 1 ? "" : "s"} •{" "}
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(r.total)}
                    </p>
                  </div>
                </div>
                {c.phone && (
                  <a
                    href={`https://wa.me/${String(c.phone).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold px-3 py-2 rounded-full bg-[#25D366]/10 text-[#128C4A] hover:bg-[#25D366]/20 inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
