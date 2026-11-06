"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw, Save, ShieldAlert } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SellerProfileValues = {
  business_name: string;
  description: string;
  phone: string;
  email: string;
  province: string;
  city: string;
};

type FieldKey = keyof SellerProfileValues;

const fields: { key: FieldKey; label: string; hint?: string; type: "text" | "email" | "tel" | "textarea"; max: number; required: boolean }[] = [
  { key: "business_name", label: "Nome comercial", type: "text", max: 160, required: true },
  { key: "email", label: "Email comercial", type: "email", max: 320, required: true },
  { key: "phone", label: "Telefone comercial", type: "tel", max: 40, required: true },
  { key: "province", label: "Província", type: "text", max: 100, required: true },
  { key: "city", label: "Cidade ou distrito", type: "text", max: 120, required: true },
  {
    key: "description",
    label: "Apresentação do negócio",
    hint: "Descreve cobertura, tecnologia e diferenciais. Máximo de 3000 caracteres.",
    type: "textarea",
    max: 3000,
    required: false,
  },
];

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Edição do perfil comercial do vendedor (tabela public.sellers).
 * Só os campos editáveis são enviados; status, avaliação e business_type
 * são protegidos por RLS + trigger (migration 0003).
 */
export function SellerProfileForm({
  sellerId,
  initial,
}: {
  sellerId: string;
  initial: SellerProfileValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<SellerProfileValues>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const dirty = useMemo(
    () => (Object.keys(initial) as FieldKey[]).some((key) => values[key].trim() !== initial[key].trim()),
    [initial, values]
  );

  const errors = useMemo(() => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (values.business_name.trim().length < 2) next.business_name = "Indica o nome comercial (mínimo 2 caracteres).";
    if (!emailPattern.test(values.email.trim())) next.email = "Email inválido.";
    if (values.phone.trim().length < 6) next.phone = "Telefone inválido.";
    if (values.province.trim().length < 2) next.province = "Indica a província.";
    if (values.city.trim().length < 2) next.city = "Indica a cidade ou distrito.";
    if (values.description.length > 3000) next.description = "Máximo de 3000 caracteres.";
    return next;
  }, [values]);

  const hasErrors = Object.keys(errors).length > 0;

  function update(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    if (status.type !== "idle") setStatus({ type: "idle", message: "" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || hasErrors || !dirty) return;
    setBusy(true);
    setStatus({ type: "idle", message: "" });
    try {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb
        .from("sellers")
        .update({
          business_name: values.business_name.trim(),
          description: values.description.trim(),
          phone: values.phone.trim(),
          email: values.email.trim().toLowerCase(),
          province: values.province.trim(),
          city: values.city.trim(),
        })
        .eq("id", sellerId)
        .select("id")
        .single();

      if (error) throw error;

      setStatus({ type: "success", message: "Perfil comercial actualizado." });
      router.refresh();
    } catch {
      setStatus({
        type: "error",
        message:
          "Não foi possível guardar. Confirma os dados e a tua sessão. Alterações a campos protegidos (estado, avaliação ou tipo de negócio) são recusadas pela base de dados.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, hint, type, max, required }) => {
          const error = errors[key];
          const shared =
            "mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:ring-0 " +
            (error ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-brand");
          return (
            <div key={key} className={type === "textarea" ? "sm:col-span-2" : undefined}>
              <label htmlFor={`seller-${key}`} className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label}
                {!required && <span className="ml-1 font-medium normal-case text-slate-400">(opcional)</span>}
              </label>
              {type === "textarea" ? (
                <textarea
                  id={`seller-${key}`}
                  name={key}
                  rows={4}
                  maxLength={max}
                  value={values[key]}
                  onChange={(event) => update(key, event.target.value)}
                  className={shared}
                />
              ) : (
                <input
                  id={`seller-${key}`}
                  name={key}
                  type={type}
                  maxLength={max}
                  value={values[key]}
                  onChange={(event) => update(key, event.target.value)}
                  aria-invalid={Boolean(error)}
                  className={shared}
                />
              )}
              <div className="mt-1 flex items-center justify-between gap-2">
                {error ? (
                  <p className="text-xs font-semibold text-red-700">{error}</p>
                ) : hint ? (
                  <p className="text-xs text-slate-500">{hint}</p>
                ) : (
                  <span />
                )}
                {type === "textarea" ? (
                  <span className="shrink-0 text-[10px] text-slate-400">{values[key].length}/{max}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {status.type === "success" ? (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-900">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand" />
          {status.message}
        </p>
      ) : null}

      {status.type === "error" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-800">
          <ShieldAlert size={17} className="mt-0.5 shrink-0" />
          {status.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || hasErrors || !dirty}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {busy ? "A guardar…" : "Guardar alterações"}
        </button>
        <button
          type="button"
          onClick={() => {
            setValues(initial);
            setStatus({ type: "idle", message: "" });
          }}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-brand disabled:opacity-50"
        >
          <RotateCcw size={15} /> Descartar
        </button>
        {dirty && !hasErrors ? <span className="text-xs font-semibold text-amber-600">Alterações por guardar</span> : null}
      </div>

      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
        O nome comercial, contactos e localização ficam visíveis no marketplace. A aprovação, a avaliação média e o
        tipo de negócio são geridos pela equipa My Net e não podem ser alterados aqui.
      </p>
    </form>
  );
}