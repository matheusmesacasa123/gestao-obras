import {
  Link,
  useRouterState,
} from "@tanstack/react-router";

import {
  ArrowRightLeft,
  Building2,
  Calculator,
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
  const {
    perfil,
  } = useAuth();

  const pathname =
    useRouterState({
      select: (
        state
      ) =>
        state.location.pathname,
    });

  const administrador =
    Boolean(
      perfil?.administrador
    );

  const menus: MenuItem[] = [
    {
      nome:
        "Dashboard",
      rota:
        "/",
      icone:
        LayoutDashboard,
    },
    {
      nome:
        "Orçamentação",
      rota:
        "/obras",
      icone:
        Calculator,
    },
    {
      nome:
        "Obras",
      rota:
        "/execucao-obras",
      icone:
        Building2,
    },
    {
      nome:
        "Histórico de Orçamentos",
      rota:
        "/historico-obras",
      icone:
        FileClock,
    },
    {
      nome:
        "Tramitação",
      rota:
        "/tramitacoes",
      icone:
        ArrowRightLeft,
    },
    {
      nome:
        "Clientes",
      rota:
        "/clientes",
      icone:
        Users,
    },
    {
      nome:
        "Relatórios",
      rota:
        "/relatorios",
      icone:
        FileText,
    },
  ];

  function estaAtiva(
    rota: string
  ) {
    if (
      rota === "/"
    ) {
      return (
        pathname === "/"
      );
    }

    return pathname.startsWith(
      rota
    );
  }

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-slate-950 p-6 text-white">
      <div className="mb-10">
        <div className="mb-4 flex items-center">
          <img
            src="/kemia-logo.png"
            alt="Kemia"
            className="h-14 w-auto object-contain"
          />
        </div>

        <p className="text-sm font-medium text-white">
          Gestão de Orçamentação
        </p>
      </div>

      <div className="mb-3">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Menu
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {menus.map(
          (
            menu
          ) => {
            const Icon =
              menu.icone;

            const ativa =
              estaAtiva(
                menu.rota
              );

            return (
              <Link
                key={
                  menu.nome
                }
                to={
                  menu.rota
                }
                className={`
                  flex
                  cursor-pointer
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  transition
                  ${
                    ativa
                      ? "bg-white font-semibold text-slate-950"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                `}
              >
                <Icon
                  size={
                    18
                  }
                />

                {
                  menu.nome
                }
              </Link>
            );
          }
        )}
      </nav>

      <div className="mt-auto space-y-6">
        {administrador && (
          <div className="border-t border-slate-800 pt-6">
            <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
              Administração
            </p>

            <Link
              to="/admin"
              className={`
                flex
                cursor-pointer
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                text-sm
                transition
                ${
                  pathname.startsWith(
                    "/admin"
                  )
                    ? "bg-white font-semibold text-slate-950"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <ShieldCheck
                size={
                  18
                }
              />

              Painel administrativo
            </Link>
          </div>
        )}

        <div className="border-t border-slate-800 pt-6">
          <p className="text-xs text-slate-400">
            Sistema interno
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Kemia Engenharia
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;