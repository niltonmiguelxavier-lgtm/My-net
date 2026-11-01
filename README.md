# My Net — Marketplace de Internet em Moçambique

Aplicação Next.js 15 App Router, React, TypeScript, Tailwind CSS e Supabase Auth/PostgreSQL/Storage. Interface em português de Moçambique/Portugal, preços em MT.

## Requisitos

- Node.js 20.9+ e npm
- Projecto Supabase
- Git para versionamento

## Desenvolvimento

1. `npm install`
2. Copia `.env.example` para `.env.local` e preenche `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Aplica a migration conforme `supabase/README.md`.
4. `npm run dev`
5. Executa `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` num ambiente Node.

## Deploy Vercel

Importa o repositório GitHub na Vercel, define as variáveis Supabase no ambiente de produção, preview e desenvolvimento e publica. Aplica primeiro as migrations ao projecto Supabase. Nunca expor a chave service_role; as páginas usam chave anon e RLS.

## Implementado nesta base

Homepage, pesquisa por texto/categoria/província/preço/velocidade/ligação/ordenação, detalhe de anúncio, registo/login/reset de password com Supabase Auth, candidatura de vendedor, painel de vendedor e criação/submissão de anúncio, favoritos, contacto, avaliação e denúncia, página de planos, pedidos de subscrição e painel administrativo para aprovação de vendedor/anúncio e confirmação manual de pagamento. A migration inclui 17 tabelas, RLS, limites de anúncios, buckets e funções PostgreSQL privilegiadas com auditoria.

## Antes de produção

Não existe aqui um projecto Supabase configurado, credenciais, dados, integração automática de M-Pesa/e-Mola, upload de documentos KYC, backoffice completo para todas as tabelas/relatórios nem testes reais da migration/RLS contra Supabase. Os pedidos de pagamento pagos ficam pendentes até o administrador validar a transacção fora da plataforma; nenhuma transacção é simulada. Para conceder a primeira conta admin, segue as instruções de operador confiável em `supabase/README.md`. Não há anúncios ou vendedores fictícios.
