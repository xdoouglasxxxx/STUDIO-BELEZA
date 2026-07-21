"use client"

import { createClient } from "@/lib/supabase"
import { useCallback, useEffect, useState } from "react"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Check, X, DollarSign, Loader2, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

const statusColors: any = {
  pendente: "bg-amber-100 text-amber-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  pago: "bg-blue-100 text-blue-700",
  cancelado: "bg-red-100 text-red-700",
  "no-show": "bg-gray-200 text-gray-600",
}

// Mensagens prontas por status — a Myleine só toca e envia
function mensagemWhats(app: any, dia: Date) {
  const nome = (app.clients?.name || "").split(" ")[0]
  const servico = app.services?.name || "seu horário"
  const data = format(dia, "dd/MM")
  const hora = app.start_time?.substring(0, 5)
  const msgs: any = {
    pendente: `Olá ${nome}! 💅 Recebi seu agendamento de *${servico}* para ${data} às ${hora}. Já vou confirmar seu horário, tá bom? ✨`,
    confirmado: `Olá ${nome}! Seu horário de *${servico}* está *CONFIRMADO* para ${data} às ${hora} 💅✨ Qualquer imprevisto é só me avisar. Te espero!`,
    pago: `${nome}, obrigada pela visita de hoje! 💛 Foi um prazer cuidar de você. Quando quiser agendar o retoque de *${servico}*, é só me chamar! 💅`,
    cancelado: `Olá ${nome}, tudo bem? Sobre seu horário de *${servico}* do dia ${data} às ${hora}: infelizmente precisou ser cancelado. 🙏 Me chama aqui pra gente remarcar no melhor dia pra você! 💅`,
  }
  return msgs[app.status] || `Olá ${nome}! Sobre seu agendamento de *${servico}* (${data} às ${hora}):`
}

export default function AgendaPage() {
  const supabase = createClient()
  const [day, setDay] = useState(new Date())
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const dateStr = format(day, "yyyy-MM-dd")

  const fetchDay = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, status, price_at_time, clients(name, phone), services(name)")
      .eq("date", dateStr)
      .order("start_time")
    setApps(data || [])
    setLoading(false)
  }, [supabase, dateStr])

  useEffect(() => { fetchDay() }, [fetchDay])

  const setStatus = async (id: string, status: string) => {
    setUpdating(id)
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id)
    if (!error) setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    setUpdating(null)
  }

  // Liberação antecipada: encerra o atendimento AGORA, liberando
  // automaticamente os próximos horários no site
  const liberarAgora = async (app: any) => {
    setUpdating(app.id)
    const agora = new Date()
    const hhmmss = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}:00`
    const { error } = await supabase.from("appointments").update({ end_time: hhmmss }).eq("id", app.id)
    if (!error) setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, end_time: hhmmss } : a)))
    setUpdating(null)
  }

  const agoraHHMM = () => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`
  }

  const emAndamento = (app: any) => {
    const hoje = format(new Date(), "yyyy-MM-dd")
    if (dateStr !== hoje) return false
    if (!["pendente", "confirmado", "pago"].includes(app.status)) return false
    const n = agoraHHMM()
    return app.start_time?.substring(0, 5) <= n && n < app.end_time?.substring(0, 5)
  }

  const receitaDia = apps
    .filter((a) => a.status === "pago")
    .reduce((acc, a) => acc + (a.price_at_time || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Agenda</h1>
          <p className="text-sm text-[#0A1F44]/60 mt-1">Gerencie os agendamentos do dia.</p>
        </div>
        <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-[#0A1F44]/5 text-right">
          <p className="text-[10px] font-medium text-[#0A1F44]/60 tracking-wider uppercase">Recebido no dia</p>
          <p className="text-lg font-bold text-[#0A1F44]">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(receitaDia)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0A1F44]/5 flex items-center justify-between">
        <button onClick={() => setDay((d) => addDays(d, -1))} className="p-2 rounded-full hover:bg-[#FDF8F0]" aria-label="Dia anterior">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-serif text-lg font-semibold capitalize">
            {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <button onClick={() => setDay(new Date())} className="text-xs font-medium text-[#C9A86C] hover:underline inline-flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Ir para hoje
          </button>
        </div>
        <button onClick={() => setDay((d) => addDays(d, 1))} className="p-2 rounded-full hover:bg-[#FDF8F0]" aria-label="Próximo dia">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-[#C9A86C] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-[#0A1F44]/5 text-center text-[#0A1F44]/60">
          Nenhum agendamento neste dia.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#0A1F44]/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="text-center min-w-[64px] bg-[#FDF8F0] rounded-xl px-2 py-2">
                    <p className="text-sm font-bold">{app.start_time?.substring(0, 5)}</p>
                    <p className="text-[10px] text-[#0A1F44]/50">{app.end_time?.substring(0, 5)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{app.clients?.name || "Cliente"}</p>
                    <p className="text-xs text-[#0A1F44]/60 truncate">{app.services?.name}</p>
                    {app.clients?.phone && (
                      <a
                        href={`https://wa.me/${String(app.clients.phone).replace(/\D/g, "")}?text=${encodeURIComponent(mensagemWhats(app, day))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#128C4A] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        💬 Enviar mensagem de {app.status === "pendente" ? "recebido" : app.status === "confirmado" ? "confirmação" : app.status === "pago" ? "agradecimento" : app.status === "cancelado" ? "cancelamento" : "contato"}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(app.price_at_time || 0)}
                  </span>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", statusColors[app.status])}>{app.status}</span>
                </div>
              </div>

              {app.status !== "cancelado" && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#0A1F44]/5">
                  {updating === app.id ? (
                    <span className="text-xs text-[#0A1F44]/60 inline-flex items-center gap-1 py-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Atualizando...
                    </span>
                  ) : (
                    <>
                      {app.status === "pendente" && (
                        <button onClick={() => setStatus(app.id, "confirmado")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Confirmar
                        </button>
                      )}
                      {(app.status === "pendente" || app.status === "confirmado") && (
                        <button onClick={() => setStatus(app.id, "pago")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#0A1F44] text-white hover:bg-[#0A1F44]/90 inline-flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Marcar pago
                        </button>
                      )}
                      <button onClick={() => setStatus(app.id, "cancelado")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Cancelar
                      </button>
                      {emAndamento(app) && (
                        <button onClick={() => liberarAgora(app)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#C9A86C] text-[#0A1F44] hover:bg-[#C9A86C]/80 inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Encerrar agora (libera a agenda)
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-[#0A1F44]/50 text-center">
        Cancelar um agendamento libera o horário automaticamente no site.
      </p>
    </div>
  )
}
