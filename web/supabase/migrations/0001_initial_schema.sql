create extension if not exists vector with schema extensions;

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 600),
  relationship text not null default '' check (char_length(relationship) <= 100),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index personas_user_created_idx on public.personas(user_id, created_at desc);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed')),
  error_message text,
  chunk_count integer not null default 0,
  uploaded_at timestamptz not null default now()
);

create index documents_persona_idx on public.documents(persona_id, uploaded_at desc);

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(1536) not null,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index chunks_owner_persona_idx on public.chunks(user_id, persona_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index conversations_persona_idx on public.conversations(persona_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages(conversation_id, created_at);

create or replace function public.match_persona_chunks(
  query_embedding extensions.vector(1536),
  match_persona_id uuid,
  match_count integer default 6
)
returns table (
  chunk_id uuid,
  document_id uuid,
  file_name text,
  chunk_index integer,
  content text,
  similarity real
)
language sql stable
set search_path = ''
as $$
  select c.id, c.document_id, d.file_name, c.chunk_index, c.content,
         (1 - (c.embedding <=> query_embedding))::real as similarity
  from public.chunks c
  join public.documents d on d.id = c.document_id
  where c.persona_id = match_persona_id
    and c.user_id = (select auth.uid())
    and d.status = 'ready'
  order by c.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 12);
$$;
revoke execute on function public.match_persona_chunks(extensions.vector, uuid, integer) from public;
grant execute on function public.match_persona_chunks(extensions.vector, uuid, integer) to authenticated;

alter table public.personas enable row level security;
alter table public.documents enable row level security;
alter table public.chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Owners manage personas" on public.personas
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage documents" on public.documents
  for all to authenticated using (
    (select auth.uid()) = user_id and exists (
      select 1 from public.personas p where p.id = persona_id and p.user_id = (select auth.uid())
    )
  ) with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.personas p where p.id = persona_id and p.user_id = (select auth.uid())
    )
  );

create policy "Owners read chunks" on public.chunks
  for select to authenticated using (
    (select auth.uid()) = user_id and exists (
      select 1 from public.personas p where p.id = persona_id and p.user_id = (select auth.uid())
    )
  );
create policy "Owners insert chunks" on public.chunks
  for insert to authenticated with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.personas p where p.id = persona_id and p.user_id = (select auth.uid())
    )
  );
create policy "Owners delete chunks" on public.chunks
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Owners manage conversations" on public.conversations
  for all to authenticated using (
    (select auth.uid()) = user_id and exists (
      select 1 from public.personas p where p.id = persona_id and p.user_id = (select auth.uid())
    )
  ) with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.personas p where p.id = persona_id and p.user_id = (select auth.uid())
    )
  );

create policy "Owners manage messages" on public.messages
  for all to authenticated using (exists (
    select 1 from public.conversations c where c.id = conversation_id and c.user_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.conversations c where c.id = conversation_id and c.user_id = (select auth.uid())
  ));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('persona-images', 'persona-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('persona-text', 'persona-text', false, 10485760, array['text/plain'])
on conflict (id) do nothing;

create policy "Users manage own persona images" on storage.objects
  for all to authenticated using (
    bucket_id = 'persona-images' and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'persona-images' and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users manage own persona text" on storage.objects
  for all to authenticated using (
    bucket_id = 'persona-text' and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'persona-text' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
