export interface DadosPropostaPlanilha {
  modeloProposta: string | null
  tipoFrete: string | null
  tipoInstalacao: string | null
  objetivoContratacao: string | null
  numeroProposta: string | null
  dataProposta: string | null
  revisao: string | null

  nomeCliente: string | null
  razaoSocial: string | null
  cnpj: string | null
  aosCuidados: string | null
  emailCliente: string | null
  telefoneCliente: string | null
  enderecoCliente: string | null
  bairroCliente: string | null
  cidadeCliente: string | null
  ufCliente: string | null
  cepCliente: string | null

  nomeVendedor: string | null
  cargoVendedor: string | null
  telefoneVendedor: string | null
  emailVendedor: string | null

  exibirDadosProjeto: boolean
  exibirRegimeOperacao: boolean
  exibirFluxograma: boolean

  arquivoWordSelecionado: string | null
}

export interface ItemPlanilhaPreview {
  ordem: number
  categoria: string | null
  codigo: string | null

  nomeInterno: string
  descricaoInterna: string | null

  quantidadeCalculo: number
  unidadeCalculo: string | null

  custoUnitario: number
  custoTotal: number

  tipoFaturamento: string | null

  valorVenda: number
  faturamentoKemia: number
  faturamentoDireto: number
  margemPercentual: number | null

  nomeComercial: string
  descricaoComercial: string | null
  quantidadeComercial: number
  unidadeComercial: string | null

  exibirNaProposta: boolean
  itemOpcional: boolean

  origemAba: string
  origemLinha: number
}

export interface ResumoAbaComposicao {
  nomeAba: string
  itens: ItemPlanilhaPreview[]

  custoTotal: number
  valorVendaTotal: number
  faturamentoKemia: number
  faturamentoDireto: number
}

export interface PreviewPlanilhaOrcamentaria {
  nomeArquivo: string
  tamanhoBytes: number

  modeloPlanilha: string
  versaoPlanilha: string
  possuiMacros: boolean

  dadosProposta: DadosPropostaPlanilha

  abasComposicao: ResumoAbaComposicao[]
  abaSugerida: string | null

  alertas: string[]
}

export type StatusRevisaoOrcamento =
  | 'ativa'
  | 'encerrada'

export interface RevisaoOrcamento {
  id: string
  obra_id: string

  numero_revisao: number
  status: StatusRevisaoOrcamento

  motivo_revisao: string | null
  observacao: string | null

  criado_por: string | null

  created_at: string
  updated_at: string
}

export interface DemandaVinculavel {
  id: string
  obra_id: string
  etapa_id: string

  titulo: string
  descricao: string | null

  status: string | null
  prioridade: string | null

  responsavel_id: string | null
  setor_id: string | null

  prazo: string | null
  data_inicio: string | null
  data_conclusao: string | null

  grupo_revisao_id: string
  numero_revisao: number
  revisao_anterior_id: string | null
  status_revisao: string
}

export interface VinculoDemandaRevisao {
  id: string

  orcamento_id: string
  revisao_id: string
  demanda_id: string

  criado_por: string | null
  created_at: string

  demanda?: DemandaVinculavel
}

export interface ItemOrcamentoSalvo {
  id: string

  orcamento_id: string
  importacao_id: string | null
  revisao_id: string

  ordem: number
  categoria: string | null
  codigo: string | null

  nome_interno: string | null
  descricao_interna: string | null

  quantidade_calculo: number | null
  unidade_calculo: string | null

  custo_unitario: number | null
  custo_total: number | null
  valor_venda: number | null

  faturamento_kemia: number | null
  faturamento_direto: number | null
  margem_percentual: number | null

  nome_comercial: string | null
  descricao_comercial: string | null

  quantidade_comercial: number | null
  unidade_comercial: string | null

  exibir_na_proposta: boolean
  item_opcional: boolean

  origem_aba: string | null
  origem_linha: number | null

  dados_adicionais?: Record<string, unknown>

  created_at: string
  updated_at: string
}

export interface ImportacaoOrcamentoSalva {
  id: string

  orcamento_id: string
  revisao_id: string

  nome_arquivo: string
  tamanho_bytes?: number | null
  hash_sha256?: string | null

  modelo_planilha: string | null
  versao_planilha: string | null

  dados_origem: Record<string, unknown>

  importado_por?: string | null
  created_at: string

  revisao: RevisaoOrcamento
  itens: ItemOrcamentoSalvo[]
  demandasVinculadas: DemandaVinculavel[]
}

export interface ResultadoImportacaoPlanilha {
  importacaoId: string
  revisaoId: string
  numeroRevisao: number

  quantidadeItens: number
  quantidadeDemandasVinculadas: number

  custoTotal: number
  valorVendaTotal: number
}

export interface SalvarImportacaoPlanilhaPayload {
  orcamentoId: string
  preview: PreviewPlanilhaOrcamentaria
  nomeAba: string

  numeroRevisao: number
  motivoRevisao: string
  observacaoRevisao?: string

  demandaIds: string[]
}

export interface AtualizarItemComercialPayload {
  id: string
  orcamentoId: string
  revisaoId: string

  nomeComercial: string
  descricaoComercial: string

  quantidadeComercial: number
  unidadeComercial: string

  exibirNaProposta: boolean
  itemOpcional: boolean
}

export interface AtualizarVinculosDemandasPayload {
  orcamentoId: string
  revisaoId: string
  demandaIds: string[]
}

export interface ResumoRevisaoOrcamento {
  revisao: RevisaoOrcamento

  importacao: {
    id: string
    nomeArquivo: string
    createdAt: string
  } | null

  quantidadeItens: number
  quantidadeDemandasVinculadas: number

  custoTotal: number
  valorVendaTotal: number
  faturamentoKemia: number
  faturamentoDireto: number
}