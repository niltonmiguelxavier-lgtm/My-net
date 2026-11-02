import Link from "next/link";
import { ArrowRight, Wifi, ShieldCheck, MapPin, Search, ChevronDown, Menu, X } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PesquisaPage({ searchParams }: { searchParams: { q?: string; category?: string; seller?: string; province?: string } }) {
  const supabase = await createSupabaseServerClient();
  
  let listings: any[] = [];
  let sellers: any[] = [];
  let categories: any[] = [];
  
  const q = searchParams.q || "";
  const categorySlug = searchParams.category || "";
  const sellerId = searchParams.seller || "";
  const province = searchParams.province || "";

  if (supabase) {
    // Lógica de busca (preservando estrutura)
    const [cats, offers, sellersResult] = await Promise.all([
      supabase.from("categories").select("id,name,slug").eq("active", true).order("sort_order"),
      supabase.from("listings").select("id,title,price_mzn,connection_type,advertised_speed_mbps,city,province,seller:sellers(business_name,average_rating,reviews_count),category:categories(name)").eq("status", "active").limit(50),
      supabase.from("sellers").select("id,business_name,province,average_rating,reviews_count").eq("status", "approved").limit(20)
    ]);
    
    categories = cats.data ?? [];
    listings = (offers.data ?? []) as unknown as any[];
    sellers = (sellersResult.data ?? []) as unknown as any[];

    // Filtros simples (simulando lógica de frontend sobre os dados)
    if (q) {
      listings = listings.filter(l => l.title.toLowerCase().includes(q.toLowerCase()) || l.seller?.business_name.toLowerCase().includes(q.toLowerCase()));
    }
    if (categorySlug) {
      listings = listings.filter(l => l.category?.slug === categorySlug);
    }
    if (sellerId) {
      listings = listings.filter(l => l.seller?.id === sellerId);
    }
    if (province) {
      listings = listings.filter(l => l.province?.toLowerCase() === province.toLowerCase());
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header Moderno */}
      <header className="border-b bg-white/90 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-extrabold text-ink">
            my<span className="text-brand">net</span>
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Início</Link>
            <Link href="/planos" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Planos</Link>
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 transition-colors">Entrar</Link>
            <Link href="/register" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors">Criar conta</Link>
          </nav>
          <div className="sm:hidden">
            <button className="text-slate-600 hover:text-brand transition-colors"><Menu size={24}/></button>
          </div>
        </div>
      </header>

      {/* Pesquisa Moderna */}
      <section className="pt-24 pb-12 bg-[#f2f8f6]">
        <div className="mx-auto max-w-7xl px-5">
          <form action="/pesquisa" className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-soft md:flex-row md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Search className="text-brand shrink-0" size={20} />
                <input 
                  name="q" 
                  placeholder="Nome do vendedor, negócio, produto, serviço..." 
                  className="w-full border-0 text-sm focus:ring-0"
                  defaultValue={q}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select 
                name="category" 
                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm bg-white focus:ring-0"
                defaultValue={categorySlug}
              >
                <option value="">Todas as categorias</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48">
              <input 
                name="province" 
                placeholder="Província" 
                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm bg-white focus:ring-0"
                defaultValue={province}
              />
            </div>
            <button className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors">
              Pesquisar <ArrowRight size={18} className="inline ml-1" />
            </button>
          </form>
        </div>
      </section>

      {/* Resultados */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-bold text-brand uppercase tracking-wider">Resultados</p>
            <h2 className="text-3xl font-extrabold text-ink">{listings.length} ofertas encontradas</h2>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Filtros <ChevronDown size={16} className="inline ml-1" />
            </button>
          </div>
        </div>

        {listings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l: any) => (
              <Link 
                key={l.id} 
                href={`/anuncios/${l.id}`} 
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-soft"
              >
                <span className="rounded-full bg-brand-pale px-3 py-1 text-xs font-bold text-brand mb-3 inline-block">
                  {l.category?.name ?? l.connection_type}
                </span>
                <h3 className="text-lg font-bold text-ink mb-2">{l.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{l.seller?.business_name}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">{l.city}, {l.province}</span>
                  <b className="text-lg text-brand">{Number(l.price_mzn).toLocaleString("pt-MZ")} MT</b>
                </div>
              </Link>
            ))
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-xl font-bold text-ink mb-2">Nenhum resultado encontrado</p>
            <p className="text-sm text-slate-500 mb-6">Tenta alterar os filtros ou a pesquisa.</p>
            <Link href="/" className="rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors">
              Voltar ao início
            </Link>
          </div>
        )}

        {/* Vendedores em destaque (Se não houver resultados específicos) */}
        <div className="mt-12">
          <h3 className="text-xl font-extrabold text-ink mb-6">Vendedores em destaque</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sellers.slice(0, 8).map((s: any) => (
              <Link 
                key={s.id} 
                href={`/pesquisa?seller=${s.id}`} 
                className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-ink">{s.business_name}</h3>
                  <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-brand">Aprovado</span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{s.province}</p>
                <p className="text-sm text-amber-600">
                  ★ {Number(s.average_rating).toFixed(1)} <span className="text-slate-500">· {s.reviews_count} avaliações</span>
                </p>
                <button className="mt-4 w-full rounded-lg bg-slate-50 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                  Ver perfil
                </button>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
