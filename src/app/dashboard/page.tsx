import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  Compass,
  CreditCard,
  FileCheck2,
  Heart,
  MessageSquare,
  Radio,
  Search,
  Settings,
  Store,
  UserRound,
  Wifi,
  Zap,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/account/BottomNav";
import { ProfileEditor, NotificationList } from "@/components/account/AccountTools";
import { UserMenu } from "@/components/account/UserMenu";

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

type MessageRow = { id: string; message: string; created_at: string; listing: { title: string } | { title: string }[] | null };

const shortcuts = [
  { label: "Vendedores", detail: "Explorar perfis", href: "/pesquisa", Icon: Store },
  { label: "Favoritos", detail: "O que guardaste", href: "/cliente/favoritos", Icon: Heart },
  { label: "Candidatura", detail: "Ser vendedor", href: "/vendedor/candidatura", Icon: FileCheck2 },
  { label: "Planos", detail: "Preços e limites", href: "/planos", Icon: CreditCard },
];

export default async function DashboardPage() {
  const sb = await createSupabaseServerClient();
  if (!sb)
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="rounded-xl bg-amber-50 p-5 text-amber-900">Configura o Supabase para aceder à tua conta.</p>
      </main>
    );

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: application },
    { count: favoritesCount },
    { data: notifications },
    { count: unreadCount },
    { data: recentMessages },
  ] = await Promise.all([
    sb.from("profiles").select("full_name,role,phone,province,city,avatar_path").eq("id", user.id).maybeSingle(),
    sb.from("seller_applications").select("status,business_name").eq("user_id", user.id).maybeSingle(),
    sb.from("favorites").select("listing_id", { count: "exact", head: true }).eq("user_id", user.id),
    sb.from("notifications").select("id,title,body,link,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    sb
      .from("contact_requests")
      .select("id,message,created_at,listing:listings(title)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const role = profile?.role ?? "customer";
  if (role === "admin") redirect("/admin");
  if (role === "seller") redirect("/vendedor/dashboard");

  const messages = (recentMessages as MessageRow[] | null) ?? [];
  const firstName = profile?.full_name?.trim().split(" ")[0] || "Cliente";
  const applicationStatus = application?.status as string | undefined;

  const stats = [
    { label: "Favoritos", value: favoritesCount ?? 0, href: "/cliente/favoritos", hint: "guardados", Icon: Heart },
    { label: "Mensagens", value: messages.length, href: "#actividade", hint: "recentes", Icon: MessageSquare },
    { label: "Notificações", value: unreadCount ?? 0, href: "#notificacoes", hint: "por ler", Icon: Bell },
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
            my<span className="text-brand">net</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/pesquisa"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand sm:inline-flex"
            >
              <Compass size={15} /> Explorar
            </Link>
            <UserMenu fullName={profile?.full_name || "Cliente"} unread={unreadCount ?? 0} role="customer" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-5">
        {/* Saudação */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand">A minha conta</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight text-ink sm:text-3xl">Olá, {firstName}</h1>
            <p className="mt-1 text-sm text-slate-600">Descobre vendedores e gere as tuas compras.</p>
          </div>
          <Link
            href="/pesquisa"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
          >
            <Search size={15} /> Procurar ofertas
          </Link>
        </div>

        {/* Indicadores */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
          {stats.map(({ label, value, href, hint, Icon }) => (
            <Link
              key={label}
              href={href}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-teal-300 sm:p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">{label}</p>
                <Icon size={15} className="text-slate-300" />
              </div>
              <b className="mt-1 block text-2xl font-extrabold text-ink">{value}</b>
              <p className="text-[10px] text-slate-400">{hint}</p>
            </Link>
          ))}
        </div>

        {/* Estado da candidatura (só se existir) */}
        {applicationStatus ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidatura de vendedor</p>
              <p className="mt-0.5 truncate text-sm font-bold capitalize text-ink">{applicationStatus}</p>
            </div>
            <Link href="/vendedor/candidatura" className="shrink-0 text-sm font-bold text-brand hover:underline">
              Consultar
            </Link>
          </div>
        ) : (
          <Link
            href="/vendedor/candidatura"
            className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4 transition-colors hover:bg-teal-100/60"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">Queres vender na My Net?</p>
              <p className="mt-0.5 text-xs text-slate-600">Submete uma candidatura para gerir o teu negócio.</p>
            </div>
            <ArrowRight size={18} className="shrink-0 text-brand" />
          </Link>
        )}

        {/* Atalhos */}
        <section className="mt-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Atalhos</h2>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {shortcuts.map(({ label, detail, href, Icon }) => (
              <Link
                key={label}
                href={href}
                className="rounded-2xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-brand">
                  <Icon size={17} />
                </span>
                <b className="mt-2.5 block text-sm leading-tight text-ink">{label}</b>
                <span className="mt-0.5 block text-[11px] text-slate-500">{detail}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Pesquisa rápida */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <form action="/pesquisa" className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                name="q"
                placeholder="Vendedor, produto ou serviço…"
                className="w-full border-0 bg-transparent py-2.5 text-sm focus:ring-0"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Procurar
            </button>
          </form>
        </section>

        {/* Actividade recente */}
        <section id="actividade" className="mt-6 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
              <MessageSquare size={16} className="text-brand" /> Actividade recente
            </h2>
          </div>
          {messages.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {messages.map((m) => (
                <article key={m.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-50 text-[11px] font-bold text-brand">
                    M
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {first(m.listing)?.title || "Vendedor"}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{m.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(m.created_at).toLocaleDateString("pt-MZ")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              Ainda não contactaste nenhum vendedor.{" "}
              <Link href="/pesquisa" className="font-bold text-brand hover:underline">
                Explorar ofertas
              </Link>
            </p>
          )}
        </section>

        {/* Notificações */}
        <section id="notificacoes" className="mt-6 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
              <Bell size={16} className="text-brand" /> Notificações
              {unreadCount ? (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
              ) : null}
            </h2>
          </div>
          <NotificationList
            items={(notifications ?? []) as { id: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string }[]}
          />
        </section>

        {/* Perfil */}
        <section id="perfil" className="mt-6 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <UserRound size={16} className="text-brand" /> Dados pessoais
          </h2>
          <p className="mt-1 text-xs text-slate-500">Actualiza o nome e a localização usados nos contactos.</p>
          <ProfileEditor
            userId={user.id}
            initial={{
              full_name: profile?.full_name ?? "",
              phone: profile?.phone ?? null,
              province: profile?.province ?? null,
              city: profile?.city ?? null,
            }}
          />
        </section>

        {/* Ajuda */}
        <section id="suporte" className="mt-6 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <CircleHelp size={16} className="text-brand" /> Precisas de ajuda?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Para questões sobre uma oferta, usa o botão de contacto na página do anúncio. Para gerir a conta ou a
            candidatura de vendedor, usa os atalhos abaixo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/pesquisa"
              className="rounded-lg bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand"
            >
              Explorar ofertas
            </Link>
            <Link
              href="/vendedor/candidatura"
              className="rounded-lg bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand"
            >
              Candidatura de vendedor
            </Link>
            <Link
              href="/planos"
              className="rounded-lg bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand"
            >
              Planos
            </Link>
          </div>
        </section>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          My Net · conta de cliente · {user.email}
        </p>
      </div>

      <BottomNav role="customer" />
    </main>
  );
}