import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays, Check, ChevronRight, Clock3, Crown, Gem, HeartHandshake,
  Home, Instagram, Loader2, MapPin, MessageCircle, Scissors, ShieldCheck,
  Sparkles, Star, User,
} from 'lucide-react'
import { supabase } from './lib/supabase'

// ============================================================
// FALLBACKS — usados se o Supabase estiver fora do ar ou em modo demo.
// Os dados reais vêm das tabelas `studios` e `services` do Supabase.
// ============================================================
const STUDIO_FALLBACK = {
  name: 'Myleine Hofmann Manicure',
  phone: '5541996922171',
  address: 'Rua Eduardo Pinto da Rocha 4001',
  slot_interval_minutes: 30,
  working_hours: {
    0: null,
    1: { start: '09:00', end: '19:00' },
    2: { start: '09:00', end: '19:00' },
    3: { start: '09:00', end: '19:00' },
    4: { start: '09:00', end: '19:00' },
    5: { start: '09:00', end: '19:00' },
    6: { start: '09:00', end: '17:00' },
  },
}
const INSTAGRAM = 'myleinehofmann.nails'

const SERVICOS_FALLBACK = [
  { id: null, name: 'Alongamento em Gel na Tips', price: 89.9, duration_minutes: 120, category: 'alongamento', description: 'Muito mais resistente, dura semanas sem quebrar.' },
  { id: null, name: 'Manicure e Pedicure Tradicional', price: 60, duration_minutes: 90, category: 'tradicional', description: 'Cuidado completo, esmaltação perfeita' },
  { id: null, name: 'Alongamento F1', price: 110, duration_minutes: 120, category: 'alongamento', description: 'Mais autoestima e segurança para suas mãos' },
]

const GALERIA = [
  { id: 1, style: 'French Rosé', grad: 'linear-gradient(135deg, #fff1f2 0%, #fecdd3 100%)' },
  { id: 2, style: 'Gold Chrome', grad: 'linear-gradient(135deg, #fdf8f0 0%, #e8d5a3 50%, #c9a86c 100%)' },
  { id: 3, style: 'Baby Boomer', grad: 'linear-gradient(180deg, #ffffff 0%, #ffe4e6 60%, #fecdd3 100%)' },
  { id: 4, style: 'Nude Perfeito', grad: 'linear-gradient(135deg, #fdf2e9 0%, #e7c9a9 100%)' },
  { id: 5, style: 'Marble Lux', grad: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' },
  { id: 6, style: 'Red Carpet', grad: 'linear-gradient(135deg, #450a0a 0%, #dc2626 100%)' },
]

// ============================================================

const ACCENTS = {
  alongamento: { bg: 'from-[#0a1f44] to-[#1a3a6b]', icon: 'text-white' },
  tradicional: { bg: 'from-[#fdf8f0] to-[#f5e6cc]', icon: 'text-[#c9a86c]' },
  esmaltacao: { bg: 'from-[#c9a86c] to-[#e8d5a3]', icon: 'text-[#0a1f44]' },
  default: { bg: 'from-[#fdf8f0] to-[#f5e6cc]', icon: 'text-[#c9a86c]' },
}
const accentOf = (s) => ACCENTS[s.category] || ACCENTS.default

const brl = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const toISO = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export default function App() {
  const [tab, setTab] = useState('inicio')
  const [studio, setStudio] = useState(STUDIO_FALLBACK)
  const [servicos, setServicos] = useState(SERVICOS_FALLBACK)
  const [fotos, setFotos] = useState([])
  const [servico, setServico] = useState(SERVICOS_FALLBACK[0])
  const [diaIdx, setDiaIdx] = useState(0)
  const [horario, setHorario] = useState(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [ocupados, setOcupados] = useState([])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [hora, setHora] = useState('09:41')

  const dias = useMemo(() => {
    const hoje = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(hoje.getDate() + i)
      return {
        date: d,
        iso: toISO(d),
        day: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        num: d.getDate(),
        isToday: i === 0,
      }
    })
  }, [])

  const diaSel = dias[diaIdx]

  useEffect(() => {
    const agora = new Date()
    setHora(
      `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`,
    )
  }, [])

  // Carrega dados do studio e a lista de serviços do Supabase
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('studios')
      .select('name, phone, address, working_hours, slot_interval_minutes')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setStudio(data) })
    supabase
      .from('services')
      .select('id, name, price, duration_minutes, description, category')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setServicos(data)
          setServico(data[0])
        }
      })
    supabase
      .from('gallery')
      .select('id, image_url, service_type')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (data && data.length > 0) setFotos(data) })
  }, [])

  // Busca horários já reservados do dia escolhido
  useEffect(() => {
    let ativo = true
    setHorario(null)
    if (!supabase) { setOcupados([]); return }
    setCarregandoHorarios(true)
    supabase
      .from('horarios_ocupados')
      .select('start_time, end_time')
      .eq('date', diaSel.iso)
      .then(({ data, error }) => {
        if (!ativo) return
        setOcupados(
          error || !data
            ? []
            : data.map((r) => ({ ini: toMin(r.start_time.slice(0, 5)), fim: toMin(r.end_time.slice(0, 5)) })),
        )
        setCarregandoHorarios(false)
      })
    return () => { ativo = false }
  }, [diaSel.iso])

  // Expediente do dia escolhido (0=dom ... 6=sáb); null = fechado
  const expediente = (studio.working_hours || STUDIO_FALLBACK.working_hours)[String(diaSel.date.getDay())] || null
  const intervalo = studio.slot_interval_minutes || 30
  const duracao = servico.duration_minutes || 60

  // Gera os horários do dia: dentro do expediente, cabendo a duração do
  // serviço, sem horários passados e sem conflito com outros atendimentos
  const slots = useMemo(() => {
    if (!expediente) return []
    const abre = toMin(expediente.start)
    const fecha = toMin(expediente.end)
    const agora = new Date()
    const ehHoje = diaSel.iso === toISO(agora)
    const agoraMin = agora.getHours() * 60 + agora.getMinutes()
    const out = []
    for (let t = abre; t + duracao <= fecha; t += intervalo) {
      if (ehHoje && t <= agoraMin) continue // regra 1: passado some
      const conflito = ocupados.some((o) => t < o.fim && t + duracao > o.ini) // regra 4: bloqueio pela duração
      out.push({ h: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, ocupado: conflito })
    }
    return out
  }, [expediente, intervalo, duracao, ocupados, diaSel.iso])

  const livres = slots.filter((s) => !s.ocupado)
  const waNumber = (studio.phone || STUDIO_FALLBACK.phone).replace(/\D/g, '')

  const linkWhats = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Olá Myleine! Quero agendar ${servico.name} no dia ${diaSel.num} às ${horario || ''}. Pode confirmar? 💅✨`,
  )}`

  async function confirmarAgendamento() {
    setErro('')
    if (!nome.trim()) { setErro('Digite seu nome para confirmar.'); return }
    if (telefone.replace(/\D/g, '').length < 10) { setErro('Digite um WhatsApp válido com DDD.'); return }
    if (!horario) { setErro('Escolha um horário disponível.'); return }

    // Modo demo (sem Supabase configurado): apenas simula
    if (!supabase || !servico.id) { setConfirmado(true); return }

    setEnviando(true)
    const { error } = await supabase.rpc('criar_agendamento', {
      p_nome: nome.trim(),
      p_telefone: telefone.trim(),
      p_service_id: servico.id,
      p_data: diaSel.iso,
      p_horario: horario,
    })
    setEnviando(false)

    if (error) {
      const m = error.message || ''
      if (m.includes('horario_ocupado')) {
        setErro('Ops! Esse horário acabou de ser reservado. Escolha outro, por favor.')
        setOcupados((prev) => [...prev, { ini: toMin(horario), fim: toMin(horario) + duracao }])
        setHorario(null)
      } else if (m.includes('horario_passado') || m.includes('data_passada')) {
        setErro('Esse horário já passou. Escolha um horário futuro, por favor.')
        setHorario(null)
      } else if (m.includes('dia_fechado') || m.includes('fora_do_horario')) {
        setErro('O studio não atende nesse dia/horário. Escolha outro, por favor.')
        setHorario(null)
      } else {
        setErro('Não foi possível enviar. Tente novamente ou agende pelo WhatsApp.')
      }
      return
    }
    setConfirmado(true)
  }

  const NAV = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'servicos', label: 'Serviços', icon: Scissors },
    { id: 'agendar', label: 'Agendar', icon: CalendarDays },
    { id: 'contato', label: 'Contato', icon: User },
  ]

  return (
    <div className="min-h-screen w-full bg-[#fdf8f0] flex justify-center md:items-center md:py-8 selection:bg-[#c9a86c]/30 overflow-x-hidden">
      <div className="hidden md:block fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-[#c9a86c]/10 rounded-full blur-[80px] max-w-full" />
        <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] bg-[#0a1f44]/5 rounded-full blur-[100px] max-w-full" />
      </div>

      <div className="relative w-full max-w-[390px] md:max-w-[410px] h-[100dvh] md:h-[860px] bg-white md:rounded-[48px] md:shadow-[0_0_0_10px_#0a1f44,0_40px_100px_-20px_rgba(10,31,68,0.4)] overflow-hidden flex flex-col">
        {/* Barra de status */}
        <div className="h-[44px] shrink-0 flex items-center justify-between px-8 pt-1 text-[15px] font-semibold tracking-tight bg-white z-20">
          <span>{hora}</span>
          <div className="w-6 h-3 rounded-[3px] border border-black/80 relative">
            <div className="absolute inset-[2px] bg-black rounded-[1px] w-[70%]" />
          </div>
        </div>

        {/* Cabeçalho */}
        <div className="px-6 py-3 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full gold-gradient flex items-center justify-center shadow-[0_4px_12px_rgba(201,168,108,0.35)]">
              <span className="serif font-bold text-[16px] text-[#0a1f44]">MH</span>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                <Gem className="w-2.5 h-2.5 text-[#c9a86c]" />
              </div>
            </div>
            <div className="leading-tight">
              <div className="serif font-bold text-[16px] text-[#0a1f44]">Myleine Hofmann</div>
              <div className="text-[10px] tracking-[0.18em] text-[#c9a86c] font-semibold uppercase">Manicure</div>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#fdf8f0] gold-border flex items-center justify-center">
            <Crown className="w-4 h-4 text-[#c9a86c]" />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto scrollbar-none pb-[96px] bg-[#fdfcf9]">
          {tab === 'inicio' && (
            <>
              <div className="relative bg-[#0a1f44] rounded-[28px] mx-4 mt-2 overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#c9a86c] rounded-full blur-[60px]" />
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#1a3a6b] rounded-full blur-[50px]" />
                </div>
                <div className="absolute top-6 right-10 sparkle"><Sparkles className="w-4 h-4 text-[#c9a86c]" /></div>
                <div className="absolute top-20 left-8 sparkle" style={{ animationDelay: '0.8s' }}><Sparkles className="w-3 h-3 text-white/60" /></div>
                <div className="absolute bottom-20 right-16 sparkle" style={{ animationDelay: '1.5s' }}><Sparkles className="w-3 h-3 text-[#e8d5a3]" /></div>
                <div className="relative p-7 pb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] tracking-widest text-[#e8d5a3] mb-4">
                    <Star className="w-3 h-3 fill-[#c9a86c] text-[#c9a86c]" /> ATENDIMENTO PREMIUM
                  </div>
                  <h1 className="serif text-[32px] leading-[0.95] font-semibold text-white">
                    Suas unhas,<br /><span className="shimmer">sua melhor</span><br />versão!
                  </h1>
                  <p className="text-[13px] text-white/70 mt-3 leading-relaxed max-w-[220px]">
                    Acabamento impecável, durabilidade e cuidado que você merece.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setTab('agendar')}
                      className="h-12 px-6 rounded-full gold-gradient text-[#0a1f44] font-bold text-[12px] tracking-[0.12em] shadow-[0_8px_20px_rgba(201,168,108,0.4)] active:scale-[0.98] transition-transform flex items-center gap-2"
                    >
                      AGENDAR AGORA <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 px-3 rounded-full bg-white/10 border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#0a1f44]">4.9</div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#c9a86c] text-[#c9a86c]" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-[1px] w-full gold-gradient opacity-60" />
              </div>

              <div className="px-4 mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { icon: Crown, title: 'Acabamento', sub: 'Perfeito', color: '#c9a86c' },
                  { icon: ShieldCheck, title: 'Durabilidade', sub: '& Segurança', color: '#0a1f44' },
                  { icon: HeartHandshake, title: 'Cuidado', sub: '& Higiene', color: '#c9a86c' },
                ].map((c, i) => (
                  <div key={i} className="rounded-[18px] bg-white border border-[#f0e6d3] p-3.5 navy-shadow">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: `${c.color}10` }}>
                      <c.icon className="w-4 h-4" style={{ color: c.color }} />
                    </div>
                    <div className="text-[11px] font-bold leading-tight text-[#0a1f44]">{c.title}</div>
                    <div className="text-[11px] leading-tight text-[#0a1f44]/70">{c.sub}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                <div className="px-6 flex items-center justify-between mb-3">
                  <h2 className="serif text-[18px] font-semibold text-[#0a1f44]">Galeria Inspirations</h2>
                  <span className="text-[11px] tracking-widest text-[#c9a86c] font-semibold">VER TUDO</span>
                </div>
                <div className="px-4 grid grid-cols-3 gap-2.5">
                  {fotos.length > 0
                    ? fotos.map((f) => (
                        <div key={f.id}>
                          <div className="aspect-[3/4] rounded-[20px] overflow-hidden relative border border-white shadow-[0_6px_20px_rgba(10,31,68,0.08)] bg-[#fdf8f0]">
                            <img
                              src={f.image_url}
                              alt={f.service_type || 'Trabalho da Myleine'}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                              <HeartHandshake className="w-3 h-3 text-[#c9a86c]" />
                            </div>
                          </div>
                          {f.service_type && (
                            <div className="mt-1.5 px-1 text-[10px] font-bold tracking-wide text-[#0a1f44]">{f.service_type}</div>
                          )}
                        </div>
                      ))
                    : GALERIA.map((f) => (
                    <div key={f.id}>
                      <div className="aspect-[3/4] rounded-[20px] overflow-hidden relative border border-white shadow-[0_6px_20px_rgba(10,31,68,0.08)]">
                        <div className="absolute inset-0" style={{ background: f.grad }} />
                        <div className="absolute bottom-0 left-0 right-0 h-[38%] bg-white/90 backdrop-blur rounded-t-[18px] border-t border-white/50 flex items-end justify-center pb-2">
                          <div className="w-[70%] h-[4px] rounded-full bg-[#0a1f44]/10" />
                        </div>
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                          <HeartHandshake className="w-3 h-3 text-[#c9a86c]" />
                        </div>
                        <div className="absolute top-0 left-[20%] w-[40%] h-full bg-gradient-to-b from-white/40 to-transparent skew-x-12" />
                      </div>
                      <div className="mt-1.5 px-1 text-[10px] font-bold tracking-wide text-[#0a1f44]">{f.style}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 px-4 pb-4">
                <div className="flex items-center justify-between mb-3 px-2">
                  <h2 className="serif text-[18px] font-semibold text-[#0a1f44]">Serviços em destaque</h2>
                  <span className="text-[10px] tracking-[0.16em] font-bold text-[#c9a86c]">• PREMIUM</span>
                </div>
                <div className="space-y-3">
                  {servicos.slice(0, 3).map((s, i) => {
                    const a = accentOf(s)
                    return (
                      <button
                        key={s.id || i}
                        onClick={() => { setServico(s); setTab('agendar') }}
                        className="w-full text-left rounded-[20px] bg-white p-4 flex items-center gap-4 navy-shadow border border-[#f5e6cc]/60 active:scale-[0.99] transition-transform"
                      >
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${a.bg} flex items-center justify-center shrink-0`}>
                          <Scissors className={`w-5 h-5 ${a.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-[#0a1f44] leading-tight truncate">{s.name}</div>
                          <div className="text-[11px] text-[#0a1f44]/60 mt-0.5 line-clamp-1">{s.description}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[13px] font-bold text-[#0a1f44]">{brl(s.price)}</div>
                          <div className="text-[10px] text-[#c9a86c] font-semibold">a partir de</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'servicos' && (
            <div className="px-4 pt-2">
              <div className="mb-4">
                <h2 className="serif text-[26px] font-semibold text-[#0a1f44] leading-none">Nossos Serviços</h2>
                <p className="text-[12px] text-[#0a1f44]/60 mt-2">Escolha o cuidado perfeito para suas mãos</p>
              </div>
              <div className="space-y-4 pb-6">
                {servicos.map((s, i) => {
                  const a = accentOf(s)
                  const maisPedido = s.name.includes('Gel na Tips')
                  return (
                    <div key={s.id || i} className="rounded-[24px] bg-white overflow-hidden navy-shadow border border-[#f0e6d3]">
                      {maisPedido && (
                        <div className="h-7 gold-gradient flex items-center justify-center text-[10px] tracking-[0.18em] font-bold text-[#0a1f44]">
                          ✨ MAIS PEDIDO ✨
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex gap-4">
                          <div className={`w-[64px] h-[64px] rounded-[18px] bg-gradient-to-br ${a.bg} flex items-center justify-center shrink-0 relative`}>
                            <Scissors className={`w-6 h-6 ${a.icon}`} />
                            {maisPedido && <Sparkles className="w-3 h-3 text-[#e8d5a3] absolute top-2 right-2" />}
                          </div>
                          <div className="flex-1">
                            <div className="serif text-[16px] font-semibold text-[#0a1f44] leading-tight">{s.name}</div>
                            <div className="text-[12px] text-[#0a1f44]/60 mt-1.5 leading-snug">{s.description}</div>
                            <div className="mt-3 flex items-center gap-2">
                              <Clock3 className="w-3.5 h-3.5 text-[#c9a86c]" />
                              <span className="text-[11px] text-[#0a1f44]/70">{s.duration_minutes} min</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] tracking-widest text-[#c9a86c] font-semibold">VALOR</div>
                            <div className="text-[20px] font-bold text-[#0a1f44] serif">{brl(s.price)}</div>
                          </div>
                          <button
                            onClick={() => { setServico(s); setTab('agendar') }}
                            className="h-11 px-6 rounded-full bg-[#0a1f44] text-white text-[11px] font-bold tracking-[0.14em] flex items-center gap-2 active:scale-95 transition-transform"
                          >
                            AGENDAR <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'agendar' && (
            <div className="px-4 pt-2">
              {!confirmado ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="serif text-[26px] font-semibold text-[#0a1f44] leading-none">Agendar</h2>
                    <div className="px-3 py-1.5 rounded-full bg-[#fdf8f0] border border-[#f0e6d3] text-[11px] font-medium text-[#0a1f44] flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online agora
                    </div>
                  </div>

                  <div className="rounded-[15px] bg-[#0a1f44] px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
                        <Scissors className="w-4 h-4 text-[#0a1f44]" />
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-white leading-tight">{servico.name}</div>
                        <div className="text-[11px] text-white/60">{brl(servico.price)} • {servico.duration_minutes} min</div>
                      </div>
                    </div>
                    <button onClick={() => setTab('servicos')} className="text-[11px] text-[#c9a86c] font-semibold">ALTERAR</button>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-[13px] font-bold tracking-wide text-[#0a1f44] mb-3">Escolha o dia</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {dias.map((d, i) => {
                        const fechado = !(studio.working_hours || STUDIO_FALLBACK.working_hours)[String(d.date.getDay())]
                        return (
                          <button
                            key={i}
                            onClick={() => setDiaIdx(i)}
                            className={`aspect-[0.9] rounded-[16px] flex flex-col items-center justify-center gap-1 border transition-all ${
                              diaIdx === i
                                ? 'bg-[#0a1f44] border-[#0a1f44] text-white shadow-[0_8px_20px_rgba(10,31,68,0.25)]'
                                : fechado
                                  ? 'bg-[#f5f5f5] border-[#eee] text-[#0a1f44]/30'
                                  : 'bg-white border-[#f0e6d3] text-[#0a1f44] hover:border-[#c9a86c]/40'
                            }`}
                          >
                            <span className={`text-[10px] uppercase tracking-wide ${diaIdx === i ? 'text-white/60' : fechado ? 'text-[#0a1f44]/30' : 'text-[#0a1f44]/50'}`}>{d.day}</span>
                            <span className="text-[16px] font-bold">{d.num}</span>
                            {d.isToday && diaIdx !== i && <span className="w-1 h-1 rounded-full bg-[#c9a86c]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-[13px] font-bold tracking-wide text-[#0a1f44] mb-3">Horários disponíveis</h3>
                    {carregandoHorarios ? (
                      <div className="h-12 flex items-center gap-2 text-[12px] text-[#0a1f44]/60">
                        <Loader2 className="w-4 h-4 animate-spin text-[#c9a86c]" /> Verificando agenda...
                      </div>
                    ) : !expediente ? (
                      <div className="rounded-[14px] bg-[#fdf8f0] border border-[#f0e6d3] px-4 py-4 text-[12px] text-[#0a1f44]/70 text-center">
                        O studio não atende neste dia 💤 Escolha outra data.
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="rounded-[14px] bg-[#fdf8f0] border border-[#f0e6d3] px-4 py-4 text-[12px] text-[#0a1f44]/70 text-center">
                        Sem horários restantes neste dia — escolha outra data.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2.5">
                        {slots.map(({ h, ocupado }) => (
                          <button
                            key={h}
                            disabled={ocupado}
                            onClick={() => setHorario(h)}
                            className={`h-12 rounded-[14px] border text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                              ocupado
                                ? 'bg-[#f5f5f5] border-[#eee] text-[#0a1f44]/25 line-through cursor-not-allowed'
                                : horario === h
                                  ? 'bg-[#0a1f44] border-[#0a1f44] text-white shadow'
                                  : 'bg-white border-[#f0e6d3] text-[#0a1f44] hover:border-[#c9a86c]'
                            }`}
                          >
                            {horario === h && <Check className="w-3.5 h-3.5" />}
                            {h}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-[#0a1f44]/50">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      {livres.length > 0
                        ? `${livres.length} ${livres.length === 1 ? 'horário livre' : 'horários livres'} para ${duracao} min • Atendimento pontual`
                        : 'Nenhum horário livre neste dia'}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-[13px] font-bold tracking-wide text-[#0a1f44] mb-3">Seus dados</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full h-12 rounded-[14px] border border-[#f0e6d3] bg-white px-4 text-[13px] text-[#0a1f44] placeholder:text-[#0a1f44]/40 focus:outline-none focus:border-[#c9a86c]"
                      />
                      <input
                        type="tel"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="Seu WhatsApp com DDD (ex: 41 99999-9999)"
                        className="w-full h-12 rounded-[14px] border border-[#f0e6d3] bg-white px-4 text-[13px] text-[#0a1f44] placeholder:text-[#0a1f44]/40 focus:outline-none focus:border-[#c9a86c]"
                      />
                    </div>
                  </div>

                  <div className="mt-6 rounded-[20px] bg-white border border-[#f0e6d3] p-4 navy-shadow">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#0a1f44]/60">Serviço</span>
                      <span className="font-semibold text-[#0a1f44]">{servico.name}</span>
                    </div>
                    <div className="flex justify-between text-[12px] mt-2">
                      <span className="text-[#0a1f44]/60">Data & hora</span>
                      <span className="font-semibold text-[#0a1f44]">
                        {diaSel.day}, {diaSel.num} {horario ? `às ${horario}` : ''}
                      </span>
                    </div>
                    <div className="h-[1px] bg-[#f5e6cc] my-3" />
                    <div className="flex justify-between">
                      <span className="text-[13px] font-bold text-[#0a1f44]">Total</span>
                      <span className="serif text-[18px] font-bold text-[#0a1f44]">{brl(servico.price)}</span>
                    </div>
                  </div>

                  {erro && (
                    <div className="mt-4 rounded-[14px] bg-[#fef2f2] border border-[#fecaca] px-4 py-3 text-[12px] text-[#991b1b]">
                      {erro}
                    </div>
                  )}

                  <div className="mt-5 space-y-3 pb-2">
                    <button
                      onClick={confirmarAgendamento}
                      disabled={enviando}
                      className="w-full h-14 rounded-full gold-gradient text-[#0a1f44] font-bold tracking-[0.14em] text-[13px] shadow-[0_10px_24px_rgba(201,168,108,0.4)] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
                      {enviando ? 'ENVIANDO...' : 'CONFIRMAR AGENDAMENTO'}
                    </button>
                    <a
                      href={linkWhats}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-12 rounded-full bg-[#25D366] text-white font-bold tracking-wide text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <MessageCircle className="w-5 h-5" /> AGENDAR PELO WHATSAPP
                    </a>
                    <p className="text-[10px] text-center text-[#0a1f44]/50 leading-snug px-6">
                      Após confirmar, a Myleine entra em contato pelo seu WhatsApp. Cancelamento grátis até 2h antes.
                    </p>
                  </div>
                </>
              ) : (
                <div className="pt-10 pb-6 text-center">
                  <div className="mx-auto w-20 h-20 rounded-full gold-gradient flex items-center justify-center shadow-[0_12px_30px_rgba(201,168,108,0.35)]">
                    <Check className="w-9 h-9 text-[#0a1f44]" />
                  </div>
                  <h2 className="serif text-[28px] font-semibold text-[#0a1f44] mt-6 leading-tight">
                    Agendamento<br />enviado!
                  </h2>
                  <p className="text-[13px] text-[#0a1f44]/60 mt-3 px-8 leading-relaxed">
                    Recebemos seu pedido para <span className="font-semibold text-[#0a1f44]">{servico.name}</span> no
                    dia {diaSel.num} às {horario}. A Myleine vai confirmar no seu WhatsApp em instantes.
                  </p>
                  <div className="mt-6 mx-4 rounded-[18px] bg-white border border-[#f0e6d3] p-4 text-left">
                    <div className="text-[11px] tracking-widest text-[#c9a86c] font-bold mb-2">RESUMO</div>
                    <div className="text-[13px] text-[#0a1f44] font-semibold">{servico.name} • {brl(servico.price)}</div>
                    <div className="text-[12px] text-[#0a1f44]/60 mt-1">
                      {diaSel.day}, {diaSel.num} • {horario} • {nome}
                    </div>
                  </div>
                  <div className="mt-6 px-4 space-y-3">
                    <a
                      href={linkWhats}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-12 rounded-full bg-[#0a1f44] text-white text-[12px] font-bold tracking-widest flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> FALAR COM MYLEINE
                    </a>
                    <button
                      onClick={() => { setConfirmado(false); setHorario(null); setTab('inicio') }}
                      className="w-full h-11 rounded-full bg-white border border-[#f0e6d3] text-[12px] font-semibold text-[#0a1f44]"
                    >
                      VOLTAR AO INÍCIO
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'contato' && (
            <div className="px-4 pt-2 pb-6">
              <div className="rounded-[28px] bg-[#0a1f44] p-6 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#c9a86c]/20 rounded-full blur-[30px]" />
                <div className="relative flex gap-4">
                  <div className="w-16 h-16 rounded-full p-[2px] gold-gradient shrink-0">
                    <div className="w-full h-full rounded-full bg-[#0a1f44] flex items-center justify-center">
                      <span className="serif text-[22px] font-bold text-[#e8d5a3]">MH</span>
                    </div>
                  </div>
                  <div>
                    <div className="serif text-[20px] font-semibold text-white leading-none">Myleine Hofmann</div>
                    <div className="text-[11px] tracking-[0.2em] text-[#c9a86c] font-semibold mt-1.5">MANICURE • NAIL ARTIST</div>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
                      <MapPin className="w-3 h-3 text-[#c9a86c] shrink-0" /> {studio.address || STUDIO_FALLBACK.address}
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    ['+850', 'Clientes'],
                    ['4.9', 'Avaliação'],
                    ['5 anos', 'Experiência'],
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-[14px] bg-white/10 border border-white/10 p-3 text-center">
                      <div className="text-[18px] font-bold text-white serif">{v}</div>
                      <div className="text-[10px] text-white/60 uppercase tracking-wide">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-[20px] bg-white border border-[#f0e6d3] overflow-hidden navy-shadow">
                  <iframe
                    title="Localização do studio"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(studio.address || STUDIO_FALLBACK.address)}&z=16&output=embed`}
                    className="w-full h-[160px] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.address || STUDIO_FALLBACK.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-12 flex items-center justify-center gap-2 text-[12px] font-bold tracking-wide text-[#0a1f44] active:bg-[#fdf8f0]"
                  >
                    <MapPin className="w-4 h-4 text-[#c9a86c]" /> ABRIR NO GOOGLE MAPS
                  </a>
                </div>

                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-14 rounded-[16px] bg-white border border-[#f0e6d3] flex items-center gap-4 px-4 navy-shadow active:scale-[0.99] transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[13px] font-semibold text-[#0a1f44]">WhatsApp</div>
                    <div className="text-[11px] text-[#0a1f44]/60">Resposta rápida</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0a1f44]/30" />
                </a>

                <a
                  href={`https://instagram.com/${INSTAGRAM}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-14 rounded-[16px] bg-white border border-[#f0e6d3] flex items-center gap-4 px-4 navy-shadow active:scale-[0.99] transition-transform"
                >
                  <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shrink-0">
                    <Instagram className="w-5 h-5 text-[#0a1f44]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[13px] font-semibold text-[#0a1f44]">@{INSTAGRAM}</div>
                    <div className="text-[11px] text-[#0a1f44]/60">Portfólio atualizado diariamente</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0a1f44]/30" />
                </a>

                <div className="rounded-[20px] bg-white border border-[#f0e6d3] p-5 navy-shadow">
                  <div className="text-[12px] font-bold tracking-widest text-[#0a1f44]">HORÁRIO DE ATENDIMENTO</div>
                  <div className="mt-3 space-y-2 text-[13px]">
                    {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((nomeDia, i) => {
                      const cfg = (studio.working_hours || STUDIO_FALLBACK.working_hours)[String(i)]
                      return (
                        <div key={i} className="flex justify-between">
                          <span className="text-[#0a1f44]/60">{nomeDia}</span>
                          {cfg ? (
                            <span className="font-semibold text-[#0a1f44]">{cfg.start} - {cfg.end}</span>
                          ) : (
                            <span className="font-semibold text-[#c9a86c]">Fechado</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-[20px] bg-[#fdf8f0] border border-[#f0e6d3] p-4 flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#f0e6d3] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#0a1f44]" />
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#0a1f44]/70">
                    Materiais esterilizados, descartáveis individuais e protocolo de higiene premium.
                    Sua segurança em primeiro lugar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navegação inferior */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-[16px] border-t border-[#f0e6d3] px-2 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] z-30">
          <div className="flex justify-between">
            {NAV.map((n) => {
              const ativo = tab === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => { setTab(n.id); setConfirmado(false) }}
                  className={`flex-1 h-[52px] rounded-[16px] flex flex-col items-center justify-center gap-1 transition-all relative ${
                    ativo ? 'text-[#0a1f44]' : 'text-[#0a1f44]/40 hover:text-[#0a1f44]/70'
                  }`}
                >
                  {ativo && <div className="absolute inset-0 rounded-[16px] gold-gradient opacity-15" />}
                  <n.icon className="w-5 h-5" strokeWidth={ativo ? 2.5 : 2} />
                  <span className={`text-[10px] tracking-wide ${ativo ? 'font-bold' : 'font-medium'}`}>{n.label}</span>
                </button>
              )
            })}
          </div>
          <div className="mx-auto mt-2 w-32 h-1 rounded-full bg-black/10" />
        </div>

        {tab === 'inicio' && (
          <div className="absolute bottom-[84px] left-4 right-4 z-20 pointer-events-none">
            <div className="pointer-events-auto rounded-full p-[1.5px] gold-gradient shadow-[0_12px_32px_rgba(201,168,108,0.4)]">
              <button
                onClick={() => setTab('agendar')}
                className="w-full h-12 rounded-full bg-[#0a1f44] text-white font-bold text-[12px] tracking-[0.16em] flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
              >
                <Sparkles className="w-4 h-4 text-[#c9a86c]" /> AGENDAR AGORA • VAGAS LIMITADAS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
