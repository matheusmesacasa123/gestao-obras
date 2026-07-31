import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  UserRound,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  atualizarNomeUsuario,
  atualizarSenhaUsuario,
} from "@/services/auth/auth-service";

import {
  supabase,
} from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/minha-conta"
)({
  component: MinhaContaPage,
});

type PerfilUsuario = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean | null;
  setor: {
    nome: string;
  } | null;
  cargo: {
    nome: string;
  } | null;
};

function formatarData(
  valor?: string
): string {
  if (!valor) {
    return "Não informado";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Não informado";
  }

  return data.toLocaleString(
    "pt-BR"
  );
}

function MinhaContaPage() {
  const {
    user,
    signOut,
    refreshUser,
  } = useAuth();

  const navigate = useNavigate();

  const [perfil, setPerfil] =
    useState<PerfilUsuario | null>(null);

  const [nome, setNome] =
    useState("");

  const [novaSenha, setNovaSenha] =
    useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    carregandoPerfil,
    setCarregandoPerfil,
  ] = useState(true);

  const [
    salvandoNome,
    setSalvandoNome,
  ] = useState(false);

  const [
    salvandoSenha,
    setSalvandoSenha,
  ] = useState(false);

  const [saindo, setSaindo] =
    useState(false);

  const [
    mensagemSucesso,
    setMensagemSucesso,
  ] = useState("");

  const [erro, setErro] =
    useState("");

  async function carregarPerfil() {
    if (!user?.id) {
      setPerfil(null);
      setCarregandoPerfil(false);
      return;
    }

    try {
      setCarregandoPerfil(true);

      const {
        data,
        error,
      } = await supabase
        .from("usuarios")
        .select(`
          id,
          nome,
          email,
          ativo,
          setor:setores (
            nome
          ),
          cargo:cargos (
            nome
          )
        `)
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      const perfilEncontrado =
        data as unknown as PerfilUsuario;

      setPerfil(perfilEncontrado);

      setNome(
        perfilEncontrado.nome ||
        user.user_metadata?.nome ||
        user.user_metadata?.name ||
        ""
      );
    } catch (error) {
      console.error(
        "Erro ao carregar perfil:",
        error
      );

      setPerfil(null);

      setNome(
        user.user_metadata?.nome ||
        user.user_metadata?.name ||
        ""
      );

      setErro(
        "Não foi possível carregar todas as informações da conta."
      );
    } finally {
      setCarregandoPerfil(false);
    }
  }

  useEffect(() => {
    carregarPerfil();
  }, [user?.id]);

  async function handleSalvarNome(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setMensagemSucesso("");

    const nomeTratado =
      nome.trim();

    if (!nomeTratado) {
      setErro(
        "Informe o seu nome."
      );

      return;
    }

    if (!user?.id) {
      setErro(
        "Usuário não autenticado."
      );

      return;
    }

    try {
      setSalvandoNome(true);

      const {
        error: erroAuth,
      } = await atualizarNomeUsuario(
        nomeTratado
      );

      if (erroAuth) {
        throw erroAuth;
      }

      const {
        error: erroUsuario,
      } = await supabase
        .from("usuarios")
        .update({
          nome: nomeTratado,
        })
        .eq("id", user.id);

      if (erroUsuario) {
        throw erroUsuario;
      }

      await refreshUser();
      await carregarPerfil();

      setMensagemSucesso(
        "Nome atualizado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar nome:",
        error
      );

      setErro(
        "Não foi possível atualizar o nome."
      );
    } finally {
      setSalvandoNome(false);
    }
  }

  async function handleAlterarSenha(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setMensagemSucesso("");

    if (novaSenha.length < 6) {
      setErro(
        "A nova senha deve possuir pelo menos 6 caracteres."
      );

      return;
    }

    if (
      novaSenha !==
      confirmarSenha
    ) {
      setErro(
        "A confirmação da senha não corresponde à nova senha."
      );

      return;
    }

    try {
      setSalvandoSenha(true);

      const {
        error,
      } = await atualizarSenhaUsuario(
        novaSenha
      );

      if (error) {
        throw error;
      }

      setNovaSenha("");
      setConfirmarSenha("");

      setMensagemSucesso(
        "Senha alterada com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar senha:",
        error
      );

      setErro(
        "Não foi possível alterar a senha."
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function handleSair() {
    try {
      setSaindo(true);

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

      setErro(
        "Não foi possível sair da conta."
      );
    } finally {
      setSaindo(false);
    }
  }

  const nomeExibido =
    perfil?.nome ||
    user?.user_metadata?.nome ||
    user?.user_metadata?.name ||
    "Usuário";

  const emailExibido =
    perfil?.email ||
    user?.email ||
    "E-mail não informado";

  const setorExibido =
    perfil?.setor?.nome ||
    "Setor não definido";

  const cargoExibido =
    perfil?.cargo?.nome ||
    "Cargo não definido";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Minha conta
        </h1>

        <p className="mt-1 text-muted-foreground">
          Gerencie suas informações de acesso e visualize seus dados profissionais.
        </p>
      </div>

      {mensagemSucesso && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />

          {mensagemSucesso}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
            <UserRound className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              {carregandoPerfil
                ? "Carregando..."
                : nomeExibido}
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {carregandoPerfil
                ? "Carregando cargo..."
                : cargoExibido}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {carregandoPerfil
                ? "Carregando setor..."
                : setorExibido}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />

              E-mail
            </div>

            <p className="mt-2 break-all text-sm text-muted-foreground">
              {emailExibido}
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />

              Setor
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {carregandoPerfil
                ? "Carregando..."
                : setorExibido}
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BriefcaseBusiness className="h-4 w-4" />

              Cargo
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {carregandoPerfil
                ? "Carregando..."
                : cargoExibido}
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4" />

              Último acesso
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {formatarData(
                user?.last_sign_in_at
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSalvarNome}
          className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-semibold">
              Informações pessoais
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Altere o nome exibido no sistema.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="nome-usuario"
              className="text-sm font-medium"
            >
              Nome
            </label>

            <input
              id="nome-usuario"
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(
                  event.target.value
                )
              }
              disabled={carregandoPerfil}
              className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70"
              placeholder="Informe seu nome"
            />
          </div>

          <button
            type="submit"
            disabled={
              salvandoNome ||
              carregandoPerfil
            }
            className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvandoNome
              ? "Salvando..."
              : "Salvar informações"}
          </button>
        </form>

        <form
          onSubmit={handleAlterarSenha}
          className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-semibold">
              Alterar senha
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Defina uma nova senha para acessar sua conta.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="nova-senha"
              className="text-sm font-medium"
            >
              Nova senha
            </label>

            <input
              id="nova-senha"
              type="password"
              value={novaSenha}
              onChange={(event) =>
                setNovaSenha(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmar-senha"
              className="text-sm font-medium"
            >
              Confirmar nova senha
            </label>

            <input
              id="confirmar-senha"
              type="password"
              value={confirmarSenha}
              onChange={(event) =>
                setConfirmarSenha(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Digite novamente"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={salvandoSenha}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvandoSenha
              ? "Alterando..."
              : "Alterar senha"}
          </button>
        </form>
      </div>

      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Sessão
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Encerre esta sessão para entrar com outra conta.
        </p>

        <button
          type="button"
          onClick={handleSair}
          disabled={saindo}
          className="mt-5 flex cursor-pointer items-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />

          {saindo
            ? "Saindo..."
            : "Sair da conta"}
        </button>
      </section>
    </div>
  );
}