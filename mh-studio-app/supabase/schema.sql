-- ============================================================
-- MH STUDIO • Schema do Supabase
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em RUN
-- ============================================================

-- Tabela principal de agendamentos
create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome_cliente text not null,
  telefone text not null,
  servico text not null,
  preco text not null,
  data date not null,
  horario text not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmado', 'cancelado', 'concluido')),
  observacoes text,
  -- impede duas clientes no mesmo dia/horário
  constraint agendamento_unico unique (data, horario)
);

-- Índice para consultas por data (painel e disponibilidade)
create index if not exists idx_agendamentos_data on public.agendamentos (data);

-- ============================================================
-- Segurança (RLS)
-- ============================================================
alter table public.agendamentos enable row level security;

-- Visitantes do site (anon) podem APENAS criar agendamentos.
-- Não conseguem ler, alterar nem apagar nada — os dados das
-- clientes (nome/telefone) ficam protegidos.
create policy "site pode criar agendamento"
  on public.agendamentos
  for insert
  to anon
  with check (true);

-- O painel (usuário logado no Supabase Auth) pode ver e gerenciar tudo
create policy "painel gerencia agendamentos"
  on public.agendamentos
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- View pública de horários ocupados
-- Expõe SOMENTE data e horário (sem nome/telefone), para o site
-- saber quais horários bloquear no calendário.
-- ============================================================
create or replace view public.horarios_ocupados as
  select data, horario
  from public.agendamentos
  where status <> 'cancelado';

grant select on public.horarios_ocupados to anon, authenticated;
