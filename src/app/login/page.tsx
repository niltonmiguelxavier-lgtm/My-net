import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  // Já autenticado: evita mostrar o formulário de login (requisito: sem homepage
  // pública nem ecrãs de auth após login).
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-soft">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="font-extrabold text-ink text-xl">
            my<span className="text-brand">net</span>
          </Link>
          <Link href="/register" className="text-sm font-semibold text-brand hover:underline">
            Novo utilizador? Criar conta
          </Link>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-brand uppercase tracking-wider mb-2">Entrar</p>
          <h1 className="text-2xl font-extrabold text-ink">Bem-vindo de volta</h1>
          <p className="text-sm text-slate-500 mt-2">Acede ao teu dashboard para continuar.</p>
        </div>

        {/* Formulário Moderno */}
        <AuthForm mode="login" />

        {/* Mensagens de Sucesso/Erro (Simulação Visual) */}
        <div className="mt-6 rounded-xl bg-teal-50 p-4 flex items-start gap-3 border border-teal-100">
          <ShieldCheck size={20} className="text-brand shrink-0 mt-0.5" />
          <p className="text-xs text-teal-700">
            <strong>Segurança:</strong> O teu acesso é protegido pelas políticas RLS do Supabase.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Não tens conta? <Link href="/register" className="text-brand hover:underline">Regista-te agora</Link></p>
        </div>
      </div>
    </main>
  );
}
