"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

/**
 * Tradução dos erros do Supabase Auth para mensagens accionáveis em português.
 * O Supabase devolve inglês técnico ("Invalid login credentials") que o
 * utilizador final não consegue interpretar.
 */
function friendlyError(message: string, mode: Mode): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Email ou palavra-passe incorrectos. Confirma os dados e tenta novamente.";
  }
  if (m.includes("email not confirmed")) {
    return "Ainda não confirmaste o teu email. Abre a mensagem de confirmação que enviámos (verifica também o spam) e depois tenta entrar.";
  }
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already exists")) {
    return "Já existe uma conta com este email. Tenta entrar ou recuperar a palavra-passe.";
  }
  if (m.includes("password") && (m.includes("at least") || m.includes("short") || m.includes("weak"))) {
    return "A palavra-passe é demasiado curta. Usa pelo menos 6 caracteres (recomendamos 12 ou mais).";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("email rate")) {
    return "Foram enviados demasiados emails em pouco tempo. Aguarda alguns minutos e tenta novamente.";
  }
  if (m.includes("email address") && m.includes("invalid")) {
    return "Este endereço de email não é aceite. Usa um email válido (por exemplo, do Gmail ou Outlook).";
  }
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) {
    return "O registo de novas contas está temporariamente desactivado. Contacta o suporte My Net.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Não foi possível contactar o servidor. Verifica a tua ligação à internet e tenta novamente.";
  }
  return mode === "login"
    ? "Não foi possível entrar. Verifica o email e a palavra-passe."
    : "Não foi possível criar a conta. Verifica os dados e tenta novamente.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");

    setBusy(true);
    setStatus({ type: "idle", message: "" });

    try {
      const sb = createSupabaseBrowserClient();

      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const full_name = String(form.get("full_name") || "").trim();
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { full_name },
          // O domínio de produção é deste próprio site, por isso não depende
          // do Site URL configurado no Supabase Auth.
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;

      if (!data.session) {
        setStatus({
          type: "success",
          message:
            "Conta criada. Enviámos um link de confirmação para o teu email — abre-o para activar a conta e depois entra. Se não chegar em alguns minutos, verifica a pasta de spam.",
        });
        event.currentTarget.reset();
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setStatus({ type: "error", message: friendlyError(raw, mode) });
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm transition-colors focus:border-brand focus:ring-0";

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" ? (
        <label className="block text-sm font-semibold text-slate-700">
          Nome completo
          <input
            required
            name="full_name"
            minLength={2}
            maxLength={180}
            autoComplete="name"
            placeholder="O teu nome"
            className={inputClass}
          />
        </label>
      ) : null}

      <label className="block text-sm font-semibold text-slate-700">
        Email
        <input
          required
          name="email"
          type="email"
          maxLength={320}
          autoComplete="email"
          inputMode="email"
          placeholder="exemplo@mynet.mz"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Palavra-passe
        <span className="relative mt-1.5 block">
          <input
            required
            name="password"
            type={showPassword ? "text" : "password"}
            minLength={mode === "register" ? 6 : 1}
            maxLength={72}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder={mode === "register" ? "Mínimo 6 caracteres" : "A tua palavra-passe"}
            className={`${inputClass} mt-0 pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors hover:text-brand"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
        {mode === "register" ? (
          <span className="mt-1.5 block text-xs font-normal text-slate-500">
            Pelo menos 6 caracteres. Recomendamos 12 ou mais.
          </span>
        ) : null}
      </label>

      {mode === "login" ? (
        <div className="text-right">
          <Link href="/recuperar-palavra-passe" className="text-xs font-semibold text-brand hover:underline">
            Esqueceste-te da palavra-passe?
          </Link>
        </div>
      ) : null}

      {status.type === "success" ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm leading-5 text-teal-900"
        >
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand" />
          {status.message}
        </p>
      ) : null}

      {status.type === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-800"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          {status.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 size={16} className="animate-spin" /> A processar…
          </>
        ) : mode === "register" ? (
          <>
            <UserPlus size={16} /> Criar conta
          </>
        ) : (
          <>
            <LogIn size={16} /> Entrar
          </>
        )}
      </button>

      <p className="text-center text-sm text-slate-600">
        {mode === "register" ? "Já tens conta?" : "Ainda não tens conta?"}{" "}
        <Link
          className="font-semibold text-brand hover:underline"
          href={mode === "register" ? "/login" : "/register"}
        >
          {mode === "register" ? "Entrar" : "Criar conta"}
        </Link>
      </p>
    </form>
  );
}