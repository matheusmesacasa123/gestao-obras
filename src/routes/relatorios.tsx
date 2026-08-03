import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  TrendingUp,
} from "lucide-react";

import {
  supabase,
} from "@/integrations/supabase/client";

export const Route =
  createFileRoute(
    "/relatorios"
  )({
    component:
      Relatorios,
  });

type ObraRelatorio = {
  id: string;
  codigo: string | null;
  numero_proposta: string | null;
  revisao: number | null;
  vendedor: string | null;
  data_entrada: string | null;
  data_inicio: string | null;
  data_entrega_esperada: string | null;
  data_entrega: string | null;
  tipo_proposta: string | null;
  tipo_orcamentacao: string | null;
  complexidade: string | null;
  valor_orcado: number | null;
  custo_orcado: number | null;
  valor_vendido: number | null;
  custo_real: number | null;
};

type LinhaRelatorio = {
  nome: string;
  valores: Array<
    number | null
  >;
  anual: number | null;
  formato?:
    | "numero"
    | "percentual"
    | "dias"
    | "moeda";
};

const MESES = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const TIPOS_PROPOSTA = [
  "Preliminar",
  "Simplificado",
  "Detalhado",
];

const TIPOS_ORCAMENTACAO = [
  "Comp. Licitação",
  "Equipamentos",
  "ETA",
  "Industrial",
  "Licitação",
  "Sanitário",
  "Serviços",
];

function criarArrayMensal(
  valorInicial = 0
) {
  return Array.from(
    {
      length: 12,
    },
    () =>
      valorInicial
  );
}

function diferencaDias(
  dataFinal?: string | null,
  dataInicial?: string | null
) {
  if (
    !dataFinal ||
    !dataInicial
  ) {
    return null;
  }

  const final =
    new Date(
      `${dataFinal}T12:00:00`
    );

  const inicial =
    new Date(
      `${dataInicial}T12:00:00`
    );

  const diferenca =
    final.getTime() -
    inicial.getTime();

  return Math.round(
    diferenca /
      (
        1000 *
        60 *
        60 *
        24
      )
  );
}

function obterMes(
  data?: string | null
) {
  if (!data) {
    return null;
  }

  const partes =
    data.split(
      "-"
    );

  const mes =
    Number(
      partes[1]
    ) -
    1;

  if (
    Number.isNaN(
      mes
    ) ||
    mes < 0 ||
    mes > 11
  ) {
    return null;
  }

  return mes;
}

function obterAno(
  data?: string | null
) {
  if (!data) {
    return null;
  }

  const ano =
    Number(
      data.split(
        "-"
      )[0]
    );

  return Number.isNaN(
    ano
  )
    ? null
    : ano;
}

function media(
  valores: number[]
) {
  if (
    valores.length ===
    0
  ) {
    return 0;
  }

  return (
    valores.reduce(
      (
        total,
        valor
      ) =>
        total +
        valor,
      0
    ) /
    valores.length
  );
}

function arredondar(
  valor: number,
  casas = 1
) {
  const fator =
    10 ** casas;

  return (
    Math.round(
      valor *
        fator
    ) /
    fator
  );
}

function formatarValor(
  valor: number | null,
  formato:
    | "numero"
    | "percentual"
    | "dias"
    | "moeda" =
    "numero"
) {
  if (
    valor ===
      null ||
    Number.isNaN(
      valor
    )
  ) {
    return "—";
  }

  if (
    formato ===
    "percentual"
  ) {
    return `${valor.toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          1,
        maximumFractionDigits:
          1,
      }
    )}%`;
  }

  if (
    formato ===
    "dias"
  ) {
    return valor.toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          1,
        maximumFractionDigits:
          1,
      }
    );
  }

  if (
    formato ===
    "moeda"
  ) {
    return valor.toLocaleString(
      "pt-BR",
      {
        style:
          "currency",
        currency:
          "BRL",
        minimumFractionDigits:
          2,
      }
    );
  }

  return valor.toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits:
        0,
    }
  );
}

function somar(
  valores: number[]
) {
  return valores.reduce(
    (
      total,
      valor
    ) =>
      total +
      valor,
    0
  );
}

function Relatorios() {
  const anoAtual =
    new Date().getFullYear();

  const [
    anoSelecionado,
    setAnoSelecionado,
  ] = useState(
    anoAtual
  );

  const [
    obras,
    setObras,
  ] = useState<ObraRelatorio[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    erro,
    setErro,
  ] = useState("");

  useEffect(() => {
    async function carregarRelatorio() {
      try {
        setLoading(
          true
        );

        setErro("");

        const inicioAno =
          `${anoSelecionado}-01-01`;

        const fimAno =
          `${anoSelecionado}-12-31`;

        const {
          data,
          error,
        } = await supabase
          .from(
            "obras"
          )
          .select(`
            id,
            codigo,
            numero_proposta,
            revisao,
            vendedor,
            data_entrada,
            data_inicio,
            data_entrega_esperada,
            data_entrega,
            tipo_proposta,
            tipo_orcamentacao,
            complexidade,
            valor_orcado,
            custo_orcado,
            valor_vendido,
            custo_real
          `)
          .or(
            `and(data_entrada.gte.${inicioAno},data_entrada.lte.${fimAno}),and(data_entrega.gte.${inicioAno},data_entrega.lte.${fimAno})`
          );

        if (error) {
          throw error;
        }

        setObras(
          (
            data ??
            []
          ) as ObraRelatorio[]
        );
      } catch (error) {
        console.error(
          "Erro ao carregar relatório:",
          error
        );

        setErro(
          "Não foi possível carregar os indicadores."
        );
      } finally {
        setLoading(
          false
        );
      }
    }

    carregarRelatorio();
  }, [
    anoSelecionado,
  ]);

  const relatorio =
    useMemo(
      () => {
        const recebidas =
          criarArrayMensal();

        const entregues =
          criarArrayMensal();

        const originais =
          criarArrayMensal();

        const revisoes =
          criarArrayMensal();

        const noPrazo =
          criarArrayMensal();

        const atrasadas =
          criarArrayMensal();

        const semPrazo =
          criarArrayMensal();

        const propostasBaixa =
          criarArrayMensal();

        const propostasMedia =
          criarArrayMensal();

        const propostasAlta =
          criarArrayMensal();

        const tipoProposta =
          new Map<
            string,
            number[]
          >();

        const tipoOrcamentacao =
          new Map<
            string,
            number[]
          >();

        TIPOS_PROPOSTA.forEach(
          (
            tipo
          ) => {
            tipoProposta.set(
              tipo,
              criarArrayMensal()
            );
          }
        );

        TIPOS_ORCAMENTACAO.forEach(
          (
            tipo
          ) => {
            tipoOrcamentacao.set(
              tipo,
              criarArrayMensal()
            );
          }
        );

        const leadTimes =
          Array.from(
            {
              length: 12,
            },
            () =>
              [] as number[]
          );

        const atrasos =
          Array.from(
            {
              length: 12,
            },
            () =>
              [] as number[]
          );

        const filas =
          Array.from(
            {
              length: 12,
            },
            () =>
              [] as number[]
          );

        const temposGerais =
          Array.from(
            {
              length: 12,
            },
            () =>
              [] as number[]
          );

        const temposBaixa =
          Array.from(
            {
              length: 12,
            },
            () =>
              [] as number[]
          );

        const temposMedia =
          Array.from(
            {
              length: 12,
            },
            () =>
              [] as number[]
          );

        const temposAlta =
          Array.from(
            {
              length: 12,
            },
            () =>
              [] as number[]
          );

        const valoresVendidos =
          criarArrayMensal();

        const margensOrcadas =
          Array.from(
            {
              length: 12,
            },
            () =>
              [] as number[]
          );

        const margensRealizadas =
          Array.from(
            {
              length: 12,
            },
            () =>
              [] as number[]
          );

        obras.forEach(
          (
            obra
          ) => {
            if (
              obterAno(
                obra.data_entrada
              ) ===
              anoSelecionado
            ) {
              const mesEntrada =
                obterMes(
                  obra.data_entrada
                );

              if (
                mesEntrada !==
                null
              ) {
                recebidas[
                  mesEntrada
                ] += 1;
              }
            }

            if (
              obterAno(
                obra.data_entrega
              ) !==
              anoSelecionado
            ) {
              return;
            }

            const mesEntrega =
              obterMes(
                obra.data_entrega
              );

            if (
              mesEntrega ===
              null
            ) {
              return;
            }

            entregues[
              mesEntrega
            ] += 1;

            if (
              (
                obra.revisao ??
                0
              ) ===
              0
            ) {
              originais[
                mesEntrega
              ] += 1;
            } else {
              revisoes[
                mesEntrega
              ] += 1;
            }

            if (
              !obra.data_entrega_esperada
            ) {
              semPrazo[
                mesEntrega
              ] += 1;
            } else {
              const atraso =
                diferencaDias(
                  obra.data_entrega,
                  obra.data_entrega_esperada
                );

              if (
                atraso !==
                  null &&
                atraso >
                  0
              ) {
                atrasadas[
                  mesEntrega
                ] += 1;

                atrasos[
                  mesEntrega
                ].push(
                  atraso
                );
              } else {
                noPrazo[
                  mesEntrega
                ] += 1;
              }

              const leadTime =
                diferencaDias(
                  obra.data_entrega,
                  obra.data_inicio
                );

              if (
                leadTime !==
                  null &&
                leadTime >=
                  0
              ) {
                leadTimes[
                  mesEntrega
                ].push(
                  leadTime
                );
              }
            }

            const fila =
              diferencaDias(
                obra.data_inicio,
                obra.data_entrada
              );

            if (
              fila !==
                null &&
              fila >=
                0
            ) {
              filas[
                mesEntrega
              ].push(
                fila
              );
            }

            const tempoGeral =
              diferencaDias(
                obra.data_entrega,
                obra.data_entrada
              );

            if (
              tempoGeral !==
                null &&
              tempoGeral >=
                0
            ) {
              temposGerais[
                mesEntrega
              ].push(
                tempoGeral
              );

              const complexidade =
                obra.complexidade
                  ?.trim()
                  .toLowerCase();

              if (
                complexidade ===
                "baixa"
              ) {
                propostasBaixa[
                  mesEntrega
                ] += 1;

                temposBaixa[
                  mesEntrega
                ].push(
                  tempoGeral
                );
              } else if (
                complexidade ===
                "média" ||
                complexidade ===
                "media"
              ) {
                propostasMedia[
                  mesEntrega
                ] += 1;

                temposMedia[
                  mesEntrega
                ].push(
                  tempoGeral
                );
              } else if (
                complexidade ===
                "alta"
              ) {
                propostasAlta[
                  mesEntrega
                ] += 1;

                temposAlta[
                  mesEntrega
                ].push(
                  tempoGeral
                );
              }
            }

            const proposta =
              obra.tipo_proposta?.trim() ||
              "Não informado";

            if (
              !tipoProposta.has(
                proposta
              )
            ) {
              tipoProposta.set(
                proposta,
                criarArrayMensal()
              );
            }

            tipoProposta.get(
              proposta
            )![mesEntrega] += 1;

            const orcamentacao =
              obra.tipo_orcamentacao?.trim() ||
              "Não informado";

            if (
              !tipoOrcamentacao.has(
                orcamentacao
              )
            ) {
              tipoOrcamentacao.set(
                orcamentacao,
                criarArrayMensal()
              );
            }

            tipoOrcamentacao.get(
              orcamentacao
            )![mesEntrega] += 1;

            if (
              obra.valor_vendido !==
                null &&
              obra.valor_vendido !==
                undefined
            ) {
              valoresVendidos[
                mesEntrega
              ] +=
                Number(
                  obra.valor_vendido
                ) ||
                0;
            }

            if (
              obra.valor_orcado &&
              obra.valor_orcado >
                0 &&
              obra.custo_orcado !==
                null
            ) {
              margensOrcadas[
                mesEntrega
              ].push(
                (
                  (
                    obra.valor_orcado -
                    obra.custo_orcado
                  ) /
                  obra.valor_orcado
                ) *
                  100
              );
            }

            if (
              obra.valor_vendido &&
              obra.valor_vendido >
                0 &&
              obra.custo_real !==
                null
            ) {
              margensRealizadas[
                mesEntrega
              ].push(
                (
                  (
                    obra.valor_vendido -
                    obra.custo_real
                  ) /
                  obra.valor_vendido
                ) *
                  100
              );
            }
          }
        );

        const taxaAtraso =
          criarArrayMensal().map(
            (
              _,
              indice
            ) => {
              const comPrazo =
                noPrazo[
                  indice
                ] +
                atrasadas[
                  indice
                ];

              return comPrazo >
                0
                ? arredondar(
                    (
                      atrasadas[
                        indice
                      ] /
                      comPrazo
                    ) *
                      100
                  )
                : 0;
            }
          );

        const mediasMensais = (
          grupos: number[][]
        ) =>
          grupos.map(
            (
              grupo
            ) =>
              arredondar(
                media(
                  grupo
                )
              )
          );

        const valoresAnuais = (
          grupos: number[][]
        ) =>
          arredondar(
            media(
              grupos.flat()
            )
          );

        const totalComPrazo =
          somar(
            noPrazo
          ) +
          somar(
            atrasadas
          );

        const taxaAtrasoAnual =
          totalComPrazo >
          0
            ? arredondar(
                (
                  somar(
                    atrasadas
                  ) /
                  totalComPrazo
                ) *
                  100
              )
            : 0;

        return {
          recebidas,
          entregues,
          originais,
          revisoes,
          noPrazo,
          atrasadas,
          semPrazo,
          taxaAtraso,
          leadTime:
            mediasMensais(
              leadTimes
            ),
          atrasoMedio:
            mediasMensais(
              atrasos
            ),
          filaMedia:
            mediasMensais(
              filas
            ),
          tempoGeral:
            mediasMensais(
              temposGerais
            ),
          tempoBaixa:
            mediasMensais(
              temposBaixa
            ),
          tempoMedia:
            mediasMensais(
              temposMedia
            ),
          tempoAlta:
            mediasMensais(
              temposAlta
            ),
          propostasBaixa,
          propostasMedia,
          propostasAlta,
          tipoProposta,
          tipoOrcamentacao,
          valoresVendidos,
          margemOrcada:
            mediasMensais(
              margensOrcadas
            ),
          margemRealizada:
            mediasMensais(
              margensRealizadas
            ),
          anuais: {
            recebidas:
              somar(
                recebidas
              ),
            entregues:
              somar(
                entregues
              ),
            originais:
              somar(
                originais
              ),
            revisoes:
              somar(
                revisoes
              ),
            noPrazo:
              somar(
                noPrazo
              ),
            atrasadas:
              somar(
                atrasadas
              ),
            semPrazo:
              somar(
                semPrazo
              ),
            taxaAtraso:
              taxaAtrasoAnual,
            leadTime:
              valoresAnuais(
                leadTimes
              ),
            atrasoMedio:
              valoresAnuais(
                atrasos
              ),
            filaMedia:
              valoresAnuais(
                filas
              ),
            tempoGeral:
              valoresAnuais(
                temposGerais
              ),
            tempoBaixa:
              valoresAnuais(
                temposBaixa
              ),
            tempoMedia:
              valoresAnuais(
                temposMedia
              ),
            tempoAlta:
              valoresAnuais(
                temposAlta
              ),
            baixa:
              somar(
                propostasBaixa
              ),
            media:
              somar(
                propostasMedia
              ),
            alta:
              somar(
                propostasAlta
              ),
            valorVendido:
              somar(
                valoresVendidos
              ),
            margemOrcada:
              valoresAnuais(
                margensOrcadas
              ),
            margemRealizada:
              valoresAnuais(
                margensRealizadas
              ),
          },
        };
      },
      [
        obras,
        anoSelecionado,
      ]
    );

  const anos =
    Array.from(
      {
        length: 6,
      },
      (
        _,
        indice
      ) =>
        anoAtual -
        3 +
        indice
    );

  const linhasVolume: LinhaRelatorio[] = [
    {
      nome:
        "Total de propostas recebidas para cotação",
      valores:
        relatorio.recebidas,
      anual:
        relatorio.anuais.recebidas,
    },
    {
      nome:
        "Total de propostas entregues",
      valores:
        relatorio.entregues,
      anual:
        relatorio.anuais.entregues,
    },
    {
      nome:
        "Propostas originais entregues (Rev = 0)",
      valores:
        relatorio.originais,
      anual:
        relatorio.anuais.originais,
    },
    {
      nome:
        "Revisões entregues (Rev ≥ 1)",
      valores:
        relatorio.revisoes,
      anual:
        relatorio.anuais.revisoes,
    },
    {
      nome:
        "Entregues no prazo",
      valores:
        relatorio.noPrazo,
      anual:
        relatorio.anuais.noPrazo,
    },
    {
      nome:
        "Entregues com atraso",
      valores:
        relatorio.atrasadas,
      anual:
        relatorio.anuais.atrasadas,
    },
    {
      nome:
        "Entregues sem prazo esperado",
      valores:
        relatorio.semPrazo,
      anual:
        relatorio.anuais.semPrazo,
    },
  ];

  const linhasDesempenho: LinhaRelatorio[] = [
    {
      nome:
        "Taxa de atraso",
      valores:
        relatorio.taxaAtraso,
      anual:
        relatorio.anuais.taxaAtraso,
      formato:
        "percentual",
    },
    {
      nome:
        "Lead time médio — início até entrega, apenas com prazo formal",
      valores:
        relatorio.leadTime,
      anual:
        relatorio.anuais.leadTime,
      formato:
        "dias",
    },
    {
      nome:
        "Atraso médio — apenas propostas entregues com atraso",
      valores:
        relatorio.atrasoMedio,
      anual:
        relatorio.anuais.atrasoMedio,
      formato:
        "dias",
    },
    {
      nome:
        "Tempo de fila médio — entrada até início",
      valores:
        relatorio.filaMedia,
      anual:
        relatorio.anuais.filaMedia,
      formato:
        "dias",
    },
    {
      nome:
        "Média de dias geral — entrada até entrega",
      valores:
        relatorio.tempoGeral,
      anual:
        relatorio.anuais.tempoGeral,
      formato:
        "dias",
    },
    {
      nome:
        "Média de dias — Baixa",
      valores:
        relatorio.tempoBaixa,
      anual:
        relatorio.anuais.tempoBaixa,
      formato:
        "dias",
    },
    {
      nome:
        "Média de dias — Média",
      valores:
        relatorio.tempoMedia,
      anual:
        relatorio.anuais.tempoMedia,
      formato:
        "dias",
    },
    {
      nome:
        "Média de dias — Alta",
      valores:
        relatorio.tempoAlta,
      anual:
        relatorio.anuais.tempoAlta,
      formato:
        "dias",
    },
  ];

  const linhasComplexidade: LinhaRelatorio[] = [
    {
      nome:
        "Propostas Baixa",
      valores:
        relatorio.propostasBaixa,
      anual:
        relatorio.anuais.baixa,
    },
    {
      nome:
        "Propostas Média",
      valores:
        relatorio.propostasMedia,
      anual:
        relatorio.anuais.media,
    },
    {
      nome:
        "Propostas Alta",
      valores:
        relatorio.propostasAlta,
      anual:
        relatorio.anuais.alta,
    },
    {
      nome:
        "TOTAL",
      valores:
        relatorio.entregues,
      anual:
        relatorio.anuais.entregues,
    },
  ];

  const linhasTipoProposta: LinhaRelatorio[] = [
    ...TIPOS_PROPOSTA.map(
      (
        nome
      ) => {
        const valores =
          relatorio.tipoProposta.get(
            nome
          ) ||
          criarArrayMensal();

        return {
          nome,
          valores,
          anual:
            somar(
              valores
            ),
        };
      }
    ),

    ...Array.from(
      relatorio.tipoProposta.entries()
    )
      .filter(
        ([
          nome,
        ]) =>
          !TIPOS_PROPOSTA.includes(
            nome
          )
      )
      .sort(
        (
          entradaA,
          entradaB
        ) =>
          entradaA[0].localeCompare(
            entradaB[0],
            "pt-BR"
          )
      )
      .map(
        ([
          nome,
          valores,
        ]) => ({
          nome,
          valores,
          anual:
            somar(
              valores
            ),
        })
      ),
  ];

  const linhasTipoOrcamentacao: LinhaRelatorio[] = [
    ...TIPOS_ORCAMENTACAO.map(
      (
        nome
      ) => {
        const valores =
          relatorio.tipoOrcamentacao.get(
            nome
          ) ||
          criarArrayMensal();

        return {
          nome,
          valores,
          anual:
            somar(
              valores
            ),
        };
      }
    ),

    ...Array.from(
      relatorio.tipoOrcamentacao.entries()
    )
      .filter(
        ([
          nome,
        ]) =>
          !TIPOS_ORCAMENTACAO.includes(
            nome
          )
      )
      .sort(
        (
          entradaA,
          entradaB
        ) =>
          entradaA[0].localeCompare(
            entradaB[0],
            "pt-BR"
          )
      )
      .map(
        ([
          nome,
          valores,
        ]) => ({
          nome,
          valores,
          anual:
            somar(
              valores
            ),
        })
      ),
  ];

  const linhasFinanceiras: LinhaRelatorio[] = [
    {
      nome:
        "Valor vendido cadastrado",
      valores:
        relatorio.valoresVendidos,
      anual:
        relatorio.anuais.valorVendido,
      formato:
        "moeda",
    },
    {
      nome:
        "Margem orçada média",
      valores:
        relatorio.margemOrcada,
      anual:
        relatorio.anuais.margemOrcada,
      formato:
        "percentual",
    },
    {
      nome:
        "Margem realizada média",
      valores:
        relatorio.margemRealizada,
      anual:
        relatorio.anuais.margemRealizada,
      formato:
        "percentual",
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          Carregando relatório...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Relatórios
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Painel de indicadores da Engenharia Comercial.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="ano-relatorio"
            className="block text-sm font-semibold text-gray-700"
          >
            Ano do relatório
          </label>

          <select
            id="ano-relatorio"
            value={
              anoSelecionado
            }
            onChange={(
              event
            ) =>
              setAnoSelecionado(
                Number(
                  event.target.value
                )
              )
            }
            className="h-11 rounded-xl border bg-white px-4 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {anos.map(
              (
                ano
              ) => (
                <option
                  key={
                    ano
                  }
                  value={
                    ano
                  }
                >
                  {
                    ano
                  }
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {
            erro
          }
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IndicadorCard
          titulo="Propostas recebidas"
          valor={
            relatorio.anuais.recebidas.toLocaleString(
              "pt-BR"
            )
          }
          descricao={`Entradas registradas em ${anoSelecionado}`}
          icon={
            FileText
          }
        />

        <IndicadorCard
          titulo="Propostas entregues"
          valor={
            relatorio.anuais.entregues.toLocaleString(
              "pt-BR"
            )
          }
          descricao="Obras com data de entrega preenchida"
          icon={
            CheckCircle2
          }
        />

        <IndicadorCard
          titulo="Taxa de atraso"
          valor={formatarValor(
            relatorio.anuais.taxaAtraso,
            "percentual"
          )}
          descricao="Entre propostas entregues com prazo formal"
          icon={
            Clock3
          }
        />

        <IndicadorCard
          titulo="Valor vendido cadastrado"
          valor={formatarValor(
            relatorio.anuais.valorVendido,
            "moeda"
          )}
          descricao="Soma dos valores vendidos nas propostas entregues"
          icon={
            TrendingUp
          }
        />
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-emerald-600" />

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Painel de indicadores — Engenharia Comercial |{" "}
              {
                anoSelecionado
              }
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Os indicadores mensais consideram o mês da entrada ou da entrega, conforme cada linha.
            </p>
          </div>
        </div>
      </div>

      <TabelaIndicadores
        titulo="Volume"
        linhas={
          linhasVolume
        }
      />

      <TabelaIndicadores
        titulo="Desempenho do time"
        linhas={
          linhasDesempenho
        }
      />

      <TabelaIndicadores
        titulo="Tipos de complexidade"
        linhas={
          linhasComplexidade
        }
      />

      <TabelaIndicadores
        titulo="Tipo de orçamentação"
        linhas={[
          ...linhasTipoOrcamentacao,
          {
            nome:
              "TOTAL",
            valores:
              relatorio.entregues,
            anual:
              relatorio.anuais.entregues,
          },
        ]}
      />

      <TabelaIndicadores
        titulo="Tipo de proposta"
        linhas={[
          ...linhasTipoProposta,
          {
            nome:
              "TOTAL",
            valores:
              relatorio.entregues,
            anual:
              relatorio.anuais.entregues,
          },
        ]}
      />

      <TabelaIndicadores
        titulo="Indicadores financeiros cadastrados"
        linhas={
          linhasFinanceiras
        }
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 text-amber-700" />

          <div>
            <h3 className="font-bold text-amber-900">
              Fechamento comercial ainda não incluído
            </h3>

            <p className="mt-1 text-sm text-amber-800">
              A tabela atual não possui resultado comercial nem data de fechamento. Por isso, propostas fechadas, taxa de conversão e ticket médio não são calculados para evitar resultados incorretos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type IndicadorCardProps = {
  titulo: string;
  valor: string;
  descricao: string;
  icon:
    React.ComponentType<{
      className?: string;
    }>;
};

function IndicadorCard({
  titulo,
  valor,
  descricao,
  icon: Icon,
}: IndicadorCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {
              titulo
            }
          </p>

          <strong className="mt-2 block text-2xl font-bold text-gray-900">
            {
              valor
            }
          </strong>
        </div>

        <div className="rounded-xl bg-emerald-50 p-2.5">
          <Icon className="h-5 w-5 text-emerald-600" />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {
          descricao
        }
      </p>
    </div>
  );
}

type TabelaIndicadoresProps = {
  titulo: string;
  linhas: LinhaRelatorio[];
};

function TabelaIndicadores({
  titulo,
  linhas,
}: TabelaIndicadoresProps) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b bg-slate-900 px-5 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white">
          {
            titulo
          }
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1350px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-600">
              <th className="sticky left-0 z-10 min-w-[330px] border-r bg-gray-50 px-4 py-3 text-left">
                Indicador
              </th>

              {MESES.map(
                (
                  mes,
                  indice
                ) => (
                  <th
                    key={
                      mes
                    }
                    title={
                      NOMES_MESES[
                        indice
                      ]
                    }
                    className="min-w-[72px] px-3 py-3 text-center"
                  >
                    {
                      mes
                    }
                  </th>
                )
              )}

              <th className="min-w-[100px] border-l bg-emerald-50 px-4 py-3 text-center text-emerald-800">
                Anual
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {linhas.map(
              (
                linha
              ) => (
                <tr
                  key={
                    linha.nome
                  }
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="sticky left-0 z-10 border-r bg-white px-4 py-3 font-medium text-gray-800">
                    {
                      linha.nome
                    }
                  </td>

                  {linha.valores.map(
                    (
                      valor,
                      indice
                    ) => (
                      <td
                        key={`${linha.nome}-${indice}`}
                        className="px-3 py-3 text-center tabular-nums text-gray-700"
                      >
                        {formatarValor(
                          valor,
                          linha.formato
                        )}
                      </td>
                    )
                  )}

                  <td className="border-l bg-emerald-50 px-4 py-3 text-center font-bold tabular-nums text-emerald-900">
                    {formatarValor(
                      linha.anual,
                      linha.formato
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}