"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, ShieldCheck, Store, UserRound, X } from "lucide-react";

type Props = {
  fullName: string;
  unread: number;
  role?: "customer" | "seller" | "admin";
};

/**
 * Menu de conta para o cabeçalho.
 * Substitui o botão mobile inerte: mantém navegação e o signout server-side
 * (/auth/signout via POST) exactamente como no resto da aplicação.
 */
export function UserMenu({ fullName, unread, role = "customer" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
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
  const links = [
    { href: "/dashboard", label: "Visão geral", Icon: UserRound },
    { href: "/pesquisa", label: "Explorar ofertas", Icon: Search },
    { href: "/cliente/favoritos", label: "Favoritos", Icon: Store },
    { href: "/dashboard#perfil", label: "Editar perfil", Icon: Settings },
    ...(role === "customer"
      ? [{ href: "/vendedor/candidatura", label: "Ser vendedor", Icon: ShieldCheck }]
      : [{ href: "/vendedor/dashboard", label: "Painel de vendedor", Icon: ShieldCheck }]),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-brand"
      >
        <span className="relative grid h-8 w-8 place-items-center rounded-full bg-brand-pale text-xs font-bold text-brand">
          {initial}
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </span>
        <span className="hidden max-w-[120px] truncate sm:block">{fullName.split(" ")[0]}</span>
        {open ? <X size={15} /> : <ChevronDown size={15} />}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-ink">{fullName}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <Bell size={12} /> {unread > 0 ? `${unread} por ler` : "Sem notificações novas"}
            </p>
          </div>
          <nav className="p-1.5">
            {links.map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-brand"
              >
                <Icon size={15} /> {label}
              </Link>
            ))}
          </nav>
          <form action="/auth/signout" method="post" className="border-t border-slate-100 p-1.5">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={15} /> Terminar sessão
            </button>
          </form>
        </div>
      ) : null}

      {/* Atalho mobile acessível para exploração */}
      <Link
        href="/pesquisa"
        className="absolute -left-24 top-1.5 text-slate-600 transition-colors hover:text-brand sm:hidden"
        aria-label="Pesquisar ofertas"
      >
        <Menu size={20} />
      </Link>
    </div>
  );
}