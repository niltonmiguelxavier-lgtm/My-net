import Link from "next/link";
import { Search, MapPin } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeSearchTerm } from "@/lib/marketplace/rules";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type SortChoice = "newest" | "price_asc" | "price_desc" | "rating" | "popular";
type SearchListing = { id: string; title: string; description: string; price_mzn: number; connection_type: string; advertised_speed_mbps: number | null; city: string; province: string; views_count: number; seller: { business_name: string; average_rating: number; reviews_count: number } | null; category: { name: string; slug: string } | null };
type SearchCategory = { id: string; name: string; slug: string };
export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? sanitizeSearchTerm(params.q) : "";
  const province = typeof params.province === "string" ? params.province.trim() : "";
  const category = typeof params.category === "string" ? params.category : "";
  const type = typeof params.type === "string" ? params.type.trim() : "";
  const min = Number(params.min ?? ""); const max = Number(params.max ?? ""); const speed = Number(params.speed ?? "");
  const sortChoices: readonly SortChoice[] = ["newest", "price_asc", "price_desc", "rating", "popular"];
  const requestedSort = typeof params.sort === "string" ? params.sort : "";
  const sort: SortChoice = sortChoices.includes(requestedSort as SortChoice) ? requestedSort as SortChoice : "newest";
  const order = sort === "price_asc" ? {column:"price_mzn",ascending:true} : sort === "price_desc" ? {column:"price_mzn",ascending:false} : sort === "popular" ? {column:"views_count",ascending:false} : {column:"created_at",ascending:false};
  const supabase = await createSupabaseServerClient();
  let rows: SearchListing[] = []; let categories: SearchCategory[] = []; let message = "";
  if (supabase) {
    let query = supabase.from("listings").select("id,title,description,price_mzn,connection_type,advertised_speed_mbps,city,province,views_count,seller:sellers(business_name,average_rating,reviews_count),category:categories!inner(name,slug)").eq("status", "active").order(order.column,{ascending:order.ascending}).limit(100);
    if(q) query=query.ilike("title",`%${q}%`);
    if(province) query=query.ilike("province",`%${province}%`);
    if(type) query=query.ilike("connection_type",`%${type}%`);
    if(category) query=query.eq("category.slug",category);
    if(Number.isFinite(min)&&min>=0)query=query.gte("price_mzn",min);
    if(Number.isFinite(max)&&max>0)query=query.lte("price_mzn",max);
    if(Number.isFinite(speed)&&speed>0)query=query.gte("advertised_speed_mbps",speed);
    const [result, cats]=await Promise.all([query,supabase.from("categories").select("id,name,slug").eq("active",true).order("sort_order")]);
    if(result.error) message="Não foi possível carregar os anúncios. Confirma a configuração e as migrations do Supabase.";
    rows=(result.data??[]) as unknown as SearchListing[];categories=cats.data??[];
    if(sort==="rating")rows.sort((a,b)=>Number(b.seller?.average_rating??0)-Number(a.seller?.average_rating??0));
  } else message="O catálogo real ficará disponível depois de configurar o Supabase.";
  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link href="/" className="text-xl font-extrabold text-ink">my<span className="text-brand">net</span></Link><Link href="/login" className="text-sm font-bold text-brand">Entrar</Link></div></header><div className="mx-auto max-w-7xl px-5 py-9"><p className="text-sm font-bold text-brand">DESCOBRE SERVIÇOS</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Pesquisar ofertas</h1><form action="/pesquisa" className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4"><input name="q" defaultValue={q} placeholder="Nome do serviço" className="rounded-xl border-slate-200"/><select name="category" defaultValue={category} className="rounded-xl border-slate-200"><option value="">Todas as categorias</option>{categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}</select><input name="province" defaultValue={province} placeholder="Província" className="rounded-xl border-slate-200"/><input name="type" defaultValue={type} placeholder="Tipo de ligação" className="rounded-xl border-slate-200"/><input name="min" type="number" min="0" defaultValue={typeof params.min==="string"?params.min:""} placeholder="Preço mínimo MT" className="rounded-xl border-slate-200"/><input name="max" type="number" min="0" defaultValue={typeof params.max==="string"?params.max:""} placeholder="Preço máximo MT" className="rounded-xl border-slate-200"/><input name="speed" type="number" min="0" defaultValue={typeof params.speed==="string"?params.speed:""} placeholder="Velocidade mínima Mbps" className="rounded-xl border-slate-200"/><select name="sort" defaultValue={sort} className="rounded-xl border-slate-200"><option value="newest">Mais recentes</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option><option value="rating">Melhor avaliação</option><option value="popular">Mais populares</option></select><button className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-bold text-white sm:col-span-2 lg:col-span-4"><Search size={17}/> Pesquisar</button></form><p className="mt-6 text-sm text-slate-500">{rows.length} {rows.length===1?"oferta encontrada":"ofertas encontradas"}</p>{message&&<p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</p>}<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((l)=><Link key={l.id} href={`/anuncios/${l.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-soft"><span className="rounded-full bg-brand-pale px-3 py-1 text-xs font-bold text-brand">{l.category?.name??l.connection_type}</span><h2 className="mt-4 font-bold text-ink">{l.title}</h2><p className="mt-2 line-clamp-2 text-sm text-slate-500">{l.description}</p><p className="mt-4 text-sm text-slate-600">{l.seller?.business_name}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13}/>{l.city}, {l.province}</p><div className="mt-4 flex justify-between border-t pt-4"><span className="text-sm text-slate-500">{l.advertised_speed_mbps?`${l.advertised_speed_mbps} Mbps`:l.connection_type}</span><b className="text-brand">{Number(l.price_mzn).toLocaleString("pt-MZ")} MT</b></div></Link>)}</div>{!rows.length&&!message&&<div className="mt-8 rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-bold text-ink">Não encontrámos ofertas com estes filtros.</p><p className="mt-2 text-sm text-slate-500">Tenta alterar os critérios ou volta mais tarde.</p></div>}</div></main>;
}
