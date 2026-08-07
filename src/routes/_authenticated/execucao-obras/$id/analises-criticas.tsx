import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Loader2,
  Pencil,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  buscarStatusAnaliseCriticaObra,
  criarAnaliseCriticaDemanda,
  editarAnaliseCriticaDemanda,
  excluirAnaliseCriticaDemanda,
  listarReprovacoesHistoricasPorObra,
  listarStatusAnaliseCriticaDemandas,
  listarStatusAnaliseCriticaEtapas,
} from "@/features/execucao-obras/analises-criticas/services/analises-criticas-service";

import type {
  ReprovacaoHistoricaDemanda,
  ResultadoAnaliseCritica,
  StatusAnaliseCritica,
  StatusAnaliseCriticaDemanda,
  StatusAnaliseCriticaEtapa,
  StatusAnaliseCriticaObra,
} from "@/features/execucao-obras/analises-criticas/types";

export const Route = createFileRoute(
  "/_authenticated/execucao-obras/$id/analises-criticas"
)({
  component:
    AnalisesCriticasPage,
});

function obterLabelStatus(
  status: StatusAnaliseCritica
): string {
  switch (status) {
    case "aprovada":
      return "Aprovada";

    case "reprovada":
      return "Reprovada";

    default:
      return "Pendente";
  }
}

function obterClasseStatus(
  status: StatusAnaliseCritica
): string {
  switch (status) {
    case "aprovada":
      return "border-green-200 bg-green-50 text-green-700";

    case "reprovada":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function StatusIcon({
  status,
  className = "h-4 w-4",
}: {
  status: StatusAnaliseCritica;
  className?: string;
}) {
  switch (status) {
    case "aprovada":
      return (
        <CheckCircle2
          className={className}
        />
      );

    case "reprovada":
      return (
        <XCircle
          className={className}
        />
      );

    default:
      return (
        <CircleDashed
          className={className}
        />
      );
  }
}

function formatarDataHora(
  valor: string | null
): string {
  if (!valor) {
    return "Ainda não analisada";
  }

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

function formatarTituloEtapa(
  etapa: StatusAnaliseCriticaEtapa
): string {
  const titulo =
    etapa.titulo ||
    "Sem título";

  if (
    etapa.ordem === null ||
    etapa.ordem === undefined
  ) {
    return titulo;
  }

  return `Etapa ${etapa.ordem} — ${titulo}`;
}

function AnalisesCriticasPage() {
  const {
    id,
  } = Route.useParams();

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
  ] = useState<string | null>(
    null
  );

  const [
    statusObra,
    setStatusObra,
  ] = useState<StatusAnaliseCriticaObra | null>(
    null
  );

  const [
    etapas,
    setEtapas,
  ] = useState<
    StatusAnaliseCriticaEtapa[]
  >([]);

  const [
    demandas,
    setDemandas,
  ] = useState<
    StatusAnaliseCriticaDemanda[]
  >([]);

  const [
    reprovacoesHistoricas,
    setReprovacoesHistoricas,
  ] = useState<
    ReprovacaoHistoricaDemanda[]
  >([]);

  const [
    etapasAbertas,
    setEtapasAbertas,
  ] = useState<
    Record<string, boolean>
  >({});

  const [
    demandaEmAnalise,
    setDemandaEmAnalise,
  ] = useState<StatusAnaliseCriticaDemanda | null>(
    null
  );

  const [
    resultadoSelecionado,
    setResultadoSelecionado,
  ] = useState<ResultadoAnaliseCritica>(
    "aprovada"
  );

  const [
    observacao,
    setObservacao,
  ] = useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    analiseExcluindoId,
    setAnaliseExcluindoId,
  ] = useState<string | null>(
    null
  );

  const demandasPorEtapa =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          StatusAnaliseCriticaDemanda[]
        >();

      for (
        const demanda
        of demandas
      ) {
        const lista =
          mapa.get(
            demanda.etapa_id
          ) ||
          [];

        lista.push(
          demanda
        );

        mapa.set(
          demanda.etapa_id,
          lista
        );
      }

      return mapa;
    }, [
      demandas,
    ]);

  async function carregarDados(
    modoAtualizacao = false
  ) {
    try {
      if (modoAtualizacao) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro(null);

      const [
        resumoObra,
        resumoEtapas,
        resumoDemandas,
        historicoReprovacoes,
      ] = await Promise.all([
        buscarStatusAnaliseCriticaObra(
          id
        ),

        listarStatusAnaliseCriticaEtapas(
          id
        ),

        listarStatusAnaliseCriticaDemandas(
          id
        ),

        listarReprovacoesHistoricasPorObra(
          id
        ),
      ]);

      setStatusObra(
        resumoObra
      );

      setEtapas(
        resumoEtapas
      );

      setDemandas(
        resumoDemandas
      );

      setReprovacoesHistoricas(
        historicoReprovacoes
      );

      setEtapasAbertas(
        (
          estadoAtual
        ) => {
          if (
            Object.keys(
              estadoAtual
            ).length > 0
          ) {
            return estadoAtual;
          }

          return resumoEtapas.reduce<
            Record<string, boolean>
          >(
            (
              acumulador,
              etapa
            ) => ({
              ...acumulador,

              [etapa.etapa_id]:
                true,
            }),
            {}
          );
        }
      );
    } catch (error: any) {
      console.error(
        "Erro ao carregar análise crítica:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível carregar a análise crítica."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, [
    id,
  ]);

  function abrirAnalise(
    demanda: StatusAnaliseCriticaDemanda
  ) {
    if (
      demanda.status_demanda !==
      "concluida"
    ) {
      window.alert(
        "Conclua a demanda antes de realizar a análise crítica."
      );

      return;
    }

    setDemandaEmAnalise(
      demanda
    );

    setResultadoSelecionado(
      demanda.status_analise ===
        "reprovada"
        ? "reprovada"
        : "aprovada"
    );

    setObservacao(
      demanda.observacao ||
        ""
    );
  }

  function fecharAnalise() {
    if (salvando) {
      return;
    }

    setDemandaEmAnalise(
      null
    );

    setResultadoSelecionado(
      "aprovada"
    );

    setObservacao("");
  }

  async function salvarAnalise() {
    if (!demandaEmAnalise) {
      return;
    }

    if (
      demandaEmAnalise.status_demanda !==
      "concluida"
    ) {
      window.alert(
        "Conclua a demanda antes de realizar a análise crítica."
      );

      setDemandaEmAnalise(
        null
      );

      return;
    }

    if (
      resultadoSelecionado ===
        "reprovada" &&
      !observacao.trim()
    ) {
      window.alert(
        "Informe a justificativa da reprovação."
      );

      return;
    }

    try {
      setSalvando(true);

      const dadosAnalise = {
        demanda_id:
          demandaEmAnalise.demanda_id,

        resultado:
          resultadoSelecionado,

        observacao:
          observacao.trim() ||
          null,
      };

      if (
        demandaEmAnalise.analise_id
      ) {
        await editarAnaliseCriticaDemanda(
          demandaEmAnalise.analise_id,
          dadosAnalise
        );
      } else {
        await criarAnaliseCriticaDemanda(
          dadosAnalise
        );
      }

      setDemandaEmAnalise(
        null
      );

      setResultadoSelecionado(
        "aprovada"
      );

      setObservacao("");

      await carregarDados(
        true
      );
    } catch (error: any) {
      console.error(
        "Erro ao salvar análise crítica:",
        error
      );

      window.alert(
        error?.message ||
          "Não foi possível salvar a análise crítica."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirAnalise(
    demanda: StatusAnaliseCriticaDemanda
  ) {
    if (!demanda.analise_id) {
      return;
    }

    const confirmou =
      window.confirm(
        `Deseja excluir a análise crítica da demanda “${demanda.titulo}”?`
      );

    if (!confirmou) {
      return;
    }

    try {
      setAnaliseExcluindoId(
        demanda.analise_id
      );

      await excluirAnaliseCriticaDemanda(
        demanda.analise_id
      );

      await carregarDados(
        true
      );
    } catch (error: any) {
      console.error(
        "Erro ao excluir análise crítica:",
        error
      );

      window.alert(
        error?.message ||
          "Não foi possível excluir a análise crítica."
      );
    } finally {
      setAnaliseExcluindoId(
        null
      );
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />

          Carregando análise crítica...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <h2 className="font-semibold text-red-900">
              Não foi possível carregar a análise crítica
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {erro}
            </p>

            <button
              type="button"
              onClick={() =>
                carregarDados()
              }
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCcw className="h-4 w-4" />

              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusGeral =
    statusObra?.status_analise ||
    "pendente";

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-gray-950">
                    Análise Crítica
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Avalie a revisão atual de cada demanda da obra em execução.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                carregarDados(
                  true
                )
              }
              disabled={
                atualizando
              }
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  atualizando
                    ? "animate-spin"
                    : ""
                }`}
              />

              Atualizar
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Resultado geral
              </p>

              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${obterClasseStatus(
                    statusGeral
                  )}`}
                >
                  <StatusIcon
                    status={
                      statusGeral
                    }
                  />

                  {obterLabelStatus(
                    statusGeral
                  )}
                </span>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Etapas
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-950">
                {statusObra?.total_etapas ??
                  0}
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Aprovadas
              </p>

              <p className="mt-2 text-2xl font-bold text-green-800">
                {statusObra?.etapas_aprovadas ??
                  0}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Pendentes/Reprovadas
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-800">
                {(statusObra?.etapas_pendentes ??
                  0) +
                  (statusObra?.etapas_reprovadas ??
                    0)}
              </p>
            </div>
          </div>

          {statusGeral ===
            "aprovada" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Obra aprovada na análise crítica
                </p>

                <p className="mt-1 text-sm">
                  Todas as revisões atuais das demandas foram aprovadas.
                </p>
              </div>
            </div>
          )}

          {statusGeral ===
            "reprovada" && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Existem demandas reprovadas
                </p>

                <p className="mt-1 text-sm">
                  Crie uma nova revisão das demandas reprovadas e realize uma nova análise.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          {etapas.length ===
          0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
              <CircleDashed className="mx-auto h-10 w-10 text-gray-300" />

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Nenhuma etapa cadastrada
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Cadastre as etapas e demandas antes de realizar a análise crítica.
              </p>
            </div>
          ) : (
            etapas.map(
              (
                etapa
              ) => {
                const etapaAberta =
                  Boolean(
                    etapasAbertas[
                      etapa.etapa_id
                    ]
                  );

                const demandasDaEtapa =
                  demandasPorEtapa.get(
                    etapa.etapa_id
                  ) ||
                  [];

                return (
                  <article
                    key={
                      etapa.etapa_id
                    }
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setEtapasAbertas(
                          (
                            estadoAtual
                          ) => ({
                            ...estadoAtual,

                            [etapa.etapa_id]:
                              !estadoAtual[
                                etapa.etapa_id
                              ],
                          })
                        )
                      }
                      className="flex w-full cursor-pointer items-center gap-4 bg-slate-50/80 px-5 py-4 text-left transition hover:bg-slate-100"
                    >
                      {etapaAberta ? (
                        <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 shrink-0 text-gray-500" />
                      )}

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-bold text-gray-950">
                          {formatarTituloEtapa(
                            etapa
                          )}
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                          {etapa.total_demandas} demanda(s) ·{" "}
                          {etapa.demandas_aprovadas} aprovada(s) ·{" "}
                          {etapa.demandas_pendentes} pendente(s) ·{" "}
                          {etapa.demandas_reprovadas} reprovada(s)
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${obterClasseStatus(
                          etapa.status_analise
                        )}`}
                      >
                        <StatusIcon
                          status={
                            etapa.status_analise
                          }
                        />

                        {obterLabelStatus(
                          etapa.status_analise
                        )}
                      </span>
                    </button>

                    {etapaAberta && (
                      <div className="divide-y">
                        {demandasDaEtapa.length ===
                        0 ? (
                          <div className="px-6 py-8 text-center text-sm text-gray-500">
                            Nenhuma demanda cadastrada nesta etapa.
                          </div>
                        ) : (
                          demandasDaEtapa.map(
                            (
                              demanda
                            ) => (
                              <div
                                key={
                                  demanda.demanda_id
                                }
                                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-semibold text-gray-950">
                                      {demanda.titulo}
                                    </h3>

                                    <span className="rounded-full border bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                                      Rev.{" "}
                                      {String(
                                        demanda.numero_revisao
                                      ).padStart(
                                        2,
                                        "0"
                                      )}
                                    </span>

                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${obterClasseStatus(
                                        demanda.status_analise
                                      )}`}
                                    >
                                      <StatusIcon
                                        status={
                                          demanda.status_analise
                                        }
                                        className="h-3.5 w-3.5"
                                      />

                                      {obterLabelStatus(
                                        demanda.status_analise
                                      )}
                                    </span>
                                  </div>

                                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                                    <p>
                                      {demanda.analisado_por_nome
                                        ? `Analisada por ${demanda.analisado_por_nome}`
                                        : "Ainda não analisada"}
                                    </p>

                                    <p>
                                      {formatarDataHora(
                                        demanda.analisado_em
                                      )}
                                    </p>

                                    {demanda.status_analise ===
                                      "reprovada" &&
                                      demanda.observacao && (
                                      <div className="mt-3 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-700">
                                          <XCircle className="h-4 w-4 shrink-0" />

                                          Motivo da reprovação
                                        </div>

                                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6">
                                          {demanda.observacao}
                                        </p>
                                      </div>
                                    )}

                                    {reprovacoesHistoricas
                                      .filter(
                                        (
                                          reprovacao
                                        ) =>
                                          reprovacao.grupo_revisao_id ===
                                            demanda.grupo_revisao_id &&
                                          reprovacao.demanda_id !==
                                            demanda.demanda_id
                                      )
                                      .map(
                                        (
                                          reprovacao
                                        ) => (
                                          <div
                                            key={
                                              reprovacao.id
                                            }
                                            className="mt-3 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-3 text-red-900"
                                          >
                                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-700">
                                              <XCircle className="h-4 w-4 shrink-0" />

                                              Motivo da reprovação

                                              <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-[10px] tracking-normal">
                                                Rev.{" "}
                                                {String(
                                                  reprovacao.numero_revisao
                                                ).padStart(
                                                  2,
                                                  "0"
                                                )}
                                              </span>
                                            </div>

                                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6">
                                              {reprovacao.observacao}
                                            </p>

                                            <p className="mt-2 text-xs text-red-700/80">
                                              {reprovacao.analisado_por_nome && (
                                                <>
                                                  Analisada por{" "}
                                                  {reprovacao.analisado_por_nome}
                                                  {" · "}
                                                </>
                                              )}

                                              {formatarDataHora(
                                                reprovacao.created_at
                                              )}
                                            </p>
                                          </div>
                                        )
                                      )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirAnalise(
                                        demanda
                                      )
                                    }
                                    disabled={
                                      demanda.status_demanda !==
                                      "concluida"
                                    }
                                    title={
                                      demanda.status_demanda !==
                                      "concluida"
                                        ? "Conclua a demanda para liberar a análise crítica."
                                        : undefined
                                    }
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200"
                                  >
                                    {demanda.status_demanda !==
                                    "concluida" ? (
                                      "Aguardando conclusão"
                                    ) : demanda.analise_id ? (
                                      <>
                                        <Pencil className="h-4 w-4" />

                                        Editar
                                      </>
                                    ) : (
                                      "Analisar"
                                    )}
                                  </button>

                                  {demanda.analise_id && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleExcluirAnalise(
                                          demanda
                                        )
                                      }
                                      disabled={
                                        analiseExcluindoId ===
                                        demanda.analise_id
                                      }
                                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {analiseExcluindoId ===
                                      demanda.analise_id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}

                                      Excluir
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>
                    )}
                  </article>
                );
              }
            )
          )}
        </section>
      </div>

      {demandaEmAnalise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b px-6 py-5">
              <h2 className="text-lg font-bold text-gray-950">
                {demandaEmAnalise.analise_id
                  ? "Editar análise crítica"
                  : "Analisar demanda"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {demandaEmAnalise.titulo} · Rev.{" "}
                {String(
                  demandaEmAnalise.numero_revisao
                ).padStart(
                  2,
                  "0"
                )}
              </p>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Resultado
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setResultadoSelecionado(
                        "aprovada"
                      )
                    }
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition ${
                      resultadoSelecionado ===
                      "aprovada"
                        ? "border-green-500 bg-green-50 ring-2 ring-green-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600" />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Aprovar
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        A revisão atende aos requisitos.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setResultadoSelecionado(
                        "reprovada"
                      )
                    }
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition ${
                      resultadoSelecionado ===
                      "reprovada"
                        ? "border-red-500 bg-red-50 ring-2 ring-red-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <XCircle className="h-5 w-5 text-red-600" />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Reprovar
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Será necessária uma nova revisão.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="observacao-analise-critica"
                  className="text-sm font-semibold text-gray-800"
                >
                  {resultadoSelecionado ===
                  "reprovada"
                    ? "Justificativa da reprovação"
                    : "Observação"}
                </label>

                <textarea
                  id="observacao-analise-critica"
                  value={
                    observacao
                  }
                  onChange={(
                    event
                  ) =>
                    setObservacao(
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder={
                    resultadoSelecionado ===
                    "reprovada"
                      ? "Informe o que precisa ser corrigido na próxima revisão..."
                      : "Registre uma observação, se necessário..."
                  }
                  className="mt-2 w-full resize-y rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                {resultadoSelecionado ===
                  "reprovada" && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    A justificativa é obrigatória para reprovar.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  fecharAnalise
                }
                disabled={
                  salvando
                }
                className="cursor-pointer rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  salvarAnalise
                }
                disabled={
                  salvando
                }
                className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  resultadoSelecionado ===
                  "aprovada"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {salvando && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {demandaEmAnalise.analise_id
                  ? "Salvar alterações"
                  : "Salvar análise"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}