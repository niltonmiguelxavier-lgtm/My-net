import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, CircleHelp, CreditCard, MessageSquare, Settings, ShieldCheck, Store, Search, Wifi, Radio, Zap, Menu, X, UserRound, Building2, FileCheck2, Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/account/BottomNav";
import { ApplicationDecision, ListingDecision, PaymentDecision, CategoryToggle, PlanToggle, ReportDecision, ContactDecision } from "@/components/admin";

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

type PendingListing = { id: string; title: string; price_mzn: number; province: string; created_at: string; seller: { business_name: string } | null };
type PendingPayment = { id: string; amount_mzn: number; method: string; reference: string | null; created_at: string; seller: { business_name: string } | null; status: string };

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 rounded-xl border border-dashed p-4 text-sm text-slate-500 text-center">{children}</p>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border bg-white p-5 shadow-soft">
      <p className="text-xs font-bold text-brand uppercase tracking-wider">{label}</p>
      <b className="mt-2 block text-3xl text-ink">{value}</b>
    </article>
  );
}

export default async function AdminPage() {
  const sb = await createSupabaseServerClient();
  if (!sb) redirect("/login");
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }] = await Promise.all([
    sb.from("profiles").select("role").eq("id", user.id).maybeSingle()
  ]);

  if (profile?.role !== "admin") redirect("/dashboard");

  const [
    { data: apps },
    { data: listings },
    { data: payments },
    { data: sellers, count: sellersCount },
    { data: activeListings, count: activeListingsCount },
    { data: users, count: usersCount },
    { data: categories },
    { data: plans },
    { data: reports },
    { data: audit },
    { data: contacts }
  ] = await Promise.all([
    sb.from("seller_applications").select("id,business_name,province,city,created_at").eq("status", "pending").order("created_at").limit(50),
    sb.from("listings").select("id,title,price_mzn,province,created_at,seller:sellers(business_name)").eq("status", "pending").order("created_at").limit(50),
    sb.from("payment_requests").select("id,amount_mzn,method,reference,created_at,seller:sellers(business_name)").in("status", ["pending", "submitted"]).order("created_at").limit(50),
    sb.from("sellers").select("id", { count: "exact", head: true }).eq("status", "approved"),
    sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    sb.from("profiles").select("id,full_name,role,province,city,created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(50),
    sb.from("categories").select("id,name,active,slug,sort_order").order("sort_order"),
    sb.from("plans").select("id,name,price_mzn,active,slug,listing_limit").order("price_mzn"),
    sb.from("reports").select("id,reason,details,status,created_at,listing:listings(title),review:reviews(comment)").in("status", ["open", "investigating"]).order("created_at", { ascending: false }).limit(30),
    sb.from("admin_audit_logs").select("id,action,entity_type,entity_id,created_at").order("created_at", { ascending: false }).limit(20),
    sb.from("contact_requests").select("id,name,email,message,status,created_at,listing:listings(title),seller:sellers(business_name)").in("status", ["new", "read", "replied"]).order("created_at", { ascending: false }).limit(30)
  ]);

  return (
    <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="border-b bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl justify-between px-5 py-5">
          <Link href="/" className="font-extrabold text-ink text-xl">
            My Net · <span className="text-brand">Administração</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-sm font-semibold text-brand hover:underline">Conta</Link>
            <form action="/auth/signout" method="post">
              <button className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Terminar sessão</button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {/* Menu Administrativo */}
        <nav className="mb-8 flex flex-wrap gap-2 overflow-x-auto pb-2">
          {[
            ["#", "Resumo", Store],
            ["#candidaturas", "Vendedores", Building2],
            ["#anuncios", "Anúncios", Zap],
            ["#pagamentos", "Pagamentos", CreditCard],
            ["#utilizadores", "Utilizadores", UserRound],
            ["#categorias", "Categorias", Radio],
            ["#planos", "Planos", FileCheck2],
            ["#denuncias", "Denúncias", ShieldCheck],
            ["#contactos", "Contactos", MessageSquare],
            ["#auditoria", "Auditoria", Star]
          ].map(([href, label, Icon]) => (
            <a
              key={label}
              href={href}
              className="rounded-lg border bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-brand transition-colors flex items-center gap-1.5"
            >
              <Icon size={14} /> {label}
            </a>
          ))}
        </nav>

        <p className="text-sm font-bold text-brand uppercase tracking-wider mb-2">PAINEL ADMINISTRATIVO</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink mb-6">Operações e Moderação</h1>

        {/* Métricas Reais */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Metric label="Contas registadas" value={usersCount ?? 0} />
          <Metric label="Vendedores aprovados" value={sellersCount ?? 0} />
          <Metric label="Anúncios activos" value={activeListingsCount ?? 0} />
          <Metric label="Candidaturas pendentes" value={apps.data?.length ?? 0} />
          <Metric label="Pagamentos pendentes" value={payments.data?.length ?? 0} />
        </div>

        {/* Seções Principais */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Candidaturas */}
          <section id="candidaturas" className="rounded-2xl border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-extrabold text-ink mb-4">
              Candidaturas pendentes ({apps.data?.length ?? 0})
            </h2>
            {apps.data?.length ? apps.data.map(a => (
              <article key={a.id} className="border-b py-4 last:border-0">
                <b className="text-sm text-ink">{a.business_name}</b>
                <p className="mt-1 text-xs text-slate-500">
                  {a.city}, {a.province} · {new Date(a.created_at).toLocaleDateString("pt-MZ")}
                </p>
                <div className="mt-3">
                  <ApplicationDecision id={a.id} />
                </div>
              </article>
            )) : (
              <Empty>Não há candidaturas pendentes.</Empty>
            )}
          </section>

          {/* Anúncios */}
          <section id="anuncios" className="rounded-2xl border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-extrabold text-ink mb-4">
              Anúncios para revisão ({listings.data?.length ?? 0})
            </h2>
            {(listings.data as unknown as PendingListing[] | null)?.length ? (listings.data as unknown as PendingListing[]).map(l => (
              <article key={l.id} className="border-b py-4 last:border-0">
                <b className="text-sm text-ink">{l.title}</b>
                <p className="mt-1 text-xs text-slate-500">
                  {first(l.seller)?.business_name} · {l.province} · {Number(l.price_mzn).toLocaleString("pt-MZ")} MT
                </p>
                <div className="mt-3">
                  <ListingDecision id={l.id} />
                </div>
              </article>
            )) : (
              <Empty>Não há anúncios pendentes.</Empty>
            )}
          </section>

          {/* Pagamentos */}
          <section id="pagamentos" className="rounded-2xl border bg-white p-5 shadow-soft lg:col-span-2">
            <h2 className="text-xl font-extrabold text-ink mb-4">
              Pedidos de pagamento ({payments.data?.length ?? 0})
            </h2>
            {(payments.data as unknown as PendingPayment[] | null)?.length ? (payments.data as unknown as PendingPayment[]).map(p => (
              <article key={p.id} className="flex flex-col justify-between gap-3 border-b py-4 sm:flex-row sm:items-center last:border-0">
                <div>
                  <b className="text-sm text-ink">{first(p.seller)?.business_name}</b>
                  <p className="mt-1 text-xs text-slate-500">
                    {p.method} · Ref. {p.reference || "Não indicada"} · {Number(p.amount_mzn).toLocaleString("pt-MZ")} MT
                  </p>
                </div>
                <PaymentDecision id={p.id} />
              </article>
            )) : (
              <Empty>Não há pedidos de pagamento para rever.</Empty>
            )}
          </section>

          {/* Utilizadores */}
          <section id="utilizadores" className="rounded-2xl border bg-white p-5 shadow-soft lg:col-span-2">
            <h2 className="text-xl font-extrabold text-ink mb-4">Contas recentes ({usersCount ?? 0})</h2>
            <p className="mt-1 text-xs text-slate-500 mb-4">
              Consulta apenas. A alteração de papéis e o bloqueio de contas exigem operações protegidas.
            </p>
            {users.data?.length ? users.data.map(u => (
              <article key={u.id} className="flex flex-wrap justify-between gap-2 border-b py-3 last:border-0">
                <div>
                  <b className="text-sm text-ink">{u.full_name || "Sem nome"}</b>
                  <p className="text-xs text-slate-500 mt-1">
                    {u.province || "Província não indicada"}{u.city ? `, ${u.city}` : ""} · {new Date(u.created_at).toLocaleDateString("pt-MZ")}
                  </p>
                </div>
                <span className="h-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                  {u.role}
                </span>
              </article>
            )) : (
              <Empty>Não há contas visíveis.</Empty>
            )}
          </section>

          {/* Categorias */}
          <section id="categorias" className="rounded-2xl border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-extrabold text-ink mb-4">
              Categorias ({categories.data?.length ?? 0})
            </h2>
            <p className="mt-1 text-xs text-slate-500 mb-4">
              Activa ou desactiva categorias sem apagar anúncios.
            </p>
            {categories.data?.map(c => (
              <article key={c.id} className="flex items-center justify-between gap-3 border-b py-3 last:border-0">
                <div>
                  <b className="text-sm text-ink">{c.name}</b>
                  <p className="text-xs text-slate-500 mt-1">
                    /{c.slug} · {c.active ? "Activa" : "Inactiva"}
                  </p>
                </div>
                <CategoryToggle id={c.id} active={c.active} />
              </article>
            ))}
          </section>

          {/* Planos */}
          <section id="planos" className="rounded-2xl border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-extrabold text-ink mb-4">
              Planos ({plans.data?.length ?? 0})
            </h2>
            <p className="mt-1 text-xs text-slate-500 mb-4">
              Consulta preços e activa/desactiva disponibilidade.
            </p>
            {plans.data?.map(p => (
              <article key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0">
                <div>
                  <b className="text-sm text-ink">{p.name}</b>
                  <p className="mt-1 text-xs text-slate-500">
                    {Number(p.price_mzn).toLocaleString("pt-MZ")} MT · limite {p.listing_limit ?? "sem limite"} · {p.active ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <PlanToggle id={p.id} active={p.active} />
              </article>
            ))}
          </section>

          {/* Denúncias */}
          <section id="denuncias" className="rounded-2xl border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-extrabold text-ink mb-4">
              Denúncias abertas ({reports.data?.length ?? 0})
            </h2>
            {reports.data?.length ? reports.data.map(r => {
              const listing = first(r.listing as unknown as { title: string } | { title: string }[] | null);
              const review = first(r.review as unknown as { comment: string } | { comment: string }[] | null);
              return (
                <article key={r.id} className="border-b py-4 last:border-0">
                  <b className="text-sm text-ink">{r.reason}</b>
                  <p className="mt-1 text-xs text-slate-500">
                    {listing?.title ?? review?.comment ?? "Conteúdo relacionado removido"} · {r.status} · {new Date(r.created_at).toLocaleDateString("pt-MZ")}
                  </p>
                  {r.details && <p className="mt-2 text-sm text-slate-600">{r.details}</p>}
                  <div className="mt-2">
                    <ReportDecision id={r.id} status={r.status} />
                  </div>
                </article>
              )) : (
                <Empty>Não há denúncias abertas.</Empty>
              )}
          </section>

          {/* Contactos */}
          <section id="contactos" className="rounded-2xl border bg-white p-5 shadow-soft lg:col-span-2">
            <h2 className="text-xl font-extrabold text-ink mb-4">
              Contactos recentes ({contacts.data?.length ?? 0})
            </h2>
            {contacts.data?.length ? contacts.data.map(c => {
              const listing = first(c.listing as unknown as { title: string } | { title: string }[] | null);
              const seller = first(c.seller as unknown as { business_name: string } | { business_name: string }[] | null);
              return (
                <article key={c.id} className="border-b py-4 last:border-0">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <b className="text-sm text-ink">{c.name} · {c.email}</b>
                      <p className="mt-1 text-xs text-slate-500">
                        {seller?.business_name ?? "Vendedor"} · {listing?.title ?? "Oferta"} · {c.status}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{c.message}</p>
                    </div>
                    <ContactDecision id={c.id} status={c.status} />
                  </div>
                </article>
              )) : (
                <Empty>Não há contactos abertos.</Empty>
              )}
          </section>

          {/* Auditoria */}
          <section id="auditoria" className="rounded-2xl border bg-white p-5 shadow-soft lg:col-span-2">
            <h2 className="text-xl font-extrabold text-ink mb-4">Auditoria recente</h2>
            {audit.data?.length ? audit.data.map(a => (
              <article key={a.id} className="border-b py-4 last:border-0">
                <b className="text-sm text-ink">{a.action}</b>
                <p className="mt-1 text-xs text-slate-500">
                  {a.entity_type} · {a.entity_id ?? "sem ID"} · {new Date(a.created_at).toLocaleDateString("pt-MZ")}
                </p>
              </article>
            )) : (
              <Empty>Ainda não há eventos de auditoria.</Empty>
            )}
          </section>
        </div>

        <p className="mt-8 text-xs text-slate-500 text-center">
          As operações são validadas pelas políticas RLS e funções PostgreSQL. A confirmação de pagamentos continua manual; não há transacções simuladas.
        </p>
      </section>
      <BottomNav role="admin" />
    </main>
  );
}
