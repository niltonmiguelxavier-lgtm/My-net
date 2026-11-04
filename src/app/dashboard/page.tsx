import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, CircleHelp, Compass, CreditCard, Heart, Settings, Store, UserRound, Search, MessageSquare, Star, Zap, Wifi, Radio } from "lucide-react";
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
  
  const [{ data: profile }, { data: application }, { count: favoritesCount }, { data: notifications }, { count: unreadCount }, { data: recentMessages }, { data: recentPayments }] = await Promise.all([
    sb.from("profiles").select("full_name,role,phone,province,city,avatar_url").eq("id", user.id).maybeSingle(),
    sb.from("seller_applications").select("status,business_name").eq("user_id", user.id).maybeSingle(),
    sb.from("favorites").select("listing_id", { count: "exact", head: true }).eq("user_id", user.id),
    sb.from("notifications").select("id,title,body,link,read_at,created_at").eq("user_id", user.id).order("created_at",{ascending:false}).limit(20),
    sb.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",user.id).is("read_at",null),
    sb.from("contact_requests").select("id,message,created_at,listing:listings(title)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(5),
    sb.from("payment_requests").select("id,amount_mzn,status,created_at").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(5)
  ]);

  const role = profile?.role ?? "customer";
  if (role === "admin") redirect("/admin");
  if (role === "seller") redirect("/vendedor/dashboard");

  return (
    <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Header Moderno */}
      <header className="border-b bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-extrabold text-ink">
            my<span className="text-brand">net</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pesquisa" className="hidden text-sm font-semibold text-slate-600 sm:block hover:text-brand transition-colors">
              Explorar
            </Link>
            <form action="/auth/signout" method="post">
              <button className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">
                Terminar sessão
              </button>
            </form>
          </nav>
          {/* User menu (client) */}
          <UserMenu fullName={profile?.full_name ?? "Cliente"} unread={unreadCount ?? 0} />
        </div>
      </header>

      {/* Layout Responsivo */}
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar Completa */}
        <aside className="h-fit rounded-2xl border bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
             <div className="w-10 h-10 rounded-full bg-brand-pale flex items-center justify-center text-brand font-bold">
                {profile?.full_name?.charAt(0) || "C"}
             </div>
             <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Olá, {profile?.full_name || "Cliente"}</p>
                <p className="text-sm font-semibold text-ink">{user.email}</p>
             </div>
          </div>
          
          <nav className="grid gap-1">
            {[
              { href: "/dashboard", label: "Início", Icon: UserRound, detail: "Dashboard principal" },
              { href: "/cliente/favoritos", label: "Favoritos", Icon: Heart, detail: "Vendedores guardados" },
              { href: "/pesquisa", label: "Explorar", Icon: Compass, detail: "Encontrar vendedores" },
              { href: "/pesquisa?category=all", label: "Categorias", Icon: Zap, detail: "Serviços e produtos" },
              { href: "/pesquisa?featured=true", label: "Destaque", Icon: Star, detail: "Vendedores em destaque" },
              { href: "/dashboard#mensagens", label: "Mensagens", Icon: MessageSquare, detail: "Conversas com vendedores" },
              { href: "/dashboard#notificacoes", label: "Notificações", Icon: Bell, detail: "Actualizações" },
              { href: "/dashboard#pagamentos", label: "Pagamentos", Icon: CreditCard, detail: "Histórico" },
              { href: "/dashboard#perfil", label: "Perfil", Icon: Settings, detail: "Informações pessoais" },
              { href: "/dashboard#suporte", label: "Suporte", Icon: CircleHelp, detail: "Ajuda" }
            ].map(({ href, label, Icon, detail }) => (
              <Link 
                key={label} 
                href={href} 
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-teal-50 hover:text-brand transition-all"
              >
                <Icon size={18} />
                <div>
                  <span className="block">{label}</span>
                  <span className="text-[10px] text-slate-400">{detail}</span>
                </div>
              </Link>
            ))}
          </nav>
          
          <div className="mt-4 border-t pt-4">
            <Link href="/dashboard#notificacoes" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-teal-50 hover:text-brand transition-all">
              <Bell size={18} />
              Notificações
              {unreadCount ? <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-xs text-white">{unreadCount}</span> : null}
            </Link>
          </div>
        </aside>

        {/* Área Principal */}
        <section>
          {/* Saudação e Resumo */}
          <div className="mb-8">
             <p className="text-sm font-bold text-brand uppercase tracking-wider">PAINEL DO CLIENTE</p>
             <h1 className="mt-2 text-3xl font-extrabold text-ink">
                Olá{profile?.full_name ? `, ${profile.full_name}` : ""}! Bem-vindo ao My Net.
             </h1>
             <p className="mt-2 text-slate-600">Gere a tua conta, descobre vendedores e gere as tuas compras.</p>
          </div>

          {/* Cartões de Resumo */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-brand uppercase">Favoritos</p>
              <b className="mt-2 block text-3xl text-ink">{favoritesCount ?? 0}</b>
              <Link href="/cliente/favoritos" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                Ver <ArrowRight size={14} />
              </Link>
            </article>
            <article className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-brand uppercase">Mensagens</p>
              <b className="mt-2 block text-3xl text-ink">{recentMessages?.length ?? 0}</b>
              <Link href="/dashboard#mensagens" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                Ver <ArrowRight size={14} />
              </Link>
            </article>
            <article className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-brand uppercase">Notificações</p>
              <b className="mt-2 block text-3xl text-ink">{unreadCount ?? 0}</b>
              <Link href="/dashboard#notificacoes" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                Ver <ArrowRight size={14} />
              </Link>
            </article>
            <article className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-brand uppercase">Pagamentos</p>
              <b className="mt-2 block text-3xl text-ink">{recentPayments?.length ?? 0}</b>
              <Link href="/dashboard#pagamentos" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                Ver <ArrowRight size={14} />
              </Link>
            </article>
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
