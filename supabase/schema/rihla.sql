create table if not exists public.rihla_rooms (
 code text primary key,
 data text not null,
 version bigint not null default 0,
 created_at timestamptz not null default now()
);
alter table public.rihla_rooms enable row level security;
revoke all on public.rihla_rooms from public, anon, authenticated;
grant select,insert,update,delete on public.rihla_rooms to service_role;
