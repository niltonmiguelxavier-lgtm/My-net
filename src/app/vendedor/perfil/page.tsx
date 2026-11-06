import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  Store,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/account/BottomNav";
import { SellerProfileForm } from "@/components/forms/SellerProfileForm";

type SellerRow = {
  id: string;
  business_name: string;
  description: string | null;
  phone: string;
  email: string;
  province: string;
  city: string;
  business_type: string | null;
  status: string;
  average_rating: number | null;
  reviews_count: number | null;
  created_at: string;
  updated_at: string;
};

const statusCopy: Record<string, { label: string; className: string }> = {
  approved: { label: "Aprovado", className: "bg-brand-pale text-brand" },
  pending: { label: "Pendente de aprovação", className: "bg-amber-50 text-amber-700" },
  under_review: { label: "Em revisão", className: "bg-amber-50 text-amber-700" },
  rejected: { label: "Recusado", className: "bg-red-50 text-red-700" },
  suspended: { label: "Suspenso", className: "bg-red-50 text-red-700" },
};

export default async function SellerProfilePage() {
  const sb = await createSupabaseServerClient();
  if (!sb) redirect("/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: seller } = await sb
    .from("sellers")
    .select(
      "id,business_name,description,phone,email,province,city,business_type,status,average_rating,reviews_count,created_at,updated_at"
    )
    .eq("user_id", user.id)
    .maybeSingle<SellerRow>();

  const initials = seller?.business_name?.trim().charAt(0).toUpperCase() ?? "V";
  const badge = seller ? statusCopy[seller.status] ?? { label: seller.status, className: "bg-slate-100 text-slate-600" } : null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-5">
          <Link href="/" className="text-xl font-extrabold text-ink">
            my<span className="text-brand">net</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/vendedor/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand"
            >
              <ArrowLeft size={15} /> Painel
            </Link>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-brand">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-7 sm:px-5">
        {!seller ? (
          /* Estado vazio: conta sem registo em public.sellers */
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Building2 size={28} className="mx-auto text-brand" />
            <h1 className="mt-3 text-xl font-extrabold text-ink">Ainda não tens perfil comercial</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              O perfil comercial é criado quando a candidatura a vendedor é aprovada. Podes consultar o estado da tua
              candidatura ou falar com a equipa My Net.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/vendedor/candidatura"
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
              >
                Consultar candidatura
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Ir para a minha conta
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Cartão de identidade */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-pale text-xl font-extrabold text-brand">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-extrabold text-ink sm:text-2xl">{seller.business_name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      {badge ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold uppercase tracking-wide ${badge.className}`}>
                          <BadgeCheck size={12} /> {badge.label}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} className="fill-amber-500 text-amber-500" />
                        {Number(seller.average_rating ?? 0).toFixed(1)} · {seller.reviews_count ?? 0} avaliações
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/pesquisa?seller=${seller.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-brand"
                >
                  <Store size={15} /> Ver perfil público
                </Link>
              </div>

              <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-start gap-2">
                  <Mail size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</dt>
                    <dd className="break-all font-semibold text-ink">{seller.email}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telefone</dt>
                    <dd className="font-semibold text-ink">{seller.phone}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Localização</dt>
                    <dd className="font-semibold text-ink">
                      {seller.city}, {seller.province}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock3 size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Última actualização</dt>
                    <dd className="font-semibold text-ink">
                      {new Date(seller.updated_at).toLocaleDateString("pt-MZ")}
                    </dd>
                  </div>
                </div>
              </dl>

              {seller.status !== "approved" ? (
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  <BadgeCheck size={15} className="mt-0.5 shrink-0" />
                  O teu perfil está <strong>{badge?.label.toLowerCase()}</strong>. Podes manter os dados actualizados,
                  mas a publicação de ofertas e a visibilidade pública dependem da aprovação da equipa My Net.
                </p>
              ) : null}
            </div>

            {/* Formulário de edição */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-extrabold text-ink">Dados do negócio</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Estes dados aparecem nas tuas ofertas e no teu perfil público do marketplace.
                </p>
              </div>
              <SellerProfileForm
                sellerId={seller.id}
                initial={{
                  business_name: seller.business_name ?? "",
                  description: seller.description ?? "",
                  phone: seller.phone ?? "",
                  email: seller.email ?? "",
                  province: seller.province ?? "",
                  city: seller.city ?? "",
                }}
              />
            </div>

            {/* Campos geridos pela plataforma */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink">
                  <BadgeCheck size={16} className="text-brand" /> Gerido pela My Net
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>
                    <span className="text-xs uppercase tracking-wider text-slate-400">Estado da conta</span>
                    <p className="font-semibold text-ink">{badge?.label ?? "—"}</p>
                  </li>
                  <li>
                    <span className="text-xs uppercase tracking-wider text-slate-400">Tipo de negócio</span>
                    <p className="font-semibold text-ink">{seller.business_type || "Não definido"}</p>
                  </li>
                  <li>
                    <span className="text-xs uppercase tracking-wider text-slate-400">Avaliação</span>
                    <p className="font-semibold text-ink">
                      {Number(seller.average_rating ?? 0).toFixed(1)} ★ · {seller.reviews_count ?? 0} avaliações
                    </p>
                  </li>
                  <li>
                    <span className="text-xs uppercase tracking-wider text-slate-400">No marketplace desde</span>
                    <p className="font-semibold text-ink">{new Date(seller.created_at).toLocaleDateString("pt-MZ")}</p>
                  </li>
                </ul>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink">
                  <MessageSquare size={16} className="text-brand" /> Precisa de alterar algo mais?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Alterações ao nome legal, tipo de negócio ou estado da conta são feitas pela equipa após verificação.
                  Contacta o suporte a partir dos canais oficiais da plataforma e indica o teu nome comercial.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/vendedor/dashboard"
                    className="rounded-lg bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand"
                  >
                    Voltar ao painel
                  </Link>
                  <Link
                    href="/planos"
                    className="rounded-lg bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand"
                  >
                    Ver planos
                  </Link>
                </div>
              </section>
            </div>
          </>
        )}
      </section>
      <BottomNav role="seller" />
    </main>
  );
}