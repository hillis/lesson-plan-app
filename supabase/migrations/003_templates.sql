-- Templates table for storing user-uploaded lesson plan templates
-- Phase 6: Custom template support

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.teachers(id) on delete cascade,
  name text not null,
  file_path text not null,
  file_size int,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Index for teacher queries
create index templates_teacher_id_idx on public.templates(teacher_id);

-- Row Level Security
alter table public.templates enable row level security;

-- Teachers can view own templates and defaults (teacher_id is null for defaults)
create policy "Teachers can view own templates and defaults"
  on public.templates for select
  using (auth.uid() = teacher_id or teacher_id is null);

-- Teachers can manage own templates only
create policy "Teachers can insert own templates"
  on public.templates for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers can update own templates"
  on public.templates for update
  using (auth.uid() = teacher_id);

create policy "Teachers can delete own templates"
  on public.templates for delete
  using (auth.uid() = teacher_id);

-- Storage bucket for template files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'templates',
  'templates',
  false,
  10485760, -- 10MB limit
  ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage RLS policies
create policy "Teachers can upload own templates"
  on storage.objects for insert
  with check (bucket_id = 'templates' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Teachers can view own templates"
  on storage.objects for select
  using (bucket_id = 'templates' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Teachers can delete own templates"
  on storage.objects for delete
  using (bucket_id = 'templates' and auth.uid()::text = (storage.foldername(name))[1]);
