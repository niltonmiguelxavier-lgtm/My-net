import Link from "next/link";
import { ArrowRight, Search, ChevronDown, Menu, MapPin, Star, SlidersHorizontal } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = { q?: string; category?: string; seller?: string; province?: string };

type ListingRow = {
  id: string;
  title: string;
  price_mzn: number;
  connection_type: string | null;
  advertised_speed_mbps: number | null;
  city: string | null;
  province: string | null;
  seller: { id: string; business_name: string; average_rating: number | null; reviews_count: number | null } | null;
  category: { name: string; slug: string } | null;
};

type SellerRow = {
  id: string;
  business_name: string;
  province: string | null;
  average_rating: number | null;
  reviews_count: number | null;
};

type CategoryRow = { id: string; name: string; slug: string };

function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function PesquisaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const categorySlug = params.category?.trim() ?? "";
  const sellerId = params.seller?.trim() ?? "";
  const province = params.province?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  let listings: ListingRow[] = [];
  let sellers: SellerRow[] = [];
  let categories: CategoryRow[] = [];

  if (supabase) {
    const [cats, offers, sellersResult] = await Promise.all([
      supabase.from("categories").select("id,name,slug").eq("active", true).order("sort_order"),
      supabase
        .from("listings")
        .select(
          "id,title,price_mzn,connection_type,advertised_speed_mbps,city,province,seller:sellers(id,business_name,average_rating,reviews_count),category:categories(name,slug)"
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("sellers")
        .select("id,business_name,province,average_rating,reviews_count")
        .eq("status", "approved")
        .limit(12),
    ]);

    categories = (cats.data as CategoryRow[] | null) ?? [];
    sellers = (sellersResult.data as SellerRow[] | null) ?? [];

    const rawListings = (offers.data as unknown as Record<string, unknown>[] | null) ?? [];
    listings = rawListings.map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      price_mzn: Number(row.price_mzn ?? 0),
      connection_type: (row.connection_type as string | null) ?? null,
      advertised_speed_mbps: row.advertised_speed_mbps === null ? null : Number(row.advertised_speed_mbps),
      city: (row.city as string | null) ?? null,
      province: (row.province as string | null) ?? null,
      seller: first(row.seller as ListingRow["seller"] | ListingRow["seller"][] | null),
      category: first(row.category as ListingRow["category"] | ListingRow["category"][] | null),
    }));

    if (q) {
      const needle = q.toLowerCase();
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(needle) ||
          (l.seller?.business_name ?? "").toLowerCase().includes(needle)
      );
    }
    if (categorySlug) listings = listings.filter((l) => l.category?.slug === categorySlug);
    if (sellerId) listings = listings.filter((l) => l.seller?.id === sellerId);
    if (province) listings = listings.filter((l) => (l.province ?? "").toLowerCase() === province.toLowerCase());
  }

  const hasFilters = Boolean(q || categorySlug || sellerId || province);

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-extrabold text-ink">
            my<span className="text-brand">net</span>
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            <Link href="/" className="text-sm font-semibold text-slate-600 transition-colors hover:text-brand">
              Início
            </Link>
            <Link href="/pesquisa" className="text-sm font-semibold text-brand">
              Explorar
            </Link>
            <Link href="/planos" className="text-sm font-semibold text-slate-600 transition-colors hover:text-brand">
              Planos
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-slate-50"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Criar conta
            </Link>
          </nav>
          <Link href="/" className="text-slate-600 transition-colors hover:text-brand sm:hidden" aria-label="Início">
            <Menu size={22} />
          </Link>
        </div>
      </header>

      {/* Pesquisa e filtros */}
      <section className="border-b border-slate-200 bg-[#f2f8f6] py-10">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Explorar marketplace</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">Encontra o fornecedor certo</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Pesquisa por negócio, oferta ou província. Resultados apenas de vendedores aprovados.
          </p>

          <form
            action="/pesquisa"
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft md:flex-row md:items-center"
          >
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 px-3">
              <Search className="shrink-0 text-brand" size={18} />
              <input
                name="q"
                defaultValue={q}
                placeholder="Nome do vendedor, negócio, produto ou serviço..."
                className="w-full border-0 bg-transparent py-2.5 text-sm focus:ring-0"
              />
            </div>
            <select
              name="category"
              defaultValue={categorySlug}
              className="w-full rounded-xl border border-slate-200 py-2.5 text-sm focus:ring-0 md:w-48"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 md:w-44">
              <MapPin className="shrink-0 text-slate-400" size={16} />
              <input
                name="province"
                defaultValue={province}
                placeholder="Província"
                className="w-full border-0 bg-transparent py-2.5 text-sm focus:ring-0"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
              Pesquisar <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>

      {/* Resultados */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Resultados</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">
              {listings.length} {listings.length === 1 ? "oferta encontrada" : "ofertas encontradas"}
            </h2>
            {hasFilters && (
              <p className="mt-1 text-xs text-slate-500">
                Filtros activos{q ? ` · “${q}”` : ""}
                {categorySlug ? ` · categoria ${categorySlug}` : ""}
                {province ? ` · ${province}` : ""}
                {sellerId ? " · vendedor selecionado" : ""}
              </p>
            )}
          </div>
          <Link
            href="/pesquisa"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <SlidersHorizontal size={15} /> Limpar filtros
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <article
                key={l.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-soft"
              >
                <span className="mb-3 inline-flex w-fit rounded-full bg-brand-pale px-3 py-1 text-xs font-bold text-brand">
                  {l.category?.name ?? l.connection_type ?? "Oferta"}
                </span>
                <h3 className="text-lg font-bold leading-snug text-ink">{l.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {l.seller?.business_name ?? "Vendedor"} · {l.city ?? "—"}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">
                    {l.province ?? "—"}
                    {l.advertised_speed_mbps ? ` · ${l.advertised_speed_mbps} Mbps` : ""}
                  </span>
                  <b className="whitespace-nowrap text-lg text-brand">
                    {l.price_mzn.toLocaleString("pt-MZ")} MT
                  </b>
                </div>
                <Link
                  href={`/pesquisa?seller=${l.seller?.id ?? ""}`}
                  className="mt-4 rounded-lg bg-slate-50 py-2 text-center text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand"
                >
                  Ver vendedor
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-xl font-bold text-ink">Nenhum resultado encontrado</p>
            <p className="mt-2 text-sm text-slate-500">
              {hasFilters
                ? "Tenta ajustar a pesquisa, a categoria ou a província."
                : "Ainda não existem ofertas publicadas nesta área."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/pesquisa"
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
              >
                Ver todas as ofertas
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        )}

        {/* Vendedores em destaque */}
        <div className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h3 className="text-xl font-extrabold text-ink">Vendedores aprovados</h3>
            <span className="text-xs font-semibold text-slate-500">{sellers.length} visíveis</span>
          </div>
          {sellers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sellers.slice(0, 8).map((s) => (
                <Link
                  key={s.id}
                  href={`/pesquisa?seller=${s.id}`}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-soft"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h4 className="font-bold leading-snug text-ink">{s.business_name}</h4>
                    <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                      Aprovado
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{s.province ?? "—"}</p>
                  <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-amber-600">
                    <Star size={14} className="fill-amber-500 text-amber-500" />
                    {Number(s.average_rating ?? 0).toFixed(1)}
                    <span className="font-normal text-slate-400">· {s.reviews_count ?? 0} avaliações</span>
                  </p>
                  <span className="mt-4 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-50 py-2 text-xs font-bold text-slate-600">
                    Ver ofertas <ChevronDown size={13} className="-rotate-90" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Ainda não há vendedores aprovados para apresentar.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}