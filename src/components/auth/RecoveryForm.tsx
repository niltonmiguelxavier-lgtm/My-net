"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldAlert } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Formulário de recuperação de palavra-passe.
 * Usa o método nativo do Supabase (resetPasswordForEmail) já integrado no projecto,
 * substituindo o POST para /auth/recover que não existia na aplicação.
 */
export function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setState({ type: "idle", message: "" });
    try {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/actualizar-palavra-passe`,
      });
      if (error) throw error;
      setState({
        type: "success",
        message:
          "Se o endereço estiver registado, enviámos um link seguro para redefinires a palavra-passe. Verifica também a pasta de spam.",
      });
      setEmail("");
    } catch {
      setState({
        type: "error",
        message: "Não foi possível enviar as instruções agora. Verifica o email e tenta novamente.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate={false}>
      <label className="block text-sm font-semibold text-slate-700">
        Email da conta
        <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-brand">
          <Mail size={16} className="shrink-0 text-slate-400" />
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            maxLength={320}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="exemplo@mynet.mz"
            className="w-full border-0 bg-transparent py-3 text-sm focus:ring-0"
          />
        </span>
      </label>

      {state.type === "success" ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm leading-5 text-teal-900"
        >
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand" />
          {state.message}
        </p>
      ) : null}

      {state.type === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-800"
        >
          <ShieldAlert size={17} className="mt-0.5 shrink-0" />
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 size={16} className="animate-spin" /> A enviar…
          </>
        ) : (
          <>
            Enviar instruções <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        Lembras-te da palavra-passe?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}