import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileClock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  supabase,
} from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/historico-obras"
)({
  component:
    HistoricoObrasPage,
});

type AcaoHistoricoObra =
  | "criou"
  | "excluiu";

type FiltroAcaoHistorico =
  | "todas"
  | AcaoHistoricoObra;

type UsuarioHistorico = {
  id: string;
  nome: string;
  email: string;
};

type HistoricoObra = {
  id: string;
  obra_id: string;
  usuario_id: string | null;
  acao: AcaoHistoricoObra;
  entidade: "obra";
  descricao: string | null;

  dados_anteriores:
    | Record<string, unknown>
    | null;

  dados_novos:
    | Record<string, unknown>
    | null;

  created_at: string;

  usuario?:
    | UsuarioHistorico
    | UsuarioHistorico[]
    | null;
};

type GrupoHistorico = {
  chave: string;
  titulo: string;
  registros: HistoricoObra[];
};

const REGISTROS_POR_PAGINA =
  10;

function obterUsuarioHistorico(
  historico: HistoricoObra
) {
  if (
    Array.isArray(
      historico.usuario
    )
  ) {
    return (
      historico.usuario[0] ||
      null
    );
  }

  return (
    historico.usuario ||
    null
  );
}

function obterValorTexto(
  dados:
    | Record<string, unknown>
    | null,
  campo: string
) {
  const valor =
    dados?.[campo];

  if (
    typeof valor !==
    "string"
  ) {
    return "";
  }

  return valor.trim();
}

function obterDadosHistorico(
  historico: HistoricoObra
) {
  return historico.acao ===
    "excluiu"
    ? historico.dados_anteriores
    : historico.dados_novos;
}

function obterCodigoObra(
  historico: HistoricoObra
) {
  const dados =
    obterDadosHistorico(
      historico
    );

  return (
    obterValorTexto(
      dados,
      "codigo"
    ) ||
    obterValorTexto(
      dados,
      "nome_obra"
    ) ||
    "Sem código"
  );
}

function obterClienteObra(
  historico: HistoricoObra
) {
  const dados =
    obterDadosHistorico(
      historico
    );

  return (
    obterValorTexto(
      dados,
      "cliente"
    ) ||
    obterValorTexto(
      dados,
      "razao_social"
    ) ||
    ""
  );
}

function formatarDataHora(
  valor: string
) {
  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  ).format(data);
}

function criarDataSemHorario(
  valor: string
) {
  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return null;
  }

  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );
}

function obterChaveData(
  valor: string
) {
  const data =
    criarDataSemHorario(
      valor
    );

  if (!data) {
    return "data-desconhecida";
  }

  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      data.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${ano}-${mes}-${dia}`;
}

function obterTituloData(
  valor: string
) {
  const data =
    criarDataSemHorario(
      valor
    );

  if (!data) {
    return "Data desconhecida";
  }

  const hoje =
    new Date();

  hoje.setHours(
    0,
    0,
    0,
    0
  );

  const ontem =
    new Date(hoje);

  ontem.setDate(
    ontem.getDate() - 1
  );

  if (
    data.getTime() ===
    hoje.getTime()
  ) {
    return "Hoje";
  }

  if (
    data.getTime() ===
    ontem.getTime()
  ) {
    return "Ontem";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday:
        "long",

      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(data);
}

function HistoricoObrasPage() {
  const [
    historico,
    setHistorico,
  ] = useState<HistoricoObra[]>(
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
  ] = useState("");

  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    acaoSelecionada,
    setAcaoSelecionada,
  ] =
    useState<FiltroAcaoHistorico>(
      "todas"
    );

  const [
    pagina,
    setPagina,
  ] = useState(1);

  async function carregarHistorico(
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

      setErro("");

      const {
        data,
        error,
      } = await supabase
        .from(
          "historico_obras"
        )
        .select(`
          id,
          obra_id,
          usuario_id,
          acao,
          entidade,
          descricao,
          dados_anteriores,
          dados_novos,
          created_at,
          usuario:usuarios (
            id,
            nome,
            email
          )
        `)
        .eq(
          "entidade",
          "obra"
        )
        .in(
          "acao",
          [
            "criou",
            "excluiu",
          ]
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(500);

      if (error) {
        throw error;
      }

      setHistorico(
        (
          data ||
          []
        ) as unknown as HistoricoObra[]
      );
    } catch (error) {
      console.error(
        "Erro ao carregar histórico de obras:",
        error
      );

      setErro(
        "Não foi possível carregar o histórico de obras."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregarHistorico(true);
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [
    pesquisa,
    acaoSelecionada,
  ]);

  const historicoFiltrado =
    useMemo(() => {
      const termo =
        pesquisa
          .trim()
          .toLowerCase();

      return historico.filter(
        (
          registro
        ) => {
          const usuario =
            obterUsuarioHistorico(
              registro
            );

          const codigo =
            obterCodigoObra(
              registro
            ).toLowerCase();

          const cliente =
            obterClienteObra(
              registro
            ).toLowerCase();

          const nomeUsuario =
            usuario?.nome
              ?.toLowerCase() ||
            "";

          const emailUsuario =
            usuario?.email
              ?.toLowerCase() ||
            "";

          const correspondePesquisa =
            !termo ||
            codigo.includes(
              termo
            ) ||
            cliente.includes(
              termo
            ) ||
            nomeUsuario.includes(
              termo
            ) ||
            emailUsuario.includes(
              termo
            );

          const correspondeAcao =
            acaoSelecionada ===
              "todas" ||
            registro.acao ===
              acaoSelecionada;

          return (
            correspondePesquisa &&
            correspondeAcao
          );
        }
      );
    }, [
      historico,
      pesquisa,
      acaoSelecionada,
    ]);

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        historicoFiltrado.length /
          REGISTROS_POR_PAGINA
      )
    );

  const paginaSegura =
    Math.min(
      pagina,
      totalPaginas
    );

  const indiceInicial =
    (
      paginaSegura -
      1
    ) *
    REGISTROS_POR_PAGINA;

  const indiceFinal =
    Math.min(
      indiceInicial +
        REGISTROS_POR_PAGINA,
      historicoFiltrado.length
    );

  const historicoPaginado =
    useMemo(
      () =>
        historicoFiltrado.slice(
          indiceInicial,
          indiceFinal
        ),
      [
        historicoFiltrado,
        indiceInicial,
        indiceFinal,
      ]
    );

  const historicoAgrupado =
    useMemo(() => {
      const grupos =
        new Map<
          string,
          GrupoHistorico
        >();

      historicoPaginado.forEach(
        (
          registro
        ) => {
          const chave =
            obterChaveData(
              registro.created_at
            );

          const grupo =
            grupos.get(
              chave
            );

          if (grupo) {
            grupo.registros.push(
              registro
            );

            return;
          }

          grupos.set(
            chave,
            {
              chave,

              titulo:
                obterTituloData(
                  registro.created_at
                ),

              registros: [
                registro,
              ],
            }
          );
        }
      );

      return Array.from(
        grupos.values()
      );
    }, [
      historicoPaginado,
    ]);

  const possuiFiltros =
    Boolean(
      pesquisa.trim()
    ) ||
    acaoSelecionada !==
      "todas";

  function limparFiltros() {
    setPesquisa("");

    setAcaoSelecionada(
      "todas"
    );

    setPagina(1);
  }

  function alterarPagina(
    novaPagina: number
  ) {
    setPagina(
      Math.min(
        Math.max(
          novaPagina,
          1
        ),
        totalPaginas
      )
    );
  }

  if (carregando) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-7 w-7 animate-spin" />

          <p className="text-sm font-medium">
            Carregando histórico...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Auditoria
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Histórico de Obras
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Consulte quem criou ou excluiu obras no sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            carregarHistorico(false)
          }
          disabled={
            atualizando
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
      </header>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {erro}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
              <FileClock className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Registros de atividade
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Criações e exclusões registradas pelo sistema.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {historico.length}{" "}
            {historico.length ===
            1
              ? "registro"
              : "registros"}
          </span>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">
            <div className="space-y-2">
              <label
                htmlFor="pesquisar-historico"
                className="text-sm font-semibold text-slate-700"
              >
                Pesquisar
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="pesquisar-historico"
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
                  placeholder="Código, cliente ou usuário..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="filtrar-acao"
                className="text-sm font-semibold text-slate-700"
              >
                Tipo de ação
              </label>

              <select
                id="filtrar-acao"
                value={
                  acaoSelecionada
                }
                onChange={(
                  event
                ) =>
                  setAcaoSelecionada(
                    event.target
                      .value as FiltroAcaoHistorico
                  )
                }
                className="h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todas">
                  Todas as ações
                </option>

                <option value="criou">
                  Criações
                </option>

                <option value="excluiu">
                  Exclusões
                </option>
              </select>
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
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
              >
                <X className="h-4 w-4" />

                Limpar
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-500">
              Exibindo{" "}
              <strong className="text-slate-900">
                {historicoFiltrado.length ===
                0
                  ? 0
                  : indiceInicial +
                    1}
              </strong>{" "}
              até{" "}
              <strong className="text-slate-900">
                {indiceFinal}
              </strong>{" "}
              de{" "}
              <strong className="text-slate-900">
                {historicoFiltrado.length}
              </strong>{" "}
              registros encontrados
            </p>
          </div>
        </div>

        {historico.length ===
        0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center p-8 text-center">
            <FileClock className="h-10 w-10 text-slate-300" />

            <h3 className="mt-4 font-semibold text-slate-900">
              Nenhuma atividade registrada
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              As criações e exclusões de obras aparecerão aqui.
            </p>
          </div>
        ) : historicoFiltrado.length ===
          0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center p-8 text-center">
            <Search className="h-10 w-10 text-slate-300" />

            <h3 className="mt-4 font-semibold text-slate-900">
              Nenhum registro encontrado
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Não encontramos atividades com os filtros selecionados.
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
          </div>
        ) : (
          <>
            <div className="bg-slate-50/30 px-4 py-5 sm:px-6">
              <div className="space-y-6">
                {historicoAgrupado.map(
                  (
                    grupo
                  ) => (
                    <div
                      key={
                        grupo.chave
                      }
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className="shrink-0 text-sm font-bold capitalize text-slate-700">
                          {grupo.titulo}
                        </h3>

                        <div className="h-px flex-1 bg-slate-200" />

                        <span className="shrink-0 text-xs font-medium text-slate-400">
                          {grupo.registros.length}{" "}
                          {grupo.registros.length ===
                          1
                            ? "atividade"
                            : "atividades"}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {grupo.registros.map(
                          (
                            registro
                          ) => {
                            const usuario =
                              obterUsuarioHistorico(
                                registro
                              );

                            const codigo =
                              obterCodigoObra(
                                registro
                              );

                            const cliente =
                              obterClienteObra(
                                registro
                              );

                            const criou =
                              registro.acao ===
                              "criou";

                            return (
                              <article
                                key={
                                  registro.id
                                }
                                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-start gap-4">
                                  <div
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                                      criou
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-red-200 bg-red-50 text-red-700"
                                    }`}
                                  >
                                    {criou ? (
                                      <Plus className="h-4 w-4" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="font-bold text-slate-950">
                                        {criou
                                          ? "Criou"
                                          : "Excluiu"}{" "}
                                        a obra{" "}
                                        {codigo}
                                      </h4>

                                      <span
                                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                          criou
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : "border-red-200 bg-red-50 text-red-700"
                                        }`}
                                      >
                                        {criou
                                          ? "Criação"
                                          : "Exclusão"}
                                      </span>
                                    </div>

                                    {cliente && (
                                      <p className="mt-1 text-sm font-medium text-slate-700">
                                        {cliente}
                                      </p>
                                    )}

                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                                      <span className="inline-flex items-center gap-1.5">
                                        <UserRound className="h-4 w-4" />

                                        {usuario?.nome ||
                                          usuario?.email ||
                                          "Usuário não identificado"}
                                      </span>

                                      <span className="inline-flex items-center gap-1.5">
                                        <Clock3 className="h-4 w-4" />

                                        {formatarDataHora(
                                          registro.created_at
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <span className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-400">
                                  {registro.obra_id.slice(
                                    0,
                                    8
                                  )}
                                </span>
                              </article>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Página{" "}
                <strong className="text-slate-900">
                  {paginaSegura}
                </strong>{" "}
                de{" "}
                <strong className="text-slate-900">
                  {totalPaginas}
                </strong>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    alterarPagina(
                      paginaSegura -
                        1
                    )
                  }
                  disabled={
                    paginaSegura <=
                    1
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />

                  Anterior
                </button>

                <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">
                  {paginaSegura}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    alterarPagina(
                      paginaSegura +
                        1
                    )
                  }
                  disabled={
                    paginaSegura >=
                    totalPaginas
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima

                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}