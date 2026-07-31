import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Building2,
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

import type {
  Obra,
} from "@/features/obras/types";

function criarDataLocal(
  valor?: string | null
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
      dia
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return null;
  }

  return data;
}

function formatarData(
  valor?: string | null
) {
  const data =
    criarDataLocal(
      valor
    );

  if (!data) {
    return "Não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    data
  );
}

function obraEstaConcluida(
  obra: Obra
) {
  return (
    obra.status ===
      "concluida" ||
    obra.status ===
      "entregue" ||
    Boolean(
      obra.data_entrega
    )
  );
}

function obraEstaAtrasada(
  obra: Obra
): boolean {
  if (
    obraEstaConcluida(
      obra
    )
  ) {
    return false;
  }

  const dataEsperada =
    criarDataLocal(
      obra.data_entrega_esperada
    );

  if (!dataEsperada) {
    return false;
  }

  const hoje =
    new Date();

  hoje.setHours(
    0,
    0,
    0,
    0
  );

  return (
    dataEsperada <
    hoje
  );
}

function obterStatusVisual(
  obra: Obra
) {
  if (
    obraEstaAtrasada(
      obra
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
    obraEstaConcluida(
      obra
    )
  ) {
    return {
      label:
        "Concluída",

      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label:
      "Em andamento",

    className:
      "border-blue-200 bg-blue-50 text-blue-700",
  };
}

export function DashboardPage() {
  const navigate =
    useNavigate();

  const [
    obras,
    setObras,
  ] = useState<Obra[]>(
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

  const carregarDashboard =
    useCallback(
      async (
        carregamentoInicial =
          true
      ) => {
        try {
          if (
            carregamentoInicial
          ) {
            setCarregando(
              true
            );
          } else {
            setAtualizando(
              true
            );
          }

          setErro("");

          const obrasData =
            await getObras();

          setObras(
            obrasData as Obra[]
          );
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar dashboard:",
            error
          );

          setErro(
            "Não foi possível carregar os dados do dashboard."
          );
        } finally {
          setCarregando(
            false
          );

          setAtualizando(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    carregarDashboard();
  }, [
    carregarDashboard,
  ]);

  const resumo =
    useMemo(
      () => {
        const obrasAtivas =
          obras.filter(
            (
              obra
            ) =>
              !obraEstaConcluida(
                obra
              )
          );

        const atrasadas =
          obrasAtivas.filter(
            obraEstaAtrasada
          );

        const concluidas =
          obras.filter(
            obraEstaConcluida
          );

        const clientes =
          new Set(
            obras
              .map(
                (
                  obra
                ) =>
                  obra.cliente
                    ?.trim()
                    .toLowerCase()
              )
              .filter(
                Boolean
              )
          );

        return {
          ativas:
            obrasAtivas.length,

          atrasadas:
            atrasadas.length,

          andamento:
            obrasAtivas.length,

          concluidas:
            concluidas.length,

          clientes:
            clientes.size,
        };
      },
      [
        obras,
      ]
    );

  const obrasRecentes =
    useMemo(
      () =>
        [...obras]
          .sort(
            (
              primeira,
              segunda
            ) => {
              const dataPrimeira =
                new Date(
                  primeira.created_at ||
                    0
                ).getTime();

              const dataSegunda =
                new Date(
                  segunda.created_at ||
                    0
                ).getTime();

              return (
                dataSegunda -
                dataPrimeira
              );
            }
          )
          .slice(
            0,
            5
          ),
      [
        obras,
      ]
    );

  if (carregando) {
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
            Visão geral das obras, prazos, entregas e andamento dos projetos.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            carregarDashboard(
              false
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

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Obras ativas"
          value={
            resumo.ativas
          }
          description="Projetos ainda em aberto"
          variant="default"
          onClick={() =>
            navigate({
              to:
                "/obras",
            })
          }
        />

        <DashboardCard
          title="Obras atrasadas"
          value={
            resumo.atrasadas
          }
          description="Necessitam de atenção"
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
            resumo.clientes
          }
          description="Clientes com obras cadastradas"
          variant="clients"
        />

        <DashboardCard
          title="Em andamento"
          value={
            resumo.andamento
          }
          description="Obras em execução"
          variant="progress"
          onClick={() =>
            navigate({
              to:
                "/obras",
            })
          }
        />
      </section>

      <section>
        <StatusObrasChart
          obras={
            obras
          }
        />
      </section>

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
                  "/obras",
              })
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
          >
            Ver todas

            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {obrasRecentes.length ===
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
            {obrasRecentes.map(
              (
                obra
              ) => {
                const status =
                  obterStatusVisual(
                    obra
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
                        <Building2 className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold text-slate-950">
                            {obra.codigo ||
                              "Sem código"}
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

                            Entrega:{" "}
                            {formatarData(
                              obra.data_entrega_esperada
                            )}
                          </span>

                          {obraEstaConcluida(
                            obra
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
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}