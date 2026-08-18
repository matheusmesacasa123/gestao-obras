import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

import {
  createFileRoute,
} from '@tanstack/react-router'

import {
  ArrowLeft,
  CheckCircle2,
  FilePlus2,
  FileSpreadsheet,
  History,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react'

import {
  Button,
} from '@/components/ui/button'

import {
  EditorItensComerciais,
} from '@/features/obras/orcamento-planilha/components/editor-itens-comerciais'

import {
  SeletorDemandasRevisao,
} from '@/features/obras/orcamento-planilha/components/seletor-demandas-revisao'

import {
  buscarImportacaoPorRevisao,
  buscarProximoNumeroRevisao,
  listarRevisoesOrcamento,
  salvarImportacaoPlanilha,
} from '@/features/obras/orcamento-planilha/services/orcamento-planilha-service'

import * as planilhaParser from '@/features/obras/orcamento-planilha/services/planilha-orcamentaria-parser'

import type {
  ImportacaoOrcamentoSalva,
  PreviewPlanilhaOrcamentaria,
  ResumoRevisaoOrcamento,
} from '@/features/obras/orcamento-planilha/types'

export const Route = createFileRoute(
  '/_authenticated/obras/$id/orcamento',
)({
  component: OrcamentoPlanilhaPage,
})

type FuncaoParser = (
  arquivo: File,
) => Promise<PreviewPlanilhaOrcamentaria>

function obterParser(): FuncaoParser {
  const modulo =
    planilhaParser as Record<
      string,
      unknown
    >

  const nomesPossiveis = [
    'processarPlanilhaOrcamentaria',
    'lerPlanilhaOrcamentaria',
    'analisarPlanilhaOrcamentaria',
    'parsePlanilhaOrcamentaria',
  ]

  for (
    const nome
    of nomesPossiveis
  ) {
    const funcao =
      modulo[nome]

    if (
      typeof funcao ===
      'function'
    ) {
      return funcao as FuncaoParser
    }
  }

  throw new Error(
    'Não foi encontrada a função de leitura da planilha orçamentária.',
  )
}

function formatarMoeda(
  valor: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  ).format(
    Number(valor || 0),
  )
}

function formatarNumero(
  valor: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      maximumFractionDigits: 4,
    },
  ).format(
    Number(valor || 0),
  )
}

function formatarData(
  valor: string | null | undefined,
) {
  if (!valor) {
    return '—'
  }

  const data =
    new Date(valor)

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return valor
  }

  return data.toLocaleDateString(
    'pt-BR',
  )
}

function formatarDataHora(
  valor: string | null | undefined,
) {
  if (!valor) {
    return '—'
  }

  const data =
    new Date(valor)

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return valor
  }

  return data.toLocaleString(
    'pt-BR',
  )
}

function formatarRevisao(
  numeroRevisao: number,
) {
  return `REV ${numeroRevisao
    .toString()
    .padStart(
      2,
      '0',
    )}`
}

function normalizarRevisaoPlanilha(
  revisao: string | null,
) {
  if (!revisao) {
    return null
  }

  const apenasNumeros =
    revisao.replace(
      /\D/g,
      '',
    )

  if (!apenasNumeros) {
    return null
  }

  return Number(
    apenasNumeros,
  )
}

function OrcamentoPlanilhaPage() {
  const {
    id: orcamentoId,
  } = Route.useParams()

  const inputArquivoRef =
    useRef<HTMLInputElement>(
      null,
    )

  const [
    revisoes,
    setRevisoes,
  ] = useState<
    ResumoRevisaoOrcamento[]
  >([])

  const [
    revisaoSelecionadaId,
    setRevisaoSelecionadaId,
  ] = useState<
    string | null
  >(null)

  const [
    importacaoSalva,
    setImportacaoSalva,
  ] = useState<
    ImportacaoOrcamentoSalva | null
  >(null)

  const [
    carregandoPagina,
    setCarregandoPagina,
  ] = useState(true)

  const [
    carregandoRevisao,
    setCarregandoRevisao,
  ] = useState(false)

  const [
    modoNovaRevisao,
    setModoNovaRevisao,
  ] = useState(false)

  const [
    arquivo,
    setArquivo,
  ] = useState<File | null>(
    null,
  )

  const [
    preview,
    setPreview,
  ] = useState<
    PreviewPlanilhaOrcamentaria | null
  >(null)

  const [
    nomeAbaSelecionada,
    setNomeAbaSelecionada,
  ] = useState('')

  const [
    processandoArquivo,
    setProcessandoArquivo,
  ] = useState(false)

  const [
    salvandoImportacao,
    setSalvandoImportacao,
  ] = useState(false)

  const [
    numeroNovaRevisao,
    setNumeroNovaRevisao,
  ] = useState(0)

  const [
    motivoNovaRevisao,
    setMotivoNovaRevisao,
  ] = useState('')

  const [
    observacaoNovaRevisao,
    setObservacaoNovaRevisao,
  ] = useState('')

  const [
    demandaIdsNovaRevisao,
    setDemandaIdsNovaRevisao,
  ] = useState<string[]>([])

  const [
    chaveSeletorDemandas,
    setChaveSeletorDemandas,
  ] = useState(0)

  const [
    mensagemErro,
    setMensagemErro,
  ] = useState('')

  const [
    mensagemSucesso,
    setMensagemSucesso,
  ] = useState('')

  const carregarResumos =
    useCallback(
      async () => {
        const resultado =
          await listarRevisoesOrcamento(
            orcamentoId,
          )

        setRevisoes(
          resultado,
        )

        return resultado
      },
      [
        orcamentoId,
      ],
    )

  const carregarPagina =
    useCallback(
      async (
        revisaoPreferidaId?: string,
      ) => {
        setCarregandoPagina(
          true,
        )

        setMensagemErro('')

        try {
          const resultado =
            await listarRevisoesOrcamento(
              orcamentoId,
            )

          setRevisoes(
            resultado,
          )

          if (
            resultado.length ===
            0
          ) {
            setRevisaoSelecionadaId(
              null,
            )

            setImportacaoSalva(
              null,
            )

            setNumeroNovaRevisao(
              0,
            )

            setModoNovaRevisao(
              true,
            )

            return
          }

          const revisaoPreferida =
            revisaoPreferidaId
              ? resultado.find(
                  (item) =>
                    item.revisao.id ===
                    revisaoPreferidaId,
                )
              : null

          const revisaoAtiva =
            resultado.find(
              (item) =>
                item.revisao.status ===
                'ativa',
            )

          const primeiraComImportacao =
            resultado.find(
              (item) =>
                Boolean(
                  item.importacao,
                ),
            )

          const selecionada =
            revisaoPreferida ??
            revisaoAtiva ??
            primeiraComImportacao ??
            resultado[0]

          setRevisaoSelecionadaId(
            selecionada.revisao.id,
          )

          if (
            selecionada.importacao
          ) {
            const importacao =
              await buscarImportacaoPorRevisao(
                selecionada.revisao.id,
              )

            setImportacaoSalva(
              importacao,
            )
          } else {
            setImportacaoSalva(
              null,
            )
          }

          setModoNovaRevisao(
            false,
          )
        } catch (error) {
          setMensagemErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as revisões do orçamento.',
          )
        } finally {
          setCarregandoPagina(
            false,
          )
        }
      },
      [
        orcamentoId,
      ],
    )

  useEffect(() => {
    void carregarPagina()
  }, [carregarPagina])

  const revisaoSelecionada =
    useMemo(
      () =>
        revisoes.find(
          (item) =>
            item.revisao.id ===
            revisaoSelecionadaId,
        ) ?? null,
      [
        revisaoSelecionadaId,
        revisoes,
      ],
    )

  const abaSelecionada =
    useMemo(
      () =>
        preview?.abasComposicao.find(
          (aba) =>
            aba.nomeAba ===
            nomeAbaSelecionada,
        ) ?? null,
      [
        nomeAbaSelecionada,
        preview,
      ],
    )

  const resumoSalvo =
    useMemo(
      () => {
        const itens =
          importacaoSalva?.itens ??
          []

        return itens.reduce(
          (
            acumulador,
            item,
          ) => ({
            quantidadeItens:
              acumulador.quantidadeItens +
              1,

            custoTotal:
              acumulador.custoTotal +
              Number(
                item.custo_total ??
                  0,
              ),

            valorTotalVenda:
              acumulador.valorTotalVenda +
              Number(
                item.valor_venda ??
                  0,
              ),

            faturamentoKemia:
              acumulador.faturamentoKemia +
              Number(
                item.faturamento_kemia ??
                  0,
              ),

            faturamentoDireto:
              acumulador.faturamentoDireto +
              Number(
                item.faturamento_direto ??
                  0,
              ),
          }),
          {
            quantidadeItens: 0,
            custoTotal: 0,
            valorTotalVenda: 0,
            faturamentoKemia: 0,
            faturamentoDireto: 0,
          },
        )
      },
      [
        importacaoSalva,
      ],
    )

  async function selecionarRevisao(
    revisaoId: string,
  ) {
    setCarregandoRevisao(
      true,
    )

    setMensagemErro('')
    setMensagemSucesso('')

    try {
      const importacao =
        await buscarImportacaoPorRevisao(
          revisaoId,
        )

      setRevisaoSelecionadaId(
        revisaoId,
      )

      setImportacaoSalva(
        importacao,
      )

      setModoNovaRevisao(
        false,
      )
    } catch (error) {
      setMensagemErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a revisão.',
      )
    } finally {
      setCarregandoRevisao(
        false,
      )
    }
  }

  function limparFormularioImportacao() {
    setArquivo(null)
    setPreview(null)
    setNomeAbaSelecionada('')
    setMotivoNovaRevisao('')
    setObservacaoNovaRevisao('')
    setDemandaIdsNovaRevisao([])
    setMensagemErro('')
    setMensagemSucesso('')

    setChaveSeletorDemandas(
      (chaveAtual) =>
        chaveAtual + 1,
    )
  }

  async function iniciarNovaRevisao() {
    setMensagemErro('')
    setMensagemSucesso('')

    try {
      const proximoNumero =
        await buscarProximoNumeroRevisao(
          orcamentoId,
        )

      limparFormularioImportacao()

      setNumeroNovaRevisao(
        proximoNumero,
      )

      setModoNovaRevisao(
        true,
      )
    } catch (error) {
      setMensagemErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível preparar a nova revisão.',
      )
    }
  }

  function importarNaRevisaoSelecionada() {
    if (!revisaoSelecionada) {
      return
    }

    limparFormularioImportacao()

    setNumeroNovaRevisao(
      revisaoSelecionada.revisao.numero_revisao,
    )

    setMotivoNovaRevisao(
      revisaoSelecionada.revisao.motivo_revisao ??
        '',
    )

    setObservacaoNovaRevisao(
      revisaoSelecionada.revisao.observacao ??
        '',
    )

    setModoNovaRevisao(
      true,
    )
  }

  function cancelarNovaRevisao() {
    limparFormularioImportacao()

    setModoNovaRevisao(
      revisoes.length === 0,
    )
  }

  function abrirSeletorArquivo() {
    inputArquivoRef.current?.click()
  }

  async function processarPlanilha(
    novoArquivo: File,
  ) {
    setProcessandoArquivo(
      true,
    )

    setMensagemErro('')
    setMensagemSucesso('')

    try {
      const parser =
        obterParser()

      const resultado =
        await parser(
          novoArquivo,
        )

      const abaInicial =
        resultado.abaSugerida ??
        resultado.abasComposicao[0]
          ?.nomeAba ??
        ''

      setArquivo(
        novoArquivo,
      )

      setPreview(
        resultado,
      )

      setNomeAbaSelecionada(
        abaInicial,
      )

      const revisaoPlanilha =
        normalizarRevisaoPlanilha(
          resultado.dadosProposta.revisao,
        )

      const maiorRevisaoAtual =
        revisoes.reduce(
          (
            maior,
            item,
          ) =>
            Math.max(
              maior,
              item.revisao.numero_revisao,
            ),
          -1,
        )

      if (
        revisaoPlanilha !== null &&
        (
          revisoes.length === 0 ||
          revisaoPlanilha >
            maiorRevisaoAtual
        )
      ) {
        setNumeroNovaRevisao(
          revisaoPlanilha,
        )
      }
    } catch (error) {
      setArquivo(null)
      setPreview(null)
      setNomeAbaSelecionada('')

      setMensagemErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível interpretar a planilha selecionada.',
      )
    } finally {
      setProcessandoArquivo(
        false,
      )
    }
  }

  async function selecionarArquivo(
    evento:
      ChangeEvent<HTMLInputElement>,
  ) {
    const novoArquivo =
      evento.target.files?.[0]

    evento.target.value = ''

    if (!novoArquivo) {
      return
    }

    await processarPlanilha(
      novoArquivo,
    )
  }

  function limparArquivo() {
    setArquivo(null)
    setPreview(null)
    setNomeAbaSelecionada('')
    setMensagemErro('')
    setMensagemSucesso('')
  }

  async function salvarImportacao() {
    if (
      !preview ||
      !abaSelecionada
    ) {
      setMensagemErro(
        'Selecione uma planilha e uma aba de composição.',
      )

      return
    }

    if (
      numeroNovaRevisao >
        0 &&
      !motivoNovaRevisao.trim()
    ) {
      setMensagemErro(
        'Informe o motivo da nova revisão.',
      )

      return
    }

    setSalvandoImportacao(
      true,
    )

    setMensagemErro('')
    setMensagemSucesso('')

    try {
      const resultado =
        await salvarImportacaoPlanilha({
          orcamentoId,

          preview,

          nomeAba:
            abaSelecionada.nomeAba,

          numeroRevisao:
            numeroNovaRevisao,

          motivoRevisao:
            motivoNovaRevisao,

          observacaoRevisao:
            observacaoNovaRevisao,

          demandaIds:
            demandaIdsNovaRevisao,
        })

      await carregarPagina(
        resultado.revisaoId,
      )

      setArquivo(null)
      setPreview(null)
      setNomeAbaSelecionada('')
      setDemandaIdsNovaRevisao([])
      setModoNovaRevisao(false)

      setMensagemSucesso(
        `${formatarRevisao(
          resultado.numeroRevisao,
        )} salva com sucesso.`,
      )
    } catch (error) {
      setMensagemErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a revisão.',
      )
    } finally {
      setSalvandoImportacao(
        false,
      )
    }
  }

  if (carregandoPagina) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando orçamento...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <input
        ref={inputArquivoRef}
        type="file"
        accept=".xlsx,.xlsm,.xls"
        className="hidden"
        onChange={
          selecionarArquivo
        }
      />

      <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Orçamento
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Controle as revisões da planilha, os dados comerciais e as demandas vinculadas.
            </p>
          </div>

          {!modoNovaRevisao && (
            <Button
              type="button"
              onClick={() =>
                void iniciarNovaRevisao()
              }
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Nova revisão
            </Button>
          )}
        </div>
      </section>

      {mensagemErro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mensagemErro}
        </div>
      )}

      {mensagemSucesso && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />

          {mensagemSucesso}
        </div>
      )}

      {revisoes.length >
        0 && (
        <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-700" />

                <h2 className="text-lg font-semibold text-slate-900">
                  Histórico de revisões
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-600">
                Consulte os dados e os vínculos de qualquer revisão anterior.
              </p>
            </div>

            <label className="w-full lg:max-w-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Revisão selecionada
              </span>

              <select
                value={
                  revisaoSelecionadaId ??
                  ''
                }
                onChange={(evento) =>
                  void selecionarRevisao(
                    evento.target.value,
                  )
                }
                disabled={
                  carregandoRevisao ||
                  modoNovaRevisao
                }
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {revisoes.map(
                  (item) => (
                    <option
                      key={
                        item.revisao.id
                      }
                      value={
                        item.revisao.id
                      }
                    >
                      {formatarRevisao(
                        item.revisao.numero_revisao,
                      )}
                      {item.revisao.status ===
                      'ativa'
                        ? ' — Atual'
                        : ''}
                      {!item.importacao
                        ? ' — Sem planilha'
                        : ''}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {revisoes.map(
              (item) => {
                const selecionada =
                  item.revisao.id ===
                  revisaoSelecionadaId

                return (
                  <button
                    key={
                      item.revisao.id
                    }
                    type="button"
                    onClick={() =>
                      void selecionarRevisao(
                        item.revisao.id,
                      )
                    }
                    disabled={
                      carregandoRevisao ||
                      modoNovaRevisao
                    }
                    className={
                      selecionada
                        ? 'rounded-xl border border-slate-900 bg-slate-900 p-4 text-left text-white shadow-sm'
                        : 'rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-slate-900 transition hover:border-slate-400'
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        {formatarRevisao(
                          item.revisao.numero_revisao,
                        )}
                      </span>

                      {item.revisao.status ===
                        'ativa' && (
                        <span
                          className={
                            selecionada
                              ? 'rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white'
                              : 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700'
                          }
                        >
                          Atual
                        </span>
                      )}
                    </div>

                    <p
                      className={
                        selecionada
                          ? 'mt-2 text-xs text-slate-300'
                          : 'mt-2 text-xs text-slate-500'
                      }
                    >
                      {item.quantidadeItens}{' '}
                      {item.quantidadeItens ===
                      1
                        ? 'item'
                        : 'itens'}
                      {' · '}
                      {item.quantidadeDemandasVinculadas}{' '}
                      {item.quantidadeDemandasVinculadas ===
                      1
                        ? 'demanda'
                        : 'demandas'}
                    </p>

                    <p
                      className={
                        selecionada
                          ? 'mt-1 text-sm font-semibold text-white'
                          : 'mt-1 text-sm font-semibold text-slate-800'
                      }
                    >
                      {formatarMoeda(
                        item.valorVendaTotal,
                      )}
                    </p>
                  </button>
                )
              },
            )}
          </div>
        </section>
      )}

      {carregandoRevisao && (
        <section className="rounded-2xl border border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-700" />

          <p className="mt-3 text-sm text-slate-600">
            Carregando revisão...
          </p>
        </section>
      )}

      {!carregandoRevisao &&
        !modoNovaRevisao &&
        revisaoSelecionada &&
        importacaoSalva && (
          <>
            <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Composição importada
                    </p>

                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {formatarRevisao(
                        importacaoSalva.revisao.numero_revisao,
                      )}
                    </span>
                  </div>

                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    {importacaoSalva.nome_arquivo}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    Importada em{' '}
                    {formatarDataHora(
                      importacaoSalva.created_at,
                    )}
                  </p>

                  {importacaoSalva.revisao.motivo_revisao && (
                    <p className="mt-2 text-sm text-slate-600">
                      <strong>
                        Motivo:
                      </strong>{' '}
                      {importacaoSalva.revisao.motivo_revisao}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void carregarPagina(
                      importacaoSalva.revisao_id,
                    )
                  }
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <ResumoValor
                  titulo="Itens"
                  valor={String(
                    resumoSalvo.quantidadeItens,
                  )}
                />

                <ResumoValor
                  titulo="Custo total"
                  valor={formatarMoeda(
                    resumoSalvo.custoTotal,
                  )}
                />

                <ResumoValor
                  titulo="Faturamento Kemia"
                  valor={formatarMoeda(
                    resumoSalvo.faturamentoKemia,
                  )}
                />

                <ResumoValor
                  titulo="Faturamento direto"
                  valor={formatarMoeda(
                    resumoSalvo.faturamentoDireto,
                  )}
                />

                <ResumoValor
                  titulo="Valor total de venda"
                  valor={formatarMoeda(
                    resumoSalvo.valorTotalVenda,
                  )}
                  destaque
                />
              </div>
            </section>

            <SeletorDemandasRevisao
              key={
                importacaoSalva.revisao_id
              }
              orcamentoId={
                orcamentoId
              }
              revisaoId={
                importacaoSalva.revisao_id
              }
              onAtualizado={
                carregarResumos
              }
              titulo={`Demandas vinculadas à ${formatarRevisao(
                importacaoSalva.revisao.numero_revisao,
              )}`}
              descricao="Você pode incluir ou remover vínculos sem alterar a planilha importada."
            />

            <EditorItensComerciais
              importacao={
                importacaoSalva
              }
            />
          </>
        )}

      {!carregandoRevisao &&
        !modoNovaRevisao &&
        revisaoSelecionada &&
        !importacaoSalva && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {formatarRevisao(
                revisaoSelecionada.revisao.numero_revisao,
              )}{' '}
              ainda não possui planilha
            </h2>

            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Importe uma planilha para completar esta revisão.
            </p>

            <Button
              type="button"
              className="mt-6"
              onClick={
                importarNaRevisaoSelecionada
              }
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar planilha
            </Button>
          </section>
        )}

      {modoNovaRevisao && (
        <>
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {revisoes.length ===
                  0
                    ? 'Primeira revisão'
                    : 'Nova revisão'}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Informe a revisão, selecione a planilha e escolha as demandas relacionadas.
                </p>
              </div>

              {revisoes.length >
                0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    cancelarNovaRevisao
                  }
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              )}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Número da revisão
                </span>

                <input
                  type="number"
                  min={0}
                  step={1}
                  value={
                    numeroNovaRevisao
                  }
                  onChange={(evento) =>
                    setNumeroNovaRevisao(
                      Math.max(
                        0,
                        Number(
                          evento.target.value,
                        ),
                      ),
                    )
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-600"
                />

                <span className="mt-1 block text-xs text-slate-500">
                  Será salva como{' '}
                  {formatarRevisao(
                    numeroNovaRevisao,
                  )}.
                </span>
              </label>

              <label className="lg:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Motivo da revisão
                  {numeroNovaRevisao >
                    0 && (
                    <span className="text-red-600">
                      {' '}*
                    </span>
                  )}
                </span>

                <input
                  type="text"
                  value={
                    motivoNovaRevisao
                  }
                  disabled={
                    numeroNovaRevisao ===
                    0
                  }
                  onChange={(evento) =>
                    setMotivoNovaRevisao(
                      evento.target.value,
                    )
                  }
                  placeholder="Ex.: Alteração de escopo solicitada pelo cliente"
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>

              <label className="lg:col-span-3">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Observação da revisão
                </span>

                <textarea
                  value={
                    observacaoNovaRevisao
                  }
                  onChange={(evento) =>
                    setObservacaoNovaRevisao(
                      evento.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Informações adicionais sobre esta revisão..."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-600"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Planilha orçamentária
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Selecione o arquivo correspondente a esta revisão.
                </p>
              </div>

              <Button
                type="button"
                onClick={
                  abrirSeletorArquivo
                }
                disabled={
                  processandoArquivo
                }
              >
                {processandoArquivo ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}

                {preview
                  ? 'Selecionar outra planilha'
                  : 'Selecionar planilha'}
              </Button>
            </div>

            {processandoArquivo && (
              <div className="mt-6 flex min-h-32 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando planilha...
                </div>
              </div>
            )}

            {!processandoArquivo &&
              !preview && (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Upload className="mx-auto h-9 w-9 text-slate-400" />

                <p className="mt-3 font-medium text-slate-800">
                  Nenhuma planilha selecionada
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  A revisão poderá ser vinculada às demandas depois que a composição for selecionada.
                </p>
              </div>
            )}

            {!processandoArquivo &&
              preview && (
              <div className="mt-6 space-y-5">
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-end">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Arquivo selecionado
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {arquivo?.name ??
                        preview.nomeArquivo}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Revisão informada na planilha:{' '}
                      {preview.dadosProposta.revisao ??
                        'Não informada'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="min-w-64">
                      <span className="mb-1 block text-xs font-medium text-slate-600">
                        Aba de composição
                      </span>

                      <select
                        value={
                          nomeAbaSelecionada
                        }
                        onChange={(evento) =>
                          setNomeAbaSelecionada(
                            evento.target.value,
                          )
                        }
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-600"
                      >
                        {preview.abasComposicao.map(
                          (aba) => (
                            <option
                              key={
                                aba.nomeAba
                              }
                              value={
                                aba.nomeAba
                              }
                            >
                              {aba.nomeAba}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={
                        limparArquivo
                      }
                    >
                      Remover
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem
                    titulo="Número da proposta"
                    valor={
                      preview.dadosProposta.numeroProposta
                    }
                  />

                  <InfoItem
                    titulo="Revisão na planilha"
                    valor={
                      preview.dadosProposta.revisao
                    }
                  />

                  <InfoItem
                    titulo="Data"
                    valor={formatarData(
                      preview.dadosProposta.dataProposta,
                    )}
                  />

                  <InfoItem
                    titulo="Cliente"
                    valor={
                      preview.dadosProposta.nomeCliente
                    }
                  />
                </div>

                {abaSelecionada && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <ResumoValor
                        titulo="Itens encontrados"
                        valor={String(
                          abaSelecionada.itens.length,
                        )}
                      />

                      <ResumoValor
                        titulo="Custo total"
                        valor={formatarMoeda(
                          abaSelecionada.custoTotal,
                        )}
                      />

                      <ResumoValor
                        titulo="Faturamento Kemia"
                        valor={formatarMoeda(
                          abaSelecionada.faturamentoKemia,
                        )}
                      />

                      <ResumoValor
                        titulo="Faturamento direto"
                        valor={formatarMoeda(
                          abaSelecionada.faturamentoDireto,
                        )}
                      />
                    </div>

                    <div className="rounded-xl bg-slate-900 px-4 py-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Valor total de venda
                      </p>

                      <p className="mt-1 text-2xl font-bold">
                        {formatarMoeda(
                          abaSelecionada.valorVendaTotal,
                        )}
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-300">
                      <table className="min-w-[1050px] w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">
                              Item
                            </th>

                            <th className="px-4 py-3">
                              Descrição
                            </th>

                            <th className="px-4 py-3 text-right">
                              Qtde. cálculo
                            </th>

                            <th className="px-4 py-3 text-right">
                              Custo unitário
                            </th>

                            <th className="px-4 py-3 text-right">
                              Custo total
                            </th>

                            <th className="px-4 py-3">
                              Faturamento
                            </th>

                            <th className="px-4 py-3 text-right">
                              Venda
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                          {abaSelecionada.itens.map(
                            (item) => (
                              <tr
                                key={`${item.origemAba}-${item.origemLinha}-${item.ordem}`}
                                className="text-slate-700"
                              >
                                <td className="px-4 py-3 font-medium text-slate-900">
                                  {item.nomeInterno ||
                                    '—'}
                                </td>

                                <td className="max-w-md whitespace-pre-line px-4 py-3 text-slate-600">
                                  {item.descricaoInterna ||
                                    '—'}
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {formatarNumero(
                                    item.quantidadeCalculo,
                                  )}
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {formatarMoeda(
                                    item.custoUnitario,
                                  )}
                                </td>

                                <td className="px-4 py-3 text-right font-medium">
                                  {formatarMoeda(
                                    item.custoTotal,
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  {item.tipoFaturamento ||
                                    'Não informado'}
                                </td>

                                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                  {formatarMoeda(
                                    item.valorVenda,
                                  )}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          <SeletorDemandasRevisao
            key={
              chaveSeletorDemandas
            }
            orcamentoId={
              orcamentoId
            }
            onChange={
              setDemandaIdsNovaRevisao
            }
            mostrarBotaoSalvar={
              false
            }
            titulo={`Demandas da ${formatarRevisao(
              numeroNovaRevisao,
            )}`}
            descricao="Selecione manualmente as demandas relacionadas. Você também pode salvar sem selecionar nenhuma."
          />

          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Salvar revisão
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  A planilha, os itens comerciais e os vínculos serão preservados dentro desta revisão.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {revisoes.length >
                  0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      cancelarNovaRevisao
                    }
                    disabled={
                      salvandoImportacao
                    }
                  >
                    Cancelar
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={() =>
                    void salvarImportacao()
                  }
                  disabled={
                    salvandoImportacao ||
                    !preview ||
                    !abaSelecionada ||
                    abaSelecionada.itens.length ===
                      0 ||
                    (
                      numeroNovaRevisao >
                        0 &&
                      !motivoNovaRevisao.trim()
                    )
                  }
                >
                  {salvandoImportacao && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  Salvar{' '}
                  {formatarRevisao(
                    numeroNovaRevisao,
                  )}
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function InfoItem({
  titulo,
  valor,
}: {
  titulo: string
  valor:
    | string
    | number
    | null
    | undefined
}) {
  const texto =
    valor === undefined ||
    valor === null ||
    valor === ''
      ? '—'
      : String(valor)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 break-words font-medium text-slate-900">
        {texto}
      </p>
    </div>
  )
}

function ResumoValor({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string
  valor: string
  destaque?: boolean
}) {
  return (
    <div
      className={
        destaque
          ? 'rounded-xl bg-slate-900 p-4 text-white'
          : 'rounded-xl border border-slate-300 bg-slate-50 p-4'
      }
    >
      <p
        className={
          destaque
            ? 'text-xs font-semibold uppercase tracking-wide text-slate-300'
            : 'text-xs font-semibold uppercase tracking-wide text-slate-500'
        }
      >
        {titulo}
      </p>

      <p className="mt-2 text-lg font-bold">
        {valor}
      </p>
    </div>
  )
}