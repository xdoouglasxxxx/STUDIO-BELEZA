-- ============================================================
-- MH STUDIO • Storage da Galeria (rodar no SQL Editor)
-- Cria o bucket "gallery" para upload de fotos pelo painel.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode VER as fotos (galeria é pública no site)
create policy "fotos publicas"
  on storage.objects for select
  using (bucket_id = 'gallery');

-- Só o painel (logado) pode enviar e remover fotos
create policy "painel envia fotos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'gallery');

create policy "painel remove fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gallery');
