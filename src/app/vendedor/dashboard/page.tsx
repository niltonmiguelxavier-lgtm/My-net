import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, CircleHelp, CreditCard, MessageSquare, Settings, ShieldCheck, Star, Store, Search, Wifi, Radio, Zap, Menu, X } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/forms/ListingForm";
import { SellerListingActions } from "@/components/forms/SellerListingActions";
import { BottomNav } from "@/components/account/BottomNav";
import { NotificationList } from "@/components/account/AccountTools";
import { ContactDecision } from "@/components/admin/AdminOperations";

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function SellerDashboard() {
  const sb = await createSupabaseServerClient();
  if (!sb) redirect("/login");
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: seller }, { data: cats }] = await Promise.all([
    sb.from("sellers").select("id,business_name,status,average_rating,reviews_count,description,phone,email,province,city,logo_url,avatar_url").eq("user_id", user.id).maybeSingle(),
    sb.from("categories").select("id,name").eq("active", true).order("sort_order"),
  ]);

  // Se não aprovado, mostrar estado de candidatura
  if (!seller || seller.status !== "approved") {
    const { data: application } = await sb.from("seller_applications").select("status,business_name,created_at").eq("user_id", user.id).maybeSingle();
    return (
      <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
        <header className="border-b bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <Link href="/" className="text-xl font-extrabold text-ink">
              my<span className="text-brand">net</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm font-semibold text-slate-600 sm:block">
                {application?.business_name || "Candidatura Pendente"}
              </span>
              <form action="/auth/signout" method="post">
                <button className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">
                  Terminar sessão
                </button>
              </form>
            </div>
          </div>
        </header>
        
        <div className="mx-auto max-w-7xl px-5 py-12">
          <Link href="/" className="font-extrabold text-ink">my<span className="text-brand">net</span></Link>
          <h1 className="mt-8 text-3xl font-extrabold text-ink">Painel de Vendedor: Candidatura Pendente</h1>
          <p className="mt-3 text-slate-600 max-w-2xl">
            A tua candidatura está em análise pela equipa My Net. Assim que aprovada, poderás gerir o teu negócio, publicar ofertas e interagir com clientes.
          </p>
          
          <div className="mt-8 rounded-2xl border bg-white p-6 shadow-soft">
            <h2 className="text-xl font-extrabold text-ink mb-4">Estado da Candidatura</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-pale flex items-center justify-center text-brand">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-lg font-bold text-ink">{application?.status === "pending" ? "Pendente de Aprovação" : application?.status || "Não submetida"}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {application?.business_name ? `Negócio: ${application.business_name}` : "Cria a tua candidatura para começar."}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Submetida em: {application?.created_at ? new Date(application.created_at).toLocaleDateString("pt-MZ") : "N/A"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Link href="/vendedor/candidatura" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors">
                Consultar candidatura
              </Link>
              <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Voltar ao início
              </Link>
            </div>
          </div>

          <section className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <h3 className="text-xl font-extrabold text-ink mb-2">Instruções Importantes</h3>
            <p className="text-sm text-slate-500 mb-4">
              Enquanto a candidatura estiver pendente, não poderás publicar anúncios ou gerir pagamentos.
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 max-w-md mx-auto">
              <li>Mantém os teus contactos atualizados no perfil.</li>
              <li>Verifica o teu email regularmente para atualizações.</li>
              <li>A equipa entrará em contacto caso seja necessária documentação adicional.</li>
            </ul>
          </section>
        </div>
        <BottomNav role="seller" />
      </main>
    );
  }

  // Se aprovado
  const [{ data: listings }, { data: contacts }, { data: reviews }, { data: subscriptions }, { data: notifications }, { count: unread }] = await Promise.all([
    sb.from("listings").select("id,title,status,price_mzn,created_at").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(50),
    sb.from("contact_requests").select("id,name,email,message,status,created_at,listing:listings(title)").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(10),
    sb.from("reviews").select("id,rating,comment,status,created_at,customer:profiles(full_name)").eq("seller_id", seller.id).eq("status", "published").order("created_at", { ascending: false }).limit(10),
    sb.from("subscriptions").select("id,status,starts_at,expires_at,plan:plans(name,price_mzn)").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(3),
    sb.from("notifications").select("id,title,body,link,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const activeCount = (listings ?? []).filter(x => x.status === "active").length;

  return (
    <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="border-b bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-extrabold text-ink">
            my<span className="text-brand">net</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-semibold text-slate-600 sm:block">{seller.business_name}</span>
            <form action="/auth/signout" method="post">
              <button className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">
                Terminar sessão
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar Completa */}
        <aside className="h-fit rounded-2xl border bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
             <div className="w-10 h-10 rounded-full bg-brand-pale flex items-center justify-center text-brand font-bold">
                {seller.business_name?.charAt(0) || "V"}
             </div>
             <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{seller.business_name}</p>
                <p className="text-sm font-semibold text-ink">{seller.email}</p>
             </div>
          </div>
          
          <nav className="grid gap-1">
            {[
              { href: "/vendedor/dashboard#inicio", label: "Início", Icon: Store, detail: "Dashboard comercial" },
              { href: "/vendedor/dashboard#anuncios", label: "Produtos e Serviços", Icon: Zap, detail: "Publicações" },
              { href: "/vendedor/dashboard#contactos", label: "Mensagens", Icon: MessageSquare, detail: "Conversas" },
              { href: "/vendedor/dashboard#avaliacoes", label: "Avaliações", Icon: Star, detail: "Feedback" },
              { href: "/vendedor/dashboard#subscricao", label: "Meu Plano", Icon: CreditCard, detail: "Pagamentos" },
              { href: "/vendedor/dashboard#perfil", label: "Perfil", Icon: Settings, detail: "Negócio" },
              { href: "/vendedor/dashboard#ajuda", label: "Suporte", Icon: CircleHelp, detail: "Ajuda" }
            ].map(({ href, label, Icon, detail }) => (
              <a 
                key={label} 
                href={href} 
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-teal-50 hover:text-brand transition-all"
              >
                <Icon size={18} />
                <div>
                  <span className="block">{label}</span>
                  <span className="text-[10px] text-slate-400">{detail}</span>
                </div>
              </a>
            ))}
          </nav>
          
          <div className="mt-4 border-t pt-4">
            <a href="/vendedor/dashboard#notificacoes" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-teal-50 hover:text-brand transition-all">
              <Bell size={18} />
              Notificações
              {unread ? <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-xs text-white">{unread}</span> : null}
            </a>
          </div>
        </aside>

        {/* Área Principal */}
        <section>
          {/* Cabeçalho */}
          <div className="mb-8">
             <p className="text-sm font-bold text-brand uppercase tracking-wider">PAINEL DO VENDEDOR</p>
             <h1 className="mt-2 text-3xl font-extrabold text-ink">{seller.business_name}</h1>
             <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <ShieldCheck size={16} className="text-brand" /> Vendedor aprovado · {seller.city}, {seller.province}
             </p>
          </div>

          {/* Cartões de Resumo */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-brand uppercase">Anúncios Ativos</p>
              <b className="mt-2 block text-3xl text-ink">{activeCount}</b>
            </article>
            <article className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-brand uppercase">Total Publicações</p>
              <b className="mt-2 block text-3xl text-ink">{listings?.length ?? 0}</b>
            </article>
            <article className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-brand uppercase">Avaliação</p>
              <b className="mt-2 block text-3xl text-ink">★ {Number(seller.average_rating).toFixed(1)}</b>
            </article>
            <article className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-bold text-brand uppercase">Contactos</p>
              <b className="mt-2 block text-3xl text-ink">{contacts?.length ?? 0}</b>
            </article>
          </div>

          {/* Área de Gestão */}
          <section id="inicio" className="mt-8">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-ink">Gestão Comercial</h2>
                <p className="mt-1 text-sm text-slate-500">Controlo total sobre o teu negócio.</p>
              </div>
              <Link href={`/pesquisa?seller=${seller.id}`} className="text-sm font-bold text-brand">
                Ver Marketplace <ArrowRight size={14} className="inline" />
              </Link>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
              {/* Publicações */}
              <div className="rounded-2xl border bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-xl font-extrabold text-ink">Os teus anúncios</h2>
                  <span className="text-xs font-bold text-brand uppercase tracking-wider">
                    {activeCount} Ativos
                  </span>
                </div>
                {listings?.length ? (
                  <div className="divide-y">
                    {listings.map(l => (
                      <div key={l.id} className="flex justify-between gap-4 py-4 hover:bg-slate-50 transition-colors px-2 rounded-xl">
                        <div className="min-w-0">
                          <Link className="font-bold text-ink hover:text-brand transition-colors" href={l.status === "active" ? `/anuncios/${l.id}` : "#anuncios"}>
                            {l.title}
                          </Link>
                          <p className="mt-1 text-xs capitalize text-slate-500">Estado: {l.status}</p>
                          <SellerListingActions id={l.id} status={l.status} />
                        </div>
                        <b className="whitespace-nowrap text-brand">{Number(l.price_mzn).toLocaleString("pt-MZ")} MT</b>
                      </div>
                    ))
                  }
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed p-6 text-sm text-slate-500 text-center">
                    Ainda não tens anúncios. Cria uma oferta para iniciar a revisão.
                  </p>
                )}
              </div>

              {/* Publicar Oferta */}
              <aside className="h-fit rounded-2xl border bg-white p-5 shadow-soft">
                <h2 className="mb-4 text-xl font-extrabold text-ink">Publicar uma oferta</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Os novos anúncios são submetidos para revisão antes de aparecerem no marketplace.
                </p>
                <ListingForm categories={cats ?? []} sellerId={seller.id} />
              </aside>
            </div>

            {/* Contactos e Avaliações */}
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <section id="contactos" className="rounded-2xl border bg-white p-5 shadow-soft">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink mb-4">
                  <MessageSquare size={18} className="text-brand" /> Contactos recebidos
                </h2>
                {contacts?.length ? contacts.map(c => (
                  <article key={c.id} className="border-b py-3 last:border-0">
                    <p className="font-bold text-sm text-ink">{c.name} · {c.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {first(c.listing)?.title ?? "Oferta"} · {c.status} · {new Date(c.created_at).toLocaleDateString("pt-MZ")}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{c.message}</p>
                    <div className="mt-2">
                      <ContactDecision id={c.id} status={c.status} />
                    </div>
                  </article>
                )) : (
                  <p className="mt-3 text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-xl">
                    Ainda não recebeste pedidos de contacto.
                  </p>
                )}
              </section>

              <section id="avaliacoes" className="rounded-2xl border bg-white p-5 shadow-soft">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink mb-4">
                  <Star size={18} className="text-amber-500" /> Avaliações dos clientes
                </h2>
                {reviews?.length ? reviews.map(r => (
                  <article key={r.id} className="border-b py-3 last:border-0">
                    <p className="font-bold text-amber-600">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} <span className="text-sm text-ink ml-2">{first(r.customer)?.full_name ?? "Cliente"}</span>
                    </p>
                    {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
                  </article>
                )) : (
                  <p className="mt-3 text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-xl">
                    Ainda não há avaliações publicadas.
                  </p>
                )}
              </section>
            </div>

            {/* Plano e Pagamentos */}
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <section id="subscricao" className="rounded-2xl border bg-white p-5 shadow-soft">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink mb-4">
                  <CreditCard size={18} className="text-brand" /> Plano e pagamentos
                </h2>
                {subscriptions?.length ? subscriptions.map(sub => (
                  <article key={sub.id} className="border-b py-3 last:border-0">
                    <p className="font-bold text-ink">
                      {first(sub.plan)?.name ?? "Plano"} · {sub.status}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {Number(first(sub.plan)?.price_mzn ?? 0).toLocaleString("pt-MZ")} MT
                      {sub.expires_at ? ` · válido até ${new Date(sub.expires_at).toLocaleDateString("pt-MZ")}` : ""}
                    </p>
                  </article>
                )) : (
                  <p className="mt-3 text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-xl">
                    Não há subscrições registadas.
                  </p>
                )}
                <Link href="/planos" className="mt-4 inline-block text-sm font-bold text-brand hover:underline">
                  Consultar planos e solicitar subscrição →
                </Link>
                <p className="mt-2 text-xs text-slate-500">
                  Os pagamentos são confirmados manualmente pela equipa; não há processamento automático.
                </p>
              </section>

              <section id="perfil" className="rounded-2xl border bg-white p-5 shadow-soft">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink mb-4">
                  <Settings size={18} className="text-brand" /> Perfil comercial
                </h2>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-xs text-slate-500 uppercase">Email</p>
                         <p className="font-semibold text-sm break-all">{seller.email}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-500 uppercase">Telefone</p>
                         <p className="font-semibold text-sm">{seller.phone || "Não definido"}</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-xs text-slate-500 uppercase">Província</p>
                         <p className="font-semibold text-sm">{seller.province}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-500 uppercase">Cidade</p>
                         <p className="font-semibold text-sm">{seller.city}</p>
                      </div>
                   </div>
                   {/* Botão de Edição */}
                   <button className="w-full rounded-lg bg-slate-50 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                      Editar Perfil Comercial
                   </button>
                </div>
              </section>
            </div>
          </section>
        </section>
      </div>
      <BottomNav role="seller" />
    </main>
  );
}
