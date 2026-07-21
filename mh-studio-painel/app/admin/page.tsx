"use client"

import { createClient } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { format, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, DollarSign, Users, Image } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const [data, setData] = useState({ todayRevenue: 0, pendingAppointments: 0, clientsThisMonth: 0, galleryCount: 0, todayAppointments: [] })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchDashboard = async () => {
      const todayStart = startOfDay(new Date()).toISOString()
      const todayEnd = endOfDay(new Date()).toISOString()
      
      const { data: revenue } = await supabase.from("appointments").select("price_at_time").eq("status", "pago").gte("date", todayStart).lte("date", todayEnd)
      const { count: pending } = await supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "pendente")
      const { count: clients } = await supabase.from("clients").select("*", { count: "exact", head: true }).gte("created_at", startOfDay(new Date()).toISOString())
      const { count: gallery } = await supabase.from("gallery").select("*", { count: "exact", head: true })
      const { data: todayApps } = await supabase.from("appointments").select("id, start_time, end_time, status, price_at_time, clients(name), services(name)").eq("date", format(new Date(), "yyyy-MM-dd")).order("start_time")

      setData({
        todayRevenue: revenue?.reduce((acc, curr) => acc + (curr.price_at_time || 0), 0) || 0,
        pendingAppointments: pending || 0,
        clientsThisMonth: clients || 0,
        galleryCount: gallery || 0,
        todayAppointments: todayApps || []
      })
      setLoading(false)
    }
    fetchDashboard()
  }, [supabase])

  const statusColors = { pendente: "bg-amber-100 text-amber-700", confirmado: "bg-emerald-100 text-emerald-700", pago: "bg-blue-100 text-blue-700", cancelado: "bg-red-100 text-red-700" }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#C9A86C] border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl lg:text-3xl font-serif font-bold">Olá, Myleine!</h1><p className="text-sm text-[#0A1F44]/60 mt-1">Resumo do seu dia.</p></div></div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#0A1F44]/5">
          <p className="text-xs font-medium text-[#0A1F44]/60 tracking-wider uppercase">Faturamento Hoje</p>
          <p className="text-2xl font-bold mt-1 text-[#0A1F44]">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.todayRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#0A1F44]/5">
          <p className="text-xs font-medium text-[#0A1F44]/60 tracking-wider uppercase">Pendentes</p>
          <p className="text-2xl font-bold mt-1 text-[#0A1F44]">{data.pendingAppointments}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#0A1F44]/5">
          <p className="text-xs font-medium text-[#0A1F44]/60 tracking-wider uppercase">Clientes (Mês)</p>
          <p className="text-2xl font-bold mt-1 text-[#0A1F44]">{data.clientsThisMonth}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#0A1F44]/5">
          <p className="text-xs font-medium text-[#0A1F44]/60 tracking-wider uppercase">Galeria</p>
          <p className="text-2xl font-bold mt-1 text-[#0A1F44]">{data.galleryCount} fotos</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#0A1F44]/5">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-serif font-semibold">Hoje</h2><Link href="/admin/agenda" className="text-sm font-medium text-[#C9A86C] hover:underline">Ver Agenda</Link></div>
        {data.todayAppointments.length === 0 ? (
          <div className="text-center py-8 text-[#0A1F44]/60">Nenhum agendamento para hoje.</div>
        ) : (
          <div className="space-y-3">
            {data.todayAppointments.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FDF8F0]">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]"><p className="text-sm font-bold">{app.start_time?.substring(0,5)}</p></div>
                  <div><p className="font-medium">{app.clients?.name}</p><p className="text-xs text-[#0A1F44]/60">{app.services?.name}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", statusColors[app.status])}>{app.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
