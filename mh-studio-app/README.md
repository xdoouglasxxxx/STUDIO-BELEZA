# MH Studio — App de Agendamento (Myleine Hofmann)

App de agendamento online conectado ao Supabase. Quando a cliente confirma, o agendamento é salvo no banco e o horário fica bloqueado para as demais.

## O que já está pronto

- Visual completo (Início, Serviços, Agendar, Contato)
- Formulário com nome e WhatsApp da cliente
- Horários já reservados aparecem riscados e bloqueados
- Proteção contra agendamento duplo no mesmo horário
- Botão de agendamento pelo WhatsApp como alternativa
- Segurança: visitantes só conseguem **criar** agendamentos — não conseguem ver nome/telefone de outras clientes

---

## PASSO 1 — Configurar o Supabase (5 min)

1. Entre em https://supabase.com/dashboard e abra o **seu projeto** (o que você já criou).
2. No menu lateral, clique em **SQL Editor** → **New query**.
3. Abra o arquivo `supabase/schema.sql` deste projeto, copie **tudo** e cole no editor.
4. Clique em **Run**. Deve aparecer "Success. No rows returned".
5. Agora pegue as chaves: menu **Project Settings** (engrenagem) → **API**:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** key → um texto longo começando com `eyJ...`

> A chave **anon** é pública e segura de usar no site. NUNCA use a `service_role` no app.

## PASSO 2 — Rodar no seu computador (para testar)

Requisito: Node.js 18+ instalado (https://nodejs.org).

```bash
# dentro da pasta do projeto
npm install

# criar o arquivo de configuração
cp .env.example .env
# abra o .env e cole a URL e a anon key do Passo 1

npm run dev
```

Abra http://localhost:5173, faça um agendamento de teste e confira no Supabase em **Table Editor → agendamentos** se ele apareceu.

## PASSO 3 — Subir para o GitHub

Você já tem o repositório `STUDIO-BELEZA` com a pasta `mh-studio-painel`. Vamos colocar este app numa pasta irmã, `mh-studio-app`:

```bash
# clone o seu repositório (se ainda não tiver na máquina)
git clone https://github.com/xdoouglasxxxx/STUDIO-BELEZA.git
cd STUDIO-BELEZA

# copie a pasta mh-studio-app (este projeto) para dentro do repositório
# (arraste a pasta ou use o comando cp)

git add mh-studio-app
git commit -m "Adiciona app de agendamento com Supabase"
git push
```

> O arquivo `.gitignore` já impede que o `.env` (com suas chaves) e o `node_modules` subam para o GitHub.

## PASSO 4 — Publicar na Vercel

1. Entre em https://vercel.com e faça login **com a conta do GitHub**.
2. Clique em **Add New → Project** e importe o repositório `STUDIO-BELEZA`.
3. Em **Root Directory**, clique em *Edit* e escolha `mh-studio-app` (importante!).
4. O framework "Vite" será detectado automaticamente.
5. Em **Environment Variables**, adicione as duas:
   - `VITE_SUPABASE_URL` = a URL do Passo 1
   - `VITE_SUPABASE_ANON_KEY` = a anon key do Passo 1
6. Clique em **Deploy**. Em ~1 minuto seu app estará no ar com um link `*.vercel.app`.

A partir daí, todo `git push` publica automaticamente uma nova versão.

## Personalizações rápidas

No topo de `src/App.jsx`:

- `WHATSAPP` — número real da Myleine (só dígitos, com 55 + DDD)
- `INSTAGRAM` — usuário do Instagram
- `SERVICOS` — nomes, preços e descrições
- `HORARIOS` — horários oferecidos por dia

## Próximos passos sugeridos

- Conectar o **mh-studio-painel** ao mesmo Supabase (tabela `agendamentos`) para a Myleine confirmar/cancelar — mude o `status` para `confirmado` ou `cancelado`; horários cancelados voltam a ficar livres automaticamente.
- Bloquear domingos e horários passados no dia de hoje.
- Notificação automática no WhatsApp da Myleine a cada novo agendamento.
