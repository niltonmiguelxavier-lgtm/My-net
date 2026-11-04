import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  CreditCard,
  Radio,
  FileCheck2,
  ShieldCheck,
  MessageSquare,
  Star,
  UserRound,
  Zap,
  Store,
  ArrowRight,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/account/BottomNav";
import { CategoryToggle, PlanToggle, ReportDecision, ContactDecision } from "@/components/admin/AdminOperations";
import { ApplicationDecision, ListingDecision, PaymentDecision } from "@/components/admin/AdminActions";

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

type PendingListing = {
  id: string;
  title: string;
  price_mzn: number;
  province: string | null;
  created_at: string;
  seller: { business_name: string } | { business_name: string }[] | null;
};
type PendingPayment = {
  id: string;
  amount_mzn: number;
  method: string | null;
  reference: string | null;
  created_at: string;
  seller: { business_name: string } | { business_name: string }[] | null;
};
type ApplicationRow = { id: string; business_name: string; province: string | null; city: string | null; created_at: string };
type UserRow = { id: string; full_name: string | null; role: string; province: string | null; city: string | null; created_at: string };
type CategoryRow = { id: string; name: string; slug: string; active: boolean };
type PlanRow = { id: string; name: string; price_mzn: number; active: boolean; slug: string | null; listing_limit: number | null };
type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  listing: { title: string } | { title: string }[] | null;
  review: { comment: string } | { comment: string }[] | null;
};
type AuditRow = { id: string; action: string; entity_type: string; entity_id: string | null; created_at: string };
type ContactRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
  listing: { title: string } | { title: string }[] | null;
  seller: { business_name: string } | { business_name: string }[] | null;
};

const fmtDate = (value: string) => new Date(value).toLocaleDateString("pt-MZ");
const fmtMzn = (value: number | null | undefined) => Number(value ?? 0).toLocaleString("pt-MZ");

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">{children}</p>
  );
}

function Card({
  id,
  title,
  hint,
  count,
  wide,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  count?: number;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft ${wide ? "lg:col-span-2" : ""}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-ink">
          {title}
          {typeof count === "number" ? (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{count}</span>
          ) : null}
        </h2>
      </div>
      {hint ? <p className="-mt-1 mb-3 text-xs leading-5 text-slate-500">{hint}</p> : null}
      {children}
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-[11px] font-bold uppercase tracking-wider text-brand">{label}</p>
      <b className="mt-1.5 block text-2xl font-extrabold text-ink">{value}</b>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </article>
  );
}

export default async function AdminPage() {
  const sb = await createSupabaseServerClient();
  if (!sb) redirect("/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }] = await Promise.all([
    sb.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);
  if (profile?.role !== "admin") redirect("/dashboard");

  const [
    { data: apps },
    { data: listings },
    { data: payments },
    { count: sellersCount },
    { count: activeListingsCount },
    { data: users, count: usersCount },
    { data: categories },
    { data: plans },
    { data: reports },
    { data: audit },
    { data: contacts, count: contactsCount },
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
    sb.from("contact_requests").select("id,name,email,message,status,created_at,listing:listings(title),seller:sellers(business_name)", { count: "exact" }).in("status", ["new", "read", "replied"]).order("created_at", { ascending: false }).limit(30),
  ]);

  const appsRows = (apps as ApplicationRow[] | null) ?? [];
  const listingRows = (listings as unknown as PendingListing[] | null) ?? [];
  const paymentRows = (payments as unknown as PendingPayment[] | null) ?? [];
  const userRows = (users as UserRow[] | null) ?? [];
  const categoryRows = (categories as CategoryRow[] | null) ?? [];
  const planRows = (plans as PlanRow[] | null) ?? [];
  const reportRows = (reports as ReportRow[] | null) ?? [];
  const auditRows = (audit as AuditRow[] | null) ?? [];
  const contactRows = (contacts as ContactRow[] | null) ?? [];

  const menu = [
    { href: "#candidaturas", label: "Vendedores", Icon: Building2, badge: appsRows.length },
    { href: "#anuncios", label: "Anúncios", Icon: Zap, badge: listingRows.length },
    { href: "#pagamentos", label: "Pagamentos", Icon: CreditCard, badge: paymentRows.length },
    { href: "#utilizadores", label: "Utilizadores", Icon: UserRound, badge: 0 },
    { href: "#categorias", label: "Categorias", Icon: Radio, badge: 0 },
    { href: "#planos", label: "Planos", Icon: FileCheck2, badge: 0 },
    { href: "#denuncias", label: "Denúncias", Icon: ShieldCheck, badge: reportRows.length },
    { href: "#contactos", label: "Contactos", Icon: MessageSquare, badge: contactsCount ?? 0 },
    { href: "#auditoria", label: "Auditoria", Icon: Star, badge: 0 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-5">
          <Link href="/" className="text-xl font-extrabold text-ink">
            my<span className="text-brand">net</span>
            <span className="ml-2 rounded-full bg-brand-pale px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-brand">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand"
            >
              Conta
            </Link>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-brand">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Painel administrativo</p>
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Operações e moderação</h1>
            <p className="mt-1 text-sm text-slate-600">
              Indicadores reais da plataforma e filas de revisão pendentes.
            </p>
          </div>
          <Link
            href="/pesquisa"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-brand"
          >
            Ver marketplace <ArrowRight size={15} />
          </Link>
        </div>

        {/* Menu administrativo */}
        <nav className="sticky top-[57px] z-30 -mx-4 mt-5 overflow-x-auto border-y border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-5 sm:px-5">
          <div className="flex gap-2">
            {menu.map(({ href, label, Icon, badge }) => (
              <a
                key={label}
                href={href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-brand"
              >
                <Icon size={14} /> {label}
                {badge > 0 ? (
                  <span className="rounded-full bg-brand-pale px-1.5 text-[10px] font-bold text-brand">{badge}</span>
                ) : null}
              </a>
            ))}
          </div>
        </nav>

        {/* Indicadores reais */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Contas registadas" value={usersCount ?? 0} hint="Perfis na plataforma" />
          <Metric label="Vendedores aprovados" value={sellersCount ?? 0} hint="Negócios activos" />
          <Metric label="Anúncios activos" value={activeListingsCount ?? 0} hint="Visíveis no marketplace" />
          <Metric label="Candidaturas pendentes" value={appsRows.length} hint="Aguardam decisão" />
          <Metric label="Pagamentos pendentes" value={paymentRows.length} hint="Confirmação manual" />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card id="candidaturas" title="Candidaturas pendentes" count={appsRows.length}>
            {appsRows.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {appsRows.map((a) => (
                  <article key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-bold text-ink">{a.business_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {a.city ?? "—"}, {a.province ?? "—"} · {fmtDate(a.created_at)}
                    </p>
                    <div className="mt-2">
                      <ApplicationDecision id={a.id} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Não há candidaturas pendentes.</Empty>
            )}
          </Card>

          <Card id="anuncios" title="Anúncios para revisão" count={listingRows.length}>
            {listingRows.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {listingRows.map((l) => (
                  <article key={l.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-bold text-ink">{l.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {first(l.seller)?.business_name ?? "Vendedor"} · {l.province ?? "—"} · {fmtMzn(l.price_mzn)} MT
                    </p>
                    <div className="mt-2">
                      <ListingDecision id={l.id} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Não há anúncios pendentes.</Empty>
            )}
          </Card>

          <Card
            id="pagamentos"
            title="Pedidos de pagamento"
            count={paymentRows.length}
            wide
            hint="A confirmação é manual — não existe aprovação automática nem simulação de transacções."
          >
            {paymentRows.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {paymentRows.map((p) => (
                  <article key={p.id} className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-bold text-ink">{first(p.seller)?.business_name ?? "Vendedor"}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {p.method ?? "método não indicado"} · Ref. {p.reference || "não indicada"} · {fmtDate(p.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <b className="whitespace-nowrap text-sm font-extrabold text-brand">{fmtMzn(p.amount_mzn)} MT</b>
                      <PaymentDecision id={p.id} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Não há pedidos de pagamento para rever.</Empty>
            )}
          </Card>

          <Card
            id="utilizadores"
            title="Contas recentes"
            count={usersCount ?? 0}
            wide
            hint="Consulta apenas. Alteração de papéis e bloqueios exigem operações protegidas."
          >
            {userRows.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {userRows.map((u) => (
                  <article key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{u.full_name || "Sem nome"}</p>
                      <p className="text-xs text-slate-500">
                        {u.province || "Província não indicada"}
                        {u.city ? `, ${u.city}` : ""} · {fmtDate(u.created_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {u.role}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Não há contas visíveis.</Empty>
            )}
          </Card>

          <Card id="categorias" title="Categorias" count={categoryRows.length} hint="Activa ou desactiva sem apagar anúncios.">
            {categoryRows.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {categoryRows.map((c) => (
                  <article key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-ink">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        /{c.slug} · {c.active ? "Activa" : "Inactiva"}
                      </p>
                    </div>
                    <CategoryToggle id={c.id} active={c.active} />
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Não há categorias registadas.</Empty>
            )}
          </Card>

          <Card id="planos" title="Planos" count={planRows.length} hint="Consulta de preços e disponibilidade. As regras comerciais não são alteradas.">
            {planRows.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {planRows.map((p) => (
                  <article key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {fmtMzn(p.price_mzn)} MT · limite {p.listing_limit ?? "sem limite"} · {p.active ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                    <PlanToggle id={p.id} active={p.active} />
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Não há planos registados.</Empty>
            )}
          </Card>

          <Card id="denuncias" title="Denúncias abertas" count={reportRows.length}>
            {reportRows.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {reportRows.map((r) => {
                  const listing = first(r.listing);
                  const review = first(r.review);
                  return (
                    <article key={r.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm font-bold text-ink">{r.reason}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {listing?.title ?? review?.comment ?? "Conteúdo relacionado removido"} · {r.status} · {fmtDate(r.created_at)}
                      </p>
                      {r.details ? <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{r.details}</p> : null}
                      <div className="mt-2">
                        <ReportDecision id={r.id} status={r.status} />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <Empty>Não há denúncias abertas.</Empty>
            )}
          </Card>

          <Card id="contactos" title="Contactos recentes" count={contactsCount ?? 0}>
            {contactRows.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {contactRows.map((c) => (
                  <article key={c.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">
                          {c.name} · <span className="font-medium text-slate-500">{c.email}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {first(c.seller)?.business_name ?? "Vendedor"} · {first(c.listing)?.title ?? "Oferta"} · {c.status}
                        </p>
                      </div>
                      <ContactDecision id={c.id} status={c.status} />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{c.message}</p>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Não há contactos abertos.</Empty>
            )}
          </Card>

          <Card id="auditoria" title="Auditoria recente" count={auditRows.length} wide hint="Registo de operações administrativas já executadas.">
            {auditRows.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {auditRows.map((a) => (
                  <article key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{a.action}</p>
                      <p className="text-xs text-slate-500">
                        {a.entity_type} · {a.entity_id ?? "sem ID"}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-400">{fmtDate(a.created_at)}</time>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>Ainda não há eventos de auditoria.</Empty>
            )}
          </Card>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-soft">
          <Store size={15} className="mt-0.5 shrink-0 text-brand" />
          <p>
            Todas as operações são validadas pelas políticas RLS e funções PostgreSQL existentes. Nenhuma regra de negócio,
            tabela ou integração foi alterada nesta manutenção de interface.
          </p>
        </div>
      </section>
      <BottomNav role="admin" />
    </main>
  );
}