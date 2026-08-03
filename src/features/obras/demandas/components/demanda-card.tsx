import {
  useState,
  type MouseEvent,
} from "react";

import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  CirclePause,
  Clock3,
  Eye,
  Layers3,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  supabase,
} from "@/integrations/supabase/client";

import {
  deleteDemanda,
  updateDemanda,
  type DemandaItem,
} from "../services/demandas-service";

import type {
  Demanda,
} from "../types";

interface DemandaCardProps {
  demanda: Demanda;
  obraId: string;
  onDelete?: () => void;
  onEdit?: (
    demanda: Demanda
  ) => void;

  onStatusChange?: () => void;
}

interface StatusVisual {
  label: string;
  className: string;
  borderClassName: string;
  icone:
    | "aguardando"
    | "andamento"
    | "cancelada"
    | "finalizada"
    | "finalizada_atraso";
}

interface SituacaoPrazo {
  mensagem: string;
  className: string;
  icone:
    | "alerta"
    | "relogio";
}

function somenteData(
  data?: string | null
): string {
  if (!data) {
    return "";
  }

  return data.split(
    "T"
  )[0];
}

function parseDataLocal(
  data?: string | null
): Date | null {
  if (!data) {
    return null;
  }

  const dataSemHorario =
    somenteData(
      data
    );

  const [
    ano,
    mes,
    dia,
  ] = dataSemHorario
    .split("-")
    .map(Number);

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return null;
  }

  const resultado =
    new Date(
      ano,
      mes - 1,
      dia
    );

  resultado.setHours(
    0,
    0,
    0,
    0
  );

  return resultado;
}

function formatarData(
  data?: string | null
): string {
  const dataConvertida =
    parseDataLocal(
      data
    );

  if (!dataConvertida) {
    return "Não informado";
  }

  return dataConvertida.toLocaleDateString(
    "pt-BR"
  );
}

function obterHoje(): Date {
  const hoje =
    new Date();

  hoje.setHours(
    0,
    0,
    0,
    0
  );

  return hoje;
}

function diferencaEmDias(
  dataInicial: Date,
  dataFinal: Date
): number {
  const milissegundosPorDia =
    1000 *
    60 *
    60 *
    24;

  return Math.ceil(
    (
      dataFinal.getTime() -
      dataInicial.getTime()
    ) /
      milissegundosPorDia
  );
}

function obterStatusVisual(
  demanda: Demanda
): StatusVisual {
  const prazo =
    parseDataLocal(
      demanda.prazo
    );

  const dataConclusao =
    parseDataLocal(
      demanda.data_conclusao
    );

  if (
    demanda.status ===
    "cancelada"
  ) {
    return {
      label:
        "Cancelada",

      className:
        "bg-red-100 text-red-700",

      borderClassName:
        "border-red-300",

      icone:
        "cancelada",
    };
  }

  if (
    demanda.status ===
    "concluida"
  ) {
    const finalizadaComAtraso =
      Boolean(
        prazo &&
        dataConclusao &&
        dataConclusao >
          prazo
      );

    if (
      finalizadaComAtraso
    ) {
      return {
        label:
          "Finalizada com atraso",

        className:
          "bg-amber-100 text-amber-800",

        borderClassName:
          "border-amber-300",

        icone:
          "finalizada_atraso",
      };
    }

    return {
      label:
        "Finalizada",

      className:
        "bg-green-100 text-green-700",

      borderClassName:
        "border-green-300",

      icone:
        "finalizada",
    };
  }

  if (
    demanda.status ===
    "em_andamento"
  ) {
    return {
      label:
        "Em andamento",

      className:
        "bg-blue-100 text-blue-700",

      borderClassName:
        "border-blue-200",

      icone:
        "andamento",
    };
  }

  return {
    label:
      "Aguardando início",

    className:
      "bg-slate-100 text-slate-700",

    borderClassName:
      "border-slate-300",

    icone:
      "aguardando",
  };
}

function obterSituacaoPrazo(
  demanda: Demanda
): SituacaoPrazo | null {
  if (
    demanda.status ===
      "concluida" ||
    demanda.status ===
      "cancelada"
  ) {
    return null;
  }

  const prazo =
    parseDataLocal(
      demanda.prazo
    );

  if (!prazo) {
    return null;
  }

  const hoje =
    obterHoje();

  if (
    prazo <
    hoje
  ) {
    const diasAtraso =
      Math.abs(
        diferencaEmDias(
          prazo,
          hoje
        )
      );

    return {
      mensagem:
        diasAtraso === 1
          ? "A demanda está atrasada há 1 dia."
          : `A demanda está atrasada há ${diasAtraso} dias.`,

      className:
        "border-red-200 bg-red-50 text-red-700",

      icone:
        "alerta",
    };
  }

  const diasRestantes =
    diferencaEmDias(
      hoje,
      prazo
    );

  if (
    diasRestantes ===
    0
  ) {
    return {
      mensagem:
        "O prazo termina hoje.",

      className:
        "border-orange-200 bg-orange-50 text-orange-700",

      icone:
        "relogio",
    };
  }

  if (
    diasRestantes >=
      1 &&
    diasRestantes <=
      3
  ) {
    return {
      mensagem:
        diasRestantes ===
        1
          ? "Falta 1 dia para o prazo."
          : `Faltam ${diasRestantes} dias para o prazo.`,

      className:
        "border-orange-200 bg-orange-50 text-orange-700",

      icone:
        "relogio",
    };
  }

  return null;
}

function obterCorPrioridade(
  prioridade:
    Demanda["prioridade"]
): string {
  switch (
    prioridade
  ) {
    case "baixa":
      return "border-green-200 bg-green-50 text-green-700";

    case "media":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "alta":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function obterLabelPrioridade(
  prioridade:
    Demanda["prioridade"]
): string {
  switch (
    prioridade
  ) {
    case "baixa":
      return "Prioridade: Baixa";

    case "media":
      return "Prioridade: Média";

    case "alta":
      return "Prioridade: Alta";

    default:
      return "Prioridade não informada";
  }
}

function IconeStatus({
  icone,
}: {
  icone:
    StatusVisual["icone"];
}) {
  switch (
    icone
  ) {
    case "aguardando":
      return (
        <CirclePause className="h-3.5 w-3.5" />
      );

    case "andamento":
      return (
        <Clock3 className="h-3.5 w-3.5" />
      );

    case "cancelada":
      return (
        <XCircle className="h-3.5 w-3.5" />
      );

    case "finalizada":
      return (
        <CheckCircle2 className="h-3.5 w-3.5" />
      );

    case "finalizada_atraso":
      return (
        <AlertTriangle className="h-3.5 w-3.5" />
      );

    default:
      return null;
  }
}

export function DemandaCard({
  demanda,
  obraId,
  onDelete,
  onEdit,
  onStatusChange,
}: DemandaCardProps) {
  const {
    perfil,
  } = useAuth();

  const [
    excluindo,
    setExcluindo,
  ] = useState(false);

  const [
    atualizandoStatus,
    setAtualizandoStatus,
  ] = useState(false);

  const [
    modalFinalizacaoAberto,
    setModalFinalizacaoAberto,
  ] = useState(false);

  const [
    dataFinalizacao,
    setDataFinalizacao,
  ] = useState("");

  const administrador =
    perfil?.administrador ===
    true;

  const demandaDoMeuSetor =
    Boolean(
      perfil?.setor_id &&
      demanda.setor_id &&
      perfil.setor_id ===
        demanda.setor_id
    );

  const podeGerenciar =
    administrador ||
    demandaDoMeuSetor;

  const statusVisual =
    obterStatusVisual(
      demanda
    );

  const situacaoPrazo =
    obterSituacaoPrazo(
      demanda
    );

  const nomeResponsavel =
    demanda.responsavel?.nome ||
    "Não atribuído";

  const nomeSetor =
    demanda.setor?.nome ||
    demanda.responsavel?.setor
      ?.nome ||
    "Não informado";

  const nomeEtapa =
    demanda.etapa?.titulo ||
    "Não informada";

  const numeroEtapa =
    demanda.etapa?.ordem;

  const itensChecklist =
    (
      demanda as Demanda & {
        itens?: DemandaItem[];
      }
    ).itens ??
    [];

  const totalItensChecklist =
    itensChecklist.length;

  const totalItensConcluidos =
    itensChecklist.filter(
      (
        item
      ) =>
        item.concluido
    ).length;

  const checklistCompleto =
    totalItensChecklist ===
      0 ||
    totalItensConcluidos ===
      totalItensChecklist;

  async function handleExcluir(
    event:
      MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();

    if (
      !podeGerenciar
    ) {
      alert(
        "Você não possui permissão para excluir esta demanda."
      );

      return;
    }

    if (
      !administrador
    ) {
      const {
        data: demandaAtual,
        error: erroDemanda,
      } = await supabase
        .from("demandas")
        .select(
          "setor_id"
        )
        .eq(
          "id",
          demanda.id
        )
        .single();

      if (
        erroDemanda
      ) {
        console.error(
          "Erro ao validar permissão para excluir demanda:",
          erroDemanda
        );

        alert(
          "Não foi possível confirmar sua permissão para excluir esta demanda."
        );

        return;
      }

      const setorUsuarioId =
        perfil?.setor_id;

      const aindaPodeExcluir =
        Boolean(
          setorUsuarioId &&
          demandaAtual.setor_id ===
            setorUsuarioId
        );

      if (
        !aindaPodeExcluir
      ) {
        alert(
          "Esta demanda não pertence mais ao seu setor. Você não pode excluí-la."
        );

        onDelete?.();

        return;
      }
    }

    const confirmou =
      confirm(
        `Deseja excluir "${demanda.titulo}"?`
      );

    if (!confirmou) {
      return;
    }

    try {
      setExcluindo(
        true
      );

      await deleteDemanda(
        demanda.id
      );

      onDelete?.();
    } catch (error) {
      console.error(
        "Erro ao excluir demanda:",
        error
      );

      alert(
        "Erro ao excluir a demanda."
      );
    } finally {
      setExcluindo(
        false
      );
    }
  }

  function handleEditar(
    event:
      MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();

    if (
      !podeGerenciar
    ) {
      alert(
        "Você não possui permissão para editar esta demanda."
      );

      return;
    }

    onEdit?.(
      demanda
    );
  }

  function obterHojeIso() {
    const hoje =
      new Date();

    return [
      hoje.getFullYear(),
      String(
        hoje.getMonth() +
          1
      ).padStart(
        2,
        "0"
      ),
      String(
        hoje.getDate()
      ).padStart(
        2,
        "0"
      ),
    ].join("-");
  }

  async function handleIniciar(
    event:
      MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();

    if (!podeGerenciar) {
      alert(
        "Você não possui permissão para iniciar esta demanda."
      );

      return;
    }

    try {
      setAtualizandoStatus(
        true
      );

      await updateDemanda(
        demanda.id,
        {
          status:
            "em_andamento",

          data_inicio:
            demanda.data_inicio ||
            obterHojeIso(),

          data_conclusao:
            null,
        }
      );

      onStatusChange?.();
    } catch (error) {
      console.error(
        "Erro ao iniciar demanda:",
        error
      );

      alert(
        "Não foi possível iniciar a demanda."
      );
    } finally {
      setAtualizandoStatus(
        false
      );
    }
  }

  async function handleReabrir(
    event:
      MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();

    if (!podeGerenciar) {
      alert(
        "Você não possui permissão para reabrir esta demanda."
      );

      return;
    }

    const confirmou =
      window.confirm(
        `Deseja reabrir a demanda "${demanda.titulo}"?`
      );

    if (!confirmou) {
      return;
    }

    try {
      setAtualizandoStatus(
        true
      );

      await updateDemanda(
        demanda.id,
        {
          status:
            "em_andamento",

          data_inicio:
            demanda.data_inicio ||
            obterHojeIso(),

          data_conclusao:
            null,
        }
      );

      onStatusChange?.();
    } catch (error) {
      console.error(
        "Erro ao reabrir demanda:",
        error
      );

      alert(
        "Não foi possível reabrir a demanda."
      );
    } finally {
      setAtualizandoStatus(
        false
      );
    }
  }

  function abrirModalFinalizacao(
    event:
      MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();

    if (!podeGerenciar) {
      alert(
        "Você não possui permissão para finalizar esta demanda."
      );

      return;
    }

    if (!checklistCompleto) {
      alert(
        `Conclua todos os itens do checklist antes de finalizar a demanda. Restam ${
          totalItensChecklist -
          totalItensConcluidos
        } item(ns).`
      );

      return;
    }

    setDataFinalizacao(
      ""
    );

    setModalFinalizacaoAberto(
      true
    );
  }

  function fecharModalFinalizacao() {
    if (atualizandoStatus) {
      return;
    }

    setModalFinalizacaoAberto(
      false
    );

    setDataFinalizacao(
      ""
    );
  }

  async function finalizarDemanda(
    dataConclusao: string
  ) {
    if (!dataConclusao) {
      alert(
        "Informe a data de conclusão."
      );

      return;
    }

    try {
      setAtualizandoStatus(
        true
      );

      await updateDemanda(
        demanda.id,
        {
          status:
            "concluida",

          data_inicio:
            demanda.data_inicio ||
            dataConclusao,

          data_conclusao:
            dataConclusao,
        }
      );

      setModalFinalizacaoAberto(
        false
      );

      setDataFinalizacao(
        ""
      );

      onStatusChange?.();
    } catch (error) {
      console.error(
        "Erro ao finalizar demanda:",
        error
      );

      alert(
        "Não foi possível finalizar a demanda."
      );
    } finally {
      setAtualizandoStatus(
        false
      );
    }
  }

  return (
    <>
      <article
      data-obra-id={
        obraId
      }
      className={`
        flex
        h-full
        flex-col
        gap-4
        rounded-2xl
        border
        bg-white
        p-5
        shadow-sm
        transition-all
        hover:shadow-md
        ${statusVisual.borderClassName}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-gray-900">
            {
              demanda.titulo
            }
          </h2>

          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {demanda.descricao ||
              "Sem descrição informada."}
          </p>
        </div>

        {podeGerenciar ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={
                handleEditar
              }
              title="Editar demanda"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black"
            >
              <Pencil className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={
                handleExcluir
              }
              disabled={
                excluindo
              }
              title="Excluir demanda"
              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500"
            title="Demanda indisponível para edição"
          >
            <Eye className="h-3.5 w-3.5" />

            Visualização
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`
            inline-flex
            items-center
            gap-1.5
            rounded-full
            px-3
            py-1
            text-xs
            font-semibold
            ${statusVisual.className}
          `}
        >
          <IconeStatus
            icone={
              statusVisual.icone
            }
          />

          {
            statusVisual.label
          }
        </span>

        <span
          className={`
            inline-flex
            items-center
            rounded-full
            border
            px-3
            py-1
            text-xs
            font-semibold
            ${obterCorPrioridade(
              demanda.prioridade
            )}
          `}
        >
          {obterLabelPrioridade(
            demanda.prioridade
          )}
        </span>
      </div>

      {totalItensChecklist >
        0 && (
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600">
                Checklist
              </span>

              <span
                className={`text-xs font-bold ${
                  checklistCompleto
                    ? "text-green-700"
                    : "text-slate-700"
                }`}
              >
                {totalItensConcluidos}/{totalItensChecklist}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${
                  checklistCompleto
                    ? "bg-green-500"
                    : "bg-blue-500"
                }`}
                style={{
                  width:
                    totalItensChecklist >
                    0
                      ? `${
                          (
                            totalItensConcluidos /
                            totalItensChecklist
                          ) *
                          100
                        }%`
                      : "0%",
                }}
              />
            </div>

            {!checklistCompleto && (
              <p className="mt-2 text-xs text-amber-700">
                Finalize os itens restantes para liberar a conclusão da demanda.
              </p>
            )}
          </div>
        )}

      <div className="rounded-xl border bg-slate-50 p-3">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 shrink-0 text-slate-500" />

          <span className="text-xs font-medium text-slate-500">
            Etapa vinculada
          </span>
        </div>

        <p className="mt-2 truncate text-sm font-semibold text-slate-800">
          {numeroEtapa
            ? `Etapa ${numeroEtapa} — ${nomeEtapa}`
            : nomeEtapa}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 shrink-0 text-slate-500" />

            <span className="text-xs font-medium text-slate-500">
              Responsável
            </span>
          </div>

          <p className="mt-2 truncate text-sm font-semibold text-slate-800">
            {
              nomeResponsavel
            }
          </p>
        </div>

        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-slate-500" />

            <span className="text-xs font-medium text-slate-500">
              Setor
            </span>
          </div>

          <p className="mt-2 truncate text-sm font-semibold text-slate-800">
            {
              nomeSetor
            }
          </p>
        </div>

        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0 text-slate-500" />

            <span className="text-xs font-medium text-slate-500">
              Prazo
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-800">
            {formatarData(
              demanda.prazo
            )}
          </p>
        </div>

        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-500" />

            <span className="text-xs font-medium text-slate-500">
              Conclusão
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-800">
            {formatarData(
              demanda.data_conclusao
            )}
          </p>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {podeGerenciar &&
          demanda.status !==
            "cancelada" && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {demanda.status ===
                "aberta" && (
                <button
                  type="button"
                  onClick={
                    handleIniciar
                  }
                  disabled={
                    atualizandoStatus
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />

                  {atualizandoStatus
                    ? "Iniciando..."
                    : "Iniciar demanda"}
                </button>
              )}

              {demanda.status !==
                "concluida" && (
                <button
                  type="button"
                  onClick={
                    abrirModalFinalizacao
                  }
                  disabled={
                    atualizandoStatus ||
                    !checklistCompleto
                  }
                  title={
                    checklistCompleto
                      ? "Finalizar demanda"
                      : "Conclua todos os itens do checklist."
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />

                  Finalizar demanda
                </button>
              )}

              {demanda.status ===
                "concluida" && (
                <button
                  type="button"
                  onClick={
                    handleReabrir
                  }
                  disabled={
                    atualizandoStatus
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />

                  {atualizandoStatus
                    ? "Reabrindo..."
                    : "Reabrir demanda"}
                </button>
              )}
            </div>
          )}

        {situacaoPrazo && (
          <div
            className={`
              flex
              items-center
              gap-2
              rounded-xl
              border
              px-3
              py-2
              text-sm
              ${situacaoPrazo.className}
            `}
          >
            {situacaoPrazo.icone ===
            "alerta" ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <CalendarClock className="h-4 w-4 shrink-0" />
            )}

            <span>
              {
                situacaoPrazo.mensagem
              }
            </span>
          </div>
        )}

        {demanda.motivo_atraso && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Motivo do atraso
            </p>

            <p className="mt-1 text-sm text-amber-900">
              {
                demanda.motivo_atraso
              }
            </p>
          </div>
        )}
      </div>
      </article>

      {modalFinalizacaoAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={
            fecharModalFinalizacao
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`finalizar-demanda-${demanda.id}`}
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
            className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl"
          >
            <h2
              id={`finalizar-demanda-${demanda.id}`}
              className="text-xl font-bold text-gray-900"
            >
              Finalizar demanda
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              A demanda foi finalizada hoje?
            </p>

            <div className="mt-6 space-y-4">
              <button
                type="button"
                onClick={() =>
                  finalizarDemanda(
                    obterHojeIso()
                  )
                }
                disabled={
                  atualizandoStatus
                }
                className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {atualizandoStatus
                  ? "Finalizando..."
                  : "Sim, foi finalizada hoje"}
              </button>

              <div className="rounded-xl border bg-slate-50 p-4">
                <label
                  htmlFor={`data-finalizacao-${demanda.id}`}
                  className="text-sm font-semibold text-gray-700"
                >
                  Foi finalizada em outra data
                </label>

                <input
                  id={`data-finalizacao-${demanda.id}`}
                  type="date"
                  value={
                    dataFinalizacao
                  }
                  onChange={(
                    event
                  ) =>
                    setDataFinalizacao(
                      event.target.value
                    )
                  }
                  disabled={
                    atualizandoStatus
                  }
                  className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    finalizarDemanda(
                      dataFinalizacao
                    )
                  }
                  disabled={
                    atualizandoStatus ||
                    !dataFinalizacao
                  }
                  className="mt-3 w-full rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Finalizar nesta data
                </button>
              </div>

              <button
                type="button"
                onClick={
                  fecharModalFinalizacao
                }
                disabled={
                  atualizandoStatus
                }
                className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DemandaCard;