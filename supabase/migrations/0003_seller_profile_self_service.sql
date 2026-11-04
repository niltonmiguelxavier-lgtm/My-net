-- My Net: permite ao vendedor manter o próprio perfil comercial.
--
-- Contexto da lacuna: as políticas existentes só permitem ao administrador
-- escrever em public.sellers (sellers_admin_manage). Sem isto, a página de
-- edição do perfil comercial não teria como gravar. Esta migration NÃO altera
-- o modelo de dados: apenas acrescenta uma política de UPDATE e um trigger de
-- protecção, seguindo o padrão já usado em 0001_initial_schema.sql e
-- 0002_security_hardening.sql (guard_* + revoke execute).
--
-- Campos protegidos (nunca alteráveis pelo vendedor):
--   user_id, status, average_rating, reviews_count, business_type
-- Qualquer tentativa de os alterar aborta a transacção.

begin;

-- 1. Política de UPDATE para o dono do registo (além de is_admin()).
create policy sellers_update_own on public.sellers for update to authenticated
 using (user_id = auth.uid())
 with check (user_id = auth.uid());

-- 2. Privilégios de coluna: o vendedor só recebe UPDATE nestas colunas.
--    (O role table-wide UPDATE não é concedido, tal como em profiles/sellers
--     já existentes; o PostgREST aplica o mesmo filtro de colunas.)
grant update (business_name, description, phone, email, province, city)
  on public.sellers to authenticated;

-- 3. Trigger: garantir que campos sensíveis não mudam e validar limites
--    equivalentes às constraints/validações da aplicação.
create or replace function public.guard_seller_profile() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if public.is_admin() then return new; end if;

 if tg_op = 'UPDATE' then
   if new.user_id        is distinct from old.user_id
   or new.status         is distinct from old.status
   or new.average_rating is distinct from old.average_rating
   or new.reviews_count  is distinct from old.reviews_count
   or new.business_type  is distinct from old.business_type then
     raise exception 'Seller protected fields cannot be changed by the seller';
   end if;
 end if;

 if new.business_name is null or char_length(btrim(new.business_name)) not between 2 and 160 then
   raise exception 'Invalid business name length';
 end if;
 if new.description is null or char_length(new.description) > 3000 then
   raise exception 'Invalid description length';
 end if;
 if new.phone is null or char_length(btrim(new.phone)) not between 6 and 40 then
   raise exception 'Invalid phone';
 end if;
 if new.email is null or new.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(new.email) > 320 then
   raise exception 'Invalid email';
 end if;
 if new.province is null or char_length(btrim(new.province)) not between 2 and 100 then
   raise exception 'Invalid province';
 end if;
 if new.city is null or char_length(btrim(new.city)) not between 2 and 120 then
   raise exception 'Invalid city';
 end if;

 return new;
end $$;

create trigger seller_profile_guard
 before update on public.sellers
 for each row execute function public.guard_seller_profile();

revoke execute on function public.guard_seller_profile() from public, anon, authenticated;

commit;
