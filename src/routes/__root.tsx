import {
  Outlet,
  createRootRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
} from "react";

import {
  Clock3,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import {
  AuthProvider,
  useAuth,
} from "@/features/auth/auth-context";

import {
  AppLayout,
} from "@/components/layout/app-layout";

export const Route =
  createRootRoute({
    component: RootComponent,
  });

function RootComponent() {
  return (
    <AuthProvider>
      <ProtectedLayout />
    </AuthProvider>
  );
}

function ProtectedLayout() {
  const {
    user,
    perfil,
    usuarioAtivo,
    loading,
    signOut,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const estaNaTelaLogin =
    location.pathname ===
    "/login";

  const estaNaTelaCadastro =
    location.pathname ===
    "/cadastro";

  const rotaPublica =
    estaNaTelaLogin ||
    estaNaTelaCadastro;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (
      !user &&
      !rotaPublica
    ) {
      navigate({
        to: "/login",
        replace: true,
      });

      return;
    }

    if (
      user &&
      usuarioAtivo &&
      rotaPublica
    ) {
      navigate({
        to: "/",
        replace: true,
      });
    }
  }, [
    user,
    usuarioAtivo,
    loading,
    rotaPublica,
    navigate,
  ]);

  async function handleSair() {
    try {
      await signOut();

      navigate({
        to: "/login",
        replace: true,
      });
    } catch (error) {
      console.error(
        "Erro ao sair:",
        error
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-muted-foreground">
          Carregando...
        </p>
      </div>
    );
  }

  if (
    !user &&
    rotaPublica
  ) {
    return <Outlet />;
  }

  if (!user) {
    return null;
  }

  if (!usuarioAtivo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Clock3 className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-950">
            Aguardando liberação
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Seu cadastro foi realizado, mas o acesso ao sistema ainda precisa ser aprovado por um administrador.
          </p>

          <div className="mt-6 rounded-xl border bg-slate-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />

              <div>
                <p className="text-sm font-medium text-slate-900">
                  Conta cadastrada
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {perfil?.email ||
                    user.email ||
                    "E-mail não informado"}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Depois que o administrador definir seu setor, cargo e ativar sua conta, faça login novamente.
          </p>

          <button
            type="button"
            onClick={handleSair}
            className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />

            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  return <AppLayout />;
}