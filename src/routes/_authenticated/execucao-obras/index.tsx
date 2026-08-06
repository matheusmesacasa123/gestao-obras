import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ObraExecucaoCard,
} from "@/features/execucao-obras/components/obra-execucao-card";

import {
  getObrasExecucao,
} from "@/features/execucao-obras/services/execucao-obras-service";

import type {
  ObraExecucao,
  StatusObraExecucao,
} from "@/features/execucao-obras/types";

export const Route = createFileRoute(
  "/_authenticated/execucao-obras/"
)({
  component:
    ExecucaoObrasPage,
});

type FiltroStatus =
  | "todos"
  | StatusObraExecucao;

function ExecucaoObrasPage() {
  const [
    obras,
    setObras,
  ] = useState<ObraExecucao[]>(
    []
  );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState(false);

  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    statusSelecionado,
    setStatusSelecionado,
  ] = useState<FiltroStatus>(
    "todos"
  );

  async function carregarObras(
    carregamentoInicial =
      false
  ) {
    try {
      if (
        carregamentoInicial
      ) {
        setCarregando(true);
      } else {
        setAtualizando(true);
      }

      setErro(false);

      const dados =
        await getObrasExecucao();

      setObras(
        dados
      );
    } catch (error) {
      console.error(
        "Erro ao carregar obras:",
        error
      );

      setErro(true);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregarObras(true);
  }, []);

  const obrasFiltradas =
    useMemo(() => {
      const termo =
        pesquisa
          .trim()
          .toLowerCase();

      return obras.filter(
        (
          obra
        ) => {
          const identificacao =
            (
              obra.codigo ||
              obra.numero_proposta ||
              ""
            ).toLowerCase();

          const codigoErp =
            (
              obra.codigo_erp ||
              ""
            ).toLowerCase();

          const cliente =
            (
              obra.cliente_relacionado
                ?.nome ||
              obra.cliente ||
              ""
            ).toLowerCase();

          const nomeObra =
            (
              obra.nome_obra ||
              ""
            ).toLowerCase();

          const correspondePesquisa =
            !termo ||
            identificacao.includes(
              termo
            ) ||
            codigoErp.includes(
              termo
            ) ||
            cliente.includes(
              termo
            ) ||
            nomeObra.includes(
              termo
            );

          const correspondeStatus =
            statusSelecionado ===
              "todos" ||
            obra.status ===
              statusSelecionado;

          return (
            correspondePesquisa &&
            correspondeStatus
          );
        }
      );
    }, [
      obras,
      pesquisa,
      statusSelecionado,
    ]);

  const possuiFiltros =
    Boolean(
      pesquisa.trim()
    ) ||
    statusSelecionado !==
      "todos";

  function limparFiltros() {
    setPesquisa("");

    setStatusSelecionado(
      "todos"
    );
  }

  if (carregando) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-7 w-7 animate-spin" />

          <p className="text-sm font-medium">
            Carregando obras...
          </p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-900">
            Erro ao carregar obras
          </h1>

          <p className="mt-2 text-sm text-red-700">
            Não foi possível buscar as obras cadastradas.
          </p>

          <button
            type="button"
            onClick={() =>
              carregarObras(true)
            }
            className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
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
            Execução
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Obras
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Controle e acompanhamento das obras em execução.
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
            to="/execucao-obras/nova"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            Nova obra
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_320px_auto]">
          <div className="space-y-2">
            <label
              htmlFor="pesquisar-obras-execucao"
              className="text-sm font-semibold text-slate-700"
            >
              Pesquisar obra
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="pesquisar-obras-execucao"
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
                placeholder="Código, ERP, cliente ou nome da obra..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="filtrar-status-obras"
              className="text-sm font-semibold text-slate-700"
            >
              Status
            </label>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                id="filtrar-status-obras"
                value={
                  statusSelecionado
                }
                onChange={(
                  event
                ) =>
                  setStatusSelecionado(
                    event.target
                      .value as FiltroStatus
                  )
                }
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">
                  Todos os status
                </option>

                <option value="nao_iniciada">
                  Não iniciada
                </option>

                <option value="em_andamento">
                  Em andamento
                </option>

                <option value="aguardando_cliente">
                  Aguardando cliente
                </option>

                <option value="paralisada">
                  Paralisada
                </option>

                <option value="atrasada">
                  Atrasada
                </option>

                <option value="concluida">
                  Concluída
                </option>

                <option value="cancelada">
                  Cancelada
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
            obras
          </p>
        </div>
      </section>

      {obras.length ===
      0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Building2 className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Nenhuma obra cadastrada
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Obras cadastradas diretamente ou geradas por orçamentos aprovados aparecerão aqui.
          </p>
        </section>
      ) : obrasFiltradas.length ===
        0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Search className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Nenhuma obra encontrada
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Não encontramos obras com os filtros selecionados.
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
              <ObraExecucaoCard
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