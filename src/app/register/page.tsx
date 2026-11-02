import Link from "next/link";
import { ArrowRight, ShieldCheck, Wifi, MapPin, ChevronDown, Menu, X, UserRound } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return <Link href="/dashboard" className="text-brand">Já tens conta? Ir para o dashboard</Link>;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-soft">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="font-extrabold text-ink text-xl">
            my<span className="text-brand">net</span>
          </Link>
          <Link href="/login" className="text-sm font-semibold text-brand hover:underline">
            Já tens conta? Entrar
          </Link>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-brand uppercase tracking-wider mb-2">Criar conta</p>
          <h1 className="text-2xl font-extrabold text-ink">Começa a tua experiência</h1>
          <p className="text-sm text-slate-500 mt-2">Regista-te como cliente para explorar a plataforma.</p>
        </div>

        {/* Formulário Moderno */}
        <form action="/auth/register" method="post" className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
            <input 
              name="full_name" 
              type="text" 
              placeholder="Ex: Nilton Miguel Xavier" 
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-0 focus:border-brand transition-colors"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input 
              name="email" 
              type="email" 
              placeholder="exemplo@mynet.mz" 
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-0 focus:border-brand transition-colors"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Palavra-passe</label>
            <input 
              name="password" 
              type="password" 
              placeholder="Mínimo 8 caracteres" 
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-0 focus:border-brand transition-colors"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Província</label>
            <select 
              name="province" 
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-0 focus:border-brand transition-colors"
              required
            >
              <option value="">Selecionar província</option>
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

          {/* Regra de Registo (Cliente por defeito) */}
          <div className="rounded-xl bg-slate-50 p-4 flex items-start gap-3 border border-slate-100">
            <ShieldCheck size={20} className="text-brand shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">
              <strong>Regra:</strong> Todos os novos utilizadores começam como CLIENTES. O acesso de vendedor depende de candidatura e aprovação posterior.
            </p>
          </div>

          <button 
            type="submit" 
            className="w-full rounded-xl bg-brand py-3.5 font-bold text-white hover:bg-brand-dark transition-colors mt-2"
          >
            Criar conta e começar
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Ao registares-te, aceitas os <Link href="#" className="text-brand hover:underline">Termos</Link> e a <Link href="#" className="text-brand hover:underline">Política de Privacidade</Link>.</p>
        </div>
      </div>
    </main>
  );
}
