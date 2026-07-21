# MH Studio — App de Agendamento (Myleine Hofmann)

Site de agendamento para as clientes, integrado ao **mesmo Supabase do painel** (mh-studio-painel). Tudo que a cliente agendar no site aparece no painel da Myleine.

## Como funciona a integração

- Os **serviços e preços** vêm da tabela `services` — se a Myleine mudar um preço no painel/Supabase, o site atualiza sozinho
- O **WhatsApp e endereço** vêm da tabela `studios`
- Cada agendamento cria/reutiliza a cliente na tabela `clients` (pelo telefone) e grava em `appointments` com status `pendente`
- Horários já reservados aparecem **riscados** no site (considerando a duração de cada serviço)
- Quando a Myleine marca `cancelado` no painel, o horário **volta a ficar livre** automaticamente

## PASSO 1 — Configurar o Supabase (uma vez só)

No Supabase → **SQL Editor**, rode os dois arquivos **nesta ordem**:

1. `supabase/1-schema-painel.sql` — cria as tabelas e cadastra os 8 serviços
2. `supabase/2-patch-site.sql` — **correção de segurança importante** + função de agendamento

> ⚠️ O patch nº 2 é obrigatório: o schema original deixava os dados das clientes (nomes e telefones) visíveis para qualquer pessoa pela API. O patch fecha isso — visitantes só conseguem agendar, nunca ler dados de outras clientes. O painel continua vendo tudo normalmente (logado via Supabase Auth).

Depois pegue as chaves em **Project Settings → API**: `Project URL` e `anon public key`.

## PASSO 2 — Subir para o GitHub (pelo navegador, sem instalar nada)

1. No repositório STUDIO-BELEZA, vá para a **raiz** (não entre na pasta mh-studio-painel)
2. **Add file → Upload files** → arraste a pasta `mh-studio-app` inteira
3. **Commit changes**

Estrutura final:
```
STUDIO-BELEZA/
├── mh-studio-painel/   ← painel da Myleine (já existia)
└── mh-studio-app/      ← este site (novo)
```

## PASSO 3 — Publicar na Vercel

1. vercel.com → login com GitHub → **Add New → Project** → importe STUDIO-BELEZA
2. **Root Directory** → Edit → escolha `mh-studio-app` (essencial!)
3. **Environment Variables**:
   - `VITE_SUPABASE_URL` = a Project URL
   - `VITE_SUPABASE_ANON_KEY` = a anon public key
4. **Deploy** — em ~1 min o site está no ar

O painel pode ser publicado como um **segundo projeto** na Vercel, importando o mesmo repositório com Root Directory = `mh-studio-painel` e as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (mesmos valores).

## PASSO 4 — Testar

1. Abra o link da Vercel, faça um agendamento de teste
2. No Supabase → **Table Editor** → `appointments`: a linha deve aparecer com status `pendente`
3. Em `clients`: a cliente de teste deve estar cadastrada
4. Volte no site, escolha o mesmo dia — o horário deve aparecer riscado

## Testar no computador (opcional, precisa de Node.js)

```bash
npm install
cp .env.example .env   # preencha com URL e anon key
npm run dev            # abre em http://localhost:5173
```

## Personalizações

- **Horários oferecidos**: lista `HORARIOS` no topo de `src/App.jsx`
- **Instagram**: constante `INSTAGRAM` no topo de `src/App.jsx`
- **Serviços/preços**: direto no Supabase (Table Editor → `services`) ou pelo painel
- **WhatsApp/endereço**: Supabase → tabela `studios`
