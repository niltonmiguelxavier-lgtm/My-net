import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  CreditCard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  Store,
  Zap,
  Plus,
  TrendingUp,
  Users,
  FileCheck,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/forms/ListingForm";
import { SellerListingActions } from "@/components/forms/SellerListingActions";
import { BottomNav } from "@/components/account/BottomNav";
import { NotificationList } from "@/components/account/AccountTools";
import { ContactDecision } from "@/components/admin/AdminOperations";

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

type ListingRow = { id: string; title: string; status: string; price_mzn: number; created_at: string };
type ContactRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
  listing: { title: string } | { title: string }[] | null;
};
type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer: { full_name: string } | { full_name: string }[] | null;
};
type SubscriptionRow = {
  id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  plan: { name: string; price_mzn: number } | { name: string; price_mzn: number }[] | null;
};
type NotificationRow = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const statusLabel: Record<string, { label: string; className: string }> = {
  active: { label: "Activo", className: "bg-brand-pale text-brand" },
  pending: { label: "A aguardar revisão", className: "bg-amber-50 text-amber-700" },
  paused: { label: "Pausado", className: "bg-slate-100 text-slate-600" },
  rejected: { label: "Recusado", className: "bg-red-50 text-red-700" },
};

const sellerNav = [
  { href: "#inicio", label: "Início", Icon: Store },
  { href: "#anuncios", label: "Ofertas", Icon: Zap },
  { href: "#contactos", label: "Mensagens", Icon: MessageSquare },
  { href: "#avaliacoes", label: "Avaliações", Icon: Star },
  { href: "#subscricao", label: "Plano", Icon: CreditCard },
  { href: "#perfil", label: "Perfil", Icon: Settings },
];

export default async function SellerDashboard() {
  const sb = await createSupabaseServerClient();
  if (!sb) redirect("/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: seller }, { data: cats }] = await Promise.all([
    sb
      .from("sellers")
      .select("id,business_name,status,average_rating,reviews_count,description,phone,email,province,city,business_type")
      .eq("user_id", user.id)
      .maybeSingle(),
    sb.from("categories").select("id,name").eq("active", true).order("sort_order"),
  ]);

  /* ---------- Estado: candidatura pendente ---------- */
  if (!seller || seller.status !== "approved") {
    const { data: application } = await sb
      .from("seller_applications")
      .select("status,business_name,created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const applicationStatus = application?.status as string | undefined;
    const badge =
      applicationStatus === "pending"
        ? { label: "Em análise", className: "bg-amber-50 text-amber-700" }
        : applicationStatus === "approved"
          ? { label: "Aprovada", className: "bg-brand-pale text-brand" }
          : applicationStatus === "rejected"
            ? { label: "Recusada", className: "bg-red-50 text-red-700" }
            : { label: "Não submetida", className: "bg-slate-100 text-slate-600" };

    return (
      <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <Link href="/" className="text-xl font-extrabold text-ink">
              my<span className="text-brand">net</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-semibold text-slate-600 transition-colors hover:text-brand">
                Conta
              </Link>
              <form action="/auth/signout" method="post">
                <button className="text-sm font-semibold text-slate-600 transition-colors hover:text-brand">
                  Terminar sessão
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-5 py-12">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Área de vendedor</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink">Estado da candidatura</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            A tua conta ainda não tem um negócio aprovado. Assim que a candidatura for aprovada, poderás publicar
            ofertas e gerir o teu negócio nesta área.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-pale text-brand">
                <ShieldCheck size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-ink">{application?.business_name ?? "Candidatura não submetida"}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {application?.created_at
                    ? `Submetida em ${new Date(application.created_at).toLocaleDateString("pt-MZ")}`
                    : "Cria a tua candidatura para começar a vender na My Net."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/vendedor/candidatura"
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
              >
                {application ? "Consultar candidatura" : "Criar candidatura"}
              </Link>
              <Link
                href="/pesquisa"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Explorar marketplace
              </Link>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
              <CircleHelp size={18} className="text-brand" /> Enquanto aguardas
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <FileCheck size={16} className="mt-0.5 shrink-0 text-brand" /> Mantém os contactos do negócio actualizados.
              </li>
              <li className="flex gap-2">
                <FileCheck size={16} className="mt-0.5 shrink-0 text-brand" /> Verifica o email para actualizações da equipa.
              </li>
              <li className="flex gap-2">
                <FileCheck size={16} className="mt-0.5 shrink-0 text-brand" /> A revisão pode exigir documentação adicional.
              </li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              A conta mantém o acesso de cliente enquanto a candidatura não for aprovada.
            </p>
          </section>
        </div>
        <BottomNav role="seller" />
      </main>
    );
  }

  /* ---------- Estado: vendedor aprovado ---------- */
  const [
    { data: listings },
    { data: contacts },
    { data: reviews },
    { data: subscriptions },
    { data: notifications },
    { count: unread },
  ] = await Promise.all([
    sb.from("listings").select("id,title,status,price_mzn,created_at").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(50),
    sb
      .from("contact_requests")
      .select("id,name,email,message,status,created_at,listing:listings(title)")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(10),
    sb
      .from("reviews")
      .select("id,rating,comment,status,created_at,customer:profiles(full_name)")
      .eq("seller_id", seller.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10),
    sb
      .from("subscriptions")
      .select("id,status,starts_at,expires_at,plan:plans(name,price_mzn)")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(3),
    sb.from("notifications").select("id,title,body,link,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const listingRows = (listings as ListingRow[] | null) ?? [];
  const contactRows = (contacts as ContactRow[] | null) ?? [];
  const reviewRows = (reviews as ReviewRow[] | null) ?? [];
  const subscriptionRows = (subscriptions as SubscriptionRow[] | null) ?? [];
  const notificationRows = (notifications as NotificationRow[] | null) ?? [];

  const activeCount = listingRows.filter((l) => l.status === "active").length;
  const pendingCount = listingRows.filter((l) => l.status === "pending").length;
  const currentSubscription = subscriptionRows[0] ? first(subscriptionRows[0].plan) : null;

  const metrics = [
    { label: "Ofertas activas", value: activeCount, Icon: Zap, detail: "Visíveis no marketplace" },
    { label: "Em revisão", value: pendingCount, Icon: FileCheck, detail: "Aguardam aprovação" },
    { label: "Avaliação", value: `★ ${Number(seller.average_rating ?? 0).toFixed(1)}`, Icon: Star, detail: `${seller.reviews_count ?? 0} avaliações` },
    { label: "Contactos", value: contactRows.length, Icon: Users, detail: "Pedidos recentes" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-5">
          <Link href="/" className="text-xl font-extrabold text-ink">
            my<span className="text-brand">net</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-600 sm:block">{seller.business_name}</span>
            <a
              href="#notificacoes"
              className="relative rounded-full bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200"
              aria-label="Notificações"
            >
              <Bell size={18} />
              {unread ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </a>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-5 lg:grid-cols-[260px_1fr]">
        {/* Menu lateral */}
        <aside className="hidden h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-soft lg:block">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-pale font-bold text-brand">
              {seller.business_name?.charAt(0) ?? "V"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{seller.business_name}</p>
              <p className="truncate text-xs text-slate-500">{seller.province ?? "—"}</p>
            </div>
          </div>
          <nav className="grid gap-1">
            {sellerNav.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-teal-50 hover:text-brand"
              >
                <Icon size={17} /> {label}
              </a>
            ))}
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <a
              href="#notificacoes"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-teal-50 hover:text-brand"
            >
              <Bell size={17} /> Notificações
              {unread ? <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span> : null}
            </a>
            <a
              href="#ajuda"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-teal-50 hover:text-brand"
            >
              <CircleHelp size={17} /> Suporte
            </a>
          </div>
          <Link
            href={`/pesquisa?seller=${seller.id}`}
            className="mt-3 block rounded-xl bg-brand px-3 py-2.5 text-center text-xs font-bold text-white transition-colors hover:bg-brand-dark"
          >
            Ver perfil público
          </Link>
        </aside>

        <section id="inicio" className="min-w-0">
          {/* Cabeçalho */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand">Painel do vendedor</p>
              <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">{seller.business_name}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-pale px-2.5 py-1 text-xs font-bold text-brand">
                  <ShieldCheck size={13} /> Vendedor aprovado
                </span>
                <span className="text-xs text-slate-500">
                  {seller.city ?? "—"}, {seller.province ?? "—"}
                </span>
              </p>
            </div>
            <Link
              href={`/pesquisa?seller=${seller.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-brand"
            >
              Marketplace <ArrowRight size={15} />
            </Link>
          </div>

          {/* Métricas */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(({ label, value, Icon, detail }) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand">{label}</p>
                  <Icon size={16} className="text-slate-300" />
                </div>
                <b className="mt-2 block text-2xl font-extrabold text-ink">{value}</b>
                <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
              </article>
            ))}
          </div>

          {/* Anúncios + Publicar */}
          <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
            <section id="anuncios" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold text-ink">Os teus anúncios</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Novas ofertas passam por revisão antes de publicação.</p>
                </div>
                <span className="rounded-full bg-brand-pale px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                  {activeCount} activos
                </span>
              </div>

              {listingRows.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {listingRows.map((l) => {
                    const badge = statusLabel[l.status] ?? { label: l.status, className: "bg-slate-100 text-slate-600" };
                    return (
                      <article key={l.id} className="flex flex-wrap items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink">{l.title}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(l.created_at).toLocaleDateString("pt-MZ")}
                            </span>
                          </div>
                          <SellerListingActions id={l.id} status={l.status} />
                        </div>
                        <b className="whitespace-nowrap text-sm font-extrabold text-brand">
                          {Number(l.price_mzn).toLocaleString("pt-MZ")} MT
                        </b>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
                  <Zap size={26} className="mx-auto text-brand" />
                  <p className="mt-3 font-bold text-ink">Ainda não tens anúncios</p>
                  <p className="mt-1 text-sm text-slate-500">Publica a primeira oferta para iniciar a revisão.</p>
                </div>
              )}
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <Plus size={17} className="text-brand" /> Publicar oferta
              </h2>
              <p className="mb-4 mt-1 text-xs leading-5 text-slate-500">
                Os dados são validados pelas regras da base de dados e pelo limite do teu plano.
              </p>
              <ListingForm categories={(cats as { id: string; name: string }[] | null) ?? []} sellerId={seller.id} />
            </aside>
          </div>

          {/* Contactos e Avaliações */}
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <section id="contactos" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink">
                <MessageSquare size={17} className="text-brand" /> Contactos recebidos
              </h2>
              {contactRows.length > 0 ? (
                contactRows.map((c) => (
                  <article key={c.id} className="border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
                    <p className="text-sm font-bold text-ink">
                      {c.name} · <span className="font-medium text-slate-500">{c.email}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {first(c.listing)?.title ?? "Oferta"} · {c.status} ·{" "}
                      {new Date(c.created_at).toLocaleDateString("pt-MZ")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.message}</p>
                    <div className="mt-2">
                      <ContactDecision id={c.id} status={c.status} />
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                  Ainda não recebeste pedidos de contacto.
                </p>
              )}
            </section>

            <section id="avaliacoes" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink">
                <Star size={17} className="text-amber-500" /> Avaliações dos clientes
              </h2>
              {reviewRows.length > 0 ? (
                reviewRows.map((r) => (
                  <article key={r.id} className="border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
                    <p className="text-sm font-bold text-amber-600">
                      {"★".repeat(Math.max(0, Math.min(5, r.rating)))}
                      {"☆".repeat(Math.max(0, 5 - Math.min(5, r.rating)))}
                      <span className="ml-2 font-semibold text-ink">{first(r.customer)?.full_name ?? "Cliente"}</span>
                    </p>
                    {r.comment && <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.comment}</p>}
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                  Ainda não há avaliações publicadas.
                </p>
              )}
            </section>
          </div>

          {/* Plano, Perfil e Notificações */}
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <section id="subscricao" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink">
                <CreditCard size={17} className="text-brand" /> Plano e pagamentos
              </h2>
              {subscriptionRows.length > 0 ? (
                subscriptionRows.map((sub) => {
                  const plan = first(sub.plan);
                  return (
                    <article key={sub.id} className="border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-ink">{plan?.name ?? "Plano"}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                          {sub.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {Number(plan?.price_mzn ?? 0).toLocaleString("pt-MZ")} MT
                        {sub.expires_at ? ` · válido até ${new Date(sub.expires_at).toLocaleDateString("pt-MZ")}` : ""}
                      </p>
                    </article>
                  );
                })
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                  Não há subscrições registadas.
                </p>
              )}
              <Link href="/planos" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                Consultar planos <ArrowRight size={14} />
              </Link>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Os pagamentos são confirmados manualmente pela equipa; não há processamento automático.
              </p>
            </section>

            <section id="perfil" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink">
                <Settings size={17} className="text-brand" /> Perfil comercial
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</dt>
                  <dd className="mt-0.5 break-all font-semibold text-ink">{seller.email}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telefone</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{seller.phone || "Não definido"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Província</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{seller.province || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cidade</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{seller.city || "—"}</dd>
                </div>
              </dl>
              {seller.description ? (
                <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{seller.description}</p>
              ) : null}
              <Link
                href="/vendedor/perfil"
                className="mt-4 block rounded-xl border border-slate-200 py-2.5 text-center text-sm font-bold text-slate-700 transition-colors hover:border-teal-300 hover:text-brand"
              >
                Editar perfil comercial
              </Link>
              <p className="mt-2 text-xs text-slate-400">
                Plano actual: {currentSubscription?.name ?? "sem subscrição activa"}
              </p>
            </section>
          </div>

          {/* Notificações e Ajuda */}
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <section id="notificacoes" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <Bell size={17} className="text-brand" /> Notificações
                {unread ? (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>
                ) : null}
              </h2>
              <NotificationList items={notificationRows} />
            </section>

            <section id="ajuda" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-ink">
                <TrendingUp size={17} className="text-brand" /> Boas práticas
              </h2>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex gap-2">
                  <FileCheck size={15} className="mt-0.5 shrink-0 text-brand" /> Mantém preços e velocidades actualizados.
                </li>
                <li className="flex gap-2">
                  <FileCheck size={15} className="mt-0.5 shrink-0 text-brand" /> Responde aos contactos em menos de 24 horas.
                </li>
                <li className="flex gap-2">
                  <FileCheck size={15} className="mt-0.5 shrink-0 text-brand" /> Descreve a cobertura real do serviço.
                </li>
              </ul>
              <Link
                href="/vendedor/perfil"
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
              >
                Actualizar dados do negócio <ArrowRight size={14} />
              </Link>
            </section>
          </div>
        </section>
      </div>
      <BottomNav role="seller" />
    </main>
  );
}