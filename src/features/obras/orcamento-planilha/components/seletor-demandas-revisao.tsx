import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  Save,
  Search,
} from 'lucide-react'

import {
  atualizarVinculosDemandas,
  buscarDemandasVinculadasRevisao,
  listarDemandasVinculaveis,
} from '../services/orcamento-planilha-service'

import type {
  DemandaVinculavel,
} from '../types'

interface SeletorDemandasRevisaoProps {
  orcamentoId: string

  revisaoId?: string | null

  demandaIdsSelecionadas?: string[]

  onChange?: (
    demandaIds: string[],
  ) => void

  onAtualizado?: () =>
    | void
    | Promise<void>

  titulo?: string

  descricao?: string

  mostrarBotaoSalvar?: boolean
}

function formatarRevisao(
  numeroRevisao: number,
) {
  return `REV ${numeroRevisao
    .toString()
    .padStart(2, '0')}`
}

function formatarTextoStatus(
  status: string | null,
) {
  if (!status) {
    return 'Sem status'
  }

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase(),
    )
}

function formatarData(
  data: string | null,
) {
  if (!data) {
    return null
  }

  const partes = data.split('-')

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  return data
}

export function SeletorDemandasRevisao({
  orcamentoId,
  revisaoId = null,
  demandaIdsSelecionadas,
  onChange,
  onAtualizado,
  titulo = 'Demandas vinculadas',
  descricao = 'Selecione as demandas relacionadas a esta revisão. O vínculo é opcional.',
  mostrarBotaoSalvar = Boolean(revisaoId),
}: SeletorDemandasRevisaoProps) {
  const [
    demandas,
    setDemandas,
  ] = useState<DemandaVinculavel[]>([])

  const [
    selecionadas,
    setSelecionadas,
  ] = useState<string[]>(
    demandaIdsSelecionadas ?? [],
  )

  const [
    pesquisa,
    setPesquisa,
  ] = useState('')

  const [
    carregando,
    setCarregando,
  ] = useState(true)

  const [
    salvando,
    setSalvando,
  ] = useState(false)

  const [
    erro,
    setErro,
  ] = useState<string | null>(null)

  const [
    sucesso,
    setSucesso,
  ] = useState<string | null>(null)

  useEffect(() => {
    if (demandaIdsSelecionadas === undefined) {
      return
    }

    setSelecionadas(
      demandaIdsSelecionadas,
    )
  }, [demandaIdsSelecionadas])

  useEffect(() => {
    let componenteAtivo = true

    async function carregar() {
      setCarregando(true)
      setErro(null)
      setSucesso(null)

      try {
        const [
          demandasDisponiveis,
          demandasVinculadas,
        ] = await Promise.all([
          listarDemandasVinculaveis(
            orcamentoId,
          ),

          revisaoId
            ? buscarDemandasVinculadasRevisao(
                revisaoId,
              )
            : Promise.resolve([]),
        ])

        if (!componenteAtivo) {
          return
        }

        setDemandas(
          demandasDisponiveis,
        )

        if (
          demandaIdsSelecionadas === undefined &&
          revisaoId
        ) {
          const idsVinculados =
            demandasVinculadas.map(
              (demanda) => demanda.id,
            )

          setSelecionadas(
            idsVinculados,
          )

          onChange?.(
            idsVinculados,
          )
        }
      } catch (error) {
        if (!componenteAtivo) {
          return
        }

        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar as demandas.',
        )
      } finally {
        if (componenteAtivo) {
          setCarregando(false)
        }
      }
    }

    void carregar()

    return () => {
      componenteAtivo = false
    }
  }, [
    demandaIdsSelecionadas,
    onChange,
    orcamentoId,
    revisaoId,
  ])

  const demandasFiltradas =
    useMemo(() => {
      const termo = pesquisa
        .trim()
        .toLocaleLowerCase('pt-BR')

      if (!termo) {
        return demandas
      }

      return demandas.filter(
        (demanda) => {
          const conteudo = [
            demanda.titulo,
            demanda.descricao,
            demanda.status,
            demanda.prioridade,
            formatarRevisao(
              demanda.numero_revisao,
            ),
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase('pt-BR')

          return conteudo.includes(
            termo,
          )
        },
      )
    }, [
      demandas,
      pesquisa,
    ])

  function alterarSelecao(
    demandaId: string,
  ) {
    setSelecionadas(
      (selecionadasAtuais) => {
        const novaSelecao =
          selecionadasAtuais.includes(
            demandaId,
          )
            ? selecionadasAtuais.filter(
                (id) => id !== demandaId,
              )
            : [
                ...selecionadasAtuais,
                demandaId,
              ]

        onChange?.(
          novaSelecao,
        )

        return novaSelecao
      },
    )

    setSucesso(null)
  }

  function selecionarTodasVisiveis() {
    const idsVisiveis =
      demandasFiltradas.map(
        (demanda) => demanda.id,
      )

    const novaSelecao = [
      ...new Set([
        ...selecionadas,
        ...idsVisiveis,
      ]),
    ]

    setSelecionadas(
      novaSelecao,
    )

    onChange?.(
      novaSelecao,
    )

    setSucesso(null)
  }

  function limparSelecao() {
    setSelecionadas([])

    onChange?.([])

    setSucesso(null)
  }

  async function salvarVinculos() {
    if (!revisaoId) {
      return
    }

    setSalvando(true)
    setErro(null)
    setSucesso(null)

    try {
      const demandasAtualizadas =
        await atualizarVinculosDemandas({
          orcamentoId,
          revisaoId,
          demandaIds: selecionadas,
        })

      const idsAtualizados =
        demandasAtualizadas.map(
          (demanda) => demanda.id,
        )

      setSelecionadas(
        idsAtualizados,
      )

      onChange?.(
        idsAtualizados,
      )

      setSucesso(
        idsAtualizados.length === 0
          ? 'A revisão foi salva sem demandas vinculadas.'
          : 'Demandas vinculadas com sucesso.',
      )

      await onAtualizado?.()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar os vínculos.',
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-slate-700" />

            <h3 className="text-lg font-semibold text-slate-900">
              {titulo}
            </h3>
          </div>

          <p className="mt-1 text-sm text-slate-600">
            {descricao}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-500">
            {selecionadas.length === 0
              ? 'Nenhuma demanda selecionada'
              : `${selecionadas.length} ${
                  selecionadas.length === 1
                    ? 'demanda selecionada'
                    : 'demandas selecionadas'
                }`}
          </p>
        </div>

        {mostrarBotaoSalvar &&
          revisaoId && (
            <button
              type="button"
              onClick={() =>
                void salvarVinculos()
              }
              disabled={
                carregando ||
                salvando
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar vínculos
                </>
              )}
            </button>
          )}
      </div>

      {erro && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm text-red-700">
            {erro}
          </p>
        </div>
      )}

      {sucesso && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

          <p className="text-sm text-emerald-800">
            {sucesso}
          </p>
        </div>
      )}

      {carregando ? (
        <div className="flex min-h-32 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando demandas...
          </div>
        </div>
      ) : demandas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="font-medium text-slate-800">
            Este orçamento ainda não possui demandas.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            A revisão poderá ser salva normalmente sem nenhum vínculo.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={pesquisa}
                onChange={(evento) =>
                  setPesquisa(
                    evento.target.value,
                  )
                }
                placeholder="Pesquisar demanda..."
                className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-600"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  selecionarTodasVisiveis
                }
                disabled={
                  demandasFiltradas.length ===
                  0
                }
                className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selecionar visíveis
              </button>

              <button
                type="button"
                onClick={limparSelecao}
                disabled={
                  selecionadas.length === 0
                }
                className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar seleção
              </button>
            </div>
          </div>

          {demandasFiltradas.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">
                Nenhuma demanda encontrada para essa pesquisa.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {demandasFiltradas.map(
                (demanda) => {
                  const selecionada =
                    selecionadas.includes(
                      demanda.id,
                    )

                  const prazo =
                    formatarData(
                      demanda.prazo,
                    )

                  return (
                    <label
                      key={demanda.id}
                      className={
                        selecionada
                          ? 'flex cursor-pointer gap-3 rounded-xl border border-slate-900 bg-slate-50 p-4 shadow-sm transition'
                          : 'flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:bg-slate-50'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          selecionada
                        }
                        onChange={() =>
                          alterarSelecao(
                            demanda.id,
                          )
                        }
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {demanda.titulo}
                          </span>

                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                            {formatarRevisao(
                              demanda.numero_revisao,
                            )}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {formatarTextoStatus(
                              demanda.status,
                            )}
                          </span>
                        </div>

                        {demanda.descricao && (
                          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                            {demanda.descricao}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            Revisão da demanda:{' '}
                            {formatarTextoStatus(
                              demanda.status_revisao,
                            )}
                          </span>

                          {prazo && (
                            <span>
                              Prazo: {prazo}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  )
                },
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}