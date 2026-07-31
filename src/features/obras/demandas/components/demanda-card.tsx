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
  Pencil,
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
}: DemandaCardProps) {
  const {
    perfil,
  } = useAuth();

  const [
    excluindo,
    setExcluindo,
  ] = useState(false);

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

  return (
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
  );
}

export default DemandaCard;