import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  CheckCircle2,
  LockKeyhole,
  Mail,
  UserRound,
  UserRoundPlus,
} from "lucide-react";

import {
  signUp,
} from "@/services/auth/auth-service";

export function CadastroForm() {
  const navigate =
    useNavigate();

  const [
    nome,
    setNome,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    senha,
    setSenha,
  ] = useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    cadastroRealizado,
    setCadastroRealizado,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function handleCadastro(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");

    const nomeTratado =
      nome.trim();

    const emailTratado =
      email.trim().toLowerCase();

    if (
      nomeTratado.length < 3
    ) {
      setErro(
        "Informe seu nome completo."
      );

      return;
    }

    if (
      senha.length < 6
    ) {
      setErro(
        "A senha deve possuir pelo menos 6 caracteres."
      );

      return;
    }

    if (
      senha !== confirmarSenha
    ) {
      setErro(
        "As senhas não coincidem."
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error,
      } = await signUp(
        nomeTratado,
        emailTratado,
        senha
      );

      if (error) {
        const mensagem =
          error.message.toLowerCase();

        if (
          mensagem.includes(
            "already registered"
          ) ||
          mensagem.includes(
            "already been registered"
          )
        ) {
          setErro(
            "Este e-mail já está cadastrado."
          );

          return;
        }

        if (
          mensagem.includes(
            "password"
          )
        ) {
          setErro(
            "A senha informada não atende aos requisitos de segurança."
          );

          return;
        }

        setErro(
          "Não foi possível realizar o cadastro."
        );

        return;
      }

      if (
        data.session
      ) {
        navigate({
          to: "/",
          replace: true,
        });

        return;
      }

      setCadastroRealizado(
        true
      );
    } catch (error) {
      console.error(
        "Erro ao cadastrar usuário:",
        error
      );

      setErro(
        "Não foi possível realizar o cadastro."
      );
    } finally {
      setLoading(false);
    }
  }

  if (cadastroRealizado) {
    return (
      <div className="w-full max-w-sm space-y-5 rounded-2xl border bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            Cadastro realizado
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sua conta foi criada. Caso a confirmação de e-mail esteja habilitada, acesse sua caixa de entrada antes de entrar.
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Depois disso, será necessário aguardar a liberação de um administrador.
          </p>
        </div>

        <Link
          to="/login"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleCadastro}
      className="w-full max-w-sm space-y-5 rounded-2xl border bg-white p-8 shadow-xl"
    >
      <div>
        <h1 className="text-2xl font-bold">
          Criar uma conta
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Após o cadastro, o acesso deverá ser liberado por um administrador.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="cadastro-nome"
          className="text-sm font-medium"
        >
          Nome completo
        </label>

        <div className="relative">
          <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            id="cadastro-nome"
            type="text"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(event) =>
              setNome(
                event.target.value
              )
            }
            required
            autoComplete="name"
            className="h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="cadastro-email"
          className="text-sm font-medium"
        >
          E-mail
        </label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            id="cadastro-email"
            type="email"
            placeholder="seuemail@empresa.com"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            required
            autoComplete="email"
            className="h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="cadastro-senha"
          className="text-sm font-medium"
        >
          Senha
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            id="cadastro-senha"
            type="password"
            placeholder="Mínimo de 6 caracteres"
            value={senha}
            onChange={(event) =>
              setSenha(
                event.target.value
              )
            }
            required
            minLength={6}
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="cadastro-confirmar-senha"
          className="text-sm font-medium"
        >
          Confirmar senha
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            id="cadastro-confirmar-senha"
            type="password"
            placeholder="Digite a senha novamente"
            value={confirmarSenha}
            onChange={(event) =>
              setConfirmarSenha(
                event.target.value
              )
            }
            required
            minLength={6}
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserRoundPlus className="h-4 w-4" />

        {loading
          ? "Cadastrando..."
          : "Criar conta"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Já possui uma conta?{" "}

        <Link
          to="/login"
          className="font-medium text-slate-950 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}