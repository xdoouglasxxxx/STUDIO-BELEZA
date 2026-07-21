-- SQL do Supabase (Copie e cole no SQL Editor do Supabase)
create extension if not exists "uuid-ossp";

create table if not exists studios (
  id uuid primary key default uuid_generate_v4(),
  name text not null default "Myleine Hofmann Manicure",
  slug text unique not null default "myleine-hofmann",
  owner_id uuid references auth.users(id),
  phone text default "5541996922171",
  address text default "Rua Eduardo Pinto da Rocha 4001",
  logo_url text,
  theme jsonb default "{\"primary\":\"#0A1F44\",\"gold\":\"#C9A86C\",\"bg\":\"#FDF8F0\"}"::jsonb,
  created_at timestamp with time zone default now()
);
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) on delete cascade,
  name text not null,
  price decimal(10,2) not null,
  duration_minutes int not null default 60,
  description text,
  category text,
  active boolean default true,
  created_at timestamp with time zone default now()
);
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
  created_at timestamp with time zone default now()
);
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text default "pendente" check (status in ("pendente","confirmado","pago","cancelado","no-show")),
  price_at_time decimal(10,2),
  payment_method text,
  created_at timestamp with time zone default now()
);
create table if not exists gallery (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) on delete cascade,
  image_url text not null,
  service_type text,
  description text,
  is_featured boolean default false,
  created_at timestamp with time zone default now()
);

insert into studios (name, slug, phone, address) 
values ("Myleine Hofmann Manicure", "myleine-hofmann", "5541996922171", "Rua Eduardo Pinto da Rocha 4001") 
on conflict (slug) do nothing;

alter table studios enable row level security;
alter table services enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table gallery enable row level security;

create policy "public read studios" on studios for select using (true);
create policy "public read services" on services for select using (true);
create policy "owner all studios" on studios for all using (auth.uid() = owner_id);
create policy "owner all services" on services for all using (auth.uid() = (select owner_id from studios where id = services.studio_id));
create policy "owner all clients" on clients for all using (auth.uid() = (select owner_id from studios where id = clients.studio_id));
create policy "owner all appointments" on appointments for all using (auth.uid() = (select owner_id from studios where id = appointments.studio_id));
create policy "owner all gallery" on gallery for all using (auth.uid() = (select owner_id from studios where id = gallery.studio_id));
