import Link from "next/link";
import { ArrowRight, ShieldCheck, Building2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CandidaturaPage() {
  const sb = await createSupabaseServerClient();
  if (!sb) return <Link href="/login" className="text-brand">Configura o Supabase para iniciar a candidatura</Link>;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <Link href="/login" className="text-brand">Entra para iniciar a candidatura</Link>;

  const [{ data: profile }, { data: application }] = await Promise.all([
    sb.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    sb.from("seller_applications").select("id,status,business_name,created_at").eq("user_id", user.id).maybeSingle()
  ]);

  const role = profile?.role ?? "customer";
  const isSeller = role === "seller";
  
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header Moderno */}
      <header className="border-b bg-white/90 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-extrabold text-ink">
            my<span className="text-brand">net</span>
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            <Link href="/pesquisa" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Explorar</Link>
            <Link href="/planos" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Planos</Link>
            {user && (
              <>
                <Link href="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Dashboard</Link>
                <form action="/auth/signout" method="post">
                  <button className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Terminar</button>
                </form>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      {isSeller ? (
        <div className="mx-auto max-w-7xl px-5 pt-24">
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            A tua conta já tem acesso de vendedor. Podes gerir o negócio no{" "}
            <Link href="/vendedor/dashboard" className="font-bold underline">painel de vendedor</Link>.
          </p>
        </div>
      ) : null}
      <section className="pt-24 pb-16 bg-[#f2f8f6]">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <p className="text-sm font-bold text-brand uppercase tracking-wider mb-2">Tornar-se Vendedor</p>
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl mb-4">Cria o teu perfil comercial</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Apresenta as tuas ofertas a clientes em todo o país. O processo é simples, seguro e profissional.
          </p>
        </div>
      </section>

      {/* Estado da Candidatura ou Formulário */}
      <section className="mx-auto max-w-4xl px-5 py-12">
        {application ? (
          /* Já tem candidatura */
          <div className="rounded-2xl border bg-white p-8 shadow-soft">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-brand-pale flex items-center justify-center text-brand">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-ink">Candidatura em curso</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Estado: <span className="font-bold capitalize text-brand">{application.status}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Negócio: {application.business_name} · Submetida em: {new Date(application.created_at).toLocaleDateString("pt-MZ")}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-teal-50 p-4 border border-teal-100 mb-6">
              <p className="text-sm text-teal-700">
                <strong>Aviso:</strong> A equipa My Net está a analisar a tua candidatura. Receberás uma notificação assim que houver uma decisão.
              </p>
            </div>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark transition-colors"
            >
              Voltar ao Dashboard <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          /* Formulário de Candidatura */
          <div className="rounded-2xl border bg-white p-8 shadow-soft">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-brand-pale flex items-center justify-center text-brand">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-ink">Candidatura de Vendedor</h2>
                <p className="text-sm text-slate-500 mt-1">Preenche os dados do teu negócio para iniciar a revisão.</p>
              </div>
            </div>

            <form action="/vendedor/candidatura/submit" method="post" className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Comercial</label>
                <input 
                  name="business_name" 
                  type="text" 
                  placeholder="Ex: Internet Moçambique Lda" 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-0 focus:border-brand transition-colors"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Província</label>
                  <select 
                    name="province" 
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-0 focus:border-brand transition-colors"
                    required
                  >
                    <option value="">Selecionar</option>
                    <option value="Maputo">Maputo</option>
                    <option value="Gaza">Gaza</option>
                    <option value="Inhambane">Inhambane</option>
                    <option value="Sofala">Sofala</option>
                    <option value="Manica">Manica</option>
                    <option value="Tete">Tete</option>
                    <option value="Zambezia">Zambezia</option>
                    <option value="Nampula">Nampula</option>
                    <option value="Niassa">Niassa</option>
                    <option value="Cabo Delgado">Cabo Delgado</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cidade</label>
                  <input 
                    name="city" 
                    type="text" 
                    placeholder="Ex: Maputo Cidade" 
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-0 focus:border-brand transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição do Negócio</label>
                <textarea 
                  name="description" 
                  placeholder="Descreve os teus serviços e tecnologias..." 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-0 focus:border-brand transition-colors"
                  rows={4}
                  required
                />
              </div>

              {/* Regra de Registo */}
              <div className="rounded-xl bg-teal-50 p-4 flex items-start gap-3 border border-teal-100">
                <ShieldCheck size={20} className="text-brand shrink-0 mt-0.5" />
                <p className="text-xs text-teal-700">
                  <strong>Processo:</strong> A candidatura será analisada pela equipa. O acesso de vendedor só é ativado após aprovação.
                </p>
              </div>

              <button 
                type="submit" 
                className="w-full rounded-xl bg-brand py-3.5 font-bold text-white hover:bg-brand-dark transition-colors mt-2"
              >
                Submeter Candidatura
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Footer */}
      <section className="border-t border-slate-100 bg-white py-8 mt-12">
        <div className="mx-auto max-w-7xl px-5 text-center text-sm text-slate-500">
          <Link href="/" className="font-extrabold text-ink text-xl mb-4 block">mynet</Link>
          <p>Marketplace de conectividade em Moçambique · Preços em MT</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/" className="hover:text-brand transition-colors">Início</Link>
            <Link href="/pesquisa" className="hover:text-brand transition-colors">Explorar</Link>
            <Link href="/planos" className="hover:text-brand transition-colors">Planos</Link>
            <Link href="/login" className="hover:text-brand transition-colors">Entrar</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
