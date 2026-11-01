import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, Bookmark, CircleHelp, Compass, CreditCard, FileCheck2, Heart, Settings, ShieldCheck, Store, UserRound } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/account/BottomNav";
import { ProfileEditor, NotificationList } from "@/components/account/AccountTools";

const customerLinks = [
  { href: "/cliente/favoritos", label: "Favoritos", detail: "Serviços que guardaste", Icon: Heart },
  { href: "/pesquisa", label: "Explorar ofertas", detail: "Compara serviços disponíveis", Icon: Compass },
  { href: "/vendedor/candidatura", label: "Candidatura de vendedor", detail: "Consulta ou inicia uma candidatura", Icon: FileCheck2 },
  { href: "/planos", label: "Planos", detail: "Planos e preços para vendedores", Icon: CreditCard },
];
export default async function DashboardPage() {
  const sb = await createSupabaseServerClient();
  if (!sb) return <main className="mx-auto max-w-3xl p-8"><p className="rounded-xl bg-amber-50 p-5 text-amber-900">Configura o Supabase para aceder à tua conta.</p></main>;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: application }, { count: favoritesCount }, { data: notifications }, { count: unreadCount }] = await Promise.all([
    sb.from("profiles").select("full_name,role,phone,province,city").eq("id", user.id).maybeSingle(),
    sb.from("seller_applications").select("status,business_name").eq("user_id", user.id).maybeSingle(),
    sb.from("favorites").select("listing_id", { count: "exact", head: true }).eq("user_id", user.id),
    sb.from("notifications").select("id,title,body,link,read_at,created_at").eq("user_id", user.id).order("created_at",{ascending:false}).limit(20),
    sb.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",user.id).is("read_at",null),
  ]);
  const role = profile?.role ?? "customer";
  if (role === "admin") redirect("/admin");
  if (role === "seller") redirect("/vendedor/dashboard");
  return <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/" className="text-xl font-extrabold text-ink">my<span className="text-brand">net</span></Link><nav className="flex items-center gap-4"><Link href="/pesquisa" className="hidden text-sm font-semibold text-slate-600 sm:block">Explorar</Link><form action="/auth/signout" method="post"><button className="text-sm font-semibold text-slate-600">Terminar sessão</button></form></nav></div></header>
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-9 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border bg-white p-4"><p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">A minha conta</p><nav className="grid gap-1">{[{href:"/dashboard",label:"Visão geral",Icon:UserRound},{href:"/cliente/favoritos",label:"Favoritos",Icon:Heart},{href:"/pesquisa",label:"Explorar",Icon:Compass},{href:"/vendedor/candidatura",label:"Candidatura",Icon:Store},{href:"/dashboard#perfil",label:"Perfil",Icon:Settings},{href:"/dashboard#ajuda",label:"Ajuda",Icon:CircleHelp}].map(({href,label,Icon})=><Link key={label} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-teal-50 hover:text-brand"><Icon size={17}/>{label}</Link>)}</nav><div className="mt-4 border-t pt-4"><Link href="/dashboard#notificacoes" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600"><Bell size={17}/>Notificações{unreadCount ? <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-xs text-white">{unreadCount}</span> : null}</Link></div></aside>
      <section><p className="text-sm font-bold text-brand">PAINEL DO CLIENTE</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Olá{profile?.full_name ? `, ${profile.full_name}` : ""}.</h1><p className="mt-2 text-slate-600">Gere a tua conta e continua a descobrir serviços de conectividade.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Favoritos guardados</p><b className="mt-3 block text-3xl text-ink">{favoritesCount ?? 0}</b><Link href="/cliente/favoritos" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand">Ver favoritos <ArrowRight size={15}/></Link></article><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Notificações por ler</p><b className="mt-3 block text-3xl text-ink">{unreadCount ?? 0}</b><span className="mt-3 block text-sm text-slate-500">Actualizações da tua conta</span></article><article className="rounded-2xl border bg-white p-5" id="perfil"><p className="text-sm text-slate-500">Perfil de cliente</p><b className="mt-3 block truncate text-lg text-ink">{profile?.full_name || "Completa o teu perfil"}</b><span className="mt-2 block truncate text-sm text-slate-500">{user.email}</span><ProfileEditor userId={user.id} initial={{full_name:profile?.full_name??"",phone:profile?.phone??null,province:profile?.province??null,city:profile?.city??null}}/></article></div>
        <section className="mt-8"><div className="flex items-end justify-between"><div><h2 className="text-xl font-extrabold text-ink">Acesso rápido</h2><p className="mt-1 text-sm text-slate-500">Escolhe o que queres fazer a seguir.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{customerLinks.map(({href,label,detail,Icon})=><Link key={label} href={href} className="flex items-center gap-4 rounded-2xl border bg-white p-5 transition hover:border-teal-300 hover:shadow-sm"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-brand"><Icon size={20}/></span><span className="min-w-0 flex-1"><b className="block text-sm text-ink">{label}</b><span className="mt-1 block text-xs text-slate-500">{detail}</span></span><ArrowRight size={17} className="text-slate-400"/></Link>)}</div></section>
        <section id="notificacoes" className="mt-6 rounded-2xl border bg-white p-5"><h2 className="flex items-center gap-2 font-extrabold text-ink"><Bell size={18} className="text-brand"/>Notificações</h2><p className="mt-2 text-sm text-slate-600">{unreadCount ? `Tens ${unreadCount} notificação(ões) por ler.` : "Não tens notificações por ler."}</p><NotificationList items={(notifications??[]) as {id:string;title:string;body:string;link:string|null;read_at:string|null;created_at:string}[]}/></section>
        <section id="ajuda" className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-5"><h2 className="flex items-center gap-2 font-extrabold text-ink"><CircleHelp size={18} className="text-brand"/>Precisas de ajuda?</h2><p className="mt-2 text-sm text-slate-600">Para questões sobre uma oferta, usa o botão de contacto na página do anúncio. Para gerir a candidatura, consulta o respectivo estado abaixo.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/pesquisa" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Explorar ofertas</Link><Link href="/vendedor/candidatura" className="rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-bold text-brand">Candidatura de vendedor</Link></div><p className="mt-4 text-xs text-slate-500">Estado da candidatura: <span className="font-semibold capitalize">{application?.status ?? "não submetida"}</span>{application?.business_name ? ` · ${application.business_name}` : ""}</p></section>
      </section>
    </div>
    <BottomNav role="customer"/>
  </main>;
}
