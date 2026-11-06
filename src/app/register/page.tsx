import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function RegisterPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  // Já autenticado: não faz sentido mostrar o formulário de registo.
  if (user) redirect("/dashboard");

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
        <AuthForm mode="register" />

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Ao registares-te, aceitas os <Link href="#" className="text-brand hover:underline">Termos</Link> e a <Link href="#" className="text-brand hover:underline">Política de Privacidade</Link>.</p>
        </div>
      </div>
    </main>
  );
}
