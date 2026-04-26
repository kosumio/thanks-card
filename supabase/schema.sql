-- supabase/schema.sql
-- サンクスカード Supabase スキーマ定義

-- 社員マスタ
create table employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text unique not null,
  name text not null,
  name_kana text not null,
  location text not null,
  birthdate date not null,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_employees_active on employees(is_active);
create index idx_employees_location on employees(location);

-- カード本体
create table thanks_cards (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references employees(id),
  to_id uuid not null references employees(id),
  message text not null check (length(message) between 1 and 200),
  is_picked boolean not null default false,
  created_at timestamptz not null default now(),
  check (from_id <> to_id)
);
create index idx_cards_from on thanks_cards(from_id);
create index idx_cards_to on thanks_cards(to_id);
create index idx_cards_created_at on thanks_cards(created_at desc);
create index idx_cards_picked on thanks_cards(is_picked) where is_picked = true;

-- リアクション
create table card_reactions (
  card_id uuid not null references thanks_cards(id) on delete cascade,
  user_id uuid not null references employees(id),
  created_at timestamptz not null default now(),
  primary key (card_id, user_id)
);
create index idx_reactions_user on card_reactions(user_id);

-- 既読管理
create table card_reads (
  card_id uuid not null references thanks_cards(id) on delete cascade,
  user_id uuid not null references employees(id),
  read_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

-- birthdate を隠す公開ビュー
create view employees_public as
  select id, employee_number, name, name_kana, location, is_admin, is_active, created_at
  from employees;

-- RLS ヘルパー関数
create or replace function current_employee_id() returns uuid
language sql stable as $$
  select (auth.jwt()->'app_metadata'->>'employee_id')::uuid
$$;

create or replace function is_current_admin() returns boolean
language sql stable as $$
  select coalesce(
    (auth.jwt()->'app_metadata'->>'is_admin')::boolean,
    false
  )
$$;
