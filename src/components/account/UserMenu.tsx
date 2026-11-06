"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Search, Settings, ShieldCheck, Store, UserRound } from "lucide-react";

type Props = {
  fullName: string;
  unread: number;
  role?: "customer" | "seller" | "admin";
};

/**
 * Menu de conta do cabeçalho.
 *
 * Alterações importantes face à versão anterior:
 * - O "Terminar sessão" deixou de estar imediatamente a seguir ao primeiro link
 *   (era a causa de logouts acidentais ao tocar no botão de 3 pontos/menu).
 * - Passa a ter confirmação explícita antes de submeter o POST /auth/signout.
 * - O painel abre como dropdown (não como bloco que empurra o conteúdo).
 */
export function UserMenu({ fullName, unread, role = "customer" }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setConfirmSignOut(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setConfirmSignOut(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const initial = fullName.trim().charAt(0).toUpperCase() || "C";
  const firstName = fullName.trim().split(" ")[0] || "Conta";

  const links = [
    { href: "/dashboard", label: "Visão geral", Icon: UserRound },
    { href: "/pesquisa", label: "Explorar ofertas", Icon: Search },
    { href: "/cliente/favoritos", label: "Favoritos", Icon: Store },
    { href: "/dashboard#perfil", label: "Editar perfil", Icon: Settings },
    role === "customer"
      ? { href: "/vendedor/candidatura", label: "Ser vendedor", Icon: ShieldCheck }
      : { href: "/vendedor/dashboard", label: "Painel de vendedor", Icon: ShieldCheck },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setConfirmSignOut(false);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu da conta"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-brand"
      >
        <span className="relative grid h-8 w-8 place-items-center rounded-full bg-brand-pale text-xs font-bold text-brand">
          {initial}
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </span>
        <span className="hidden max-w-[100px] truncate sm:block">{firstName}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(260px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-ink">{fullName}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {unread > 0 ? `${unread} notificação(ões) por ler` : "Sem notificações novas"}
            </p>
          </div>

          <nav className="p-1.5">
            {links.map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-brand"
              >
                <Icon size={15} /> {label}
              </Link>
            ))}
          </nav>

          {/* Sair: separado por margem e com confirmação — evita logout acidental */}
          <div className="border-t border-slate-100 p-1.5">
            {confirmSignOut ? (
              <form action="/auth/signout" method="post" className="space-y-1.5 p-1">
                <p className="px-1.5 text-xs font-semibold text-slate-600">Terminar sessão agora?</p>
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-red-600 px-2 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700"
                  >
                    Sim, sair
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmSignOut(false)}
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <LogOut size={15} /> Terminar sessão
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}