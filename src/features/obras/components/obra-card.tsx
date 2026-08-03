import {
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  Building2,
  CalendarDays,
  Eye,
  Layers3,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  deletarObra,
} from "../services/obras-service";

import type {
  EtapaObraResumo,
  Obra,
  StatusEtapaObra,
} from "../types";

interface ObraCardProps {
  obra: Obra;
  onDelete?: () => void;
}

function parseData(
  data?: string | null
) {
  if (!data) {
    return null;
  }

  const [
    ano,
    mes,
    dia,
  ] = data
    .split("-")
    .map(Number);

  const dataFormatada =
    new Date(
      ano,
      mes - 1,
      dia
    );

  if (
    Number.isNaN(
      dataFormatada.getTime()
    )
  ) {
    return null;
  }

  dataFormatada.setHours(
    0,
    0,
    0,
    0
  );

  return dataFormatada;
}

function formatarData(
  data?: string | null
) {
  const dataFormatada =
    parseData(data);

  if (!dataFormatada) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    dataFormatada
  );
}


function obraEstaFinalizada(
  obra: Obra
) {
  return Boolean(
    obra.data_entrega
  );
}

function getEtapaStatusInfo(
  status?: StatusEtapaObra | null
) {
  switch (status) {
    case "em_andamento":
      return {
        label:
          "Em andamento",

        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "aguardando_outro_setor":
      return {
        label:
          "Aguardando outro setor",

        className:
          "border-purple-200 bg-purple-50 text-purple-700",
      };

    case "aguardando_cliente":
      return {
        label:
          "Aguardando cliente",

        className:
          "border-orange-200 bg-orange-50 text-orange-700",
      };

    case "bloqueada":
      return {
        label:
          "Bloqueada",

        className:
          "border-red-200 bg-red-50 text-red-700",
      };

    case "concluida":
      return {
        label:
          "Concluída",

        className:
          "border-green-200 bg-green-50 text-green-700",
      };

    default:
      return {
        label:
          "Não iniciada",

        className:
          "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

function getStatusGeralStyle(
  obra: Obra
) {
  const etapas =
    obra.etapas ||
    [];

  if (
    obraEstaFinalizada(
      obra
    )
  ) {
    const dataEsperada =
      parseData(
        obra.data_entrega_esperada
      );

    const dataFinal =
      parseData(
        obra.data_entrega
      );

    if (
      dataEsperada &&
      dataFinal &&
      dataFinal >
        dataEsperada
    ) {
      return {
        label:
          "Finalizada com atraso",

        className:
          "border-amber-300 bg-amber-100 text-amber-800",
      };
    }

    return {
      label:
        "Finalizada",

      className:
        "border-green-300 bg-green-100 text-green-800",
    };
  }

  if (
    etapas.length ===
    0
  ) {
    switch (
      obra.status
    ) {
      case "em_desenvolvimento":
        return {
          label:
            "Em andamento",

          className:
            "border-blue-300 bg-blue-100 text-blue-800",
        };

      case "em_analise":
        return {
          label:
            "Em análise",

          className:
            "border-amber-300 bg-amber-100 text-amber-800",
        };

      case "aguardando_cliente":
        return {
          label:
            "Aguardando cliente",

          className:
            "border-orange-300 bg-orange-100 text-orange-800",
        };

      default:
        return {
          label:
            "Recebida",

          className:
            "border-gray-300 bg-gray-100 text-gray-800",
        };
    }
  }

  const etapasObrigatorias =
    etapas.filter(
      (etapa) =>
        etapa.obrigatoria
    );

  const etapasConsideradas =
    etapasObrigatorias.length >
    0
      ? etapasObrigatorias
      : etapas;

  const todasConcluidas =
    etapasConsideradas.every(
      (etapa) =>
        etapa.status ===
        "concluida"
    );

  if (todasConcluidas) {
    return {
      label:
        "Em andamento",

      className:
        "border-blue-300 bg-blue-100 text-blue-800",
    };
  }

  const hoje =
    new Date();

  hoje.setHours(
    0,
    0,
    0,
    0
  );

  const possuiEtapaAtrasada =
    etapasConsideradas.some(
      (etapa) => {
        if (
          etapa.status ===
            "concluida" ||
          !etapa.prazo
        ) {
          return false;
        }

        const prazo =
          parseData(
            etapa.prazo
          );

        return Boolean(
          prazo &&
          prazo <
            hoje
        );
      }
    );

  if (
    possuiEtapaAtrasada
  ) {
    return {
      label:
        "Etapa atrasada",

      className:
        "border-red-300 bg-red-100 text-red-800",
    };
  }

  const possuiBloqueada =
    etapasConsideradas.some(
      (etapa) =>
        etapa.status ===
        "bloqueada"
    );

  if (
    possuiBloqueada
  ) {
    return {
      label:
        "Bloqueada",

      className:
        "border-red-300 bg-red-100 text-red-800",
    };
  }

  const possuiAguardando =
    etapasConsideradas.some(
      (etapa) =>
        etapa.status ===
          "aguardando_cliente" ||
        etapa.status ===
          "aguardando_outro_setor"
    );

  if (
    possuiAguardando
  ) {
    return {
      label:
        "Aguardando",

      className:
        "border-orange-300 bg-orange-100 text-orange-800",
    };
  }

  const possuiEmAndamento =
    etapasConsideradas.some(
      (etapa) =>
        etapa.status ===
        "em_andamento"
    );

  if (
    possuiEmAndamento
  ) {
    return {
      label:
        "Em andamento",

      className:
        "border-blue-300 bg-blue-100 text-blue-800",
    };
  }

  return {
    label:
      "Recebida",

    className:
      "border-gray-300 bg-gray-100 text-gray-800",
  };
}


function calcularProgressoEtapas(
  obra: Obra
) {
  const etapas =
    obra.etapas ||
    [];

  const finalizada =
    obraEstaFinalizada(
      obra
    );

  if (
    etapas.length ===
    0
  ) {
    const progresso =
      finalizada
        ? 100
        : obra.progresso ??
          0;

    return {
      progresso:
        Math.min(
          100,
          Math.max(
            0,
            progresso
          )
        ),

      concluidas:
        0,

      total:
        0,

      possuiEtapas:
        false,

      obraFinalizada:
        finalizada,
    };
  }

  const etapasObrigatorias =
    etapas.filter(
      (etapa) =>
        etapa.obrigatoria
    );

  const etapasConsideradas =
    etapasObrigatorias.length >
    0
      ? etapasObrigatorias
      : etapas;

  const concluidas =
    etapasConsideradas.filter(
      (etapa) =>
        etapa.status ===
        "concluida"
    ).length;

  const total =
    etapasConsideradas.length;

  const progressoEtapas =
    total > 0
      ? Math.round(
          (
            concluidas /
            total
          ) *
            100
        )
      : 0;

  return {
    progresso:
      progressoEtapas,

    concluidas,
    total,

    possuiEtapas:
      true,

    obraFinalizada:
      finalizada,
  };
}


function encontrarEtapaExibida(
  obra: Obra,
  setorUsuarioId?: string | null,
  administrador = false
): EtapaObraResumo | null {
  const etapas =
    obra.etapas ||
    [];

  if (
    etapas.length ===
    0
  ) {
    return null;
  }

  if (
    !administrador &&
    setorUsuarioId
  ) {
    const etapaUsuario =
      etapas.find(
        (etapa) =>
          etapa.setor_id ===
          setorUsuarioId
      );

    if (etapaUsuario) {
      return etapaUsuario;
    }
  }

  if (obra.setor_id) {
    const etapaSetorAtual =
      etapas.find(
        (etapa) =>
          etapa.setor_id ===
          obra.setor_id
      );

    if (
      etapaSetorAtual
    ) {
      return etapaSetorAtual;
    }
  }

  const etapaEmAndamento =
    etapas.find(
      (etapa) =>
        etapa.status ===
        "em_andamento"
    );

  if (
    etapaEmAndamento
  ) {
    return etapaEmAndamento;
  }

  const etapaPendente =
    etapas.find(
      (etapa) =>
        etapa.status !==
        "concluida"
    );

  return (
    etapaPendente ||
    etapas[0] ||
    null
  );
}

export function ObraCard({
  obra,
  onDelete,
}: ObraCardProps) {
  const navigate =
    useNavigate();

  const {
    perfil,
  } = useAuth();

  const administrador =
    Boolean(
      perfil?.administrador
    );

  const mesmoSetor =
    Boolean(
      obra.setor_id &&
      perfil?.setor_id &&
      obra.setor_id ===
        perfil.setor_id
    );

  const possuiEtapaDoMeuSetor =
    Boolean(
      perfil?.setor_id &&
      obra.etapas?.some(
        (etapa) =>
          etapa.setor_id ===
          perfil.setor_id
      )
    );

  const podeEditarObra =
    administrador ||
    mesmoSetor;

  const podeTrabalharNaObra =
    podeEditarObra ||
    possuiEtapaDoMeuSetor;

  const statusInfo =
    getStatusGeralStyle(
      obra
    );

  const progressoEtapas =
    calcularProgressoEtapas(
      obra
    );

  const etapaExibida =
    encontrarEtapaExibida(
      obra,
      perfil?.setor_id,
      administrador
    );

  const etapaStatusInfo =
    getEtapaStatusInfo(
      etapaExibida?.status
    );

  const numeroExibido =
    obra.numero_proposta ||
    obra.codigo ||
    "Sem número";


  const nomeCliente =
    obra.clientes?.nome ||
    obra.cliente ||
    "Cliente não informado";

  const nomeSetor =
    obra.setor?.nome ||
    "Setor não atribuído";

  const tituloEtapa =
    administrador
      ? "Etapa do setor atual"
      : "Etapa do meu setor";

  function handleCardClick() {
    navigate({
      to:
        "/obras/$id",

      params: {
        id:
          obra.id,
      },
    });
  }

  async function handleExcluir(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (!podeEditarObra) {
      alert(
        "Você não possui permissão para excluir esta obra."
      );

      return;
    }

    const confirmado =
      window.confirm(
        `Tem certeza que deseja excluir a obra ${
          obra.codigo ||
          "sem código"
        }?`
      );

    if (!confirmado) {
      return;
    }

    try {
      await deletarObra(
        obra.id
      );

      onDelete?.();
    } catch (error) {
      console.error(
        "Erro ao excluir obra:",
        error
      );

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido";

      alert(
        `Erro ao excluir obra: ${mensagem}`
      );
    }
  }

  return (
    <div
      onClick={
        handleCardClick
      }
      className="flex h-full cursor-pointer flex-col gap-5 rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-xl font-bold tracking-tight text-gray-900">
              {numeroExibido}
            </h3>
          </div>

          <p className="truncate text-sm font-medium text-gray-600">
            {nomeCliente}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
        >
          {
            statusInfo.label
          }
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3">
        <Building2 className="h-5 w-5 shrink-0 text-slate-500" />

        <div className="min-w-0">
          <span className="block text-xs font-medium text-slate-500">
            Setor atual
          </span>

          <span className="block truncate text-sm font-semibold text-slate-800">
            {nomeSetor}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-gray-50/50 p-3">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 shrink-0 text-slate-500" />

            <span className="block text-xs font-medium text-gray-500">
              {tituloEtapa}
            </span>
          </div>

          {etapaExibida ? (
            <div className="mt-2 space-y-1">
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${etapaStatusInfo.className}`}
              >
                {
                  etapaStatusInfo.label
                }
              </span>

              <p className="truncate text-xs text-gray-500">
                {etapaExibida.setor?.nome ||
                  "Setor não informado"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-gray-800">
              Não cadastrada
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-gray-50/50 p-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />

            <span className="block text-xs font-medium text-gray-500">
              Prazo da etapa
            </span>
          </div>

          <span className="mt-2 block text-sm font-bold text-gray-800">
            {etapaExibida
              ? formatarData(
                  etapaExibida.prazo
                )
              : "Não informado"}
          </span>
        </div>
      </div>

      <div className="mt-auto space-y-1.5">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-gray-600">
          <div>
            <span className="block">
              Progresso das etapas
            </span>

            {progressoEtapas.obraFinalizada ? (
              <span className="mt-0.5 block text-[11px] text-emerald-700">
                {progressoEtapas.possuiEtapas &&
                progressoEtapas.concluidas <
                  progressoEtapas.total
                  ? `${
                      progressoEtapas.total -
                      progressoEtapas.concluidas
                    } ${
                      progressoEtapas.total -
                        progressoEtapas.concluidas ===
                      1
                        ? "etapa ainda aberta"
                        : "etapas ainda abertas"
                    }`
                  : "Finalização da obra registrada"}
              </span>
            ) : progressoEtapas.possuiEtapas ? (
              <span className="mt-0.5 block text-[11px] text-gray-500">
                {
                  progressoEtapas.concluidas
                } de{" "}
                {
                  progressoEtapas.total
                } etapas concluídas
              </span>
            ) : (
              <span className="mt-0.5 block text-[11px] text-transparent">
                Nenhuma etapa cadastrada
              </span>
            )}
          </div>

          <span className="shrink-0">
            {
              progressoEtapas.progresso
            }%
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
            style={{
              width:
                `${progressoEtapas.progresso}%`,
            }}
          />
        </div>
      </div>

      {podeEditarObra ? (
        <div className="flex items-center gap-3 pt-1">
          <Link
            to="/obras/$id/editar"
            params={{
              id:
                obra.id,
            }}
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
          >
            Editar
          </Link>

          {onDelete && (
            <button
              type="button"
              onClick={
                handleExcluir
              }
              className="relative z-10 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Excluir
            </button>
          )}
        </div>
      ) : podeTrabalharNaObra ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <Layers3 className="h-4 w-4 shrink-0" />

          <span>
            Acesso às atividades do meu setor
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Eye className="h-4 w-4 shrink-0" />

          <span>
            Somente visualização
          </span>
        </div>
      )}
    </div>
  );
}