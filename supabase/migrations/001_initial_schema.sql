-- =============================================
-- Sheinfeld Tenant Portal — Initial Schema
-- =============================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Projects
create table public.projects (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  type          text not null check (type in ('pinuy_binuy', 'tama38')),
  address       text not null,
  signature_count  int not null default 0,
  signature_total  int not null default 1,
  handover_date    date,
  handover_note    text,
  created_at    timestamptz not null default now()
);

-- Apartments
create table public.apartments (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  address         text not null,
  floor           int not null,
  current_area    numeric(6,1) not null,
  new_area        numeric(6,1),
  new_floor       int,
  appreciation_percent numeric(5,1),
  appreciation_ils     numeric(12,0),
  created_at      timestamptz not null default now()
);

-- Profiles (extends auth.users)
create table public.profiles (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  full_name    text not null,
  email        text not null,
  phone        text,
  role         text not null default 'tenant' check (role in ('tenant', 'admin')),
  project_id   uuid references public.projects(id) on delete set null,
  apartment_id uuid references public.apartments(id) on delete set null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (user_id)
);

-- Documents
create table public.documents (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.profiles(id) on delete cascade,
  project_id   uuid references public.projects(id) on delete set null,
  category     text not null check (category in ('contracts','guarantees','deposits','power_of_attorney','approvals','blueprints')),
  name         text not null,
  storage_path text not null,
  file_size    bigint not null default 0,
  uploaded_at  timestamptz not null default now()
);

-- Project Team
create table public.project_team (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  full_name   text not null,
  role        text not null,
  company     text,
  photo_path  text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Timeline Steps
create table public.timeline_steps (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  date        date,
  status      text not null default 'upcoming' check (status in ('completed','active','upcoming')),
  admin_note  text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Amenities
create table public.amenities (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  type        text not null check (type in ('elevator','parking','storage','safe_room','garden','gym','pool','bike_room')),
  available   boolean not null default false,
  unique (project_id, type)
);

-- Apartment Specs
create table public.apartment_specs (
  id           uuid primary key default uuid_generate_v4(),
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  tab          text not null check (tab in ('finishes','kitchen','electrical','plumbing','exterior')),
  title        text not null,
  description  text not null default '',
  image_path   text,
  sort_order   int not null default 0
);

-- Gallery Images
create table public.gallery_images (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  caption     text,
  sort_order  int not null default 0
);

-- Chat Messages
create table public.chat_messages (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid references public.projects(id) on delete set null,
  tenant_id    uuid not null references public.profiles(id) on delete cascade,
  sender_role  text not null check (sender_role in ('tenant','admin')),
  content      text not null,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- =============================================
-- INDEXES
-- =============================================

create index on public.profiles (user_id);
create index on public.profiles (project_id);
create index on public.documents (tenant_id);
create index on public.documents (project_id);
create index on public.chat_messages (tenant_id);
create index on public.chat_messages (created_at desc);
create index on public.timeline_steps (project_id, sort_order);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.projects        enable row level security;
alter table public.apartments       enable row level security;
alter table public.profiles         enable row level security;
alter table public.documents        enable row level security;
alter table public.project_team     enable row level security;
alter table public.timeline_steps   enable row level security;
alter table public.amenities        enable row level security;
alter table public.apartment_specs  enable row level security;
alter table public.gallery_images   enable row level security;
alter table public.chat_messages    enable row level security;

-- Helper: get current user's profile
create or replace function public.current_profile()
returns public.profiles
language sql stable security definer
set search_path = public
as $$
  select * from public.profiles where user_id = auth.uid() limit 1;
$$;

-- Helper: is current user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- ---- projects ----
create policy "tenants_see_own_project" on public.projects
  for select using (
    id = (select project_id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "admins_full_projects" on public.projects
  for all using (public.is_admin());

-- ---- apartments ----
create policy "tenants_see_own_apartment" on public.apartments
  for select using (
    id = (select apartment_id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "admins_full_apartments" on public.apartments
  for all using (public.is_admin());

-- ---- profiles ----
create policy "users_see_own_profile" on public.profiles
  for select using (user_id = auth.uid());

create policy "admins_full_profiles" on public.profiles
  for all using (public.is_admin());

-- ---- documents ----
create policy "tenants_see_own_docs" on public.documents
  for select using (
    tenant_id = (select id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "admins_full_documents" on public.documents
  for all using (public.is_admin());

-- ---- project_team ----
create policy "tenants_see_team" on public.project_team
  for select using (
    project_id = (select project_id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "admins_full_team" on public.project_team
  for all using (public.is_admin());

-- ---- timeline_steps ----
create policy "tenants_see_timeline" on public.timeline_steps
  for select using (
    project_id = (select project_id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "admins_full_timeline" on public.timeline_steps
  for all using (public.is_admin());

-- ---- amenities ----
create policy "tenants_see_amenities" on public.amenities
  for select using (
    project_id = (select project_id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "admins_full_amenities" on public.amenities
  for all using (public.is_admin());

-- ---- apartment_specs ----
create policy "tenants_see_specs" on public.apartment_specs
  for select using (
    apartment_id = (select apartment_id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "admins_full_specs" on public.apartment_specs
  for all using (public.is_admin());

-- ---- gallery_images ----
create policy "tenants_see_gallery" on public.gallery_images
  for select using (
    project_id = (select project_id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "admins_full_gallery" on public.gallery_images
  for all using (public.is_admin());

-- ---- chat_messages ----
create policy "tenants_see_own_messages" on public.chat_messages
  for select using (
    tenant_id = (select id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "tenants_insert_own_messages" on public.chat_messages
  for insert with check (
    tenant_id = (select id from public.profiles where user_id = auth.uid() limit 1)
    and sender_role = 'tenant'
  );

create policy "tenants_update_own_messages" on public.chat_messages
  for update using (
    tenant_id = (select id from public.profiles where user_id = auth.uid() limit 1)
  );

create policy "admins_full_chat" on public.chat_messages
  for all using (public.is_admin());

-- =============================================
-- STORAGE BUCKET POLICIES
-- =============================================

-- Run these in Supabase dashboard > Storage > Policies
-- (SQL below for reference)

-- Create the 'documents' bucket (private):
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

-- Tenants can read their own files (files stored under their user_id prefix):
-- create policy "tenants_read_own_files" on storage.objects
--   for select using (
--     bucket_id = 'documents'
--     and (storage.foldername(name))[1] = (
--       select u.id::text from auth.users u
--       join public.profiles p on p.user_id = u.id
--       where u.id = auth.uid() limit 1
--     )
--   );

-- Admins can read/write all files:
-- create policy "admins_full_storage" on storage.objects
--   for all using (bucket_id = 'documents' and public.is_admin());

-- =============================================
-- REALTIME
-- =============================================

-- Enable realtime on chat_messages:
alter publication supabase_realtime add table public.chat_messages;
