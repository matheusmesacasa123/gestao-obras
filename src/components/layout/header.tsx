import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  supabase,
} from "@/integrations/supabase/client";

type PerfilHeader = {
  nome: string;
  administrador: boolean;
  cargo:
    | {
        nome: string;
      }
    | null;
};

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);

  if (partes.length === 0) {
    return "U";
  }

  if (partes.length === 1) {
    return partes[0].charAt(0).toUpperCase();
  }

  return (
    partes[0].charAt(0) +
    partes[partes.length - 1].charAt(0)
  ).toUpperCase();
}

export function Header() {
  const { user, perfil, signOut } = useAuth();
  const navigate = useNavigate();

  const [menuAberto, setMenuAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [perfilHeader, setPerfilHeader] = useState<PerfilHeader | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const nome =
    perfilHeader?.nome ||
    perfil?.nome ||
    user?.user_metadata?.nome ||
    user?.user_metadata?.name ||
    "Usuário";

  const cargo =
    perfilHeader?.cargo?.nome ||
    (perfilHeader?.administrador || perfil?.administrador
      ? "Administrador"
      : "Cargo não definido");

  const email = perfil?.email || user?.email || "E-mail não informado";
  const iniciais = obterIniciais(nome);

  useEffect(() => {
    async function carregarPerfilHeader() {
      if (!user?.id) {
        setPerfilHeader(null);
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          nome,
          administrador,
          cargo:cargos (
            nome
          )
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar dados do Header:", error);
        setPerfilHeader(null);
        return;
      }

      if (!data) {
        setPerfilHeader(null);
        return;
      }

      setPerfilHeader(data as unknown as PerfilHeader);
    }

    carregarPerfilHeader();
  }, [user?.id, perfil?.cargo_id, perfil?.administrador, perfil?.nome]);

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      const elemento = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(elemento)) {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
    };
  }, []);

  async function handleSair() {
    try {
      setSaindo(true);
      await signOut();

      navigate({
        to: "/login",
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
      alert("Não foi possível sair da conta.");
    } finally {
      setSaindo(false);
      setMenuAberto(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/80 bg-white/95 px-6 shadow-sm shadow-slate-900/[0.025] backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold text-[#315f72] transition hover:text-[#244b5d]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#91bda4] shadow-[0_0_0_4px_rgba(145,189,164,0.15)]" />
          Kemia
        </Link>

        <div className="h-5 w-px bg-border" />

        <span className="truncate text-sm font-medium text-muted-foreground">
          Gestão de Obras
        </span>
      </div>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuAberto((estadoAtual) => !estadoAtual)}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-2.5 py-1.5 text-left transition hover:border-border hover:bg-muted/70"
          aria-expanded={menuAberto}
          aria-haspopup="menu"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#436f82] text-sm font-semibold text-white shadow-sm ring-4 ring-[#436f82]/10">
            {iniciais}
          </div>

          <div className="hidden min-w-0 sm:block">
            <p className="max-w-48 truncate text-sm font-semibold text-foreground">
              {nome}
            </p>
            <p className="max-w-48 truncate text-xs text-muted-foreground">
              {cargo}
            </p>
          </div>

          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              menuAberto ? "rotate-180" : ""
            }`}
          />
        </button>

        {menuAberto && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-slate-900/10"
          >
            <div className="border-b border-border bg-gradient-to-r from-[#edf4f1] to-white px-4 py-3">
              <p className="truncate text-sm font-semibold text-foreground">
                {nome}
              </p>
              <p className="mt-0.5 truncate text-xs font-medium text-[#436f82]">
                {cargo}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {email}
              </p>
            </div>

            <div className="p-2">
              <Link
                to="/minha-conta"
                onClick={() => setMenuAberto(false)}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-muted"
                role="menuitem"
              >
                <UserRound className="h-4 w-4 text-[#436f82]" />
                Minha conta
              </Link>

              <button
                type="button"
                onClick={handleSair}
                disabled={saindo}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                {saindo ? "Saindo..." : "Sair da conta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
