import { supabase } from '@/integrations/supabase/client'

import type {
  AtualizarItemComercialPayload,
  AtualizarVinculosDemandasPayload,
  DemandaVinculavel,
  ImportacaoOrcamentoSalva,
  ItemOrcamentoSalvo,
  PreviewPlanilhaOrcamentaria,
  ResultadoImportacaoPlanilha,
  ResumoAbaComposicao,
  ResumoRevisaoOrcamento,
  RevisaoOrcamento,
  SalvarImportacaoPlanilhaPayload,
  VinculoDemandaRevisao,
} from '../types'

export type {
  AtualizarItemComercialPayload,
  AtualizarVinculosDemandasPayload,
  DemandaVinculavel,
  ImportacaoOrcamentoSalva,
  ItemOrcamentoSalvo,
  ResultadoImportacaoPlanilha,
  ResumoRevisaoOrcamento,
  RevisaoOrcamento,
  SalvarImportacaoPlanilhaPayload,
  VinculoDemandaRevisao,
} from '../types'

interface RevisaoAtivaAnterior {
  id: string
  numero_revisao: number
}

interface DadosSalvarNormalizados {
  orcamentoId: string
  preview: PreviewPlanilhaOrcamentaria
  nomeAba: string
  numeroRevisao: number
  motivoRevisao: string
  observacaoRevisao?: string
  demandaIds: string[]
}

function normalizarRevisao(revisao: string | null) {
  if (!revisao) {
    return 0
  }

  const apenasNumeros = revisao.replace(/\D/g, '')

  return apenasNumeros ? Number(apenasNumeros) : 0
}

function encontrarAba(
  preview: PreviewPlanilhaOrcamentaria,
  nomeAba: string,
): ResumoAbaComposicao {
  const aba = preview.abasComposicao.find(
    (item) => item.nomeAba === nomeAba,
  )

  if (!aba) {
    throw new Error(
      'A aba de composição selecionada não foi encontrada.',
    )
  }

  if (aba.itens.length === 0) {
    throw new Error(
      'A aba selecionada não possui itens para importar.',
    )
  }

  return aba
}

function removerDuplicados(valores: string[]) {
  return [...new Set(valores.filter(Boolean))]
}

function normalizarPayloadSalvar(
  payloadOuOrcamentoId:
    | SalvarImportacaoPlanilhaPayload
    | string,
  previewLegado?: PreviewPlanilhaOrcamentaria,
): DadosSalvarNormalizados {
  if (typeof payloadOuOrcamentoId !== 'string') {
    return {
      ...payloadOuOrcamentoId,
      demandaIds: removerDuplicados(
        payloadOuOrcamentoId.demandaIds,
      ),
    }
  }

  if (!previewLegado) {
    throw new Error(
      'Os dados da planilha não foram informados.',
    )
  }

  const numeroRevisao = normalizarRevisao(
    previewLegado.dadosProposta.revisao,
  )

  const nomeAba =
    previewLegado.abaSugerida ??
    previewLegado.abasComposicao[0]?.nomeAba

  if (!nomeAba) {
    throw new Error(
      'A planilha não possui uma aba de composição válida.',
    )
  }

  return {
    orcamentoId: payloadOuOrcamentoId,
    preview: previewLegado,
    nomeAba,
    numeroRevisao,
    motivoRevisao:
      numeroRevisao === 0
        ? ''
        : 'Nova revisão importada da planilha orçamentária.',
    demandaIds: [],
  }
}

async function obterUsuarioAtualId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user?.id ?? null
}

async function gerarHashImportacao(
  orcamentoId: string,
  preview: PreviewPlanilhaOrcamentaria,
  aba: ResumoAbaComposicao,
) {
  const conteudoHash = JSON.stringify({
    orcamentoId,
    nomeArquivo: preview.nomeArquivo,
    tamanhoBytes: preview.tamanhoBytes,
    numeroProposta: preview.dadosProposta.numeroProposta,
    revisao: preview.dadosProposta.revisao,
    nomeAba: aba.nomeAba,
    itens: aba.itens.map((item) => ({
      origemLinha: item.origemLinha,
      nomeInterno: item.nomeInterno,
      descricaoInterna: item.descricaoInterna,
      quantidadeCalculo: item.quantidadeCalculo,
      custoUnitario: item.custoUnitario,
      custoTotal: item.custoTotal,
      tipoFaturamento: item.tipoFaturamento,
      valorVenda: item.valorVenda,
      itemOpcional: item.itemOpcional,
    })),
  })

  const dados = new TextEncoder().encode(conteudoHash)

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    dados,
  )

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function buscarRevisaoAtiva(
  orcamentoId: string,
): Promise<RevisaoAtivaAnterior | null> {
  const { data, error } = await supabase
    .from('orcamento_revisoes')
    .select('id, numero_revisao')
    .eq('obra_id', orcamentoId)
    .eq('status', 'ativa')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
    ? {
        id: data.id,
        numero_revisao: Number(data.numero_revisao),
      }
    : null
}

async function buscarRevisaoPorNumero(
  orcamentoId: string,
  numeroRevisao: number,
): Promise<RevisaoOrcamento | null> {
  const { data, error } = await supabase
    .from('orcamento_revisoes')
    .select(`
      id,
      obra_id,
      numero_revisao,
      status,
      motivo_revisao,
      observacao,
      criado_por,
      created_at,
      updated_at
    `)
    .eq('obra_id', orcamentoId)
    .eq('numero_revisao', numeroRevisao)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as RevisaoOrcamento | null
}

async function restaurarRevisaoAtiva(
  revisaoAnterior: RevisaoAtivaAnterior | null,
) {
  if (!revisaoAnterior) {
    return
  }

  const { error } = await supabase
    .from('orcamento_revisoes')
    .update({
      status: 'ativa',
      updated_at: new Date().toISOString(),
    })
    .eq('id', revisaoAnterior.id)

  if (error) {
    console.error(
      'Não foi possível restaurar a revisão ativa anterior:',
      error,
    )
  }
}

async function criarOuAtivarRevisao({
  orcamentoId,
  numeroRevisao,
  motivoRevisao,
  observacaoRevisao,
}: {
  orcamentoId: string
  numeroRevisao: number
  motivoRevisao: string
  observacaoRevisao?: string
}) {
  if (!Number.isInteger(numeroRevisao) || numeroRevisao < 0) {
    throw new Error(
      'O número da revisão precisa ser um número inteiro maior ou igual a zero.',
    )
  }

  if (numeroRevisao > 0 && !motivoRevisao.trim()) {
    throw new Error(
      'Informe o motivo da nova revisão.',
    )
  }

  const revisaoExistente = await buscarRevisaoPorNumero(
    orcamentoId,
    numeroRevisao,
  )

  const revisaoAtivaAnterior =
    await buscarRevisaoAtiva(orcamentoId)

  if (
    revisaoExistente &&
    revisaoExistente.status === 'ativa'
  ) {
    return {
      revisao: revisaoExistente,
      revisaoCriada: false,
      revisaoAtivaAnterior,
      statusAnterior: revisaoExistente.status,
    }
  }

  if (revisaoAtivaAnterior) {
    const { error: erroEncerrarAnterior } = await supabase
      .from('orcamento_revisoes')
      .update({
        status: 'encerrada',
        updated_at: new Date().toISOString(),
      })
      .eq('id', revisaoAtivaAnterior.id)

    if (erroEncerrarAnterior) {
      throw erroEncerrarAnterior
    }
  }

  if (revisaoExistente) {
    const { data, error } = await supabase
      .from('orcamento_revisoes')
      .update({
        status: 'ativa',
        motivo_revisao:
          numeroRevisao === 0
            ? revisaoExistente.motivo_revisao
            : motivoRevisao.trim(),
        observacao:
          observacaoRevisao?.trim() ||
          revisaoExistente.observacao,
        updated_at: new Date().toISOString(),
      })
      .eq('id', revisaoExistente.id)
      .select(`
        id,
        obra_id,
        numero_revisao,
        status,
        motivo_revisao,
        observacao,
        criado_por,
        created_at,
        updated_at
      `)
      .single()

    if (error || !data) {
      await restaurarRevisaoAtiva(revisaoAtivaAnterior)
      throw error
    }

    return {
      revisao: data as RevisaoOrcamento,
      revisaoCriada: false,
      revisaoAtivaAnterior,
      statusAnterior: revisaoExistente.status,
    }
  }

  const usuarioId = await obterUsuarioAtualId()

  const { data, error } = await supabase
    .from('orcamento_revisoes')
    .insert({
      obra_id: orcamentoId,
      numero_revisao: numeroRevisao,
      status: 'ativa',
      motivo_revisao:
        numeroRevisao === 0
          ? null
          : motivoRevisao.trim(),
      observacao:
        observacaoRevisao?.trim() || null,
      criado_por: usuarioId,
    })
    .select(`
      id,
      obra_id,
      numero_revisao,
      status,
      motivo_revisao,
      observacao,
      criado_por,
      created_at,
      updated_at
    `)
    .single()

  if (error || !data) {
    await restaurarRevisaoAtiva(revisaoAtivaAnterior)
    throw error
  }

  return {
    revisao: data as RevisaoOrcamento,
    revisaoCriada: true,
    revisaoAtivaAnterior,
    statusAnterior: null,
  }
}

async function excluirRevisaoIncompleta(
  revisaoId: string,
  revisaoCriada: boolean,
  statusAnterior: string | null,
  revisaoAtivaAnterior: RevisaoAtivaAnterior | null,
) {
  if (revisaoCriada) {
    const { error } = await supabase
      .from('orcamento_revisoes')
      .delete()
      .eq('id', revisaoId)

    if (error) {
      console.error(
        'Não foi possível remover a revisão incompleta:',
        error,
      )
    }
  } else {
    const { error } = await supabase
      .from('orcamento_revisoes')
      .update({
        status: statusAnterior ?? 'encerrada',
        updated_at: new Date().toISOString(),
      })
      .eq('id', revisaoId)

    if (error) {
      console.error(
        'Não foi possível restaurar o estado da revisão:',
        error,
      )
    }
  }

  await restaurarRevisaoAtiva(revisaoAtivaAnterior)
}

async function excluirConteudoImportado(
  importacaoId: string,
  revisaoId: string,
) {
  const { error: erroItens } = await supabase
    .from('orcamento_itens')
    .delete()
    .eq('revisao_id', revisaoId)
    .eq('importacao_id', importacaoId)

  if (erroItens) {
    console.error(
      'Não foi possível remover os itens da importação incompleta:',
      erroItens,
    )
  }

  const { error: erroImportacao } = await supabase
    .from('orcamento_importacoes')
    .delete()
    .eq('id', importacaoId)

  if (erroImportacao) {
    console.error(
      'Não foi possível remover a importação incompleta:',
      erroImportacao,
    )
  }
}

async function buscarImportacaoBasePorRevisao(
  revisaoId: string,
) {
  const { data, error } = await supabase
    .from('orcamento_importacoes')
    .select(`
      id,
      orcamento_id,
      revisao_id,
      nome_arquivo,
      tamanho_bytes,
      hash_sha256,
      modelo_planilha,
      versao_planilha,
      dados_origem,
      importado_por,
      created_at
    `)
    .eq('revisao_id', revisaoId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

async function montarImportacaoSalva(
  importacao: Record<string, unknown>,
  revisao: RevisaoOrcamento,
): Promise<ImportacaoOrcamentoSalva> {
  const importacaoId = String(importacao.id)
  const revisaoId = String(importacao.revisao_id)

  const { data: itens, error: erroItens } = await supabase
    .from('orcamento_itens')
    .select(`
      id,
      orcamento_id,
      importacao_id,
      revisao_id,
      ordem,
      categoria,
      codigo,
      nome_interno,
      descricao_interna,
      quantidade_calculo,
      unidade_calculo,
      custo_unitario,
      custo_total,
      valor_venda,
      faturamento_kemia,
      faturamento_direto,
      margem_percentual,
      nome_comercial,
      descricao_comercial,
      quantidade_comercial,
      unidade_comercial,
      exibir_na_proposta,
      item_opcional,
      origem_aba,
      origem_linha,
      dados_adicionais,
      created_at,
      updated_at
    `)
    .eq('revisao_id', revisaoId)
    .order('ordem', {
      ascending: true,
    })

  if (erroItens) {
    throw erroItens
  }

  const demandasVinculadas =
    await buscarDemandasVinculadasRevisao(revisaoId)

  return {
    id: importacaoId,
    orcamento_id: String(importacao.orcamento_id),
    revisao_id: revisaoId,

    nome_arquivo: String(importacao.nome_arquivo),

    tamanho_bytes:
      importacao.tamanho_bytes === null ||
      importacao.tamanho_bytes === undefined
        ? null
        : Number(importacao.tamanho_bytes),

    hash_sha256:
      importacao.hash_sha256 === null ||
      importacao.hash_sha256 === undefined
        ? null
        : String(importacao.hash_sha256),

    modelo_planilha:
      importacao.modelo_planilha === null ||
      importacao.modelo_planilha === undefined
        ? null
        : String(importacao.modelo_planilha),

    versao_planilha:
      importacao.versao_planilha === null ||
      importacao.versao_planilha === undefined
        ? null
        : String(importacao.versao_planilha),

    dados_origem:
      (importacao.dados_origem ?? {}) as Record<
        string,
        unknown
      >,

    importado_por:
      importacao.importado_por === null ||
      importacao.importado_por === undefined
        ? null
        : String(importacao.importado_por),

    created_at: String(importacao.created_at),

    revisao,
    itens: (itens ?? []) as ItemOrcamentoSalvo[],
    demandasVinculadas,
  }
}

export async function buscarImportacaoPorRevisao(
  revisaoId: string,
): Promise<ImportacaoOrcamentoSalva | null> {
  const { data: revisao, error: erroRevisao } =
    await supabase
      .from('orcamento_revisoes')
      .select(`
        id,
        obra_id,
        numero_revisao,
        status,
        motivo_revisao,
        observacao,
        criado_por,
        created_at,
        updated_at
      `)
      .eq('id', revisaoId)
      .maybeSingle()

  if (erroRevisao) {
    throw erroRevisao
  }

  if (!revisao) {
    return null
  }

  const importacao =
    await buscarImportacaoBasePorRevisao(revisaoId)

  if (!importacao) {
    return null
  }

  return montarImportacaoSalva(
    importacao as Record<string, unknown>,
    revisao as RevisaoOrcamento,
  )
}

export async function buscarUltimaImportacaoPlanilha(
  orcamentoId: string,
): Promise<ImportacaoOrcamentoSalva | null> {
  const { data: revisoes, error: erroRevisoes } =
    await supabase
      .from('orcamento_revisoes')
      .select(`
        id,
        obra_id,
        numero_revisao,
        status,
        motivo_revisao,
        observacao,
        criado_por,
        created_at,
        updated_at
      `)
      .eq('obra_id', orcamentoId)
      .order('numero_revisao', {
        ascending: false,
      })

  if (erroRevisoes) {
    throw erroRevisoes
  }

  if (!revisoes || revisoes.length === 0) {
    return null
  }

  const revisoesOrdenadas = [
    ...revisoes.filter(
      (revisao) => revisao.status === 'ativa',
    ),
    ...revisoes.filter(
      (revisao) => revisao.status !== 'ativa',
    ),
  ]

  for (const revisao of revisoesOrdenadas) {
    const importacao =
      await buscarImportacaoBasePorRevisao(revisao.id)

    if (importacao) {
      return montarImportacaoSalva(
        importacao as Record<string, unknown>,
        revisao as RevisaoOrcamento,
      )
    }
  }

  return null
}

export async function listarRevisoesOrcamento(
  orcamentoId: string,
): Promise<ResumoRevisaoOrcamento[]> {
  const { data: revisoes, error: erroRevisoes } =
    await supabase
      .from('orcamento_revisoes')
      .select(`
        id,
        obra_id,
        numero_revisao,
        status,
        motivo_revisao,
        observacao,
        criado_por,
        created_at,
        updated_at
      `)
      .eq('obra_id', orcamentoId)
      .order('numero_revisao', {
        ascending: false,
      })

  if (erroRevisoes) {
    throw erroRevisoes
  }

  if (!revisoes || revisoes.length === 0) {
    return []
  }

  const revisaoIds = revisoes.map((revisao) => revisao.id)

  const [
    resultadoImportacoes,
    resultadoItens,
    resultadoVinculos,
  ] = await Promise.all([
    supabase
      .from('orcamento_importacoes')
      .select('id, revisao_id, nome_arquivo, created_at')
      .in('revisao_id', revisaoIds),

    supabase
      .from('orcamento_itens')
      .select(`
        id,
        revisao_id,
        custo_total,
        valor_venda,
        faturamento_kemia,
        faturamento_direto
      `)
      .in('revisao_id', revisaoIds),

    supabase
      .from('orcamento_revisao_demandas')
      .select('id, revisao_id')
      .in('revisao_id', revisaoIds),
  ])

  if (resultadoImportacoes.error) {
    throw resultadoImportacoes.error
  }

  if (resultadoItens.error) {
    throw resultadoItens.error
  }

  if (resultadoVinculos.error) {
    throw resultadoVinculos.error
  }

  return revisoes.map((revisao) => {
    const importacao = resultadoImportacoes.data?.find(
      (item) => item.revisao_id === revisao.id,
    )

    const itens =
      resultadoItens.data?.filter(
        (item) => item.revisao_id === revisao.id,
      ) ?? []

    const quantidadeDemandasVinculadas =
      resultadoVinculos.data?.filter(
        (item) => item.revisao_id === revisao.id,
      ).length ?? 0

    const totais = itens.reduce(
      (acumulador, item) => ({
        custoTotal:
          acumulador.custoTotal +
          Number(item.custo_total ?? 0),

        valorVendaTotal:
          acumulador.valorVendaTotal +
          Number(item.valor_venda ?? 0),

        faturamentoKemia:
          acumulador.faturamentoKemia +
          Number(item.faturamento_kemia ?? 0),

        faturamentoDireto:
          acumulador.faturamentoDireto +
          Number(item.faturamento_direto ?? 0),
      }),
      {
        custoTotal: 0,
        valorVendaTotal: 0,
        faturamentoKemia: 0,
        faturamentoDireto: 0,
      },
    )

    return {
      revisao: revisao as RevisaoOrcamento,

      importacao: importacao
        ? {
            id: importacao.id,
            nomeArquivo: importacao.nome_arquivo,
            createdAt: importacao.created_at,
          }
        : null,

      quantidadeItens: itens.length,
      quantidadeDemandasVinculadas,

      ...totais,
    }
  })
}

export async function buscarProximoNumeroRevisao(
  orcamentoId: string,
) {
  const { data, error } = await supabase
    .from('orcamento_revisoes')
    .select('numero_revisao')
    .eq('obra_id', orcamentoId)
    .order('numero_revisao', {
      ascending: false,
    })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Number(data?.numero_revisao ?? -1) + 1
}

export async function listarDemandasVinculaveis(
  orcamentoId: string,
): Promise<DemandaVinculavel[]> {
  const { data, error } = await supabase
    .from('demandas')
    .select(`
      id,
      obra_id,
      etapa_id,
      titulo,
      descricao,
      status,
      prioridade,
      responsavel_id,
      setor_id,
      prazo,
      data_inicio,
      data_conclusao,
      grupo_revisao_id,
      numero_revisao,
      revisao_anterior_id,
      status_revisao
    `)
    .eq('obra_id', orcamentoId)
    .order('titulo', {
      ascending: true,
    })
    .order('numero_revisao', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return (data ?? []) as DemandaVinculavel[]
}

export async function buscarDemandasVinculadasRevisao(
  revisaoId: string,
): Promise<DemandaVinculavel[]> {
  const { data: vinculos, error: erroVinculos } =
    await supabase
      .from('orcamento_revisao_demandas')
      .select('demanda_id')
      .eq('revisao_id', revisaoId)

  if (erroVinculos) {
    throw erroVinculos
  }

  const demandaIds =
    vinculos?.map((vinculo) => vinculo.demanda_id) ?? []

  if (demandaIds.length === 0) {
    return []
  }

  const { data: demandas, error: erroDemandas } =
    await supabase
      .from('demandas')
      .select(`
        id,
        obra_id,
        etapa_id,
        titulo,
        descricao,
        status,
        prioridade,
        responsavel_id,
        setor_id,
        prazo,
        data_inicio,
        data_conclusao,
        grupo_revisao_id,
        numero_revisao,
        revisao_anterior_id,
        status_revisao
      `)
      .in('id', demandaIds)
      .order('titulo', {
        ascending: true,
      })
      .order('numero_revisao', {
        ascending: false,
      })

  if (erroDemandas) {
    throw erroDemandas
  }

  return (demandas ?? []) as DemandaVinculavel[]
}

async function validarDemandasDoOrcamento(
  orcamentoId: string,
  demandaIds: string[],
) {
  const ids = removerDuplicados(demandaIds)

  if (ids.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('demandas')
    .select('id')
    .eq('obra_id', orcamentoId)
    .in('id', ids)

  if (error) {
    throw error
  }

  if ((data ?? []).length !== ids.length) {
    throw new Error(
      'Uma ou mais demandas selecionadas não pertencem a este orçamento.',
    )
  }

  return ids
}

export async function atualizarVinculosDemandas(
  payload: AtualizarVinculosDemandasPayload,
) {
  const demandaIds = await validarDemandasDoOrcamento(
    payload.orcamentoId,
    payload.demandaIds,
  )

  const { data: revisao, error: erroRevisao } =
    await supabase
      .from('orcamento_revisoes')
      .select('id')
      .eq('id', payload.revisaoId)
      .eq('obra_id', payload.orcamentoId)
      .maybeSingle()

  if (erroRevisao) {
    throw erroRevisao
  }

  if (!revisao) {
    throw new Error(
      'A revisão selecionada não pertence a este orçamento.',
    )
  }

  const { data: vinculosAtuais, error: erroVinculos } =
    await supabase
      .from('orcamento_revisao_demandas')
      .select('id, demanda_id')
      .eq('revisao_id', payload.revisaoId)

  if (erroVinculos) {
    throw erroVinculos
  }

  const idsAtuais =
    vinculosAtuais?.map((vinculo) => vinculo.demanda_id) ??
    []

  const idsAdicionar = demandaIds.filter(
    (id) => !idsAtuais.includes(id),
  )

  const idsRemover = idsAtuais.filter(
    (id) => !demandaIds.includes(id),
  )

  if (idsAdicionar.length > 0) {
    const usuarioId = await obterUsuarioAtualId()

    const { error: erroAdicionar } = await supabase
      .from('orcamento_revisao_demandas')
      .insert(
        idsAdicionar.map((demandaId) => ({
          orcamento_id: payload.orcamentoId,
          revisao_id: payload.revisaoId,
          demanda_id: demandaId,
          criado_por: usuarioId,
        })),
      )

    if (erroAdicionar) {
      throw erroAdicionar
    }
  }

  if (idsRemover.length > 0) {
    const { error: erroRemover } = await supabase
      .from('orcamento_revisao_demandas')
      .delete()
      .eq('revisao_id', payload.revisaoId)
      .in('demanda_id', idsRemover)

    if (erroRemover) {
      throw erroRemover
    }
  }

  return buscarDemandasVinculadasRevisao(
    payload.revisaoId,
  )
}

export async function atualizarItensComerciais(
  itens: AtualizarItemComercialPayload[],
) {
  if (itens.length === 0) {
    return
  }

  await Promise.all(
    itens.map(async (item) => {
      let consulta = supabase
        .from('orcamento_itens')
        .update({
          nome_comercial:
            item.nomeComercial.trim() || null,

          descricao_comercial:
            item.descricaoComercial.trim() || null,

          quantidade_comercial:
            item.quantidadeComercial,

          unidade_comercial:
            item.unidadeComercial.trim() || null,

          exibir_na_proposta:
            item.exibirNaProposta,

          item_opcional:
            item.itemOpcional,

          updated_at:
            new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('orcamento_id', item.orcamentoId)

      if (item.revisaoId) {
        consulta = consulta.eq(
          'revisao_id',
          item.revisaoId,
        )
      }

      const { error } = await consulta

      if (error) {
        throw error
      }
    }),
  )
}

export async function salvarImportacaoPlanilha(
  payload: SalvarImportacaoPlanilhaPayload,
): Promise<ResultadoImportacaoPlanilha>

export async function salvarImportacaoPlanilha(
  orcamentoId: string,
  preview: PreviewPlanilhaOrcamentaria,
): Promise<ResultadoImportacaoPlanilha>

export async function salvarImportacaoPlanilha(
  payloadOuOrcamentoId:
    | SalvarImportacaoPlanilhaPayload
    | string,
  previewLegado?: PreviewPlanilhaOrcamentaria,
): Promise<ResultadoImportacaoPlanilha> {
  const payload = normalizarPayloadSalvar(
    payloadOuOrcamentoId,
    previewLegado,
  )

  const aba = encontrarAba(
    payload.preview,
    payload.nomeAba,
  )

  const hashSha256 = await gerarHashImportacao(
    payload.orcamentoId,
    payload.preview,
    aba,
  )

  const { data: importacaoDuplicada, error: erroDuplicada } =
    await supabase
      .from('orcamento_importacoes')
      .select('id')
      .eq('orcamento_id', payload.orcamentoId)
      .eq('hash_sha256', hashSha256)
      .maybeSingle()

  if (erroDuplicada) {
    throw erroDuplicada
  }

  if (importacaoDuplicada) {
    throw new Error(
      'Esta composição já foi importada anteriormente para este orçamento.',
    )
  }

  const revisaoExistente = await buscarRevisaoPorNumero(
    payload.orcamentoId,
    payload.numeroRevisao,
  )

  if (revisaoExistente) {
    const importacaoExistente =
      await buscarImportacaoBasePorRevisao(
        revisaoExistente.id,
      )

    if (importacaoExistente) {
      throw new Error(
        `A REV ${payload.numeroRevisao
          .toString()
          .padStart(
            2,
            '0',
          )} já possui uma planilha importada.`,
      )
    }
  }

  const demandaIds = await validarDemandasDoOrcamento(
    payload.orcamentoId,
    payload.demandaIds,
  )

  const { data: orcamentoAtual, error: erroOrcamento } =
    await supabase
      .from('orcamentos')
      .select('valor_vendido, custo_real')
      .eq('id', payload.orcamentoId)
      .single()

  if (erroOrcamento || !orcamentoAtual) {
    throw new Error(
      'Não foi possível localizar o orçamento.',
    )
  }

  const controleRevisao = await criarOuAtivarRevisao({
    orcamentoId: payload.orcamentoId,
    numeroRevisao: payload.numeroRevisao,
    motivoRevisao: payload.motivoRevisao,
    observacaoRevisao: payload.observacaoRevisao,
  })

  const revisaoId = controleRevisao.revisao.id

  let importacaoId: string | null = null

  try {
    const usuarioId = await obterUsuarioAtualId()

    const { data: importacao, error: erroImportacao } =
      await supabase
        .from('orcamento_importacoes')
        .insert({
          orcamento_id: payload.orcamentoId,
          revisao_id: revisaoId,

          nome_arquivo: payload.preview.nomeArquivo,
          tamanho_bytes: payload.preview.tamanhoBytes,
          hash_sha256: hashSha256,

          modelo_planilha:
            payload.preview.modeloPlanilha,

          versao_planilha:
            payload.preview.versaoPlanilha,

          importado_por: usuarioId,

          dados_origem: {
            aba_selecionada: aba.nomeAba,

            abas_disponiveis:
              payload.preview.abasComposicao.map(
                (item) => item.nomeAba,
              ),

            possui_macros:
              payload.preview.possuiMacros,

            dados_proposta:
              payload.preview.dadosProposta,

            revisao: {
              id: revisaoId,
              numero: payload.numeroRevisao,
              motivo: payload.motivoRevisao,
              observacao:
                payload.observacaoRevisao ?? null,
            },

            totais: {
              custo_total: aba.custoTotal,
              valor_venda_total: aba.valorVendaTotal,
              faturamento_kemia:
                aba.faturamentoKemia,
              faturamento_direto:
                aba.faturamentoDireto,
            },
          },
        })
        .select('id')
        .single()

    if (erroImportacao || !importacao) {
      throw erroImportacao
    }

    importacaoId = importacao.id

    const itensPayload = aba.itens.map((item) => ({
      orcamento_id: payload.orcamentoId,
      importacao_id: importacao.id,
      revisao_id: revisaoId,

      ordem: item.ordem,
      categoria: item.categoria,
      codigo: item.codigo,

      nome_interno: item.nomeInterno,
      descricao_interna: item.descricaoInterna,

      quantidade_calculo:
        item.quantidadeCalculo,

      unidade_calculo:
        item.unidadeCalculo,

      custo_unitario: item.custoUnitario,
      custo_total: item.custoTotal,
      valor_venda: item.valorVenda,

      faturamento_kemia:
        item.faturamentoKemia,

      faturamento_direto:
        item.faturamentoDireto,

      margem_percentual: null,

      nome_comercial: item.nomeComercial,

      descricao_comercial:
        item.descricaoComercial,

      quantidade_comercial:
        item.quantidadeComercial,

      unidade_comercial:
        item.unidadeComercial,

      exibir_na_proposta:
        item.exibirNaProposta,

      item_opcional:
        item.itemOpcional,

      origem_aba: item.origemAba,
      origem_linha: item.origemLinha,

      dados_adicionais: {
        tipo_faturamento:
          item.tipoFaturamento,

        percentual_formacao_venda:
          item.margemPercentual,
      },

      updated_at: new Date().toISOString(),
    }))

    const { error: erroItens } = await supabase
      .from('orcamento_itens')
      .insert(itensPayload)

    if (erroItens) {
      throw erroItens
    }

    await atualizarVinculosDemandas({
      orcamentoId: payload.orcamentoId,
      revisaoId,
      demandaIds,
    })

    const { error: erroValores } = await supabase.rpc(
      'atualizar_valores_obra',
      {
        p_obra_id: payload.orcamentoId,
        p_valor_orcado: aba.valorVendaTotal,
        p_custo_orcado: aba.custoTotal,
        p_valor_vendido:
          orcamentoAtual.valor_vendido,
        p_custo_real:
          orcamentoAtual.custo_real,

        p_motivo_alteracao:
          `Importação da planilha "${payload.preview.nomeArquivo}", aba "${aba.nomeAba}", REV ${payload.numeroRevisao
            .toString()
            .padStart(2, '0')}.`,
      },
    )

    if (erroValores) {
      throw erroValores
    }

    const { error: erroAtualizarOrcamento } =
      await supabase
        .from('orcamentos')
        .update({
          revisao: payload.numeroRevisao,
          motivo_revisao:
            payload.numeroRevisao === 0
              ? null
              : payload.motivoRevisao.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.orcamentoId)

    if (erroAtualizarOrcamento) {
      throw erroAtualizarOrcamento
    }

    return {
      importacaoId: importacao.id,
      revisaoId,
      numeroRevisao: payload.numeroRevisao,

      quantidadeItens: aba.itens.length,

      quantidadeDemandasVinculadas:
        demandaIds.length,

      custoTotal: aba.custoTotal,
      valorVendaTotal: aba.valorVendaTotal,
    }
  } catch (error) {
    if (importacaoId) {
      await excluirConteudoImportado(
        importacaoId,
        revisaoId,
      )
    }

    await excluirRevisaoIncompleta(
      revisaoId,
      controleRevisao.revisaoCriada,
      controleRevisao.statusAnterior,
      controleRevisao.revisaoAtivaAnterior,
    )

    throw error
  }
}