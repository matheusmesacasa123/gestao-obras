import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Building2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
} from "@tanstack/react-router";

import {
  DashboardCard,
} from "./dashboard-card";

import {
  StatusObrasChart,
} from "./components/status-obras-chart";

import {
  getObras,
} from "@/features/obras/services/obras-service";

import {
  getObrasExecucao,
} from "@/features/execucao-obras/services/execucao-obras-service";

import type {
  Obra,
} from "@/features/obras/types";

import type {
  ObraExecucao,
} from "@/features/execucao-obras/types";

type TipoDashboard =
  | "orcamentacao"
  | "execucao";

function criarDataLocal(
  valor?: string | null,
) {
  if (!valor) {
    return null;
  }

  const [
    ano,
    mes,
    dia,
  ] = valor
    .split("-")
    .map(Number);

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return null;
  }

  const data =
    new Date(
      ano,
      mes - 1,
      dia,
    );

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }

  return data;
}

function formatarData(
  valor?: string | null,
) {
  const data =
    criarDataLocal(
      valor,
    );

  if (!data) {
    return "Não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(
    data,
  );
}

/* =========================================================
   ORÇAMENTAÇÃO
========================================================= */

function etapasValidasOrcamento(
  obra: Obra,
) {
  return obra.etapas ?? [];
}

function orcamentoEstaConcluido(
  obra: Obra,
) {
  const etapas =
    etapasValidasOrcamento(
      obra,
    );

  if (
    etapas.length === 0
  ) {
    return (
      obra.status ===
      "concluida"
    );
  }

  return etapas.every(
    (etapa) =>
      etapa.status ===
      "concluida",
  );
}

function etapaOrcamentoEstaAtrasada(
  prazo?: string | null,
  status?: string | null,
) {
  if (
    !prazo ||
    status === "concluida"
  ) {
    return false;
  }

  const dataPrazo =
    criarDataLocal(
      prazo,
    );

  if (!dataPrazo) {
    return false;
  }

  const hoje =
    new Date();

  hoje.setHours(
    0,
    0,
    0,
    0,
  );

  return (
    dataPrazo <
    hoje
  );
}

function orcamentoEstaAtrasado(
  obra: Obra,
) {
  if (
    orcamentoEstaConcluido(
      obra,
    )
  ) {
    return false;
  }

  return etapasValidasOrcamento(
    obra,
  ).some(
    (etapa) =>
      etapaOrcamentoEstaAtrasada(
        etapa.prazo,
        etapa.status,
      ),
  );
}

function orcamentoEstaEmAndamento(
  obra: Obra,
) {
  if (
    orcamentoEstaConcluido(
      obra,
    ) ||
    orcamentoEstaAtrasado(
      obra,
    )
  ) {
    return false;
  }

  return etapasValidasOrcamento(
    obra,
  ).some(
    (etapa) =>
      etapa.status ===
      "em_andamento",
  );
}

function orcamentoEstaAguardandoCliente(
  obra: Obra,
) {
  if (
    orcamentoEstaConcluido(
      obra,
    ) ||
    orcamentoEstaAtrasado(
      obra,
    )
  ) {
    return false;
  }

  return etapasValidasOrcamento(
    obra,
  ).some(
    (etapa) =>
      etapa.status ===
      "aguardando_cliente",
  );
}

function orcamentoEstaRecebido(
  obra: Obra,
) {
  return (
    !orcamentoEstaConcluido(
      obra,
    ) &&
    !orcamentoEstaAtrasado(
      obra,
    ) &&
    !orcamentoEstaEmAndamento(
      obra,
    ) &&
    !orcamentoEstaAguardandoCliente(
      obra,
    )
  );
}

function obterStatusVisualOrcamento(
  obra: Obra,
) {
  if (
    orcamentoEstaAtrasado(
      obra,
    )
  ) {
    return {
      label:
        "Atrasado",

      className:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (
    orcamentoEstaConcluido(
      obra,
    )
  ) {
    return {
      label:
        "Concluído",

      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (
    orcamentoEstaAguardandoCliente(
      obra,
    )
  ) {
    return {
      label:
        "Aguardando cliente",

      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (
    orcamentoEstaEmAndamento(
      obra,
    )
  ) {
    return {
      label:
        "Em andamento",

      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (
    orcamentoEstaRecebido(
      obra,
    )
  ) {
    return {
      label:
        "Recebido",

      className:
        "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  return {
    label:
      "Em aberto",

    className:
      "border-slate-200 bg-slate-50 text-slate-700",
  };
}

/* =========================================================
   EXECUÇÃO DE OBRAS
========================================================= */

function obraExecucaoEstaConcluida(
  obra: ObraExecucao,
) {
  return (
    obra.status ===
      "concluida" ||
    Boolean(
      obra.data_entrega,
    )
  );
}

function obraExecucaoEstaCancelada(
  obra: ObraExecucao,
) {
  return (
    obra.status ===
    "cancelada"
  );
}

function obraExecucaoEstaAtiva(
  obra: ObraExecucao,
) {
  return (
    !obraExecucaoEstaConcluida(
      obra,
    ) &&
    !obraExecucaoEstaCancelada(
      obra,
    )
  );
}

function obraExecucaoEstaAtrasada(
  obra: ObraExecucao,
) {
  if (
    obraExecucaoEstaConcluida(
      obra,
    ) ||
    obraExecucaoEstaCancelada(
      obra,
    )
  ) {
    return false;
  }

  if (
    obra.status ===
    "atrasada"
  ) {
    return true;
  }

  const prazo =
    criarDataLocal(
      obra.prazo_entrega,
    );

  if (!prazo) {
    return false;
  }

  const hoje =
    new Date();

  hoje.setHours(
    0,
    0,
    0,
    0,
  );

  return (
    prazo <
    hoje
  );
}

function obterStatusVisualExecucao(
  obra: ObraExecucao,
) {
  if (
    obraExecucaoEstaAtrasada(
      obra,
    )
  ) {
    return {
      label:
        "Atrasada",

      className:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (
    obraExecucaoEstaConcluida(
      obra,
    )
  ) {
    return {
      label:
        "Concluída",

      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  switch (
    obra.status
  ) {
    case "nao_iniciada":
      return {
        label:
          "Não iniciada",

        className:
          "border-slate-200 bg-slate-50 text-slate-700",
      };

    case "em_andamento":
      return {
        label:
          "Em andamento",

        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "aguardando_cliente":
      return {
        label:
          "Aguardando cliente",

        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "paralisada":
      return {
        label:
          "Paralisada",

        className:
          "border-orange-200 bg-orange-50 text-orange-700",
      };

    case "cancelada":
      return {
        label:
          "Cancelada",

        className:
          "border-slate-200 bg-slate-100 text-slate-600",
      };

    default:
      return {
        label:
          "Em aberto",

        className:
          "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

/* =========================================================
   DASHBOARD
========================================================= */

export function DashboardPage() {
  const navigate =
    useNavigate();

  const [
    tipoDashboard,
    setTipoDashboard,
  ] =
    useState<TipoDashboard>(
      "execucao",
    );

  const [
    orcamentos,
    setOrcamentos,
  ] =
    useState<Obra[]>(
      [],
    );

  const [
    obrasExecucao,
    setObrasExecucao,
  ] =
    useState<
      ObraExecucao[]
    >([]);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    atualizando,
    setAtualizando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const carregarDashboard =
    useCallback(
      async (
        carregamentoInicial =
          true,
      ) => {
        try {
          if (
            carregamentoInicial
          ) {
            setCarregando(
              true,
            );
          } else {
            setAtualizando(
              true,
            );
          }

          setErro("");

          const [
            dadosOrcamentos,
            dadosExecucao,
          ] =
            await Promise.all([
              getObras(),
              getObrasExecucao(),
            ]);

          setOrcamentos(
            dadosOrcamentos,
          );

          setObrasExecucao(
            dadosExecucao,
          );
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar dashboard:",
            error,
          );

          setErro(
            "Não foi possível carregar os dados do dashboard.",
          );
        } finally {
          setCarregando(
            false,
          );

          setAtualizando(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    carregarDashboard();
  }, [
    carregarDashboard,
  ]);

  const resumoOrcamentacao =
    useMemo(() => {
      const ativos =
        orcamentos.filter(
          (obra) =>
            !orcamentoEstaConcluido(
              obra,
            ),
        );

      const atrasados =
        orcamentos.filter(
          orcamentoEstaAtrasado,
        );

      const andamento =
        orcamentos.filter(
          orcamentoEstaEmAndamento,
        );

      const concluidos =
        orcamentos.filter(
          orcamentoEstaConcluido,
        );

      const clientes =
        new Set(
          orcamentos
            .map(
              (obra) => {
                if (
                  obra.cliente_id
                ) {
                  return `id:${obra.cliente_id}`;
                }

                const nome =
                  obra.cliente
                    ?.trim()
                    .toLowerCase();

                if (
                  !nome
                ) {
                  return null;
                }

                return `nome:${nome}`;
              },
            )
            .filter(
              Boolean,
            ),
        );

      return {
        ativos:
          ativos.length,

        atrasados:
          atrasados.length,

        andamento:
          andamento.length,

        concluidos:
          concluidos.length,

        clientes:
          clientes.size,
      };
    }, [
      orcamentos,
    ]);

  const resumoExecucao =
    useMemo(() => {
      const ativas =
        obrasExecucao.filter(
          obraExecucaoEstaAtiva,
        );

      const atrasadas =
        obrasExecucao.filter(
          obraExecucaoEstaAtrasada,
        );

      const andamento =
        obrasExecucao.filter(
          (obra) =>
            obra.status ===
              "em_andamento" &&
            !obraExecucaoEstaAtrasada(
              obra,
            ),
        );

      const clientes =
        new Set(
          obrasExecucao
            .map(
              (obra) => {
                if (
                  obra.cliente_id
                ) {
                  return `id:${obra.cliente_id}`;
                }

                const nome =
                  obra.cliente
                    ?.trim()
                    .toLowerCase();

                if (
                  !nome
                ) {
                  return null;
                }

                return `nome:${nome}`;
              },
            )
            .filter(
              Boolean,
            ),
        );

      return {
        ativas:
          ativas.length,

        atrasadas:
          atrasadas.length,

        andamento:
          andamento.length,

        clientes:
          clientes.size,
      };
    }, [
      obrasExecucao,
    ]);

  const orcamentosRecentes =
    useMemo(
      () =>
        [
          ...orcamentos,
        ]
          .sort(
            (
              primeira,
              segunda,
            ) =>
              new Date(
                segunda.created_at ||
                  0,
              ).getTime() -
              new Date(
                primeira.created_at ||
                  0,
              ).getTime(),
          )
          .slice(
            0,
            5,
          ),
      [
        orcamentos,
      ],
    );

  const obrasExecucaoRecentes =
    useMemo(
      () =>
        [
          ...obrasExecucao,
        ]
          .sort(
            (
              primeira,
              segunda,
            ) =>
              new Date(
                segunda.created_at ||
                  0,
              ).getTime() -
              new Date(
                primeira.created_at ||
                  0,
              ).getTime(),
          )
          .slice(
            0,
            5,
          ),
      [
        obrasExecucao,
      ],
    );

  const orcamentacaoAtiva =
    tipoDashboard ===
    "orcamentacao";

  if (
    carregando
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-7 w-7 animate-spin" />

          <p className="text-sm font-medium">
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Gestão de obras
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Visão geral dos indicadores de orçamentação e execução de obras.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            carregarDashboard(
              false,
            )
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

          Atualizar dados
        </button>
      </header>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {erro}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              setTipoDashboard(
                "orcamentacao",
              )
            }
            className={`flex items-center justify-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold transition ${
              orcamentacaoAtiva
                ? "bg-[#102d3c] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <Calculator className="h-5 w-5" />

            Orçamentação
          </button>

          <button
            type="button"
            onClick={() =>
              setTipoDashboard(
                "execucao",
              )
            }
            className={`flex items-center justify-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold transition ${
              !orcamentacaoAtiva
                ? "bg-[#102d3c] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <Building2 className="h-5 w-5" />

            Execução de Obras
          </button>
        </div>
      </section>

      {orcamentacaoAtiva ? (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              title="Orçamentos ativos"
              value={
                resumoOrcamentacao.ativos
              }
              description="Orçamentos ainda em aberto"
              variant="default"
              onClick={() =>
                navigate({
                  to:
                    "/obras",
                })
              }
            />

            <DashboardCard
              title="Orçamentos atrasados"
              value={
                resumoOrcamentacao.atrasados
              }
              description="Possuem etapa fora do prazo"
              variant="danger"
              onClick={() =>
                navigate({
                  to:
                    "/obras",
                })
              }
            />

            <DashboardCard
              title="Clientes"
              value={
                resumoOrcamentacao.clientes
              }
              description="Clientes com orçamentos cadastrados"
              variant="clients"
            />

            <DashboardCard
              title="Em andamento"
              value={
                resumoOrcamentacao.andamento
              }
              description="Orçamentos atualmente em elaboração"
              variant="progress"
              onClick={() =>
                navigate({
                  to:
                    "/obras",
                })
              }
            />
          </section>

          <StatusObrasChart
            tipo="orcamentacao"
            orcamentos={
              orcamentos
            }
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Orçamentos recentes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Últimos orçamentos cadastrados no sistema.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate({
                    to:
                      "/obras",
                  })
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                Ver todos

                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {orcamentosRecentes.length ===
            0 ? (
              <div className="py-12 text-center">
                <Calculator className="mx-auto h-10 w-10 text-slate-300" />

                <h3 className="mt-4 font-semibold text-slate-900">
                  Nenhum orçamento cadastrado
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Os orçamentos cadastrados aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orcamentosRecentes.map(
                  (
                    obra,
                  ) => {
                    const status =
                      obterStatusVisualOrcamento(
                        obra,
                      );

                    return (
                      <button
                        key={
                          obra.id
                        }
                        type="button"
                        onClick={() =>
                          navigate({
                            to:
                              "/obras/$id",

                            params: {
                              id:
                                obra.id,
                            },
                          })
                        }
                        className="group flex w-full flex-col gap-4 py-5 text-left transition first:pt-0 last:pb-0 hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-3"
                      >
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                            <Calculator className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-bold text-slate-950">
                                {obra.numero_proposta ||
                                  obra.codigo ||
                                  "Sem número de proposta"}
                              </h3>

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>

                            <p className="mt-1 truncate text-sm font-medium text-slate-700">
                              {obra.nome_obra ||
                                obra.cliente ||
                                "Orçamento sem identificação"}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                              {orcamentoEstaConcluido(
                                obra,
                              ) ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5" />

                                  Finalizado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="h-3.5 w-3.5" />

                                  Em aberto
                                </span>
                              )}

                              {orcamentoEstaAtrasado(
                                obra,
                              ) && (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-red-600">
                                  <CalendarDays className="h-3.5 w-3.5" />

                                  Etapa em atraso
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="hidden h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700 sm:block" />
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              title="Obras ativas"
              value={
                resumoExecucao.ativas
              }
              description="Obras ainda não finalizadas"
              variant="default"
              onClick={() =>
                navigate({
                  to:
                    "/execucao-obras",
                })
              }
            />

            <DashboardCard
              title="Obras atrasadas"
              value={
                resumoExecucao.atrasadas
              }
              description="Necessitam de atenção"
              variant="danger"
              onClick={() =>
                navigate({
                  to:
                    "/execucao-obras",
                })
              }
            />

            <DashboardCard
              title="Clientes"
              value={
                resumoExecucao.clientes
              }
              description="Clientes com obras cadastradas"
              variant="clients"
            />

            <DashboardCard
              title="Em andamento"
              value={
                resumoExecucao.andamento
              }
              description="Obras atualmente em execução"
              variant="progress"
              onClick={() =>
                navigate({
                  to:
                    "/execucao-obras",
                })
              }
            />
          </section>

          <StatusObrasChart
            tipo="execucao"
            obrasExecucao={
              obrasExecucao
            }
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Obras recentes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Últimas obras cadastradas no sistema.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate({
                    to:
                      "/execucao-obras",
                  })
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                Ver todas

                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {obrasExecucaoRecentes.length ===
            0 ? (
              <div className="py-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-slate-300" />

                <h3 className="mt-4 font-semibold text-slate-900">
                  Nenhuma obra cadastrada
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  As obras cadastradas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {obrasExecucaoRecentes.map(
                  (
                    obra,
                  ) => {
                    const status =
                      obterStatusVisualExecucao(
                        obra,
                      );

                    return (
                      <button
                        key={
                          obra.id
                        }
                        type="button"
                        onClick={() =>
                          navigate({
                            to:
                              "/execucao-obras/$id",

                            params: {
                              id:
                                obra.id,
                            },
                          })
                        }
                        className="group flex w-full flex-col gap-4 py-5 text-left transition first:pt-0 last:pb-0 hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-3"
                      >
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                            <Building2 className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-bold text-slate-950">
                                {obra.codigo_erp ||
                                  "Sem numeração ERP"}
                              </h3>

                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>

                            <p className="mt-1 truncate text-sm font-medium text-slate-700">
                              {obra.nome_obra ||
                                obra.cliente ||
                                "Obra sem identificação"}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" />

                                Prazo:{" "}
                                {formatarData(
                                  obra.prazo_entrega,
                                )}
                              </span>

                              {obraExecucaoEstaConcluida(
                                obra,
                              ) ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5" />

                                  Finalizada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="h-3.5 w-3.5" />

                                  Em aberto
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="hidden h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700 sm:block" />
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}