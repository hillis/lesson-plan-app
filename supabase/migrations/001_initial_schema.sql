-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Teachers table (extends Supabase auth.users)
create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  school text,
  google_drive_token jsonb,
  google_drive_folder_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents uploaded by teachers
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  name text not null,
  type text not null check (type in ('syllabus', 'standards', 'pacing_guide', 'other')),
  file_path text not null,
  file_size int,
  mime_type text,
  parsed_content jsonb,
  created_at timestamptz default now()
);

-- Generated lesson plans
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  week_number int,
  unit_name text,
  config jsonb not null,
  output_files jsonb,
  drive_folder_url text,
  status text default 'pending' check (status in ('pending', 'generating', 'completed', 'failed')),
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Indexes
create index documents_teacher_id_idx on public.documents(teacher_id);
create index documents_type_idx on public.documents(type);
create index generations_teacher_id_idx on public.generations(teacher_id);
create index generations_status_idx on public.generations(status);

-- Row Level Security
alter table public.teachers enable row level security;
alter table public.documents enable row level security;
alter table public.generations enable row level security;

-- RLS Policies
create policy "Teachers can view and update own profile"
  on public.teachers for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Teachers can manage own documents"
  on public.documents for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Teachers can manage own generations"
  on public.generations for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- Storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

-- Storage RLS
create policy "Teachers can upload own documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Teachers can view own documents"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Teachers can delete own documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Function to auto-create teacher profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.teachers (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
