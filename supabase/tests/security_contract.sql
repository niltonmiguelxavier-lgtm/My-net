-- Run against a disposable Supabase test project after migration.
-- Assertions use built-in PostgreSQL catalog tables; no production rows are required.
do $$
declare t text; enabled boolean;
begin
 foreach t in array array['profiles','seller_applications','sellers','categories','plans','subscriptions','payment_requests','payment_transactions','listings','listing_images','reviews','favorites','contact_requests','notifications','reports','admin_audit_logs','platform_settings'] loop
   select relrowsecurity into enabled from pg_class where oid=('public.'||t)::regclass;
   if not coalesce(enabled,false) then raise exception 'RLS is disabled on public.%',t; end if;
 end loop;
 if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='admin_review_payment') then raise exception 'Payment review RPC missing'; end if;
 if has_function_privilege('anon','public.admin_review_payment(uuid,boolean,text)','execute') then raise exception 'Anonymous role can review payments'; end if;
 if not exists(select 1 from pg_trigger where tgname='profiles_role_guard' and not tgisinternal) then raise exception 'Profile role guard missing'; end if;
 if not exists(select 1 from pg_trigger where tgname='seller_listing_guard' and not tgisinternal) then raise exception 'Seller listing guard missing'; end if;
end $$;
