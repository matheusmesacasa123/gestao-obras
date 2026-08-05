import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProximasReunioes,
} from "@/features/reunioes/services/reunioes-service";

import type {
  Reuniao,
} from "@/features/reunioes/types";

export const Route = createFileRoute(
  "/_authenticated/reunioes"
)({
  component:
    ReunioesPage,
});

function formatarData(
  valor: string
) {
  const data =
    new Date(
      valor
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return {
      dia:
        "--",
      mes:
        "---",
      semana:
        valor,
    };
  }

  return {
    dia:
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          day:
            "2-digit",
        }
      ).format(
        data
      ),

    mes:
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          month:
            "short",
        }
      )
        .format(
          data
        )
        .replace(
          ".",
          ""
        )
        .toUpperCase(),

    semana:
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          weekday:
            "long",
          day:
            "2-digit",
          month:
            "long",
        }
      ).format(
        data
      ),
  };
}

function formatarHora(
  valor: string
) {
  const data =
    new Date(
      valor
    );

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
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    data
  );
}

function formatarIntervalo(
  inicio: string,
  fim?: string | null
) {
  const horaInicio =
    formatarHora(
      inicio
    );

  if (!fim) {
    return horaInicio;
  }

  return `${horaInicio} às ${formatarHora(
    fim
  )}`;
}

function obterChaveData(
  valor: string
) {
  const data =
    new Date(
      valor
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return [
    data.getFullYear(),
    String(
      data.getMonth() +
        1
    ).padStart(
      2,
      "0"
    ),
    String(
      data.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
}

function ReunioesPage() {
  const [
    reunioes,
    setReunioes,
  ] = useState<
    Reuniao[]
  >([]);

  const [
    carregando,
    setCarregando,
  ] = useState(
    true
  );

  const [
    atualizando,
    setAtualizando,
  ] = useState(
    false
  );

  const [
    erro,
    setErro,
  ] = useState<
    string | null
  >(
    null
  );

  const carregarReunioes =
    useCallback(
      async (
        carregamentoInicial =
          false
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

          setErro(
            null
          );

          const dados =
            await getProximasReunioes();

          setReunioes(
            dados
          );
        } catch (error) {
          console.error(
            "Erro ao carregar próximas reuniões:",
            error
          );

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as próximas reuniões."
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

  useEffect(
    () => {
      carregarReunioes(
        true
      );
    },
    [
      carregarReunioes,
    ]
  );

  const reunioesAgrupadas =
    useMemo(
      () => {
        const grupos =
          new Map<
            string,
            Reuniao[]
          >();

        for (
          const reuniao
          of reunioes
        ) {
          const chave =
            obterChaveData(
              reuniao.inicio
            );

          const grupo =
            grupos.get(
              chave
            );

          if (grupo) {
            grupo.push(
              reuniao
            );
          } else {
            grupos.set(
              chave,
              [
                reuniao,
              ]
            );
          }
        }

        return Array.from(
          grupos.entries()
        ).map(
          ([
            chave,
            itens,
          ]) => ({
            chave,
            data:
              itens[0]
                .inicio,
            reunioes:
              itens,
          })
        );
      },
      [
        reunioes,
      ]
    );

  if (
    carregando
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-500" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Carregando próximas reuniões...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-950 p-2.5 text-white">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Próximas reuniões
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Agenda geral das reuniões vinculadas às obras.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              carregarReunioes(
                false
              )
            }
            disabled={
              atualizando
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            {reunioes.length} reunião(ões) agendada(s)
          </span>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
            {reunioesAgrupadas.length} dia(s) com reunião
          </span>
        </div>
      </section>

      {erro && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-base font-bold text-red-800">
            Não foi possível carregar as reuniões
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {erro}
          </p>

          <button
            type="button"
            onClick={() =>
              carregarReunioes(
                true
              )
            }
            className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
          >
            Tentar novamente
          </button>
        </section>
      )}

      {!erro &&
        reunioes.length ===
          0 && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-400" />

            <h2 className="mt-4 text-lg font-bold text-slate-950">
              Nenhuma reunião futura
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              As reuniões agendadas dentro das obras aparecerão aqui.
            </p>
          </section>
        )}

      {!erro &&
        reunioesAgrupadas.map(
          (
            grupo
          ) => {
            const dataFormatada =
              formatarData(
                grupo.data
              );

            return (
              <section
                key={
                  grupo.chave
                }
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />

                  <p className="text-sm font-bold capitalize text-slate-600">
                    {dataFormatada.semana}
                  </p>

                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="space-y-3">
                  {grupo.reunioes.map(
                    (
                      reuniao
                    ) => (
                      <ReuniaoResumoCard
                        key={
                          reuniao.id
                        }
                        reuniao={
                          reuniao
                        }
                      />
                    )
                  )}
                </div>
              </section>
            );
          }
        )}
    </div>
  );
}

interface ReuniaoResumoCardProps {
  reuniao: Reuniao;
}

function ReuniaoResumoCard({
  reuniao,
}: ReuniaoResumoCardProps) {
  const data =
    formatarData(
      reuniao.inicio
    );

  const identificacaoObra =
    reuniao.obra?.codigo ||
    "Obra sem código";

  const nomeObra =
    reuniao.obra?.nome_obra ||
    reuniao.obra?.cliente ||
    "Obra não informada";

  return (
    <Link
      to="/execucao-obras/$id/reunioes"
      params={{
        id:
          reuniao.obra_id,
      }}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:flex-row md:items-center"
    >
      <div className="flex shrink-0 items-center gap-4 md:w-44">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white">
          <span className="text-2xl font-bold leading-none">
            {data.dia}
          </span>

          <span className="mt-1 text-xs font-bold tracking-wide text-slate-300">
            {data.mes}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Clock3 className="h-4 w-4 text-slate-500" />

            {formatarIntervalo(
              reuniao.inicio,
              reuniao.fim
            )}
          </div>

          <p className="mt-1 text-xs font-medium capitalize text-slate-500">
            {new Intl.DateTimeFormat(
              "pt-BR",
              {
                weekday:
                  "long",
              }
            ).format(
              new Date(
                reuniao.inicio
              )
            )}
          </p>
        </div>
      </div>

      <div className="min-w-0 flex-1 border-t border-slate-100 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <h2 className="truncate text-lg font-bold text-slate-950">
          {reuniao.titulo}
        </h2>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <Building2 className="h-4 w-4" />

            <span className="font-semibold text-slate-800">
              {identificacaoObra}
            </span>

            <span className="text-slate-400">
              —
            </span>

            <span className="truncate">
              {nomeObra}
            </span>
          </span>

          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" />

            {reuniao.local ||
              "Local não informado"}
          </span>

          <span className="inline-flex items-center gap-2">
            <UsersRound className="h-4 w-4" />

            {reuniao.participantes
              ?.length ||
              0} participante(s)
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 text-sm font-semibold text-slate-600 transition group-hover:text-slate-950">
        Ver na obra

        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}