# AUDITORIA E PLANO DE IMPLEMENTAÇÃO: FRONTEND OVERHAUL (2026)

## 1. Estado Inicial do Projecto
- **Tecnologia**: Next.js 15.5.4, React 19.1.1, TypeScript, Tailwind CSS 3.4.17, Supabase (SSR & Client), Lucide React.
- **Estrutura**:
  - `/src/app/page.tsx`: Homepage pública (Hero, Categorias, Ofertas, Vendedores, Como funciona, Footer).
  - `/src/app/dashboard/page.tsx`: Dashboard do Cliente (Sidebar, Resumo, Acesso rápido, Notificações, Ajuda).
  - `/src/app/vendedor/dashboard/page.tsx`: Dashboard do Vendedor (Sidebar, Resumo, Anúncios, Contactos, Avaliações, Plano, Perfil).
  - `/src/app/admin/page.tsx`: Painel Administrativo (Métricas, Candidaturas, Anúncios, Pagamentos, Utilizadores, Categorias, Planos, Denúncias, Contactos, Auditoria).
  - `/src/app/login/page.tsx`, `/src/app/register/page.tsx`, `/src/app/recuperar-palavra-passe/page.tsx`: Autenticação.
  - `/src/app/pesquisa/page.tsx`: Pesquisa e Exploração.
  - `/src/app/planos/page.tsx`: Planos.
  - `/src/middleware.ts`: Redireccionamento baseado em funções (Admin, Seller, Customer).
- **Regras de Preservação**:
  - Backend, Supabase, Base de Dados, APIs e Regras de Negócio não serão alterados.
  - O foco é exclusivamente o Frontend (UI/UX, Componentes, Responsividade, Performance).

## 2. Problemas Identificados
1. **Homepage**: Design simples, mas necessita de Hero moderno, barra de pesquisa melhorada, secções de benefícios e planos mais comerciais.
2. **Dashboard do Cliente**: Layout básico, falta de "Secção de Descoberta", "Actividade Recente", "Pesquisa Rápida" e "Cartões de Resumo" expandidos.
3. **Dashboard do Vendedor**: Interface funcional mas com falta de "Estado de Aprovação" detalhado, "Área de Gestão" unificada e "Menu Completo" (Perfil Comercial, Publicações, etc.).
4. **Painel Administrativo**: Layout funcional, mas necessita de melhor organização visual, estados visuais (loading, empty, error) e melhorias de UX.
5. **Autenticação**: Formulários simples, necessitam de modernização visual (Sucesso/Erro/Confirmação).
6. **Mensagens/Notificações**: Interfaces atuais são básicas; necessitam de modernização (Lista de conversas, Área de conversação, Contadores).
7. **Responsividade**: Melhorias necessárias para Mobile (Menus, Cartões, Formulários).
8. **Estados Visuais**: Falta de Skeleton Loading, Empty States consistentes e Modais.

## 3. Plano de Manutenção e Implementação (Branch: frontend-maintenance-2026)

### Fase 1: Identidade Visual e Base (Tailwind & Componentes)
- Atualizar `tailwind.config.ts` com cores e sombras modernas.
- Criar/Atualizar Componentes Base (Cards, Buttons, Inputs, Modals, Skeleton, EmptyStates).
- Implementar Layouts Responsivos (Sidebar Desktop / Menu Mobile).

### Fase 2: Homepage Pública (Modernização Comercial)
- Redesign do Header (Logótipo, Menu responsivo, Botões).
- Hero Section (Título, Subtítulo, Barra de pesquisa, Botões, Elemento visual).
- Secção de Pesquisa (Filtros, Localização).
- Categorias (Cartões organizados).
- Vendedores em Destaque (Cartões com foto, avaliação, verificação).
- "Como funciona" (Passos visuais).
- Vantagens, Planos, FAQ, Suporte, Footer.

### Fase 3: Autenticação e Redireccionamento
- Modernizar Login, Registo, Recuperação (Mensagens de erro/sucesso).
- Garantir redireccionamento imediato após login (Middleware + Client components).

### Fase 4: Dashboard do Cliente
- Cabeçalho (Saudação, Perfil, Notificações, Mensagens).
- Cartões de Resumo (Favoritos, Mensagens, Notificações, Compras).
- Secção de Descoberta (Recomendados, Destaque, Novos, Categorias, Produtos).
- Pesquisa Rápida.
- Actividade Recente (Mensagens, Interacções, Pagamentos).
- Menu Completo (Sidebar + Mobile Nav).

### Fase 5: Dashboard do Vendedor
- Cabeçalho (Negócio, Estado, Notificações).
- Cartões de Resumo (Produtos, Serviços, Visualizações, Mensagens, Plano, Candidatura).
- Área de Gestão (Publicações, Mensagens, Actividade, Plano).
- Estado de Aprovação (Instruções, Pendente vs Aprovado).
- Menu Completo (Negócio, Produtos, Mensagens, Notificações, Pagamentos, Plano, Perfil, Suporte, Definições).

### Fase 6: Painel Administrativo
- Métricas Reais (Utilizadores, Clientes, Vendedores, Pendentes, Aprovados, Produtos, Serviços, Pagamentos, Actividade).
- Menus Organizados (Visão Geral, Utilizadores, Vendedores, Publicações, Pagamentos, Planos, Mensagens, Notificações, Definições).
- Estados Visuais (Loading, Empty, Error).

### Fase 7: Mensagens, Notificações, Perfis e Uploads
- Interface de Mensagens (Lista, Área de conversa, Contadores).
- Interface de Notificações (Centralizada, Contadores).
- Edição de Perfil (Cliente/Vendedor) e Upload de Imagens (Pré-visualização).
- Sistema de Pagamentos e Planos (Cartões modernos, Benefícios, Limites).

### Fase 8: Pesquisa, Exploração e Responsividade
- Experiência de Pesquisa (Filtros, Resultados, Cartões, Perfil Individual).
- Testes de Responsividade (Android, iPhone, Tablet, Desktop).

### Fase 9: Performance, Qualidade e Testes
- Revisão de Componentes, TypeScript, CSS, Imports.
- Otimização de Imagens e Renderização.
- Testes Finais (Homepage, Auth, Dashboards, Menus, Pesquisa, Mensagens, Notificações, Uploads, Pagamentos, Planos).
- Build de Produção.

## 4. Próximos Passos Imediatos
1. Criar branch `frontend-maintenance-2026`.
2. Atualizar Tailwind e Componentes Base.
3. Começar com a Homepage Pública (Fase 2).

---
**Nota**: A base de dados Supabase e o backend permanecem intactos.
