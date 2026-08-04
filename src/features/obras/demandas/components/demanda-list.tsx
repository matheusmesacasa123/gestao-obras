import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  CirclePlay,
  CircleUserRound,
  CopyPlus,
  History,
  ListTodo,
  Loader2,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  concluirDemanda,
  criarNovaRevisaoDemanda,
  iniciarDemanda,
} from "../services/demandas-service";

import type {
  Demanda,
  StatusDemanda,
} from "../types";

export interface EtapaDemandaLista {
  id: string;
  titulo: string | null;
  ordem: number | null;
  setor_id: string;
}

interface DemandaListProps {
  demandas: Demanda[];
  etapas: EtapaDemandaLista[];
  obraId: string;
  onDelete?: () => void;
  onEdit?: (
    demanda: Demanda
  ) => void;
  onStatusChange?: () => void;
}

interface GrupoDemanda {
  grupoId: string;
  revisoes: Demanda[];
}

function formatarData(
  valor?: string | null
) {
  if (!valor) {
    return "Sem prazo";
  }

  const [
    ano,
    mes,
    dia,
  ] = valor
    .split("-")
    .map(Number);

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
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    data
  );
}

function obterLabelStatus(
  status?: StatusDemanda | null
) {
  switch (status) {
    case "em_andamento":
      return "Em andamento";

    case "concluida":
      return "Concluída";

    case "cancelada":
      return "Cancelada";

    default:
      return "Aberta";
  }
}

function obterClasseStatus(
  status?: StatusDemanda | null
) {
  switch (status) {
    case "em_andamento":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "concluida":
      return "border-green-200 bg-green-50 text-green-700";

    case "cancelada":
      return "border-gray-200 bg-gray-100 text-gray-600";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function formatarNumeroRevisao(
  numero: number
) {
  return `Rev. ${String(
    numero
  ).padStart(
    2,
    "0"
  )}`;
}

interface IdentidadeVisualDemanda {
  borda: string;
  fundo: string;
  marcador: string;
  titulo: string;
  detalhe: string;
  painel: string;
}

function obterIdentidadeVisualDemanda(): IdentidadeVisualDemanda {
  return {
    borda:
      "border-l-slate-700",

    fundo:
      "bg-white",

    marcador:
      "bg-slate-700",

    titulo:
      "text-slate-950",

    detalhe:
      "border-slate-300 bg-slate-100 text-slate-700",

    painel:
      "border-slate-200 bg-slate-50",
  };
}

export function DemandaList({
  demandas,
  etapas,
  onEdit,
  onStatusChange,
}: DemandaListProps) {
  const {
    perfil,
  } = useAuth();

  const [
    etapasAbertas,
    setEtapasAbertas,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const [
    revisaoSelecionadaPorGrupo,
    setRevisaoSelecionadaPorGrupo,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

  const [
    demandaIniciandoId,
    setDemandaIniciandoId,
  ] = useState<string | null>(
    null
  );

  const [
    demandaConcluindoId,
    setDemandaConcluindoId,
  ] = useState<string | null>(
    null
  );

  const [
    grupoCriandoRevisaoId,
    setGrupoCriandoRevisaoId,
  ] = useState<string | null>(
    null
  );

  async function handleIniciarDemanda(
    demanda: Demanda
  ) {
    try {
      setDemandaIniciandoId(
        demanda.id
      );

      await iniciarDemanda(
        demanda.id
      );

      await onStatusChange?.();
    } catch (error: any) {
      console.error(
        "Erro ao iniciar demanda:",
        error
      );

      window.alert(
        error?.message ||
          "Não foi possível iniciar a demanda."
      );
    } finally {
      setDemandaIniciandoId(
        null
      );
    }
  }

  async function handleConcluirDemanda(
    demanda: Demanda
  ) {
    const confirmado =
      window.confirm(
        `Deseja concluir a demanda “${demanda.titulo}” na ${formatarNumeroRevisao(
          demanda.numero_revisao
        )}?`
      );

    if (!confirmado) {
      return;
    }

    try {
      setDemandaConcluindoId(
        demanda.id
      );

      await concluirDemanda(
        demanda.id
      );

      await onStatusChange?.();
    } catch (error: any) {
      console.error(
        "Erro ao concluir demanda:",
        error
      );

      window.alert(
        error?.message ||
          error?.details ||
          "Não foi possível concluir a demanda."
      );
    } finally {
      setDemandaConcluindoId(
        null
      );
    }
  }

  async function handleCriarNovaRevisao(
    grupo: GrupoDemanda
  ) {
    const revisaoMaisRecente =
      grupo.revisoes[0];

    const proximaRevisao =
      revisaoMaisRecente.numero_revisao +
      1;

    const confirmou =
      window.confirm(
        `Criar a ${formatarNumeroRevisao(
          proximaRevisao
        )} da demanda “${revisaoMaisRecente.titulo}”? O checklist será copiado como pendente. Documentos e observações não serão copiados.`
      );

    if (!confirmou) {
      return;
    }

    try {
      setGrupoCriandoRevisaoId(
        grupo.grupoId
      );

      const novaDemandaId =
        await criarNovaRevisaoDemanda(
          revisaoMaisRecente.id
        );

      setRevisaoSelecionadaPorGrupo(
        (
          estadoAtual
        ) => ({
          ...estadoAtual,

          [grupo.grupoId]:
            novaDemandaId,
        })
      );

      await onStatusChange?.();
    } catch (error: any) {
      console.error(
        "Erro ao criar nova revisão da demanda:",
        error
      );

      window.alert(
        error?.message ||
          error?.details ||
          "Não foi possível criar a nova revisão."
      );
    } finally {
      setGrupoCriandoRevisaoId(
        null
      );
    }
  }

  const etapasOrdenadas =
    useMemo(
      () =>
        [...etapas].sort(
          (
            etapaA,
            etapaB
          ) =>
            (
              etapaA.ordem ??
              Number.MAX_SAFE_INTEGER
            ) -
            (
              etapaB.ordem ??
              Number.MAX_SAFE_INTEGER
            )
        ),
      [
        etapas,
      ]
    );

  const gruposPorEtapa =
    useMemo(() => {
      const resultado =
        new Map<
          string,
          GrupoDemanda[]
        >();

      for (
        const etapa
        of etapasOrdenadas
      ) {
        resultado.set(
          etapa.id,
          []
        );
      }

      const mapaTemporario =
        new Map<
          string,
          Map<
            string,
            Demanda[]
          >
        >();

      for (
        const demanda
        of demandas
      ) {
        if (!demanda.etapa_id) {
          continue;
        }

        const gruposDaEtapa =
          mapaTemporario.get(
            demanda.etapa_id
          ) ||
          new Map<
            string,
            Demanda[]
          >();

        const grupoId =
          demanda.grupo_revisao_id ||
          demanda.id;

        const revisoes =
          gruposDaEtapa.get(
            grupoId
          ) ||
          [];

        revisoes.push(
          demanda
        );

        gruposDaEtapa.set(
          grupoId,
          revisoes
        );

        mapaTemporario.set(
          demanda.etapa_id,
          gruposDaEtapa
        );
      }

      for (
        const etapa
        of etapasOrdenadas
      ) {
        const gruposDaEtapa =
          mapaTemporario.get(
            etapa.id
          );

        if (!gruposDaEtapa) {
          continue;
        }

        const grupos =
          Array.from(
            gruposDaEtapa.entries()
          )
            .map(
              ([
                grupoId,
                revisoes,
              ]) => ({
                grupoId,

                revisoes:
                  [...revisoes].sort(
                    (
                      revisaoA,
                      revisaoB
                    ) =>
                      revisaoB.numero_revisao -
                      revisaoA.numero_revisao
                  ),
              })
            )
            .sort(
              (
                grupoA,
                grupoB
              ) =>
                grupoA.revisoes[0].titulo.localeCompare(
                  grupoB.revisoes[0].titulo,
                  "pt-BR"
                )
            );

        resultado.set(
          etapa.id,
          grupos
        );
      }

      return resultado;
    }, [
      demandas,
      etapasOrdenadas,
    ]);

  if (
    etapasOrdenadas.length ===
    0
  ) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <h2 className="text-lg font-semibold">
          Nenhuma etapa cadastrada
        </h2>

        <p className="mt-2 text-muted-foreground">
          Cadastre uma etapa antes de criar demandas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {etapasOrdenadas.map(
        (
          etapa
        ) => {
          const grupos =
            gruposPorEtapa.get(
              etapa.id
            ) ||
            [];

          const etapaAberta =
            Boolean(
              etapasAbertas[
                etapa.id
              ]
            );

          return (
            <section
              key={
                etapa.id
              }
              className="overflow-hidden rounded-2xl border bg-white shadow-sm [will-change:contents]"
            >
              <button
                type="button"
                onClick={() =>
                  setEtapasAbertas(
                    (
                      estadoAtual
                    ) => ({
                      ...estadoAtual,

                      [etapa.id]:
                        !estadoAtual[
                          etapa.id
                        ],
                    })
                  )
                }
                className={`flex w-full cursor-pointer items-center gap-3 bg-slate-50/70 px-4 py-4 text-left transition-colors duration-200 ease-out hover:bg-slate-100/80 motion-reduce:transition-none ${
                  etapaAberta
                    ? "border-b"
                    : ""
                }`}
              >
                <ChevronRight
                  className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                    etapaAberta
                      ? "rotate-90"
                      : "rotate-0"
                  }`}
                />

                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-gray-950">
                    Etapa{" "}
                    {etapa.ordem ??
                      "—"}{" "}
                    —{" "}
                    {etapa.titulo ||
                      "Sem título"}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {grupos.length} demanda(s)
                  </p>
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out motion-reduce:transition-none ${
                  etapaAberta
                    ? "grid-rows-[1fr] opacity-100"
                    : "pointer-events-none grid-rows-[0fr] opacity-0"
                }`}
                aria-hidden={
                  !etapaAberta
                }
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className={`divide-y transition-transform duration-250 ease-out motion-reduce:transition-none ${
                      etapaAberta
                        ? "translate-y-0"
                        : "-translate-y-1"
                    }`}
                  >
                  {grupos.length ===
                  0 ? (
                    <div className="px-5 py-8 text-center">
                      <ListTodo className="mx-auto h-8 w-8 text-gray-300" />

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        Nenhuma demanda nesta etapa
                      </p>
                    </div>
                  ) : (
                    grupos.map(
                      (
                        grupo
                      ) => {
                        const revisaoMaisRecente =
                          grupo.revisoes[0];

                        const revisaoSelecionadaId =
                          revisaoSelecionadaPorGrupo[
                            grupo.grupoId
                          ] ||
                          revisaoMaisRecente.id;

                        const demandaSelecionada =
                          grupo.revisoes.find(
                            (
                              revisao
                            ) =>
                              revisao.id ===
                              revisaoSelecionadaId
                          ) ||
                          revisaoMaisRecente;

                        const ehRevisaoMaisRecente =
                          demandaSelecionada.id ===
                          revisaoMaisRecente.id;

                        const itensPendentes =
                          (
                            demandaSelecionada.itens ??
                            []
                          ).filter(
                            (
                              item
                            ) =>
                              !item.concluido
                          ).length;

                        const podeConcluir =
                          demandaSelecionada.status ===
                            "em_andamento" &&
                          itensPendentes ===
                            0;

                        const administrador =
                          perfil?.administrador ===
                          true;

                        const podeGerenciar =
                          administrador ||
                          Boolean(
                            perfil?.setor_id &&
                            perfil.setor_id ===
                              demandaSelecionada.setor_id
                          );

                        const identidadeVisual =
                          obterIdentidadeVisualDemanda();

                        const demandaConcluida =
                          demandaSelecionada.status ===
                          "concluida";

                        const classeContainer =
                          demandaConcluida
                            ? "border-l-green-600 bg-green-50/70"
                            : `${identidadeVisual.borda} ${identidadeVisual.fundo}`;

                        const classeTitulo =
                          demandaConcluida
                            ? "text-green-950"
                            : identidadeVisual.titulo;

                        const classeMarcador =
                          demandaConcluida
                            ? "bg-green-600"
                            : identidadeVisual.marcador;

                        const classeDetalhe =
                          demandaConcluida
                            ? "border-green-300 bg-green-100 text-green-800"
                            : identidadeVisual.detalhe;

                        const classePainel =
                          demandaConcluida
                            ? "border-green-300 bg-green-100/70"
                            : identidadeVisual.painel;

                        return (
                          <article
                            key={
                              grupo.grupoId
                            }
                            className={`space-y-4 border-l-2 px-5 py-5 transition ${classeContainer}`}
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  onEdit?.(
                                    demandaSelecionada
                                  )
                                }
                                className="min-w-0 cursor-pointer text-left"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`h-2 w-2 shrink-0 rounded-full ${classeMarcador}`}
                                  />

                                  <h4
                                    className={`truncate text-sm font-extrabold ${classeTitulo}`}
                                  >
                                    {revisaoMaisRecente.titulo}
                                  </h4>

                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${classeDetalhe}`}
                                  >
                                    <History className="h-3.5 w-3.5" />

                                    {grupo.revisoes.length} revisão(ões)
                                  </span>
                                </div>

                                {demandaSelecionada.descricao && (
                                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                    {demandaSelecionada.descricao}
                                  </p>
                                )}
                              </button>

                              <div className="flex flex-wrap items-center gap-2">
                                <label
                                  htmlFor={`revisao-demanda-${grupo.grupoId}`}
                                  className="text-xs font-semibold text-gray-500"
                                >
                                  Revisão
                                </label>

                                <select
                                  id={`revisao-demanda-${grupo.grupoId}`}
                                  value={
                                    demandaSelecionada.id
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setRevisaoSelecionadaPorGrupo(
                                      (
                                        estadoAtual
                                      ) => ({
                                        ...estadoAtual,

                                        [grupo.grupoId]:
                                          event.target.value,
                                      })
                                    )
                                  }
                                  className="h-9 rounded-lg border bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500"
                                >
                                  {grupo.revisoes.map(
                                    (
                                      revisao
                                    ) => (
                                      <option
                                        key={
                                          revisao.id
                                        }
                                        value={
                                          revisao.id
                                        }
                                      >
                                        {formatarNumeroRevisao(
                                          revisao.numero_revisao
                                        )}
                                        {revisao.id ===
                                        revisaoMaisRecente.id
                                          ? " — mais recente"
                                          : ""}
                                      </option>
                                    )
                                  )}
                                </select>

                                {podeGerenciar &&
                                  ehRevisaoMaisRecente && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCriarNovaRevisao(
                                        grupo
                                      )
                                    }
                                    disabled={
                                      grupoCriandoRevisaoId ===
                                      grupo.grupoId
                                    }
                                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {grupoCriandoRevisaoId ===
                                    grupo.grupoId ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CopyPlus className="h-4 w-4" />
                                    )}

                                    Nova revisão
                                  </button>
                                )}
                              </div>
                            </div>

                            <div
                              className={`grid gap-3 rounded-xl border p-4 md:grid-cols-[130px_minmax(0,1fr)_180px_140px_auto] md:items-center ${classePainel}`}
                            >
                              <div>
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                                    demandaConcluida
                                      ? "border-green-300 bg-green-50 text-green-800"
                                      : `bg-white ${classeDetalhe}`
                                  }`}
                                >
                                  {formatarNumeroRevisao(
                                    demandaSelecionada.numero_revisao
                                  )}
                                </span>
                              </div>

                              <div>
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${obterClasseStatus(
                                    demandaSelecionada.status
                                  )}`}
                                >
                                  {obterLabelStatus(
                                    demandaSelecionada.status
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CircleUserRound className="h-4 w-4 shrink-0 text-gray-400" />

                                <span className="truncate">
                                  {demandaSelecionada.responsavel
                                    ?.nome ||
                                    "Sem responsável"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />

                                <span>
                                  {formatarData(
                                    demandaSelecionada.prazo
                                  )}
                                </span>
                              </div>

                              <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                                {podeGerenciar &&
                                  demandaSelecionada.status ===
                                    "aberta" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleIniciarDemanda(
                                        demandaSelecionada
                                      )
                                    }
                                    disabled={
                                      demandaIniciandoId ===
                                      demandaSelecionada.id
                                    }
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {demandaIniciandoId ===
                                    demandaSelecionada.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CirclePlay className="h-4 w-4" />
                                    )}

                                    Iniciar
                                  </button>
                                )}

                                {podeGerenciar &&
                                  demandaSelecionada.status ===
                                    "em_andamento" && (
                                  <div className="flex flex-col items-start gap-1 md:items-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConcluirDemanda(
                                          demandaSelecionada
                                        )
                                      }
                                      disabled={
                                        !podeConcluir ||
                                        demandaConcluindoId ===
                                          demandaSelecionada.id
                                      }
                                      title={
                                        itensPendentes >
                                        0
                                          ? `Conclua os ${itensPendentes} item(ns) pendente(s) antes de finalizar.`
                                          : "Concluir demanda"
                                      }
                                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                                    >
                                      {demandaConcluindoId ===
                                      demandaSelecionada.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CircleCheckBig className="h-4 w-4" />
                                      )}

                                      Concluir
                                    </button>

                                    {itensPendentes >
                                      0 && (
                                      <span className="text-[11px] font-medium text-amber-700">
                                        {itensPendentes} item(ns) pendente(s)
                                      </span>
                                    )}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    onEdit?.(
                                      demandaSelecionada
                                    )
                                  }
                                  className="cursor-pointer rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                  Abrir
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )
                  )}
                  </div>
                </div>
              </div>
            </section>
          );
        }
      )}
    </div>
  );
}