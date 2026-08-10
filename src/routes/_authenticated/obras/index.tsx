import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  getObras,
} from "@/features/obras/services/obras-service";

import type {
  Obra,
} from "@/features/obras/types";

import {
  ObraCard,
} from "@/features/obras/components/obra-card";

export const Route = createFileRoute(
  "/_authenticated/obras/"
)({
  component: ObrasPage,
});

function ObrasPage() {
  const [
    obras,
    setObras,
  ] = useState<Obra[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(false);

  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    setorSelecionadoId,
    setSetorSelecionadoId,
  ] = useState("todos");

  async function carregarObras(
    carregamentoInicial = false
  ) {
    try {
      if (carregamentoInicial) {
        setLoading(true);
      } else {
        setAtualizando(true);
      }

      setError(false);

      const data =
        await getObras();

      setObras(data);
    } catch (error) {
      console.error(
        "Erro ao buscar obras:",
        error
      );

      setError(true);
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregarObras(true);
  }, []);

  const setoresDisponiveis =
    useMemo(() => {
      const setoresMap =
        new Map<
          string,
          string
        >();

      obras.forEach(
        (
          obra
        ) => {
          if (
            obra.setor_id &&
            obra.setor?.nome
          ) {
            setoresMap.set(
              obra.setor_id,
              obra.setor.nome
            );
          }
        }
      );

      return Array.from(
        setoresMap.entries()
      )
        .map(
          ([
            id,
            nome,
          ]) => ({
            id,
            nome,
          })
        )
        .sort(
          (
            setorA,
            setorB
          ) =>
            setorA.nome.localeCompare(
              setorB.nome,
              "pt-BR"
            )
        );
    }, [
      obras,
    ]);

  const obrasFiltradas =
    useMemo(() => {
      const termo =
        pesquisa
          .trim()
          .toLowerCase();

      return obras
        .filter(
          (
            obra
          ) => {
            const codigo =
              obra.codigo
                ?.toLowerCase() ||
              "";

            const cliente =
              obra.cliente
                ?.toLowerCase() ||
              "";

            const correspondePesquisa =
              !termo ||
              codigo.includes(
                termo
              ) ||
              cliente.includes(
                termo
              );

            const correspondeSetor =
              setorSelecionadoId ===
                "todos" ||
              (
                setorSelecionadoId ===
                  "sem_setor" &&
                !obra.setor_id
              ) ||
              obra.setor_id ===
                setorSelecionadoId;

            return (
              correspondePesquisa &&
              correspondeSetor
            );
          }
        )
        .sort(
          (
            obraA,
            obraB
          ) => {
            const propostaA =
              obraA.numero_proposta
                ?.trim() ||
              "";

            const propostaB =
              obraB.numero_proposta
                ?.trim() ||
              "";

            if (
              !propostaA &&
              !propostaB
            ) {
              return 0;
            }

            if (!propostaA) {
              return 1;
            }

            if (!propostaB) {
              return -1;
            }

            return propostaB.localeCompare(
              propostaA,
              "pt-BR",
              {
                numeric:
                  true,

                sensitivity:
                  "base",
              }
            );
          }
        );
    }, [
      obras,
      pesquisa,
      setorSelecionadoId,
    ]);

  const possuiFiltros =
    Boolean(
      pesquisa.trim()
    ) ||
    setorSelecionadoId !==
      "todos";

  function limparFiltros() {
    setPesquisa("");

    setSetorSelecionadoId(
      "todos"
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="h-7 w-7 animate-spin" />

          <p className="text-sm font-medium">
            Carregando orçamentos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-900">
            Erro ao carregar orçamentos
          </h1>

          <p className="mt-2 text-sm text-red-700">
            Não foi possível buscar os orçamentos.
          </p>

          <button
            type="button"
            onClick={() =>
              carregarObras(true)
            }
            className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Orçamentos
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Orçamentação
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Controle e acompanhamento dos orçamentos cadastrados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              carregarObras(false)
            }
            disabled={
              atualizando
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                atualizando
                  ? "animate-spin"
                  : ""
              }`}
            />

            Atualizar
          </button>

          <Link
            to="/obras/nova"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            Novo orçamento
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_320px_auto]">
          <div className="space-y-2">
            <label
              htmlFor="pesquisar-orcamentos"
              className="text-sm font-semibold text-slate-700"
            >
              Pesquisar orçamento
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="pesquisar-orcamentos"
                type="text"
                value={
                  pesquisa
                }
                onChange={(
                  event
                ) =>
                  setPesquisa(
                    event.target.value
                  )
                }
                placeholder="Digite o código ou cliente..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="filtrar-setor-obras"
              className="text-sm font-semibold text-slate-700"
            >
              Setor atual
            </label>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                id="filtrar-setor-obras"
                value={
                  setorSelecionadoId
                }
                onChange={(
                  event
                ) =>
                  setSetorSelecionadoId(
                    event.target.value
                  )
                }
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">
                  Todos os setores
                </option>

                {setoresDisponiveis.map(
                  (
                    setor
                  ) => (
                    <option
                      key={
                        setor.id
                      }
                      value={
                        setor.id
                      }
                    >
                      {setor.nome}
                    </option>
                  )
                )}

                <option value="sem_setor">
                  Sem setor definido
                </option>
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={
                limparFiltros
              }
              disabled={
                !possuiFiltros
              }
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
            >
              <X className="h-4 w-4" />

              Limpar
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Exibindo{" "}
            <strong className="text-slate-900">
              {obrasFiltradas.length}
            </strong>{" "}
            de{" "}
            <strong className="text-slate-900">
              {obras.length}
            </strong>{" "}
            orçamentos
          </p>
        </div>
      </section>

      {obras.length ===
      0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Building2 className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Nenhum orçamento cadastrado
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Os novos orçamentos cadastrados aparecerão aqui.
          </p>

          <Link
            to="/obras/nova"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            Cadastrar primeiro orçamento
          </Link>
        </section>
      ) : obrasFiltradas.length ===
        0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Search className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Nenhum orçamento encontrado
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Não encontramos orçamentos com os filtros selecionados.
          </p>

          <button
            type="button"
            onClick={
              limparFiltros
            }
            className="mt-5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Limpar filtros
          </button>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {obrasFiltradas.map(
            (
              obra
            ) => (
              <ObraCard
                key={
                  obra.id
                }
                obra={
                  obra
                }
                onDelete={() =>
                  carregarObras(false)
                }
              />
            )
          )}
        </section>
      )}
    </div>
  );
}