import {
  Link,
  useRouterState,
} from "@tanstack/react-router";

import {
  ArrowRightLeft,
  Building2,
  Calculator,
  CalendarDays,
  FileClock,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

type MenuItem = {
  nome: string;
  rota: string;
  icone: React.ElementType;
};

export function Sidebar() {
  const { perfil } = useAuth();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const administrador = Boolean(perfil?.administrador);

  const menus: MenuItem[] = [
    { nome: "Dashboard", rota: "/", icone: LayoutDashboard },
    { nome: "Orçamentação", rota: "/obras", icone: Calculator },
    { nome: "Obras", rota: "/execucao-obras", icone: Building2 },
    { nome: "Reuniões", rota: "/reunioes", icone: CalendarDays },
    {
      nome: "Histórico de Orçamentos",
      rota: "/historico-obras",
      icone: FileClock,
    },
    { nome: "Tramitação", rota: "/tramitacoes", icone: ArrowRightLeft },
    { nome: "Clientes", rota: "/clientes", icone: Users },
    { nome: "Relatórios", rota: "/relatorios", icone: FileText },
  ];

  function estaAtiva(rota: string) {
    if (rota === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(rota);
  }

  function classesDoItem(ativa: boolean) {
    return `group relative flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
      ativa
        ? "bg-white/10 font-semibold text-white shadow-sm ring-1 ring-white/10"
        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
    }`;
  }

  return (
    <aside className="relative flex min-h-screen w-64 shrink-0 flex-col overflow-hidden bg-[#102d3c] p-6 text-white shadow-xl shadow-slate-900/10">
      <div className="absolute inset-y-0 left-0 w-1 bg-[#91bda4]" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-[#91bda4]/10 blur-2xl" />

      <div className="relative mb-9">
        <img
          src="/kemia-logo.png"
          alt="Kemia"
          className="h-auto w-44 object-contain object-left drop-shadow-sm"
        />

        <p className="mt-4 text-sm font-semibold text-white">
          Gestão de Obras
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Plataforma interna
        </p>
      </div>

      <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#91bda4]">
        Navegação
      </p>

      <nav className="relative flex flex-col gap-1.5">
        {menus.map((menu) => {
          const Icon = menu.icone;
          const ativa = estaAtiva(menu.rota);

          return (
            <Link
              key={menu.nome}
              to={menu.rota}
              className={classesDoItem(ativa)}
            >
              {ativa && (
                <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-[#91bda4]" />
              )}

              <Icon
                size={18}
                className={
                  ativa
                    ? "text-[#b8d7c5]"
                    : "text-slate-400 transition-colors group-hover:text-[#b8d7c5]"
                }
              />

              {menu.nome}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto space-y-5">
        {administrador && (
          <div className="border-t border-white/10 pt-5">
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#91bda4]">
              Administração
            </p>

            <Link
              to="/admin"
              className={classesDoItem(pathname.startsWith("/admin"))}
            >
              {pathname.startsWith("/admin") && (
                <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-[#91bda4]" />
              )}

              <ShieldCheck size={18} />
              Painel administrativo
            </Link>
          </div>
        )}

        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-[#91bda4] shadow-[0_0_0_3px_rgba(145,189,164,0.12)]" />
            Sistema interno
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            Kemia Engenharia
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
