import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RecoveryForm } from "@/components/auth/RecoveryForm";

export default async function RecuperarPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
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
            Voltar ao Login
          </Link>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-brand uppercase tracking-wider mb-2">Recuperar</p>
          <h1 className="text-2xl font-extrabold text-ink">Redefinir palavra-passe</h1>
          <p className="text-sm text-slate-500 mt-2">Introduz o teu email para receber instruções.</p>
        </div>

        <RecoveryForm />

        {/* Mensagem de Sucesso/Erro */}
        <div className="mt-6 rounded-xl bg-teal-50 p-4 flex items-start gap-3 border border-teal-100">
          <ShieldCheck size={20} className="text-brand shrink-0 mt-0.5" />
          <p className="text-xs text-teal-700">
            <strong>Segurança:</strong> Verificaremos o teu email e enviaremos um link seguro.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Lembras-te? <Link href="/login" className="text-brand hover:underline">Entrar</Link></p>
        </div>
      </div>
    </main>
  );
}
