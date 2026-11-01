# Supabase — My Net

1. Cria um projecto Supabase e configura `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no ambiente local/Vercel (Settings → API). Nunca coloques `SUPABASE_SERVICE_ROLE_KEY` no browser ou no Git.
2. Instala Supabase CLI e executa `supabase link --project-ref <PROJECT_REF>` e `supabase db push`, ou executa `migrations/0001_initial_schema.sql` no SQL Editor.
3. No Auth → URL Configuration define o URL local/produção e os redirect URLs. Activa confirmação de email para produção.
4. Cria utilizadores de teste através do fluxo Auth; não há utilizadores ou anúncios seed.
5. Para conceder administração, usa operador de confiança no SQL Editor: `update public.profiles set role='admin' where id='<UUID verificado>';`. Nunca disponibilizar isto numa API pública.
6. As imagens públicas ficam em `listing-images` e `profile-images`. Documentos KYC ficam apenas no bucket privado `seller-documents`; descarrega-os com URL assinada depois de validar permissões no servidor.

A migration configura RLS, as tabelas do marketplace, buckets, nove categorias, três planos e configurações básicas. Valores de planos são defaults administráveis; nenhuma transacção ou anúncio de demonstração é inserido. RLS protege acesso, mas validação de limite de anúncios e activação de subscrição pagos também deve ser feita numa função transaccional/servidor confiável antes de permitir publicação. Nenhum webhook de M-Pesa/e-Mola está implementado nesta etapa.

## Estado dos pagamentos e verificações

Os pedidos de subscrição ficam pendentes. O operador administrativo pode confirmar comprovativos submetidos através do painel; isto é uma confirmação manual, não uma verificação automática junto de M-Pesa/e-Mola. Nunca marcar um pagamento como confirmado sem validação fora de banda. A aplicação não recolhe PIN ou OTP.

Os documentos KYC ainda não têm formulário de upload ligado ao bucket e exigem uma etapa segura adicional. O painel administrativo actual trata a fila de candidaturas, moderação de anúncios e revisão manual de pagamentos; não é ainda um backoffice completo de denúncias, relatórios e parametrização.

Os planos pagos ficam bloqueados no frontend enquanto não existirem dados públicos de pagamento. Depois de validar um destinatário oficial, configura apenas o texto de instrução pública para a chave `public_payment_instructions` usando o SQL Editor, por exemplo `update public.platform_settings set value='"INSTRUÇÕES OFICIAIS"'::jsonb where key='public_payment_instructions';`. Não inclua credenciais, PINs ou OTPs. Sem instruções válidas, não solicites transferência ao utilizador.
