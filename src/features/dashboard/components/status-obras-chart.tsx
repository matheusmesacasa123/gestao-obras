import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Clock3,
  Hourglass,
  Inbox,
  UserRoundCheck,
  XCircle,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import type {
  Obra,
} from "@/features/obras/types";

import type {
  ObraExecucao,
} from "@/features/execucao-obras/types";

type Props =
  | {
      tipo: "orcamentacao";
      orcamentos: Obra[];
      obrasExecucao?: never;
    }
  | {
      tipo: "execucao";
      obrasExecucao: ObraExecucao[];
      orcamentos?: never;
    };

type StatusItem = {
  nome: string;
  descricao: string;
  valor: number;
  percentual: number;
  barraClassName: string;
  iconeClassName: string;
  iconeContainerClassName: string;
  Icone: LucideIcon;
};

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

/* =========================================================
   EXECUÇÃO
========================================================= */

function execucaoEstaConcluida(
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

function execucaoEstaCancelada(
  obra: ObraExecucao,
) {
  return (
    obra.status ===
    "cancelada"
  );
}

function execucaoEstaAtrasada(
  obra: ObraExecucao,
) {
  if (
    execucaoEstaConcluida(
      obra,
    ) ||
    execucaoEstaCancelada(
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

function execucaoFinalizadaComAtraso(
  obra: ObraExecucao,
) {
  if (
    !execucaoEstaConcluida(
      obra,
    ) ||
    !obra.data_entrega ||
    !obra.prazo_entrega
  ) {
    return false;
  }

  const prazo =
    criarDataLocal(
      obra.prazo_entrega,
    );

  const entrega =
    criarDataLocal(
      obra.data_entrega,
    );

  if (
    !prazo ||
    !entrega
  ) {
    return false;
  }

  return (
    entrega >
    prazo
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export function StatusObrasChart(
  props: Props,
) {
  const total =
    props.tipo ===
    "orcamentacao"
      ? props.orcamentos.length
      : props.obrasExecucao.length;

  function calcularPercentual(
    valor: number,
  ) {
    if (
      total === 0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (
          valor /
          total
        ) *
          100,
      ),
    );
  }

  let dados: StatusItem[] =
    [];

  let titulo =
    "";

  let descricao =
    "";

  let labelTotal =
    "";

  if (
    props.tipo ===
    "orcamentacao"
  ) {
    const {
      orcamentos,
    } = props;

    const recebidos =
      orcamentos.filter(
        orcamentoEstaRecebido,
      ).length;

    const emAndamento =
      orcamentos.filter(
        orcamentoEstaEmAndamento,
      ).length;

    const aguardandoCliente =
      orcamentos.filter(
        orcamentoEstaAguardandoCliente,
      ).length;

    const concluidos =
      orcamentos.filter(
        orcamentoEstaConcluido,
      ).length;

    const atrasados =
      orcamentos.filter(
        orcamentoEstaAtrasado,
      ).length;

    titulo =
      "Status dos orçamentos";

    descricao =
      "Distribuição dos orçamentos conforme o andamento das etapas.";

    labelTotal =
      total === 1
        ? "orçamento"
        : "orçamentos";

    dados = [
      {
        nome:
          "Recebidos",

        descricao:
          "Orçamentos aguardando início",

        valor:
          recebidos,

        percentual:
          calcularPercentual(
            recebidos,
          ),

        barraClassName:
          "bg-slate-500",

        iconeClassName:
          "text-slate-600",

        iconeContainerClassName:
          "border-slate-200 bg-slate-100",

        Icone:
          Inbox,
      },

      {
        nome:
          "Em andamento",

        descricao:
          "Orçamentos atualmente em elaboração",

        valor:
          emAndamento,

        percentual:
          calcularPercentual(
            emAndamento,
          ),

        barraClassName:
          "bg-blue-500",

        iconeClassName:
          "text-blue-600",

        iconeContainerClassName:
          "border-blue-100 bg-blue-50",

        Icone:
          Activity,
      },

      {
        nome:
          "Aguardando cliente",

        descricao:
          "Dependem de retorno do cliente",

        valor:
          aguardandoCliente,

        percentual:
          calcularPercentual(
            aguardandoCliente,
          ),

        barraClassName:
          "bg-amber-500",

        iconeClassName:
          "text-amber-600",

        iconeContainerClassName:
          "border-amber-100 bg-amber-50",

        Icone:
          UserRoundCheck,
      },

      {
        nome:
          "Concluídos",

        descricao:
          "Orçamentos com todas as etapas concluídas",

        valor:
          concluidos,

        percentual:
          calcularPercentual(
            concluidos,
          ),

        barraClassName:
          "bg-emerald-500",

        iconeClassName:
          "text-emerald-600",

        iconeContainerClassName:
          "border-emerald-100 bg-emerald-50",

        Icone:
          CheckCircle2,
      },

      {
        nome:
          "Atrasados",

        descricao:
          "Orçamentos com etapa aberta fora do prazo",

        valor:
          atrasados,

        percentual:
          calcularPercentual(
            atrasados,
          ),

        barraClassName:
          "bg-red-500",

        iconeClassName:
          "text-red-600",

        iconeContainerClassName:
          "border-red-100 bg-red-50",

        Icone:
          AlertTriangle,
      },
    ];
  } else {
    const {
      obrasExecucao,
    } = props;

    const naoIniciadas =
      obrasExecucao.filter(
        (obra) =>
          obra.status ===
            "nao_iniciada" &&
          !execucaoEstaAtrasada(
            obra,
          ),
      ).length;

    const andamento =
      obrasExecucao.filter(
        (obra) =>
          obra.status ===
            "em_andamento" &&
          !execucaoEstaAtrasada(
            obra,
          ),
      ).length;

    const aguardandoCliente =
      obrasExecucao.filter(
        (obra) =>
          obra.status ===
            "aguardando_cliente" &&
          !execucaoEstaAtrasada(
            obra,
          ),
      ).length;

    const paralisadas =
      obrasExecucao.filter(
        (obra) =>
          obra.status ===
            "paralisada" &&
          !execucaoEstaAtrasada(
            obra,
          ),
      ).length;

    const atrasadas =
      obrasExecucao.filter(
        execucaoEstaAtrasada,
      ).length;

    const concluidas =
      obrasExecucao.filter(
        execucaoEstaConcluida,
      ).length;

    const canceladas =
      obrasExecucao.filter(
        execucaoEstaCancelada,
      ).length;

    const finalizadasComAtraso =
      obrasExecucao.filter(
        execucaoFinalizadaComAtraso,
      ).length;

    titulo =
      "Status das obras";

    descricao =
      "Distribuição das obras em execução por situação.";

    labelTotal =
      total === 1
        ? "obra"
        : "obras";

    dados = [
      {
        nome:
          "Não iniciadas",

        descricao:
          "Obras aguardando início",

        valor:
          naoIniciadas,

        percentual:
          calcularPercentual(
            naoIniciadas,
          ),

        barraClassName:
          "bg-slate-500",

        iconeClassName:
          "text-slate-600",

        iconeContainerClassName:
          "border-slate-200 bg-slate-100",

        Icone:
          CirclePlay,
      },

      {
        nome:
          "Em andamento",

        descricao:
          "Obras atualmente em execução",

        valor:
          andamento,

        percentual:
          calcularPercentual(
            andamento,
          ),

        barraClassName:
          "bg-blue-500",

        iconeClassName:
          "text-blue-600",

        iconeContainerClassName:
          "border-blue-100 bg-blue-50",

        Icone:
          Activity,
      },

      {
        nome:
          "Aguardando cliente",

        descricao:
          "Dependem de retorno do cliente",

        valor:
          aguardandoCliente,

        percentual:
          calcularPercentual(
            aguardandoCliente,
          ),

        barraClassName:
          "bg-amber-500",

        iconeClassName:
          "text-amber-600",

        iconeContainerClassName:
          "border-amber-100 bg-amber-50",

        Icone:
          Hourglass,
      },

      {
        nome:
          "Paralisadas",

        descricao:
          "Obras temporariamente paradas",

        valor:
          paralisadas,

        percentual:
          calcularPercentual(
            paralisadas,
          ),

        barraClassName:
          "bg-orange-500",

        iconeClassName:
          "text-orange-600",

        iconeContainerClassName:
          "border-orange-100 bg-orange-50",

        Icone:
          CirclePause,
      },

      {
        nome:
          "Atrasadas",

        descricao:
          "Obras abertas fora do prazo",

        valor:
          atrasadas,

        percentual:
          calcularPercentual(
            atrasadas,
          ),

        barraClassName:
          "bg-red-500",

        iconeClassName:
          "text-red-600",

        iconeContainerClassName:
          "border-red-100 bg-red-50",

        Icone:
          AlertTriangle,
      },

      {
        nome:
          "Concluídas",

        descricao:
          "Obras finalizadas",

        valor:
          concluidas,

        percentual:
          calcularPercentual(
            concluidas,
          ),

        barraClassName:
          "bg-emerald-500",

        iconeClassName:
          "text-emerald-600",

        iconeContainerClassName:
          "border-emerald-100 bg-emerald-50",

        Icone:
          CheckCircle2,
      },

      {
        nome:
          "Canceladas",

        descricao:
          "Obras canceladas",

        valor:
          canceladas,

        percentual:
          calcularPercentual(
            canceladas,
          ),

        barraClassName:
          "bg-slate-400",

        iconeClassName:
          "text-slate-500",

        iconeContainerClassName:
          "border-slate-200 bg-slate-50",

        Icone:
          XCircle,
      },

      {
        nome:
          "Finalizadas com atraso",

        descricao:
          "Entregues após o prazo previsto",

        valor:
          finalizadasComAtraso,

        percentual:
          calcularPercentual(
            finalizadasComAtraso,
          ),

        barraClassName:
          "bg-amber-600",

        iconeClassName:
          "text-amber-700",

        iconeContainerClassName:
          "border-amber-200 bg-amber-50",

        Icone:
          Clock3,
      },
    ];
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            {titulo}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {descricao}
          </p>
        </div>

        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {total}{" "}
          {labelTotal}
        </span>
      </div>

      {total ===
      0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center text-center">
          <Activity className="h-10 w-10 text-slate-300" />

          <h3 className="mt-4 font-semibold text-slate-900">
            Nenhum registro cadastrado
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Os indicadores aparecerão quando houver registros cadastrados.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {dados.map(
            (
              item,
            ) => {
              const {
                Icone,
              } = item;

              return (
                <div
                  key={
                    item.nome
                  }
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.iconeContainerClassName}`}
                    >
                      <Icone
                        className={`h-4.5 w-4.5 ${item.iconeClassName}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.nome}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {item.descricao}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-lg font-bold text-slate-950">
                            {item.valor}
                          </p>

                          <p className="text-xs font-medium text-slate-500">
                            {item.percentual}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${item.barraClassName}`}
                          style={{
                            width: `${item.percentual}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}