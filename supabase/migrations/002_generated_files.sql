-- Generated Files table for storing lesson plan files
-- Separate from documents (uploaded) - different metadata needs

create table public.generated_files (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  generation_id uuid references public.generations(id) on delete set null,
  name text not null,
  file_path text not null,
  file_size int not null,
  mime_type text not null,
  file_type text not null check (file_type in ('CTE', 'Teacher', 'Student', 'Presentation')),
  week_number int not null,
  week_start_date date,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index generated_files_teacher_id_idx on public.generated_files(teacher_id);
create index generated_files_week_number_idx on public.generated_files(week_number);
create index generated_files_created_at_idx on public.generated_files(created_at desc);

-- Row Level Security
alter table public.generated_files enable row level security;

-- RLS policy (same pattern as documents)
create policy "Teachers can manage own generated files"
  on public.generated_files for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- Storage bucket for generated lesson plans (separate from uploaded documents)
insert into storage.buckets (id, name, public)
values ('generated-files', 'generated-files', false);

-- Storage RLS policies (same pattern as documents bucket in 001_initial_schema.sql)
create policy "Teachers can upload own generated files"
  on storage.objects for insert
  with check (bucket_id = 'generated-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Teachers can view own generated files"
  on storage.objects for select
  using (bucket_id = 'generated-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Teachers can delete own generated files"
  on storage.objects for delete
  using (bucket_id = 'generated-files' and auth.uid()::text = (storage.foldername(name))[1]);
