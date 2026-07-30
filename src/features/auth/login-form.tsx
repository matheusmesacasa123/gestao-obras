import { useState } from "react";
import { signIn } from "@/services/auth/auth-service";
import { useNavigate } from "@tanstack/react-router";


export function LoginForm() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setErro("");

    const { error } = await signIn(email, senha);


    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }


    navigate({
      to: "/",
    });

  }


  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col gap-4 w-80"
    >

      <h1 className="text-2xl font-bold">
        Login
      </h1>


      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        className="border p-2 rounded"
      />


      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e)=>setSenha(e.target.value)}
        className="border p-2 rounded"
      />


      {erro && (
        <span className="text-red-500">
          {erro}
        </span>
      )}


      <button
        disabled={loading}
        className="bg-black text-white p-2 rounded"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>

    </form>
  );
}