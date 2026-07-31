import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import type {
  Obra,
} from "@/features/obras/types";

interface Props {
  obras: Obra[];
}

type StatusItem = {
  nome: string;
  descricao: string;
  valor: number;
  percentual: number;
  barraClassName: string;
  iconeClassName: string;
  iconeContainerClassName: string;
  Icone: typeof Activity;
};

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
) {
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

function obraFinalizadaComAtraso(
  obra: Obra
) {
  if (
    !obraEstaConcluida(
      obra
    ) ||
    !obra.data_entrega ||
    !obra.data_entrega_esperada
  ) {
    return false;
  }

  const dataEsperada =
    criarDataLocal(
      obra.data_entrega_esperada
    );

  const dataReal =
    criarDataLocal(
      obra.data_entrega
    );

  if (
    !dataEsperada ||
    !dataReal
  ) {
    return false;
  }

  return (
    dataReal >
    dataEsperada
  );
}

export function StatusObrasChart({
  obras,
}: Props) {
  const totalObras =
    obras.length;

  const andamento =
    obras.filter(
      (
        obra
      ) =>
        !obraEstaConcluida(
          obra
        )
    ).length;

  const concluidas =
    obras.filter(
      obraEstaConcluida
    ).length;

  const atrasadas =
    obras.filter(
      obraEstaAtrasada
    ).length;

  const finalizadasComAtraso =
    obras.filter(
      obraFinalizadaComAtraso
    ).length;

  function calcularPercentual(
    valor: number
  ) {
    if (
      totalObras ===
      0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (
          valor /
          totalObras
        ) *
          100
      )
    );
  }

  const dados: StatusItem[] = [
    {
      nome:
        "Em andamento",

      descricao:
        "Obras ainda em execução",

      valor:
        andamento,

      percentual:
        calcularPercentual(
          andamento
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
        "Concluídas",

      descricao:
        "Obras finalizadas",

      valor:
        concluidas,

      percentual:
        calcularPercentual(
          concluidas
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
        "Atrasadas",

      descricao:
        "Obras abertas fora do prazo",

      valor:
        atrasadas,

      percentual:
        calcularPercentual(
          atrasadas
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
        "Finalizadas com atraso",

      descricao:
        "Entregues após a data prevista",

      valor:
        finalizadasComAtraso,

      percentual:
        calcularPercentual(
          finalizadasComAtraso
        ),

      barraClassName:
        "bg-amber-500",

      iconeClassName:
        "text-amber-600",

      iconeContainerClassName:
        "border-amber-100 bg-amber-50",

      Icone:
        Clock3,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            Status das obras
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Distribuição das obras por situação.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {totalObras}{" "}
          {totalObras === 1
            ? "obra"
            : "obras"}
        </span>
      </div>

      {totalObras ===
      0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center text-center">
          <Activity className="h-10 w-10 text-slate-300" />

          <h3 className="mt-4 font-semibold text-slate-900">
            Nenhuma obra cadastrada
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Os indicadores aparecerão quando houver obras cadastradas.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {dados.map(
            (
              item
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
            }
          )}
        </div>
      )}
    </section>
  );
}