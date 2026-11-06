# My Net — Marketplace de Internet em Moçambique

Aplicação Next.js 15 App Router, React, TypeScript, Tailwind CSS e Supabase Auth/PostgreSQL/Storage. Interface em português de Moçambique/Portugal, preços em MT.

## Requisitos

- Node.js 20.9+ e npm
- Projecto Supabase
- Git para versionamento

## Desenvolvimento

1. `npm install`
2. Copia `.env.example` para `.env.local` e preenche `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Aplica as migrations conforme `supabase/README.md` (`0001`, `0002` e `0003_seller_profile_self_service`).
4. `npm run dev`
5. Executa `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` num ambiente Node.

## Deploy Vercel

Importa o repositório GitHub na Vercel, define as variáveis Supabase no ambiente de produção, preview e desenvolvimento e publica. Aplica primeiro as migrations ao projecto Supabase. Nunca expor a chave service_role; as páginas usam chave anon e RLS.

O perfil comercial do vendedor exige a migration `0003`. Sem ela a página abre em modo de leitura: o vendedor não tem permissão de `UPDATE` em `public.sellers`.

O upload de imagens não está implementado: os buckets `profile-images` e `listing-images` existem, mas nenhum componente escreve neles (`profiles.avatar_path` e `listing_images.storage_path` só são lidos).

## Implementado nesta base

Homepage, pesquisa por texto/categoria/província/preço/velocidade/ligação/ordenação, detalhe de anúncio, registo/login/reset de password com Supabase Auth, candidatura de vendedor, painel de vendedor e criação/submissão de anúncio, favoritos, contacto, avaliação e denúncia, página de planos, pedidos de subscrição e painel administrativo para aprovação de vendedor/anúncio e confirmação manual de pagamento. A migration inclui 17 tabelas, RLS, limites de anúncios, buckets e funções PostgreSQL privilegiadas com auditoria.

A manutenção frontend de 2026 acrescentou: homepage com secção de suporte e rodapé estruturado, dashboard de cliente revisto, painel de vendedor com estados de aprovação e métricas reais, painel administrativo com indicadores e filas de revisão, pesquisa com filtros e estados vazios, recuperação de palavra-passe ligada ao Supabase Auth, menu de conta e página de perfil comercial do vendedor (`/vendedor/perfil`). Corrigiu ainda consultas que referenciavam colunas inexistentes e erros de sintaxe que impediam a compilação.

## Antes de produção

O projecto Supabase está configurado e as migrations `0001`–`0003` estão aplicadas. A migration `0003` e as políticas RLS de `sellers` foram verificadas contra a base de dados real, incluindo testes de escalada de privilégios (vendedor não pode alterar `status`, `average_rating` nem `reviews_count`). Continuam por implementar: integração automática de M-Pesa/e-Mola, upload de documentos KYC e backoffice completo para todas as tabelas/relatórios. Os pedidos de pagamento pagos ficam pendentes até o administrador validar a transacção fora da plataforma; nenhuma transacção é simulada. Para conceder a primeira conta admin, segue as instruções de operador confiável em `supabase/README.md`. Não há anúncios ou vendedores fictícios.
