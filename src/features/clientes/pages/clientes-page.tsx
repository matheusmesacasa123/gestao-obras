// src/features/clientes/pages/clientes-page.tsx

import { useEffect, useState } from "react";
import { getClientes, criarCliente, excluirCliente, type Cliente } from "../services/clientes-service";

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  // Função para aplicar a máscara de telefone (XX) XXXXX-XXXX
  function formatarTelefone(valor: string) {
    let apenasNumeros = valor.replace(/\D/g, "");
    if (apenasNumeros.length > 11) {
      apenasNumeros = apenasNumeros.slice(0, 11);
    }

    if (apenasNumeros.length > 6) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
    } else if (apenasNumeros.length > 2) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    } else if (apenasNumeros.length > 0) {
      return `(${apenasNumeros}`;
    }
    return "";
  }

  function handleTelefoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatado = formatarTelefone(e.target.value);
    setTelefone(formatado);
  }

  async function carregarClientes() {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      alert("O nome do cliente é obrigatório!");
      return;
    }

    try {
      await criarCliente({ nome, email, telefone });
      setNome("");
      setEmail("");
      setTelefone("");
      carregarClientes();
    } catch (error: any) {
      alert("Erro ao cadastrar cliente: " + (error?.message || "Erro desconhecido"));
    }
  }

  async function handleExcluir(id: string) {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return;
    try {
      await excluirCliente(id);
      carregarClientes();
    } catch (error: any) {
      alert("Erro ao excluir: " + (error?.message || "Erro desconhecido"));
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
      </div>

      <form onSubmit={handleSalvar} className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Cadastrar Novo Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Nome do Cliente / Empresa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={handleTelefoneChange}
            maxLength={15}
            className="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-xl text-sm transition-colors"
        >
          Salvar Cliente
        </button>
      </form>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500 text-sm">Carregando clientes...</p>
        ) : clientes.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                <th className="p-4">Nome</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Telefone</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-gray-800">
              {clientes.map((cli) => (
                <tr key={cli.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium">{cli.nome}</td>
                  <td className="p-4 text-gray-600">{cli.email || "—"}</td>
                  <td className="p-4 text-gray-600">{cli.telefone || "—"}</td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleExcluir(cli.id)}
                      className="text-red-600 hover:text-red-800 font-semibold text-xs border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}