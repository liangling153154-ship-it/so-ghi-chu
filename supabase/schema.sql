-- Kho ghi chú cá nhân hóa — chạy toàn bộ file này trong Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → dán vào → Run)

-- ============ BẢNG DỮ LIỆU ============

-- Mỗi "không gian" ứng với 1 link/token
create table if not exists spaces (
  id         uuid primary key default gen_random_uuid(),
  token      text unique not null,
  name       text not null,
  created_at timestamptz not null default now()
);

-- Mỗi ghi chú thuộc về 1 không gian
create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references spaces(id) on delete cascade,
  title      text not null,
  content    text,
  image_path text,
  category   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_space_idx on notes (space_id, updated_at desc);

-- ============ QUYỀN TRUY CẬP ============
-- Theo spec: không cần bảo mật, link chính là chìa khóa.
-- Bật RLS nhưng cho phép anon toàn quyền (tránh cảnh báo của Supabase dashboard).

alter table spaces enable row level security;
alter table notes  enable row level security;

create policy "anon full access" on spaces
  for all to anon using (true) with check (true);

create policy "anon full access" on notes
  for all to anon using (true) with check (true);

-- ============ STORAGE (ảnh đính kèm) ============

insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', true)
on conflict (id) do nothing;

create policy "anon upload note-images" on storage.objects
  for insert to anon with check (bucket_id = 'note-images');

create policy "anon update note-images" on storage.objects
  for update to anon using (bucket_id = 'note-images');

create policy "anon delete note-images" on storage.objects
  for delete to anon using (bucket_id = 'note-images');

create policy "public read note-images" on storage.objects
  for select to anon using (bucket_id = 'note-images');
