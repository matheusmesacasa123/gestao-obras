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
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErro("");

    try {
      const { error } = await signIn(email.trim(), senha);

      if (error) {
        setErro("E-mail ou senha incorretos.");
        return;
      }

      navigate({
        to: "/",
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao entrar:", error);
      setErro("Não foi possível entrar no sistema.");
    } finally {
      setLoading(false);
    }
  }

  const campo =
    "h-11 w-full rounded-xl border border-input bg-white pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-[#4f8192] focus:ring-4 focus:ring-[#4f8192]/10";

  return (
    <form
      onSubmit={handleLogin}
      className="w-full space-y-5 rounded-3xl border border-white/80 bg-white/95 p-7 shadow-2xl shadow-[#173240]/10 backdrop-blur sm:p-9"
    >
      <div>
        <div className="mb-5 flex items-center gap-3 lg:hidden">
          <img
            src="/kemia-logo.png"
            alt="Kemia"
            className="h-12 w-auto object-contain"
          />
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4f8192]">
          Área restrita
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Acessar o sistema
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Informe seus dados para continuar.
        </p>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          {erro}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="login-email" className="text-sm font-semibold text-foreground">
          E-mail
        </label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f8192]" />
          <input
            id="login-email"
            type="email"
            placeholder="seuemail@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className={campo}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="login-senha" className="text-sm font-semibold text-foreground">
          Senha
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f8192]" />
          <input
            id="login-senha"
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
            autoComplete="current-password"
            className={campo}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#436f82] px-4 text-sm font-semibold text-white shadow-lg shadow-[#436f82]/20 transition hover:-translate-y-0.5 hover:bg-[#365f71] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <LogIn className="h-4 w-4" />
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Link
        to="/cadastro"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-[#315f72] transition hover:border-[#91bda4] hover:bg-[#f5f9f7]"
      >
        <UserRoundPlus className="h-4 w-4" />
        Criar uma conta
      </Link>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        O acesso será liberado por um administrador após o cadastro.
      </p>
    </form>
  );
}
