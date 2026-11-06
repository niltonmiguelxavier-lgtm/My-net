import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, CircleHelp, Compass, Heart, Settings, Store, UserRound, Search, MessageSquare, Zap, Wifi, Radio } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/account/BottomNav";
import { ProfileEditor, NotificationList } from "@/components/account/AccountTools";
import { UserMenu } from "@/components/account/UserMenu";

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function DashboardPage() {
  const sb = await createSupabaseServerClient();
  if (!sb) return <main className="mx-auto max-w-3xl p-8"><p className="rounded-xl bg-amber-50 p-5 text-amber-900">Configura o Supabase para aceder à tua conta.</p></main>;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  
  const [{ data: profile }, { data: application }, { count: favoritesCount }, { data: notifications }, { count: unreadCount }, { data: recentMessages }] = await Promise.all([
    sb.from("profiles").select("full_name,role,phone,province,city,avatar_path").eq("id", user.id).maybeSingle(),
    sb.from("seller_applications").select("status,business_name").eq("user_id", user.id).maybeSingle(),
    sb.from("favorites").select("listing_id", { count: "exact", head: true }).eq("user_id", user.id),
    sb.from("notifications").select("id,title,body,link,read_at,created_at").eq("user_id", user.id).order("created_at",{ascending:false}).limit(20),
    sb.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",user.id).is("read_at",null),
    sb.from("contact_requests").select("id,message,created_at,listing:listings(title)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const role = profile?.role ?? "customer";
  if (role === "admin") redirect("/admin");
  if (role === "seller") redirect("/vendedor/dashboard");

  return (
    <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Header Moderno */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-extrabold text-ink">
            my<span className="text-brand">net</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/pesquisa"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand sm:block"
            >
              Explorar
            </Link>
            <UserMenu fullName={profile?.full_name ?? "Cliente"} unread={unreadCount ?? 0} />
          </div>
        </div>
      </header>

      {/* Layout Responsivo */}
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar Completa */}
        <aside className="hidden h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-soft lg:block">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
             <div className="w-10 h-10 rounded-full bg-brand-pale flex items-center justify-center text-brand font-bold">
                {profile?.full_name?.charAt(0) || "C"}
             </div>
             <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Olá, {profile?.full_name || "Cliente"}</p>
                <p className="text-sm font-semibold text-ink">{user.email}</p>
             </div>
          </div>
          
          <nav className="grid gap-0.5">
            {[
              { href: "/dashboard", label: "Início", Icon: UserRound },
              { href: "/cliente/favoritos", label: "Favoritos", Icon: Heart },
              { href: "/pesquisa", label: "Explorar", Icon: Compass },
              { href: "/dashboard#mensagens", label: "Mensagens", Icon: MessageSquare },
              { href: "/dashboard#notificacoes", label: "Notificações", Icon: Bell, badge: unreadCount ?? 0 },
              { href: "/dashboard#perfil", label: "Perfil", Icon: Settings },
              { href: "/dashboard#suporte", label: "Ajuda", Icon: CircleHelp }
            ].map(({ href, label, Icon, badge }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-teal-50 hover:text-brand"
              >
                <Icon size={17} />
                <span>{label}</span>
                {badge ? (
                  <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <Link
              href="/vendedor/candidatura"
              className="block rounded-xl bg-brand px-3 py-2.5 text-center text-xs font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Ser vendedor
            </Link>
          </div>
        </aside>

        {/* Área Principal */}
        <section>
          {/* Saudação e Resumo */}
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand">Painel do cliente</p>
            <h1 className="mt-1.5 text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
              Olá{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-600">Descobre fornecedores de internet perto de ti.</p>
          </div>

          {/* Resumo rápido */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Favoritos", value: favoritesCount ?? 0, href: "/cliente/favoritos", cta: "Ver" },
              { label: "Mensagens", value: recentMessages?.length ?? 0, href: "/dashboard#mensagens", cta: "Ver" },
              { label: "Notificações", value: unreadCount ?? 0, href: "/dashboard#notificacoes", cta: "Ver" },
              {
                label: "Candidatura",
                value: application ? String(application.status) : "—",
                href: "/vendedor/candidatura",
                cta: application ? "Consultar" : "Iniciar"
              }
            ].map(({ label, value, href, cta }) => (
              <Link
                key={label}
                href={href}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand">{label}</p>
                <b className="mt-1 block truncate text-2xl font-extrabold capitalize text-ink">{value}</b>
                <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-bold text-brand">
                  {cta} <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          {/* Secção de Descoberta */}
          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-ink">Descoberta</h2>
                <p className="mt-1 text-sm text-slate-500">Encontra o que procuras rapidamente.</p>
              </div>
              <Link href="/pesquisa" className="text-sm font-bold text-brand">Ver tudo</Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
               {[
                 { label: "Vendedores", detail: "Explorar perfis", href: "/pesquisa", Icon: Store },
                 { label: "Produtos", detail: "Comparar ofertas", href: "/pesquisa?type=product", Icon: Zap },
                 { label: "Serviços", detail: "Soluções de internet", href: "/pesquisa?type=service", Icon: Wifi },
                 { label: "Categorias", detail: "Navegar por tipo", href: "/pesquisa#categorias", Icon: Radio }
               ].map((item) => (
                 <Link key={item.label} href={item.href} className="flex items-center gap-4 rounded-2xl border bg-white p-5 transition hover:border-teal-300 hover:shadow-sm">
                   <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-brand">
                     <item.Icon size={20} />
                   </span>
                   <span className="min-w-0 flex-1">
                     <b className="block text-sm text-ink">{item.label}</b>
                     <span className="mt-1 block text-xs text-slate-500">{item.detail}</span>
                   </span>
                   <ArrowRight size={17} className="text-slate-400" />
                 </Link>
               ))}
            </div>
          </section>

          {/* Pesquisa Rápida */}
          <section className="mt-8 rounded-2xl border bg-white p-5 shadow-soft">
             <h2 className="text-lg font-extrabold text-ink mb-4">Pesquisa rápida</h2>
             <form action="/pesquisa" className="flex flex-col gap-2">
                <div className="flex gap-2">
                   <input name="q" placeholder="O que procuras? (Vendedor, Produto...)" className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-0 focus:border-brand" />
                   <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors">
                      <Search size={18} />
                   </button>
                </div>
             </form>
          </section>

          {/* Actividade Recente */}
          <section className="mt-8">
             <h2 className="text-lg font-extrabold text-ink mb-4">Actividade recente</h2>
             <div className="space-y-4">
                {(recentMessages?.length ?? 0) > 0 ? (recentMessages ?? []).map(m => (
                   <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white/50 hover:bg-white transition-colors">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">M</div>
                      <div>
                         <p className="text-sm font-bold text-ink">Mensagem de {first(m.listing)?.title || "Vendedor"}</p>
                         <p className="text-xs text-slate-500 mt-1">{m.message.substring(0, 50)}...</p>
                         <p className="text-[10px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleDateString("pt-MZ")}</p>
                      </div>
                   </div>
                )) : (
                   <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-xl">
                      Ainda não tens mensagens recentes.
                   </p>
                )}
             </div>
          </section>

          {/* Perfil */}
          <section id="perfil" className="mt-8 rounded-2xl border bg-white p-5 shadow-soft">
             <h2 className="text-lg font-extrabold text-ink mb-4">Perfil</h2>
             <ProfileEditor userId={user.id} initial={{
                full_name: profile?.full_name ?? "",
                phone: profile?.phone ?? null,
                province: profile?.province ?? null,
                city: profile?.city ?? null
             }} />
          </section>

          {/* Notificações */}
          <section id="notificacoes" className="mt-8 rounded-2xl border bg-white p-5 shadow-soft">
             <h2 className="flex items-center gap-2 font-extrabold text-ink mb-4">
                <Bell size={18} className="text-brand" /> Notificações
             </h2>
             <p className="mt-2 text-sm text-slate-600 mb-4">
                {unreadCount ? `Tens ${unreadCount} notificação(ões) por ler.` : "Não tens notificações por ler."}
             </p>
             <NotificationList items={(notifications ?? []) as { id: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string }[]} />
          </section>

          {/* Ajuda / Suporte */}
          <section id="suporte" className="mt-8 rounded-2xl border border-teal-100 bg-teal-50 p-5 shadow-soft">
             <h2 className="flex items-center gap-2 font-extrabold text-ink mb-3">
                <CircleHelp size={18} className="text-brand" /> Precisas de ajuda?
             </h2>
             <p className="mt-1 text-sm text-slate-600">
                Para questões sobre uma oferta, usa o botão de contacto. Para gerir a candidatura, consulta o estado abaixo.
             </p>
             <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/pesquisa" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark transition-colors">
                   Explorar ofertas
                </Link>
                <Link href="/vendedor/candidatura" className="rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-bold text-brand hover:bg-teal-50 transition-colors">
                   Candidatura de vendedor
                </Link>
             </div>
             <p className="mt-4 text-xs text-slate-500">
                Estado da candidatura: <span className="font-semibold capitalize">{application?.status ?? "não submetida"}</span>
                {application?.business_name ? ` · ${application.business_name}` : ""}
             </p>
          </section>
        </section>
      </div>
      
      <BottomNav role="customer" />
    </main>
  );
}
