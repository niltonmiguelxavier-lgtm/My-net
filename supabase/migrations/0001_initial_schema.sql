-- My Net: PostgreSQL schema for Supabase. Apply with `supabase db push` or SQL Editor.
begin;
create extension if not exists pgcrypto;

create type public.account_role as enum ('customer','seller','admin');
create type public.seller_status as enum ('pending','under_review','approved','rejected','suspended');
create type public.listing_status as enum ('draft','pending','active','paused','rejected','removed');
create type public.subscription_status as enum ('pending','active','expired','cancelled','rejected');
create type public.payment_request_status as enum ('pending','submitted','confirmed','rejected','cancelled');
create type public.review_status as enum ('pending','published','rejected','removed');
create type public.contact_status as enum ('new','read','replied','closed');
create type public.report_status as enum ('open','investigating','resolved','dismissed');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', phone text, role public.account_role not null default 'customer',
 province text, city text, avatar_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint profiles_full_name_length check (char_length(full_name)<=180), constraint profiles_phone_length check (phone is null or char_length(phone)<=40)
);
create table public.seller_applications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 business_name text not null, description text not null default '', phone text not null, email text not null,
 province text not null, city text not null, business_type text, document_paths text[] not null default '{}',
 status public.seller_status not null default 'pending', review_note text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint seller_application_user_unique unique(user_id), constraint app_business_name_length check(char_length(business_name) between 2 and 160)
);
create table public.sellers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade,
 business_name text not null, description text not null default '', phone text not null, email text not null,
 province text not null, city text not null, business_type text, status public.seller_status not null default 'pending',
 average_rating numeric(3,2) not null default 0 check(average_rating between 0 and 5), reviews_count integer not null default 0 check(reviews_count>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
 description text, active boolean not null default true, sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table public.plans (
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
 price_mzn numeric(12,2) not null default 0 check(price_mzn>=0), listing_limit integer check(listing_limit is null or listing_limit>=0),
 features jsonb not null default '[]'::jsonb, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.subscriptions (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.sellers(id) on delete cascade,
 plan_id uuid not null references public.plans(id), status public.subscription_status not null default 'pending',
 starts_at timestamptz, expires_at timestamptz, payment_reference text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payment_requests (
 id uuid primary key default gen_random_uuid(), subscription_id uuid not null references public.subscriptions(id) on delete cascade,
 seller_id uuid not null references public.sellers(id) on delete cascade, amount_mzn numeric(12,2) not null check(amount_mzn>=0),
 method text not null check(method in ('mpesa','emola','bank_transfer','other')), status public.payment_request_status not null default 'pending',
 reference text, proof_path text, submitted_at timestamptz, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
 admin_note text, created_at timestamptz not null default now()
);
create table public.payment_transactions (
 id uuid primary key default gen_random_uuid(), payment_request_id uuid not null references public.payment_requests(id) on delete restrict,
 provider text not null, provider_reference text, amount_mzn numeric(12,2) not null check(amount_mzn>=0), status text not null check(status in ('pending','confirmed','failed','refunded')),
 verified_at timestamptz, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.listings (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.sellers(id) on delete cascade,
 category_id uuid not null references public.categories(id), title text not null, description text not null,
 price_mzn numeric(12,2) not null check(price_mzn>=0), billing_period text not null default 'monthly', connection_type text not null,
 advertised_speed_mbps numeric(10,2), data_limit_gb numeric(10,2), province text not null, city text not null,
 availability text not null default 'available', contact_phone text, contact_email text,
 status public.listing_status not null default 'draft', featured boolean not null default false, views_count bigint not null default 0 check(views_count>=0),
 moderation_note text, published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint listing_title_length check(char_length(title) between 3 and 160), constraint listing_description_length check(char_length(description) between 10 and 10000)
);
create table public.listing_images (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade,
 storage_path text not null, alt_text text, sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table public.reviews (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id) on delete cascade,
 seller_id uuid not null references public.sellers(id) on delete cascade, rating smallint not null check(rating between 1 and 5),
 comment text not null default '', status public.review_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint one_review_per_customer_seller unique(customer_id,seller_id), constraint review_comment_length check(char_length(comment)<=2000)
);
create table public.favorites (
 user_id uuid not null references public.profiles(id) on delete cascade, listing_id uuid not null references public.listings(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id,listing_id)
);
create table public.contact_requests (
 id uuid primary key default gen_random_uuid(), customer_id uuid references public.profiles(id) on delete set null,
 seller_id uuid not null references public.sellers(id) on delete cascade, listing_id uuid references public.listings(id) on delete set null,
 name text not null, email text not null, phone text, message text not null, status public.contact_status not null default 'new',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 title text not null, body text not null, link text, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid references public.profiles(id) on delete set null,
 listing_id uuid references public.listings(id) on delete cascade, review_id uuid references public.reviews(id) on delete cascade,
 reason text not null, details text, status public.report_status not null default 'open', handled_by uuid references public.profiles(id),
 handled_at timestamptz, created_at timestamptz not null default now(), constraint report_target check(num_nonnulls(listing_id,review_id)=1)
);
create table public.admin_audit_logs (
 id bigint generated always as identity primary key, admin_id uuid references public.profiles(id) on delete set null,
 action text not null, entity_type text not null, entity_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.platform_settings (
 key text primary key, value jsonb not null, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);

create index listings_search_idx on public.listings(status, category_id, province, city, price_mzn);
create index listings_created_idx on public.listings(created_at desc) where status='active';
create index listings_seller_status_idx on public.listings(seller_id,status);
create index listings_title_trgm_idx on public.listings using gin(to_tsvector('simple',title||' '||description));
create index sellers_ranking_idx on public.sellers(status,average_rating desc,reviews_count desc);
create index applications_queue_idx on public.seller_applications(status,created_at);
create index subscriptions_seller_idx on public.subscriptions(seller_id,status,expires_at desc);
create index payments_review_idx on public.payment_requests(status,created_at);
create index contacts_seller_idx on public.contact_requests(seller_id,status,created_at desc);
create index notifications_user_idx on public.notifications(user_id,created_at desc);
create index reports_queue_idx on public.reports(status,created_at);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger applications_updated before update on public.seller_applications for each row execute function public.set_updated_at();
create trigger sellers_updated before update on public.sellers for each row execute function public.set_updated_at();
create trigger plans_updated before update on public.plans for each row execute function public.set_updated_at();
create trigger subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger listings_updated before update on public.listings for each row execute function public.set_updated_at();
create trigger reviews_updated before update on public.reviews for each row execute function public.set_updated_at();
create trigger contacts_updated before update on public.contact_requests for each row execute function public.set_updated_at();

-- Role is never client-editable; admin privilege is granted only by trusted server/database operator.
create or replace function public.protect_profile_role() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then raise exception 'Profile role cannot be changed by the account owner'; end if;
 return new;
end $$;
create trigger profiles_role_guard before update on public.profiles for each row execute function public.protect_profile_role();

-- Listing owners cannot self-approve, feature, or exceed their subscribed plan.
create or replace function public.guard_seller_listing() returns trigger language plpgsql security definer set search_path=public as $$
declare sid uuid; lim integer; used integer;
begin
 if public.is_admin() then return new; end if;
 sid=public.current_seller_id();
 if sid is null or new.seller_id<>sid then raise exception 'Only approved sellers can manage listings'; end if;
 if tg_op='INSERT' then
   if new.status not in ('draft','pending') or new.featured then raise exception 'New listings must be pending moderation'; end if;
   select p.listing_limit into lim from public.subscriptions s join public.plans p on p.id=s.plan_id where s.seller_id=sid and s.status='active' and s.expires_at>now() order by s.expires_at desc limit 1;
   if not found then select listing_limit into lim from public.plans where slug='gratuito' and active=true; end if;
   select count(*) into used from public.listings where seller_id=sid and status in ('draft','active','pending');
   if lim is not null and used>=lim then raise exception 'Listing plan limit reached'; end if;
 else
   if new.status is distinct from old.status and new.status not in ('draft','pending','paused') then raise exception 'Listing moderation state is controlled by administrators'; end if;
   if old.status='active' and new.status='active' and (new.title is distinct from old.title or new.description is distinct from old.description or new.price_mzn is distinct from old.price_mzn or new.connection_type is distinct from old.connection_type or new.province is distinct from old.province or new.city is distinct from old.city) then raise exception 'Edited active listings must be resubmitted for moderation'; end if;
   if new.featured is distinct from old.featured then raise exception 'Only administrators can feature listings'; end if;
 end if;
 return new;
end $$;
create trigger seller_listing_guard before insert or update on public.listings for each row execute function public.guard_seller_listing();
-- Protect immutable review targets and contact-request contents from their owner parties.
create or replace function public.guard_review_record() returns trigger language plpgsql security definer set search_path=public as $$
declare seller_user uuid;
begin
 if public.is_admin() then return new; end if;
 if tg_op='INSERT' then
   if new.customer_id is distinct from auth.uid() then raise exception 'Reviews must belong to the current customer'; end if;
   select user_id into seller_user from public.sellers where id=new.seller_id;
   if seller_user is null or seller_user=auth.uid() then raise exception 'Self-reviews are not allowed'; end if;
 else
   if new.customer_id is distinct from old.customer_id or new.seller_id is distinct from old.seller_id then raise exception 'Review author and seller cannot be changed'; end if;
 end if;
 return new;
end $$;
create trigger review_record_guard before insert or update on public.reviews for each row execute function public.guard_review_record();
create or replace function public.guard_contact_request() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if public.is_admin() then return new; end if;
 if tg_op='UPDATE' then
   if new.customer_id is distinct from old.customer_id or new.seller_id is distinct from old.seller_id or new.listing_id is distinct from old.listing_id or new.name is distinct from old.name or new.email is distinct from old.email or new.phone is distinct from old.phone or new.message is distinct from old.message then raise exception 'Contact request details are immutable'; end if;
   if new.status not in ('read','replied','closed') then raise exception 'Invalid contact request status'; end if;
 end if;
 return new;
end $$;
create trigger contact_request_guard before update on public.contact_requests for each row execute function public.guard_contact_request();
create or replace function public.guard_payment_request() returns trigger language plpgsql security definer set search_path=public as $$
declare sid uuid; expected numeric; owner_id uuid;
begin
 if public.is_admin() then return new; end if;
 sid=public.current_seller_id(); if tg_op<>'INSERT' or sid is null or new.seller_id<>sid or new.status<>'pending' then raise exception 'Payment requests must be created by the owning seller as pending'; end if;
 select s.user_id,p.price_mzn into owner_id,expected from public.subscriptions sub join public.sellers s on s.id=sub.seller_id join public.plans p on p.id=sub.plan_id where sub.id=new.subscription_id and sub.seller_id=sid and sub.status='pending';
 if owner_id is null or new.amount_mzn<>expected then raise exception 'Subscription and amount do not match'; end if;
 return new;
end $$;
create trigger payment_request_guard before insert or update on public.payment_requests for each row execute function public.guard_payment_request();
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
create or replace function public.current_seller_id() returns uuid language sql stable security definer set search_path=public as $$ select id from public.sellers where user_id=auth.uid() and status='approved' limit 1 $$;

-- Rating aggregate reflects only published reviews.
create or replace function public.refresh_seller_rating() returns trigger language plpgsql security definer set search_path=public as $$
declare sid uuid;
begin
 if tg_op='DELETE' then sid=old.seller_id; else sid=new.seller_id; end if;
 if tg_op='UPDATE' and old.seller_id is distinct from new.seller_id then update public.sellers set average_rating=coalesce((select round(avg(rating)::numeric,2) from public.reviews where seller_id=old.seller_id and status='published'),0), reviews_count=(select count(*) from public.reviews where seller_id=old.seller_id and status='published')) where id=old.seller_id; end if;
 update public.sellers set average_rating=coalesce((select round(avg(rating)::numeric,2) from public.reviews where seller_id=sid and status='published'),0), reviews_count=(select count(*) from public.reviews where seller_id=sid and status='published') where id=sid;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
create trigger review_rating_refresh after insert or update or delete on public.reviews for each row execute function public.refresh_seller_rating();

alter table public.profiles enable row level security;
alter table public.seller_applications enable row level security;
alter table public.sellers enable row level security;
alter table public.categories enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_requests enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.contact_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.platform_settings enable row level security;

-- Admin-only transactional actions, never callable by public/anon roles.
create or replace function public.admin_review_seller_application(application_id uuid, decision public.seller_status, note text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare app public.seller_applications%rowtype; sid uuid;
begin
 if not public.is_admin() then raise exception 'Administrator permission required'; end if;
 if decision not in ('approved','rejected','under_review') then raise exception 'Invalid application decision'; end if;
 select * into app from public.seller_applications where id=application_id for update;
 if not found then raise exception 'Application not found'; end if;
 update public.seller_applications set status=decision,review_note=left(note,1000),reviewed_by=auth.uid(),reviewed_at=now() where id=application_id;
 if decision='approved' then
   insert into public.sellers(user_id,business_name,description,phone,email,province,city,business_type,status)
   values(app.user_id,app.business_name,app.description,app.phone,app.email,app.province,app.city,app.business_type,'approved')
   on conflict(user_id) do update set business_name=excluded.business_name,description=excluded.description,phone=excluded.phone,email=excluded.email,province=excluded.province,city=excluded.city,business_type=excluded.business_type,status='approved' returning id into sid;
   update public.subscriptions set status='cancelled' where seller_id=sid and status='active';
   update public.profiles set role='seller' where id=app.user_id;
   insert into public.subscriptions(seller_id,plan_id,status,starts_at,expires_at)
   select sid,id,'active',now(),null from public.plans where slug='gratuito' and active=true;
 else
   update public.sellers set status=decision where user_id=app.user_id;
 end if;
 insert into public.admin_audit_logs(admin_id,action,entity_type,entity_id,metadata) values(auth.uid(),'seller_application_'||decision,'seller_application',application_id::text,jsonb_build_object('note',left(note,1000)));
 return sid;
end $$;
create or replace function public.seller_request_subscription(requested_plan uuid, method text, payment_ref text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare sid uuid; pid uuid; price numeric(12,2); subid uuid; reqid uuid;
begin
 sid=public.current_seller_id(); if sid is null then raise exception 'Approved seller account required'; end if;
 if method not in ('mpesa','emola','bank_transfer','other') then raise exception 'Unsupported payment method'; end if;
 select id,price_mzn into pid,price from public.plans where id=requested_plan and active=true;
 if pid is null then raise exception 'Plan unavailable'; end if;
 if price=0 then
   update public.subscriptions set status='cancelled' where seller_id=sid and status='active';
   insert into public.subscriptions(seller_id,plan_id,status,starts_at,expires_at) values(sid,pid,'active',now(),null) returning id into subid;
   return subid;
 end if;
 if payment_ref is null or char_length(trim(payment_ref))<3 then raise exception 'Payment reference required for paid plans'; end if;
 insert into public.subscriptions(seller_id,plan_id,status) values(sid,pid,'pending') returning id into subid;
 insert into public.payment_requests(subscription_id,seller_id,amount_mzn,method,status,reference,submitted_at) values(subid,sid,price,method,left(trim(payment_ref),120),'pending',now()) returning id into reqid;
 return reqid;
end $$;

create or replace function public.admin_review_listing(listing_id uuid, decision public.listing_status, note text default null)
returns void language plpgsql security definer set search_path=public as $$
declare l public.listings%rowtype;
begin
 if not public.is_admin() then raise exception 'Administrator permission required'; end if;
 if decision not in ('active','rejected','removed','paused') then raise exception 'Invalid moderation decision'; end if;
 select * into l from public.listings where id=listing_id for update; if not found then raise exception 'Listing not found'; end if;
 if decision='active' then
   if not exists(select 1 from public.sellers where id=l.seller_id and status='approved') then raise exception 'Seller is not approved'; end if;
   if not exists(select 1 from public.categories where id=l.category_id and active) then raise exception 'Category is inactive'; end if;
 end if;
 update public.listings set status=decision,moderation_note=left(note,1000),published_at=case when decision='active' then coalesce(published_at,now()) else published_at end where id=listing_id;
 insert into public.admin_audit_logs(admin_id,action,entity_type,entity_id,metadata) values(auth.uid(),'listing_'||decision,'listing',listing_id::text,jsonb_build_object('note',left(note,1000)));
end $$;

create or replace function public.admin_review_payment(payment_id uuid, approved boolean, note text default null)
returns void language plpgsql security definer set search_path=public as $$
declare req public.payment_requests%rowtype; sub public.subscriptions%rowtype;
begin
 if not public.is_admin() then raise exception 'Administrator permission required'; end if;
 select * into req from public.payment_requests where id=payment_id for update;
 if not found then raise exception 'Payment request not found'; end if;
 if req.status not in ('pending','submitted') then raise exception 'Payment request already reviewed'; end if;
 if approved and (req.reference is null or char_length(trim(req.reference))<3) then raise exception 'A payment reference must be provided before confirmation'; end if;
 update public.payment_requests set status=case when approved then 'confirmed'::public.payment_request_status else 'rejected'::public.payment_request_status end,reviewed_by=auth.uid(),reviewed_at=now(),admin_note=left(note,1000) where id=payment_id;
 if approved then
   insert into public.payment_transactions(payment_request_id,provider,provider_reference,amount_mzn,status,verified_at) values(req.id,req.method,req.reference,req.amount_mzn,'confirmed',now());
   select * into sub from public.subscriptions where id=req.subscription_id for update;
   update public.subscriptions set status='cancelled' where seller_id=req.seller_id and status='active';
   update public.subscriptions set status='active',starts_at=now(),expires_at=now()+interval '30 days',payment_reference=req.reference where id=req.subscription_id;
 else
   update public.subscriptions set status='rejected' where id=req.subscription_id and status='pending';
 end if;
 insert into public.admin_audit_logs(admin_id,action,entity_type,entity_id,metadata) values(auth.uid(),case when approved then 'payment_confirmed' else 'payment_rejected' end,'payment_request',req.id::text,jsonb_build_object('amount_mzn',req.amount_mzn,'note',left(note,1000)));
end $$;
revoke all on function public.admin_review_seller_application(uuid,public.seller_status,text) from public,anon;
revoke all on function public.seller_request_subscription(uuid,text,text) from public,anon;
revoke all on function public.admin_review_listing(uuid,public.listing_status,text) from public,anon;
revoke all on function public.admin_review_payment(uuid,boolean,text) from public,anon;
grant execute on function public.admin_review_seller_application(uuid,public.seller_status,text) to authenticated;
grant execute on function public.seller_request_subscription(uuid,text,text) to authenticated;
grant execute on function public.admin_review_listing(uuid,public.listing_status,text) to authenticated;
grant execute on function public.admin_review_payment(uuid,boolean,text) to authenticated;

create policy profiles_read_self_admin on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy applications_read_owner_admin on public.seller_applications for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy applications_submit_self on public.seller_applications for insert to authenticated with check(user_id=auth.uid() and status='pending' and reviewed_by is null and reviewed_at is null);
-- Application contents are immutable after submission; edits require administrator review/re-submission handling.
create policy applications_admin_manage on public.seller_applications for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy sellers_public_read on public.sellers for select using(status='approved' or user_id=auth.uid() or public.is_admin());
create policy sellers_admin_manage on public.sellers for all to authenticated using(public.is_admin()) with check(public.is_admin());
-- Public clients can read safe seller fields only; direct contact details are not exposed in PostgREST.
revoke select on public.sellers from anon, authenticated;
grant select (id,business_name,description,province,city,status,average_rating,reviews_count,created_at,updated_at) on public.sellers to anon;
grant select (id,user_id,business_name,description,phone,email,province,city,business_type,status,average_rating,reviews_count,created_at,updated_at) on public.sellers to authenticated;
create policy categories_public_read on public.categories for select using(active or public.is_admin());
create policy categories_admin_manage on public.categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy plans_public_read on public.plans for select using(active or public.is_admin());
create policy plans_admin_manage on public.plans for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy listings_public_read on public.listings for select using(status='active' or seller_id=public.current_seller_id() or public.is_admin());
create policy listings_owner_insert on public.listings for insert to authenticated with check(seller_id=public.current_seller_id() and exists(select 1 from public.sellers s where s.id=seller_id and s.status='approved'));
create policy listings_owner_update on public.listings for update to authenticated using(seller_id=public.current_seller_id()) with check(seller_id=public.current_seller_id());
create policy listings_owner_delete on public.listings for delete to authenticated using(seller_id=public.current_seller_id());
create policy listings_admin_manage on public.listings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy listing_images_read on public.listing_images for select using(exists(select 1 from public.listings l where l.id=listing_id and (l.status='active' or l.seller_id=public.current_seller_id() or public.is_admin())));
create policy listing_images_owner_manage on public.listing_images for all to authenticated using(exists(select 1 from public.listings l where l.id=listing_id and l.seller_id=public.current_seller_id())) with check(exists(select 1 from public.listings l where l.id=listing_id and l.seller_id=public.current_seller_id()));
create policy subscriptions_owner_read on public.subscriptions for select to authenticated using(seller_id=public.current_seller_id() or public.is_admin());
create policy subscriptions_admin_manage on public.subscriptions for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy payment_requests_owner_read on public.payment_requests for select to authenticated using(seller_id=public.current_seller_id() or public.is_admin());
create policy payment_requests_owner_insert on public.payment_requests for insert to authenticated with check(seller_id=public.current_seller_id() and status='pending');
create policy payment_requests_admin_manage on public.payment_requests for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy payment_transactions_admin_only on public.payment_transactions for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy reviews_public_read on public.reviews for select using(status='published' or customer_id=auth.uid() or public.is_admin());
create policy reviews_customer_insert on public.reviews for insert to authenticated with check(customer_id=auth.uid() and seller_id<>public.current_seller_id() and status='pending');
create policy reviews_owner_update on public.reviews for update to authenticated using(customer_id=auth.uid() and status='pending') with check(customer_id=auth.uid() and status='pending');
create policy reviews_admin_manage on public.reviews for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy favorites_owner_manage on public.favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy contacts_read_parties_admin on public.contact_requests for select to authenticated using(customer_id=auth.uid() or seller_id=public.current_seller_id() or public.is_admin());
create policy contacts_customer_insert on public.contact_requests for insert to authenticated with check(customer_id=auth.uid() and status='new' and exists(select 1 from public.sellers s where s.id=seller_id and s.status='approved') and (listing_id is null or exists(select 1 from public.listings l where l.id=listing_id and l.seller_id=seller_id and l.status='active')));
create policy contacts_seller_update on public.contact_requests for update to authenticated using(seller_id=public.current_seller_id()) with check(seller_id=public.current_seller_id());
create policy contacts_admin_manage on public.contact_requests for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy notifications_owner_read on public.notifications for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy notifications_owner_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy notifications_admin_manage on public.notifications for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy reports_owner_read on public.reports for select to authenticated using(reporter_id=auth.uid() or public.is_admin());
create policy reports_submit on public.reports for insert to authenticated with check(reporter_id=auth.uid() and status='open' and handled_by is null and handled_at is null);
create policy reports_admin_manage on public.reports for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy audit_admin_read on public.admin_audit_logs for select to authenticated using(public.is_admin());
create policy settings_public_read on public.platform_settings for select using(key in ('seller_application_open','listing_moderation_required','public_payment_instructions'));
create policy settings_admin_manage on public.platform_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- Defaults only; no fictitious listings, accounts, reviews, or transactions.
insert into public.categories(name,slug,sort_order) values
('Pacotes de dados móveis','dados-moveis',1),('Internet residencial','internet-residencial',2),('Fibra óptica','fibra-optica',3),('Wi-Fi','wifi',4),('Internet via satélite','satelite',5),('Internet sem fios','sem-fios',6),('Revendedores de Internet','revendedores',7),('Internet empresarial','empresarial',8),('Outros serviços de conectividade','outros',9);
insert into public.plans(slug,name,price_mzn,listing_limit,features) values
('gratuito','Gratuito',0,2,'["Perfil público","Contactos comerciais","Gestão básica de anúncios"]'),
('profissional','Profissional',500,10,'["Até 10 anúncios activos","Maior visibilidade","Estatísticas de visualizações","Perfil comercial melhorado"]'),
('premium','Premium',1200,null,'["Anúncios ilimitados, sujeitos a utilização justa","Anúncios em destaque","Estatísticas avançadas","Prioridade de exposição","Suporte prioritário"]');
insert into public.platform_settings(key,value) values ('seller_application_open','true'::jsonb),('listing_moderation_required','true'::jsonb),('public_payment_instructions','null'::jsonb);

-- Buckets: public listing/profile media; private business verification documents.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('listing-images','listing-images',true,5242880,array['image/jpeg','image/png','image/webp']),
('profile-images','profile-images',true,3145728,array['image/jpeg','image/png','image/webp']),
('seller-documents','seller-documents',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do nothing;
create policy listing_image_storage_public_read on storage.objects for select using(bucket_id='listing-images');
create policy listing_image_storage_owner_write on storage.objects for insert to authenticated with check(bucket_id='listing-images' and (storage.foldername(name))[1]=public.current_seller_id()::text);
create policy listing_image_storage_owner_update on storage.objects for update to authenticated using(bucket_id='listing-images' and (storage.foldername(name))[1]=public.current_seller_id()::text) with check(bucket_id='listing-images' and (storage.foldername(name))[1]=public.current_seller_id()::text);
create policy profile_image_read on storage.objects for select using(bucket_id='profile-images');
create policy profile_image_owner_write on storage.objects for insert to authenticated with check(bucket_id='profile-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy seller_documents_owner_read on storage.objects for select to authenticated using(bucket_id='seller-documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
create policy seller_documents_owner_insert on storage.objects for insert to authenticated with check(bucket_id='seller-documents' and (storage.foldername(name))[1]=auth.uid()::text);

commit;
