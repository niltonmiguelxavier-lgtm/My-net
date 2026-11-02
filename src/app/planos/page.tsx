import Link from "next/link";
import { ArrowRight, Wifi, ShieldCheck, MapPin, Search, ChevronDown, Menu, X, CreditCard, Building2, Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlanosPage() {
  const supabase = await createSupabaseServerClient();
  let plans: any[] = [];
  
  if (supabase) {
    const { data } = await supabase.from("plans").select("id,name,price_mzn,listing_limit,description,benefits,active").order("price_mzn");
    plans = data ?? [];
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
            <Link href="/pesquisa" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Explorar</Link>
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 transition-colors">Entrar</Link>
            <Link href="/register" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors">Criar conta</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-[#f2f8f6]">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <p className="text-sm font-bold text-brand uppercase tracking-wider mb-2">Planos para Vendedores</p>
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl mb-4">Escolhe o plano ideal para o teu negócio</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Desenvolvemos planos adaptados à realidade de Moçambique, com opções para todos os tipos de fornecedores de internet.
          </p>
        </div>
      </section>

      {/* Cartões de Planos */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.length > 0 ? plans.map(p => (
            <article 
              key={p.id} 
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition hover:border-brand hover:shadow-brand/10"
            >
              {p.active ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand bg-brand-pale px-3 py-1 text-xs font-bold text-brand mb-4">
                  <ShieldCheck size={12} /> Disponível
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 mb-4">
                  Indisponível
                </span>
              )}
              
              <h3 className="text-xl font-extrabold text-ink mb-2">{p.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-ink">
                  {Number(p.price_mzn).toLocaleString("pt-MZ")} <span className="text-sm font-semibold text-slate-500">MT/mês</span>
                </span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {p.benefits?.split(",").map((b: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <Wifi size={16} className="text-brand shrink-0" /> {b.trim()}
                  </li>
                ))}
                {p.listing_limit && (
                  <li className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 size={16} className="text-brand shrink-0" /> Limite: {p.listing_limit} anúncios
                  </li>
                )}
              </ul>
              
              <button 
                className={`w-full rounded-lg py-3 font-bold text-sm transition ${
                  p.active 
                    ? "bg-brand text-white hover:bg-brand-dark" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p.active ? "Solicitar Subscrição" : "Indisponível"}
              </button>
              
              <p className="mt-4 text-[10px] text-slate-400 text-center">
                Os pagamentos são confirmados manualmente pela equipa.
              </p>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <p className="text-xl font-extrabold text-ink mb-2">Nenhum plano disponível</p>
              <p className="text-sm text-slate-500">Os planos serão atualizados em breve.</p>
            </div>
          )}
        </div>

        {/* FAQ */}
        <section className="mt-16 mx-auto max-w-3xl">
          <h2 className="text-2xl font-extrabold text-ink text-center mb-8">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {[
              { q: "Como funciona a aprovação?", a: "A equipa My Net analisa cada candidatura em 48-72 horas úteis." },
              { q: "Posso alterar o plano?", a: "Sim, podes solicitar a alteração a qualquer momento através do painel." },
              { q: "Os pagamentos são automáticos?", a: "Não, os pagamentos são confirmados manualmente pela equipa." }
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
                <h4 className="font-bold text-ink mb-2">{item.q}</h4>
                <p className="text-sm text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      {/* Footer */}
      <section className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-5 text-center text-sm text-slate-500">
          <Link href="/" className="font-extrabold text-ink text-xl mb-4 block">mynet</Link>
          <p>Marketplace de conectividade em Moçambique · Preços em MT</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/" className="hover:text-brand transition-colors">Início</Link>
            <Link href="/pesquisa" className="hover:text-brand transition-colors">Explorar</Link>
            <Link href="/login" className="hover:text-brand transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-brand transition-colors">Criar conta</Link>
            <Link href="/#suporte" className="hover:text-brand transition-colors">Suporte</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
