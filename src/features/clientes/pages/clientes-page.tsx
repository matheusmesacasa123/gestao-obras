import { useEffect, useMemo, useState } from "react";

import { Search } from "lucide-react";

import { useNavigate } from "@tanstack/react-router";

import {
  criarCliente,
  excluirCliente,
  getClientes,
  type Cliente,
} from "../services/clientes-service";

function formatarMoeda(valor?: number | null) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function ClientesPage() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");

  const [razaoSocial, setRazaoSocial] = useState("");

  const [cnpj, setCnpj] = useState("");

  const [email, setEmail] = useState("");

  const [telefone, setTelefone] = useState("");

  function formatarCnpj(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function handleCnpjChange(event: React.ChangeEvent<HTMLInputElement>) {
    setCnpj(formatarCnpj(event.target.value));
  }

  function formatarTelefone(valor: string) {
    let apenasNumeros = valor.replace(/\D/g, "");

    if (apenasNumeros.length > 11) {
      apenasNumeros = apenasNumeros.slice(0, 11);
    }

    if (apenasNumeros.length > 6) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(
        2,
        7,
      )}-${apenasNumeros.slice(7)}`;
    }

    if (apenasNumeros.length > 2) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    }

    if (apenasNumeros.length > 0) {
      return `(${apenasNumeros}`;
    }

    return "";
  }

  function handleTelefoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTelefone(formatarTelefone(event.target.value));
  }

  async function carregarClientes() {
    try {
      setLoading(true);

      const data = await getClientes();

      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    if (!termo) {
      return clientes;
    }

    return clientes.filter(
      (cliente) =>
        cliente.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        (cliente.razao_social ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(termo) ||
        (cliente.cnpj ?? "").includes(termo) ||
        (cliente.email ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (cliente.telefone ?? "").includes(termo),
    );
  }, [busca, clientes]);

  async function handleSalvar(event: React.FormEvent) {
    event.preventDefault();

    if (!nome.trim()) {
      alert("O nome do cliente é obrigatório!");

      return;
    }

    if (!razaoSocial.trim()) {
      alert("A razão social é obrigatória!");

      return;
    }

    if (!cnpj.trim()) {
      alert("O CNPJ é obrigatório!");

      return;
    }

    try {
      await criarCliente({
        nome: nome.trim(),

        razao_social: razaoSocial.trim(),

        cnpj: cnpj.trim(),

        email: email.trim() || null,

        telefone: telefone.trim() || null,
      });

      setNome("");
      setRazaoSocial("");
      setCnpj("");
      setEmail("");
      setTelefone("");

      await carregarClientes();
    } catch (error: any) {
      alert(
        "Erro ao cadastrar cliente: " + (error?.message || "Erro desconhecido"),
      );
    }
  }

  async function handleExcluir(cliente: Cliente) {
    const quantidadeObras = cliente.quantidade_obras ?? 0;

    if (quantidadeObras > 0) {
      alert(
        `Este cliente possui ${quantidadeObras} ${
          quantidadeObras === 1 ? "obra vinculada" : "obras vinculadas"
        } e não pode ser excluído.`,
      );

      return;
    }

    if (
      !window.confirm(`Deseja realmente excluir o cliente "${cliente.nome}"?`)
    ) {
      return;
    }

    try {
      await excluirCliente(cliente.id);

      await carregarClientes();
    } catch (error: any) {
      alert("Erro ao excluir: " + (error?.message || "Erro desconhecido"));
    }
  }

  function abrirCliente(clienteId: string) {
    navigate({
      to: "/clientes/$id",

      params: {
        id: clienteId,
      },
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>

          <p className="mt-1 text-sm text-gray-500">
            Cadastro, consulta e acompanhamento das obras por cliente.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSalvar}
        className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-800">
          Cadastrar Novo Cliente
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input
            type="text"
            placeholder="Nome do Cliente / Empresa *"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="text"
            placeholder="Razão Social *"
            value={razaoSocial}
            onChange={(event) => setRazaoSocial(event.target.value)}
            required
            className="rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="text"
            placeholder="CNPJ *"
            value={cnpj}
            onChange={handleCnpjChange}
            maxLength={18}
            inputMode="numeric"
            required
            className="rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="text"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={handleTelefoneChange}
            maxLength={15}
            className="rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Salvar Cliente
        </button>
      </form>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Clientes cadastrados
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {clientesFiltrados.length}{" "}
              {clientesFiltrados.length === 1
                ? "cliente encontrado"
                : "clientes encontrados"}
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, razão social, CNPJ, e-mail ou telefone"
              className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Carregando clientes...</p>
          ) : clientes.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              Nenhum cliente cadastrado ainda.
            </p>
          ) : clientesFiltrados.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              Nenhum cliente corresponde à busca.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                    <th className="p-4">Nome</th>

                    <th className="p-4">E-mail</th>

                    <th className="p-4">Telefone</th>

                    <th className="p-4 text-center">Obras</th>

                    <th className="p-4 text-right">Valor vendido</th>

                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y text-sm text-gray-800">
                  {clientesFiltrados.map((cliente) => {
                    const quantidadeObras = cliente.quantidade_obras ?? 0;

                    const possuiObras = quantidadeObras > 0;

                    return (
                      <tr
                        key={cliente.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => abrirCliente(cliente.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();

                            abrirCliente(cliente.id);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-200"
                      >
                        <td className="p-4 font-semibold text-gray-900">
                          {cliente.nome}
                        </td>

                        <td className="p-4 text-gray-600">
                          {cliente.email || "—"}
                        </td>

                        <td className="p-4 text-gray-600">
                          {cliente.telefone || "—"}
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex min-w-9 items-center justify-center rounded-full px-3 py-1 text-xs font-bold ${
                              possuiObras
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {quantidadeObras}
                          </span>
                        </td>

                        <td className="p-4 text-right font-semibold tabular-nums text-gray-900">
                          {formatarMoeda(cliente.valor_total_vendido)}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            disabled={possuiObras}
                            title={
                              possuiObras
                                ? "Clientes com obras vinculadas não podem ser excluídos."
                                : "Excluir cliente"
                            }
                            onClick={(event) => {
                              event.stopPropagation();

                              handleExcluir(cliente);
                            }}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}