-- MH Studio - Supabase Schema
-- Rode no SQL Editor do Supabase

-- Enable UUID
create extension if not exists "uuid-ossp";

-- Studios
create table if not exists studios (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Myleine Hofmann Manicure',
  slug text unique not null default 'myleine-hofmann',
  owner_id uuid references auth.users(id),
  phone text default '5541996922171',
  address text default 'Rua Eduardo Pinto da Rocha 4001',
  logo_url text,
  theme jsonb default '{"primary":"#0A1F44","gold":"#C9A86C","bg":"#FDF8F0"}'::jsonb,
  created_at timestamp default now()
);

-- Services
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) on delete cascade,
  name text not null,
  price decimal(10,2) not null,
  duration_minutes int not null default 60,
  description text,
  category text,
  active boolean default true,
  created_at timestamp default now()
);

-- Clients
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  total_visits int default 0,
  total_spent decimal(10,2) default 0,
  last_visit date,
  notes text,
  created_at timestamp default now()
);

-- Appointments
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text default 'pendente' check (status in ('pendente','confirmado','pago','cancelado','no-show')),
  price_at_time decimal(10,2),
  payment_method text,
  created_at timestamp default now()
);

-- Gallery
create table if not exists gallery (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) on delete cascade,
  image_url text not null,
  service_type text,
  created_at timestamp default now()
);

-- Insert Studio
insert into studios (name, slug) values ('Myleine Hofmann Manicure','myleine-hofmann') on conflict (slug) do nothing;

-- Insert Services (from flyers)
insert into services (studio_id, name, price, duration_minutes, category, description) 
select s.id, svc.name, svc.price, svc.duration, svc.cat, svc.descricao from studios s,
(values
('Alongamento em Gel na Tips', 89.90, 120, 'alongamento', 'Muito mais resistente, dura semanas sem quebrar. Comprimento e formato personalizado.'),
('Manicure e Pedicure Tradicional', 60.00, 90, 'tradicional', 'Cuidado completo, esmaltação perfeita'),
('Esmaltação em Gel Mão', 75.00, 60, 'esmaltacao', 'Brilho por muito mais tempo, acabamento natural'),
('Esmaltação em Gel Pé', 70.00, 60, 'esmaltacao', 'Durabilidade e segurança'),
('SPA dos Pés', 65.00, 60, 'spa', 'Antes e depois, hidratação e cuidado'),
('Blindagem das Unhas', 55.00, 60, 'blindagem', 'Protege naturais contra quebras, ideal para unhas fracas'),
('Banho de Gel', 60.00, 60, 'banho', 'Acabamento leve e uniforme, prolonga esmaltação'),
('Alongamento F1', 110.00, 120, 'alongamento', 'Mais autoestima e segurança para suas mãos')
) as svc(name,price,duration,cat,descricao)
where s.slug='myleine-hofmann';

-- RLS
alter table studios enable row level security;
alter table services enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table gallery enable row level security;

create policy "public read" on studios for select using (true);
create policy "public read services" on services for select using (true);
create policy "public insert clients" on clients for insert with check (true);
create policy "public insert appointments" on appointments for insert with check (true);
create policy "public read gallery" on gallery for select using (true);

-- Owner can do everything (simplified - after auth, restrict by owner_id)
create policy "owner all" on services for all using (true) with check (true);
create policy "owner all clients" on clients for all using (true) with check (true);
create policy "owner all appointments" on appointments for all using (true) with check (true);
