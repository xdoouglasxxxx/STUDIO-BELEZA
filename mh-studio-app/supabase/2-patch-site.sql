-- ============================================================
-- MH STUDIO • PATCH DO SITE (rodar DEPOIS do schema.sql do painel)
-- Cole no SQL Editor do Supabase e clique em RUN
--
-- O que este patch faz:
--  1. CORRIGE FALHA DE SEGURANÇA: o schema original permitia que
--     qualquer visitante lesse/alterasse dados de todas as clientes.
--  2. Cria a view "horarios_ocupados" (só data/horário, sem dados
--     pessoais) para o site bloquear horários já reservados.
--  3. Cria a função "criar_agendamento" que o site usa para agendar
--     com segurança (impede agendamento duplo no mesmo horário).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Correção de segurança (RLS)
-- ------------------------------------------------------------
-- Remove as políticas abertas demais
drop policy if exists "owner all" on services;
drop policy if exists "owner all clients" on clients;
drop policy if exists "owner all appointments" on appointments;
drop policy if exists "public insert clients" on clients;
drop policy if exists "public insert appointments" on appointments;

-- Painel (usuário logado via Supabase Auth) gerencia tudo
create policy "painel gerencia services"
  on services for all to authenticated using (true) with check (true);
create policy "painel gerencia clients"
  on clients for all to authenticated using (true) with check (true);
create policy "painel gerencia appointments"
  on appointments for all to authenticated using (true) with check (true);

-- Visitantes continuam podendo LER serviços, studio e galeria
-- (políticas "public read" do schema original já cuidam disso).
-- Visitantes NÃO leem clients/appointments — dados pessoais protegidos.

-- ------------------------------------------------------------
-- 2. Impede duas clientes no mesmo dia/horário
-- ------------------------------------------------------------
create unique index if not exists idx_agendamento_unico
  on appointments (date, start_time)
  where status <> 'cancelado';

-- ------------------------------------------------------------
-- 3. View pública de horários ocupados (sem dados pessoais)
-- ------------------------------------------------------------
create or replace view public.horarios_ocupados as
  select date, start_time, end_time
  from appointments
  where status <> 'cancelado';

grant select on public.horarios_ocupados to anon, authenticated;

-- ------------------------------------------------------------
-- 4. Função segura de agendamento (usada pelo site)
-- ------------------------------------------------------------
create or replace function public.criar_agendamento(
  p_nome text,
  p_telefone text,
  p_service_id uuid,
  p_data date,
  p_horario time
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio uuid;
  v_client uuid;
  v_dur int;
  v_price decimal;
  v_id uuid;
begin
  -- valida entradas básicas
  if coalesce(trim(p_nome), '') = '' or coalesce(trim(p_telefone), '') = '' then
    raise exception 'dados_invalidos';
  end if;
  if p_data < current_date then
    raise exception 'data_passada';
  end if;

  select id into v_studio from studios limit 1;

  select duration_minutes, price into v_dur, v_price
  from services where id = p_service_id and active = true;
  if v_dur is null then
    raise exception 'servico_invalido';
  end if;

  -- horário já ocupado?
  if exists (
    select 1 from appointments
    where date = p_data
      and status <> 'cancelado'
      and p_horario >= start_time
      and p_horario < end_time
  ) then
    raise exception 'horario_ocupado';
  end if;

  -- reutiliza a cliente pelo telefone, ou cadastra
  select id into v_client from clients
  where phone = trim(p_telefone) limit 1;
  if v_client is null then
    insert into clients (studio_id, name, phone)
    values (v_studio, trim(p_nome), trim(p_telefone))
    returning id into v_client;
  end if;

  insert into appointments
    (studio_id, client_id, service_id, date, start_time, end_time, status, price_at_time)
  values
    (v_studio, v_client, p_service_id, p_data, p_horario,
     p_horario + make_interval(mins => v_dur), 'pendente', v_price)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.criar_agendamento(text, text, uuid, date, time) from public;
grant execute on function public.criar_agendamento(text, text, uuid, date, time) to anon, authenticated;
