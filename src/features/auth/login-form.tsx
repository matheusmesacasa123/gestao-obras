import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  LockKeyhole,
  LogIn,
  Mail,
  UserRoundPlus,
} from "lucide-react";

import {
  signIn,
} from "@/services/auth/auth-service";

export function LoginForm() {
  const navigate =
    useNavigate();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    senha,
    setSenha,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErro("");

    try {
      const {
        error,
      } = await signIn(
        email.trim(),
        senha
      );

      if (error) {
        setErro(
          "E-mail ou senha incorretos."
        );

        return;
      }

      navigate({
        to: "/",
        replace: true,
      });
    } catch (error) {
      console.error(
        "Erro ao entrar:",
        error
      );

      setErro(
        "Não foi possível entrar no sistema."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="w-full max-w-sm space-y-5 rounded-2xl border bg-white p-8 shadow-xl"
    >
      <div>
        <h1 className="text-2xl font-bold">
          Acessar o sistema
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Informe seus dados de acesso.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="login-email"
          className="text-sm font-medium"
        >
          E-mail
        </label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            id="login-email"
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
          htmlFor="login-senha"
          className="text-sm font-medium"
        >
          Senha
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            id="login-senha"
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(event) =>
              setSenha(
                event.target.value
              )
            }
            required
            autoComplete="current-password"
            className="h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogIn className="h-4 w-4" />

        {loading
          ? "Entrando..."
          : "Entrar"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />

        <span className="text-xs text-muted-foreground">
          ou
        </span>

        <div className="h-px flex-1 bg-border" />
      </div>

      <Link
        to="/cadastro"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
      >
        <UserRoundPlus className="h-4 w-4" />

        Criar uma conta
      </Link>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        O acesso ao sistema será liberado por um administrador após o cadastro.
      </p>
    </form>
  );
}