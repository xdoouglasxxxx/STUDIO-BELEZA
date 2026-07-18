'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { 
  Calendar, Check, Clock, Crown, Gem, HeartHandshake, 
  House, MessageCircle, Scissors, ShieldCheck, Sparkles, 
  Star, User, MapPin, Instagram, ChevronRight 
} from 'lucide-react'
import Link from 'next/link'

export default function PublicSite() {
  // Estados do App
  const [currentTab, setCurrentTab] = useState('inicio')
  const [services, setServices] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [studio, setStudio] = useState<any>(null)
  const supabase = createClient()

  // Dias da semana para o calendário (próximos 7 dias)
  const today = new Date()
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      day: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      num: d.getDate(),
      full: d.toISOString().split('T')[0],
      isToday: i === 0
    }
  })

  // Horários pré-definidos (intervalo de 1h)
  const allTimes = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ]

  // 1. Carregar Studio e Serviços
  useEffect(() => {
    const loadData = async () => {
      // Buscar Studio
      const { data: studioData } = await supabase
        .from('studios')
        .select('*')
        .single()
      if (studioData) setStudio(studioData)

      // Buscar Serviços Ativos
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true })
      if (servicesData) setServices(servicesData)
    }
    loadData()
  }, [supabase])

  // 2. Buscar horários disponíveis quando selecionar data
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([])
      return
    }

    const fetchTimes = async () => {
      // Buscar agendamentos do dia com status não cancelado
      const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('date', selectedDate)
        .in('status', ['pendente', 'confirmado', 'pago'])

      const occupiedTimes = appointments?.map(a => a.start_time) || []
      
      // Filtrar horários disponíveis
      const freeTimes = allTimes.filter(time => !occupiedTimes.includes(time))
      setAvailableTimes(freeTimes)
    }
    fetchTimes()
  }, [selectedDate, supabase])

  // 3. Função para criar o agendamento
  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      alert('Preencha todos os campos!')
      return
    }

    setLoading(true)

    // Verificar se cliente já existe, senão criar
    let clientId = null
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('phone', clientPhone)
      .maybeSingle()

    if (existingClient) {
      clientId = existingClient.id
    } else {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({
          studio_id: studio?.id,
          name: clientName,
          phone: clientPhone,
        })
        .select()
        .single()
      if (newClient) clientId = newClient.id
    }

    if (!clientId) {
      alert('Erro ao cadastrar cliente.')
      setLoading(false)
      return
    }

    // Calcular horário de término (1h após o início)
    const startTime = selectedTime
    const endHour = parseInt(selectedTime.split(':')[0]) + 1
    const endTime = `${String(endHour).padStart(2, '0')}:00`

    // Criar agendamento
    const { error } = await supabase
      .from('appointments')
      .insert({
        studio_id: studio?.id,
        client_id: clientId,
        service_id: selectedService.id,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        status: 'pendente',
        price_at_time: selectedService.price,
      })

    setLoading(false)
    if (error) {
      alert('Erro ao agendar: ' + error.message)
    } else {
      setSuccess(true)
    }
  }

  // 4. Resetar fluxo
  const resetFlow = () => {
    setSuccess(false)
    setCurrentTab('inicio')
    setSelectedService(null)
    setSelectedDate('')
    setSelectedTime('')
    setClientName('')
    setClientPhone('')
  }

  // ================= RENDERIZAÇÃO DAS TELAS =================

  // TELA: INICIO
  if (currentTab === 'inicio') {
    return (
      <div className="min-h-screen bg-[#FDF8F0] text-[#0A1F44] font-sans pb-[96px] selection:bg-[#C9A86C]/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A86C] flex items-center justify-center shadow-[0_4px_12px_rgba(201,168,108,0.35)]">
              <span className="font-serif font-bold text-[16px] text-[#0A1F44]">MH</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-[16px] text-[#0A1F44]">Myleine Hofmann</h1>
              <p className="text-[10px] tracking-[0.18em] text-[#C9A86C] font-semibold uppercase">Manicure</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#FDF8F0] border border-[#C9A86C]/40 flex items-center justify-center">
            <Crown className="w-4 h-4 text-[#C9A86C]" />
          </div>
        </div>

        {/* Banner Hero */}
        <div className="relative bg-[#0A1F44] rounded-[28px] mx-4 mt-2 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C9A86C] rounded-full blur-[60px]" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#1A3A6B] rounded-full blur-[50px]" />
          </div>
          <div className="absolute top-6 right-10 sparkle"><Sparkles className="w-4 h-4 text-[#C9A86C]" /></div>
          <div className="absolute top-20 left-8 sparkle"><Sparkles className="w-3 h-3 text-white/60" /></div>
          
          <div className="relative p-7 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] tracking-widest text-[#E8D5A3] mb-4">
              <Star className="w-3 h-3 fill-[#C9A86C] text-[#C9A86C]" /> ATENDIMENTO PREMIUM
            </div>
            <h1 className="font-serif text-[32px] leading-[0.95] font-semibold text-white">
              Suas unhas,<br />
              <span className="shimmer">sua melhor</span><br />
              versão!
            </h1>
            <p className="text-[13px] text-white/70 mt-3 leading-relaxed max-w-[220px]">
              Acabamento impecável, durabilidade e cuidado que você merece.
            </p>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setCurrentTab('servicos')}
                className="h-12 px-6 rounded-full bg-[#C9A86C] text-[#0A1F44] font-bold text-[12px] tracking-[0.12em] shadow-[0_8px_20px_rgba(201,168,108,0.4)] active:scale-[0.98] transition-transform flex items-center gap-2"
              >
                AGENDAR AGORA <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-3 rounded-full bg-white/10 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#0A1F44]">4.9</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-[#C9A86C] text-[#C9A86C]" />)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Diferenciais */}
        <div className="px-4 mt-5 grid grid-cols-3 gap-2.5">
          {[
            { icon: Crown, title: 'Acabamento', sub: 'Perfeito' },
            { icon: ShieldCheck, title: 'Durabilidade', sub: '& Segurança' },
            { icon: HeartHandshake, title: 'Cuidado', sub: '& Higiene' }
          ].map((item, idx) => (
            <div key={idx} className="rounded-[18px] bg-white border border-[#F0E6D3] p-3.5 shadow-[0_6px_20px_rgba(10,31,68,0.08)]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: '#C9A86C10' }}>
                <item.icon className="w-4 h-4" style={{ color: '#C9A86C' }} />
              </div>
              <div className="text-[11px] font-bold leading-tight text-[#0A1F44]">{item.title}</div>
              <div className="text-[11px] leading-tight text-[#0A1F44]/70">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Galeria Destaques */}
        <div className="mt-7">
          <div className="px-6 flex items-center justify-between mb-3">
            <h2 className="font-serif text-[18px] font-semibold text-[#0A1F44]">Galeria Inspirations</h2>
          </div>
          <div className="px-4 grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-[20px] overflow-hidden relative border border-white shadow-[0_6px_20px_rgba(10,31,68,0.08)] bg-gradient-to-br from-pink-100 to-pink-200">
                <div className="absolute bottom-0 left-0 right-0 h-[38%] bg-white/90 backdrop-blur rounded-t-[18px] border-t border-white/50 flex items-end justify-center pb-2">
                  <div className="w-[70%] h-[4px] rounded-full bg-[#0A1F44]/10" />
                </div>
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                  <HeartHandshake className="w-3 h-3 text-[#C9A86C]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Serviços em Destaque */}
        <div className="mt-7 px-4 pb-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="font-serif text-[18px] font-semibold text-[#0A1F44]">Serviços em destaque</h2>
            <span className="text-[10px] tracking-[0.16em] font-bold text-[#C9A86C]">• PREMIUM</span>
          </div>
          <div className="space-y-3">
            {services.slice(0, 2).map((svc) => (
              <div key={svc.id} className="rounded-[20px] bg-white p-4 flex items-center gap-4 shadow-[0_6px_20px_rgba(10,31,68,0.08)] border border-[#F5E6CC]/60">
                <div className="w-12 h-12 rounded-full bg-[#0A1F44]/10 flex items-center justify-center shrink-0">
                  <Scissors className="w-5 h-5 text-[#C9A86C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#0A1F44] leading-tight truncate">{svc.name}</div>
                  <div className="text-[11px] text-[#0A1F44]/60 mt-0.5 line-clamp-1">{svc.description || `${svc.duration_minutes} min de cuidado`}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold text-[#0A1F44]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Nav */}
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    )
  }

  // TELA: SERVIÇOS
  if (currentTab === 'servicos') {
    return (
      <div className="min-h-screen bg-[#FDF8F0] text-[#0A1F44] font-sans pb-[96px] px-4 pt-2">
        <div className="mb-4">
          <h2 className="font-serif text-[26px] font-semibold text-[#0A1F44] leading-none">Nossos Serviços</h2>
          <p className="text-[12px] text-[#0A1F44]/60 mt-2">Escolha o cuidado perfeito para suas mãos</p>
        </div>
        <div className="space-y-4 pb-6">
          {services.map((svc) => (
            <div key={svc.id} className="rounded-[24px] bg-white overflow-hidden shadow-[0_6px_20px_rgba(10,31,68,0.08)] border border-[#F0E6D3] group">
              <div className="p-5">
                <div className="flex gap-4">
                  <div className="w-[64px] h-[64px] rounded-[18px] bg-[#0A1F44]/10 flex items-center justify-center shrink-0">
                    <Scissors className="w-6 h-6 text-[#C9A86C]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-serif text-[16px] font-semibold text-[#0A1F44] leading-tight">{svc.name}</div>
                    <div className="text-[12px] text-[#0A1F44]/60 mt-1.5 leading-snug">{svc.description || `${svc.duration_minutes} min`}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#C9A86C]" />
                      <span className="text-[11px] text-[#0A1F44]/70">{svc.duration_minutes} min</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] tracking-widest text-[#C9A86C] font-semibold">VALOR</div>
                    <div className="text-[20px] font-bold text-[#0A1F44] font-serif">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedService(svc); setCurrentTab('agendar'); }}
                    className="h-11 px-6 rounded-full bg-[#0A1F44] text-white text-[11px] font-bold tracking-[0.14em] flex items-center gap-2 active:scale-95 transition-transform"
                  >
                    AGENDAR <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    )
  }

  // TELA: AGENDAR
  if (currentTab === 'agendar') {
    if (success) {
      return (
        <div className="min-h-screen bg-[#FDF8F0] text-[#0A1F44] font-sans px-4 pt-10 pb-6 text-center flex flex-col items-center justify-center h-screen">
          <div className="mx-auto w-20 h-20 rounded-full bg-[#C9A86C] flex items-center justify-center shadow-[0_12px_30px_rgba(201,168,108,0.35)]">
            <Check className="w-9 h-9 text-[#0A1F44]" />
          </div>
          <h2 className="font-serif text-[28px] font-semibold text-[#0A1F44] mt-6 leading-tight">
            Agendamento<br />solicitado!
          </h2>
          <p className="text-[13px] text-[#0A1F44]/60 mt-3 px-8 leading-relaxed">
            Recebemos seu pedido para <span className="font-semibold text-[#0A1F44]">{selectedService?.name}</span> no dia {selectedDate} às {selectedTime}. A Myleine vai confirmar no seu WhatsApp em instantes.
          </p>
          <button 
            onClick={resetFlow}
            className="mt-6 w-full max-w-sm h-12 rounded-full bg-[#0A1F44] text-white text-[12px] font-bold tracking-widest flex items-center justify-center"
          >
            VOLTAR AO INÍCIO
          </button>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-[#FDF8F0] text-[#0A1F44] font-sans px-4 pt-2 pb-[96px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-[26px] font-semibold text-[#0A1F44] leading-none">Agendar</h2>
          <div className="px-3 py-1.5 rounded-full bg-[#FDF8F0] border border-[#F0E6D3] text-[11px] font-medium text-[#0A1F44] flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online agora
          </div>
        </div>

        {/* Serviço Selecionado */}
        {selectedService && (
          <div className="rounded-[16px] bg-[#0A1F44] p-[1px] mb-6">
            <div className="rounded-[15px] bg-[#0A1F44] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C9A86C] flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-[#0A1F44]" />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white leading-tight">{selectedService.name}</div>
                  <div className="text-[11px] text-white/60">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedService(null); setCurrentTab('servicos'); }}
                className="text-[11px] text-[#C9A86C] font-semibold"
              >
                ALTERAR
              </button>
            </div>
          </div>
        )}

        {/* Calendário */}
        <div className="mt-6">
          <h3 className="text-[13px] font-bold tracking-wide text-[#0A1F44] mb-3">Escolha o dia</h3>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDate(day.full)}
                className={`aspect-[0.9] rounded-[16px] flex flex-col items-center justify-center gap-1 border transition-all ${
                  selectedDate === day.full 
                    ? 'bg-[#0A1F44] border-[#0A1F44] text-white shadow-[0_8px_20px_rgba(10,31,68,0.25)]' 
                    : 'bg-white border-[#F0E6D3] text-[#0A1F44] hover:border-[#C9A86C]/40'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wide ${selectedDate === day.full ? 'text-white/60' : 'text-[#0A1F44]/50'}`}>
                  {day.day}
                </span>
                <span className="text-[16px] font-bold">{day.num}</span>
                {day.isToday && selectedDate !== day.full && (
                  <span className="w-1 h-1 rounded-full bg-[#C9A86C]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Horários */}
        <div className="mt-6">
          <h3 className="text-[13px] font-bold tracking-wide text-[#0A1F44] mb-3">Horários disponíveis</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {availableTimes.length > 0 ? (
              availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`h-12 rounded-[14px] border text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    selectedTime === time 
                      ? 'bg-[#0A1F44] border-[#0A1F44] text-white shadow' 
                      : 'bg-white border-[#F0E6D3] text-[#0A1F44] hover:border-[#C9A86C]'
                  }`}
                >
                  {selectedTime === time && <Check className="w-3.5 h-3.5" />}
                  {time}
                </button>
              ))
            ) : (
              <div className="col-span-3 py-4 text-center text-[#0A1F44]/60 text-sm">
                {selectedDate ? 'Nenhum horário disponível para esta data.' : 'Selecione uma data primeiro.'}
              </div>
            )}
          </div>
        </div>

        {/* Formulário */}
        <div className="mt-6 rounded-[20px] bg-white border border-[#F0E6D3] p-4 shadow-[0_6px_20px_rgba(10,31,68,0.08)]">
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Seu nome completo" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#0A1F44]/10 bg-[#FDF8F0] outline-none focus:border-[#C9A86C] text-[14px] placeholder:text-[#0A1F44]/40"
            />
            <input 
              type="text" 
              placeholder="WhatsApp (41) 9____-____" 
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#0A1F44]/10 bg-[#FDF8F0] outline-none focus:border-[#C9A86C] text-[14px] placeholder:text-[#0A1F44]/40"
            />
          </div>
        </div>

        {/* Resumo e Botão */}
        <div className="mt-6 rounded-[20px] bg-white border border-[#F0E6D3] p-4 shadow-[0_6px_20px_rgba(10,31,68,0.08)]">
          <div className="flex justify-between text-[12px]">
            <span className="text-[#0A1F44]/60">Serviço</span>
            <span className="font-semibold text-[#0A1F44]">{selectedService?.name || 'Nenhum selecionado'}</span>
          </div>
          <div className="flex justify-between text-[12px] mt-2">
            <span className="text-[#0A1F44]/60">Data & hora</span>
            <span className="font-semibold text-[#0A1F44]">
              {selectedDate ? `${selectedDate} às ${selectedTime || '--:--'}` : 'Selecione data e hora'}
            </span>
          </div>
          <div className="h-[1px] bg-[#F5E6CC] my-3" />
          <div className="flex justify-between">
            <span className="text-[13px] font-bold text-[#0A1F44]">Total</span>
            <span className="font-serif text-[18px] font-bold text-[#0A1F44]">
              {selectedService ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price) : 'R$ 0,00'}
            </span>
          </div>
        </div>

        {/* Botão Confirmar */}
        <div className="mt-6 space-y-3 pb-2">
          <button 
            onClick={handleConfirm}
            disabled={loading || !selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone}
            className="w-full h-14 rounded-full bg-[#C9A86C] text-[#0A1F44] font-bold tracking-[0.14em] text-[13px] shadow-[0_10px_24px_rgba(201,168,108,0.4)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'AGENDANDO...' : 'CONFIRMAR AGENDAMENTO'}
          </button>
          
          <a 
            href={`https://wa.me/${studio?.phone || '5541996922171'}?text=${encodeURIComponent(`Olá Myleine! Quero agendar um horário.`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full h-12 rounded-full bg-[#25D366] text-white font-bold tracking-wide text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <MessageCircle className="w-5 h-5" /> AGENDAR PELO WHATSAPP
          </a>
        </div>

        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    )
  }

  // TELA: CONTATO
  if (currentTab === 'contato') {
    return (
      <div className="min-h-screen bg-[#FDF8F0] text-[#0A1F44] font-sans px-4 pt-2 pb-[96px]">
        <div className="rounded-[28px] bg-[#0A1F44] p-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#C9A86C]/20 rounded-full blur-[30px]" />
          <div className="relative flex gap-4">
            <div className="w-16 h-16 rounded-full p-[2px] bg-[#C9A86C] shrink-0">
              <div className="w-full h-full rounded-full bg-[#0A1F44] flex items-center justify-center">
                <span className="font-serif text-[22px] font-bold text-[#E8D5A3]">MH</span>
              </div>
            </div>
            <div>
              <div className="font-serif text-[20px] font-semibold text-white leading-none">Myleine Hofmann</div>
              <div className="text-[11px] tracking-[0.2em] text-[#C9A86C] font-semibold mt-1.5">MANICURE • NAIL ARTIST</div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
                <MapPin className="w-3 h-3 text-[#C9A86C]" /> {studio?.address || 'Rua Eduardo Pinto da Rocha 4001'}
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-[14px] bg-white/10 border border-white/10 p-3 text-center">
              <div className="text-[18px] font-bold text-white font-serif">+850</div>
              <div className="text-[10px] text-white/60 uppercase tracking-wide">Clientes</div>
            </div>
            <div className="rounded-[14px] bg-white/10 border border-white/10 p-3 text-center">
              <div className="text-[18px] font-bold text-white font-serif">4.9</div>
              <div className="text-[10px] text-white/60 uppercase tracking-wide">Avaliação</div>
            </div>
            <div className="rounded-[14px] bg-white/10 border border-white/10 p-3 text-center">
              <div className="text-[18px] font-bold text-white font-serif">5 anos</div>
              <div className="text-[10px] text-white/60 uppercase tracking-wide">Experiência</div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <a 
            href={`https://wa.me/${studio?.phone || '5541996922171'}`}
            target="_blank"
            rel="noreferrer"
            className="w-full h-14 rounded-[16px] bg-white border border-[#F0E6D3] flex items-center gap-4 px-4 shadow-[0_6px_20px_rgba(10,31,68,0.08)] active:scale-[0.99] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[13px] font-semibold text-[#0A1F44]">WhatsApp</div>
              <div className="text-[11px] text-[#0A1F44]/60">Resposta rápida</div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#0A1F44]/30" />
          </a>

          <div className="w-full h-14 rounded-[16px] bg-white border border-[#F0E6D3] flex items-center gap-4 px-4 shadow-[0_6px_20px_rgba(10,31,68,0.08)]">
            <div className="w-10 h-10 rounded-full bg-[#C9A86C] flex items-center justify-center shrink-0">
              <Instagram className="w-5 h-5 text-[#0A1F44]" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[13px] font-semibold text-[#0A1F44]">@myleinehofmann.nails</div>
              <div className="text-[11px] text-[#0A1F44]/60">Portfólio atualizado diariamente</div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#0A1F44]/30" />
          </div>

          <div className="rounded-[20px] bg-white border border-[#F0E6D3] p-5 shadow-[0_6px_20px_rgba(10,31,68,0.08)]">
            <div className="text-[12px] font-bold tracking-widest text-[#0A1F44]">HORÁRIO DE ATENDIMENTO</div>
            <div className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#0A1F44]/60">Segunda - Sexta</span>
                <span className="font-semibold text-[#0A1F44]">09:00 - 19:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0A1F44]/60">Sábado</span>
                <span className="font-semibold text-[#0A1F44]">09:00 - 17:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#0A1F44]/60">Domingo</span>
                <span className="font-semibold text-[#C9A86C]">Fechado</span>
              </div>
            </div>
          </div>
        </div>
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    )
  }

  return null
}

// Componente Bottom Nav
function BottomNav({ currentTab, setCurrentTab }: { currentTab: string, setCurrentTab: (tab: string) => void }) {
  const tabs = [
    { id: 'inicio', label: 'Início', icon: House },
    { id: 'servicos', label: 'Serviços', icon: Scissors },
    { id: 'agendar', label: 'Agendar', icon: Calendar },
    { id: 'contato', label: 'Contato', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-[16px] border-t border-[#F0E6D3] px-2 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] z-30">
      <div className="flex justify-between">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 h-[52px] rounded-[16px] flex flex-col items-center justify-center gap-1 transition-all relative ${
                isActive ? 'text-[#0A1F44]' : 'text-[#0A1F44]/40 hover:text-[#0A1F44]/70'
              }`}
            >
              {isActive && <div className="absolute inset-0 rounded-[16px] bg-[#C9A86C]/10" />}
              <tab.icon className={`w-5 h-5 ${isActive ? 'text-[#0A1F44]' : 'text-[#0A1F44]/40'}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
