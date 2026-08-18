import {
  read,
  utils,
} from 'xlsx'

import type {
  CellObject,
  WorkBook,
  WorkSheet,
} from 'xlsx'

import type {
  DadosPropostaPlanilha,
  ItemPlanilhaPreview,
  PreviewPlanilhaOrcamentaria,
  ResumoAbaComposicao,
} from '../types'

const NOME_ABA_DADOS =
  'DADOS'

const NOME_ABA_COMPOSICAO_PADRAO =
  'COMPOSICAO'

const PREFIXO_ABA_COMPOSICAO =
  'COMPOSICAO'

const CAMPOS_NOMEADOS = {
  modeloProposta:
    'ModeloProposta',

  tipoFrete:
    'TipoFrete',

  tipoInstalacao:
    'TipoInstalacao',

  objetivoContratacao:
    'ObjetivoContratacao',

  numeroProposta:
    'NumeroProposta',

  dataProposta:
    'DataProposta',

  revisao:
    'RevisaoProposta',

  nomeCliente:
    'NomeCliente',

  cnpj:
    'CNPJCliente',

  aosCuidados:
    'AosCuidados',

  emailCliente:
    'EmailCliente',

  telefoneCliente:
    'TelefoneCliente',

  enderecoCliente:
    'EnderecoCliente',

  bairroCliente:
    'BairroCliente',

  cidadeCliente:
    'CidadeCliente',

  ufCliente:
    'UFCliente',

  cepCliente:
    'CEPCliente',

  nomeVendedor:
    'NomeVendedor',

  cargoVendedor:
    'CargoVendedor',

  telefoneVendedor:
    'TelefoneVendedor',

  emailVendedor:
    'EmailVendedor',

  exibirDadosProjeto:
    'ExibirDadosProjeto',

  exibirRegimeOperacao:
    'ExibirRegimeOperacao',

  exibirFluxograma:
    'ExibirFluxograma',
} as const

const NOMES_LINHAS_RESUMO =
  new Set([
    'KEMIA',
    'DIRETO',
    'TOTAL',
    'INSTALACAO',
    'START-UP',
    'STARTUP',
  ])

function normalizarTexto(
  valor: unknown,
) {
  return String(
    valor ?? '',
  )
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .trim()
    .toUpperCase()
}

function transformarEmTexto(
  valor: unknown,
): string | null {
  if (
    valor === null ||
    valor === undefined
  ) {
    return null
  }

  const texto =
    String(valor).trim()

  if (
    !texto ||
    texto.startsWith('#')
  ) {
    return null
  }

  return texto
}

function transformarEmNumero(
  valor: unknown,
): number {
  if (
    typeof valor === 'number' &&
    Number.isFinite(valor)
  ) {
    return valor
  }

  if (
    typeof valor !== 'string'
  ) {
    return 0
  }

  const texto =
    valor.trim()

  if (!texto) {
    return 0
  }

  const textoSemMoeda =
    texto.replace(
      /R\$\s?/gi,
      '',
    )

  const possuiVirgula =
    textoSemMoeda.includes(',')

  const textoNormalizado =
    possuiVirgula
      ? textoSemMoeda
          .replace(/\./g, '')
          .replace(',', '.')
      : textoSemMoeda

  const numero =
    Number(
      textoNormalizado.replace(
        /[^0-9.-]/g,
        '',
      ),
    )

  return Number.isFinite(numero)
    ? numero
    : 0
}

function arredondarMoeda(
  valor: number,
) {
  return (
    Math.round(
      (
        valor +
        Number.EPSILON
      ) *
        100,
    ) /
    100
  )
}

function obterCelula(
  aba: WorkSheet,
  endereco: string,
): CellObject | undefined {
  return aba[
    endereco
  ] as
    | CellObject
    | undefined
}

function obterValorCelula(
  aba: WorkSheet,
  endereco: string,
): unknown {
  return obterCelula(
    aba,
    endereco,
  )?.v
}

function obterTextoCelula(
  aba: WorkSheet,
  endereco: string,
) {
  return transformarEmTexto(
    obterValorCelula(
      aba,
      endereco,
    ),
  )
}

function obterNumeroCelula(
  aba: WorkSheet,
  endereco: string,
) {
  return transformarEmNumero(
    obterValorCelula(
      aba,
      endereco,
    ),
  )
}

function formatarDataExcel(
  valor: unknown,
): string | null {
  if (
    valor instanceof Date
  ) {
    return valor
      .toISOString()
      .slice(0, 10)
  }

  if (
    typeof valor === 'number' &&
    Number.isFinite(valor)
  ) {
    const inicioExcel =
      Date.UTC(
        1899,
        11,
        30,
      )

    const data =
      new Date(
        inicioExcel +
          valor *
            24 *
            60 *
            60 *
            1000,
      )

    return data
      .toISOString()
      .slice(0, 10)
  }

  const texto =
    transformarEmTexto(valor)

  if (!texto) {
    return null
  }

  const correspondencia =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    )

  if (
    correspondencia
  ) {
    const [
      ,
      dia,
      mes,
      ano,
    ] = correspondencia

    return `${ano}-${mes.padStart(
      2,
      '0',
    )}-${dia.padStart(
      2,
      '0',
    )}`
  }

  return texto
}

function transformarEmBooleano(
  valor: unknown,
) {
  if (
    typeof valor === 'boolean'
  ) {
    return valor
  }

  if (
    typeof valor === 'number'
  ) {
    return valor !== 0
  }

  const texto =
    normalizarTexto(valor)

  return [
    'TRUE',
    'VERDADEIRO',
    'SIM',
    'X',
    '☒',
    '☑',
    '1',
  ].includes(texto)
}

function encontrarNomeAba(
  workbook: WorkBook,
  nomeProcurado: string,
) {
  const nomeNormalizado =
    normalizarTexto(
      nomeProcurado,
    )

  return (
    workbook.SheetNames.find(
      (nomeAba) =>
        normalizarTexto(
          nomeAba,
        ) ===
        nomeNormalizado,
    ) ?? null
  )
}

function obterReferenciaNomeada(
  workbook: WorkBook,
  nome: string,
): {
  nomeAba: string
  endereco: string
} | null {
  const nomeEncontrado =
    workbook.Workbook
      ?.Names?.find(
        (item) =>
          item.Name === nome,
      )

  const referencia =
    nomeEncontrado?.Ref

  if (
    !referencia ||
    referencia.includes(':')
  ) {
    return null
  }

  const indiceSeparador =
    referencia.lastIndexOf('!')

  if (
    indiceSeparador < 0
  ) {
    return null
  }

  const nomeAba =
    referencia
      .slice(
        0,
        indiceSeparador,
      )
      .replace(/^'/, '')
      .replace(/'$/, '')
      .replace(/''/g, "'")

  const endereco =
    referencia
      .slice(
        indiceSeparador + 1,
      )
      .replace(/\$/g, '')

  return {
    nomeAba,
    endereco,
  }
}

function obterValorNomeado(
  workbook: WorkBook,
  nome: string,
): unknown {
  const referencia =
    obterReferenciaNomeada(
      workbook,
      nome,
    )

  if (!referencia) {
    return null
  }

  const aba =
    workbook.Sheets[
      referencia.nomeAba
    ]

  if (!aba) {
    return null
  }

  return obterValorCelula(
    aba,
    referencia.endereco,
  )
}

function obterTextoNomeado(
  workbook: WorkBook,
  nome: string,
) {
  return transformarEmTexto(
    obterValorNomeado(
      workbook,
      nome,
    ),
  )
}

function obterBooleanoNomeado(
  workbook: WorkBook,
  nome: string,
) {
  return transformarEmBooleano(
    obterValorNomeado(
      workbook,
      nome,
    ),
  )
}

function textoNomeadoOuCelula(
  workbook: WorkBook,
  nomeCampo: string,
  abaDados: WorkSheet | undefined,
  enderecoAlternativo: string,
) {
  return (
    obterTextoNomeado(
      workbook,
      nomeCampo,
    ) ??
    (
      abaDados
        ? obterTextoCelula(
            abaDados,
            enderecoAlternativo,
          )
        : null
    )
  )
}

function valorNomeadoOuCelula(
  workbook: WorkBook,
  nomeCampo: string,
  abaDados: WorkSheet | undefined,
  enderecoAlternativo: string,
) {
  const valorNomeado =
    obterValorNomeado(
      workbook,
      nomeCampo,
    )

  if (
    valorNomeado !== null &&
    valorNomeado !== undefined
  ) {
    return valorNomeado
  }

  return abaDados
    ? obterValorCelula(
        abaDados,
        enderecoAlternativo,
      )
    : null
}

function booleanoNomeadoOuCelula(
  workbook: WorkBook,
  nomeCampo: string,
  abaDados: WorkSheet | undefined,
  enderecoAlternativo: string,
) {
  const referencia =
    obterReferenciaNomeada(
      workbook,
      nomeCampo,
    )

  if (referencia) {
    return obterBooleanoNomeado(
      workbook,
      nomeCampo,
    )
  }

  return abaDados
    ? transformarEmBooleano(
        obterValorCelula(
          abaDados,
          enderecoAlternativo,
        ),
      )
    : false
}

function criarDadosPropostaVazios(): DadosPropostaPlanilha {
  return {
    modeloProposta: null,
    tipoFrete: null,
    tipoInstalacao: null,
    objetivoContratacao: null,

    numeroProposta: null,
    dataProposta: null,
    revisao: null,

    nomeCliente: null,
    razaoSocial: null,
    cnpj: null,
    aosCuidados: null,
    emailCliente: null,
    telefoneCliente: null,
    enderecoCliente: null,
    bairroCliente: null,
    cidadeCliente: null,
    ufCliente: null,
    cepCliente: null,

    nomeVendedor: null,
    cargoVendedor: null,
    telefoneVendedor: null,
    emailVendedor: null,

    exibirDadosProjeto: false,
    exibirRegimeOperacao: false,
    exibirFluxograma: false,

    arquivoWordSelecionado: null,
  }
}

function lerDadosProposta(
  workbook: WorkBook,
): DadosPropostaPlanilha {
  const nomeAbaDados =
    encontrarNomeAba(
      workbook,
      NOME_ABA_DADOS,
    )

  const abaDados =
    nomeAbaDados
      ? workbook.Sheets[
          nomeAbaDados
        ]
      : undefined

  const possuiCamposNomeados =
    Object.values(
      CAMPOS_NOMEADOS,
    ).some(
      (nome) =>
        obterReferenciaNomeada(
          workbook,
          nome,
        ) !== null,
    )

  if (
    !abaDados &&
    !possuiCamposNomeados
  ) {
    return criarDadosPropostaVazios()
  }

  return {
    modeloProposta:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.modeloProposta,
        abaDados,
        'C4',
      ),

    tipoFrete:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.tipoFrete,
        abaDados,
        'C5',
      ),

    tipoInstalacao:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.tipoInstalacao,
        abaDados,
        'C6',
      ),

    objetivoContratacao:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.objetivoContratacao,
        abaDados,
        'F4',
      ),

    numeroProposta:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.numeroProposta,
        abaDados,
        'C8',
      ),

    dataProposta:
      formatarDataExcel(
        valorNomeadoOuCelula(
          workbook,
          CAMPOS_NOMEADOS.dataProposta,
          abaDados,
          'C10',
        ),
      ),

    revisao:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.revisao,
        abaDados,
        'C11',
      ),

    nomeCliente:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.nomeCliente,
        abaDados,
        'C9',
      ),

    razaoSocial: null,

    cnpj:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.cnpj,
        abaDados,
        'C12',
      ),

    aosCuidados:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.aosCuidados,
        abaDados,
        'C13',
      ),

    emailCliente:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.emailCliente,
        abaDados,
        'C14',
      ),

    telefoneCliente:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.telefoneCliente,
        abaDados,
        'C15',
      ),

    enderecoCliente:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.enderecoCliente,
        abaDados,
        'F8',
      ),

    bairroCliente:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.bairroCliente,
        abaDados,
        'F9',
      ),

    cidadeCliente:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.cidadeCliente,
        abaDados,
        'F10',
      ),

    ufCliente:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.ufCliente,
        abaDados,
        'F11',
      ),

    cepCliente:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.cepCliente,
        abaDados,
        'F12',
      ),

    nomeVendedor:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.nomeVendedor,
        abaDados,
        'C16',
      ),

    cargoVendedor:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.cargoVendedor,
        abaDados,
        'C17',
      ),

    telefoneVendedor:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.telefoneVendedor,
        abaDados,
        'C18',
      ),

    emailVendedor:
      textoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.emailVendedor,
        abaDados,
        'C19',
      ),

    exibirDadosProjeto:
      booleanoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.exibirDadosProjeto,
        abaDados,
        'H9',
      ),

    exibirRegimeOperacao:
      booleanoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.exibirRegimeOperacao,
        abaDados,
        'H10',
      ),

    exibirFluxograma:
      booleanoNomeadoOuCelula(
        workbook,
        CAMPOS_NOMEADOS.exibirFluxograma,
        abaDados,
        'H11',
      ),

    arquivoWordSelecionado:
      abaDados
        ? obterTextoCelula(
            abaDados,
            'C21',
          )
        : null,
  }
}

function localizarLinhasCabecalho(
  aba: WorkSheet,
) {
  const referencia =
    aba['!ref']

  if (!referencia) {
    return []
  }

  const intervalo =
    utils.decode_range(
      referencia,
    )

  const linhas: number[] = []

  for (
    let linha =
      intervalo.s.r;
    linha <=
    intervalo.e.r;
    linha += 1
  ) {
    const textoItens =
      normalizarTexto(
        obterValorCelula(
          aba,
          utils.encode_cell({
            r: linha,
            c: 2,
          }),
        ),
      )

    const textoQuantidade =
      normalizarTexto(
        obterValorCelula(
          aba,
          utils.encode_cell({
            r: linha,
            c: 4,
          }),
        ),
      )

    if (
      textoItens.includes('ITENS') &&
      textoQuantidade.includes('QTDE')
    ) {
      linhas.push(linha)
    }
  }

  return linhas
}

function secaoEhOpcional(
  aba: WorkSheet,
  linhaCabecalho: number,
) {
  const primeiraLinha =
    Math.max(
      0,
      linhaCabecalho - 4,
    )

  for (
    let linha =
      primeiraLinha;
    linha <
    linhaCabecalho;
    linha += 1
  ) {
    for (
      let coluna = 0;
      coluna <= 8;
      coluna += 1
    ) {
      const texto =
        normalizarTexto(
          obterValorCelula(
            aba,
            utils.encode_cell({
              r: linha,
              c: coluna,
            }),
          ),
        )

      if (
        texto.includes(
          'OPCIONAIS',
        )
      ) {
        return true
      }
    }
  }

  return false
}

function linhaEhResumo(
  aba: WorkSheet,
  linha: number,
) {
  const categoria =
    normalizarTexto(
      obterValorCelula(
        aba,
        utils.encode_cell({
          r: linha,
          c: 1,
        }),
      ),
    )

  return NOMES_LINHAS_RESUMO.has(
    categoria,
  )
}

function obterLimiteSecao(
  aba: WorkSheet,
  linhaCabecalho: number,
  proximoCabecalho:
    | number
    | undefined,
) {
  const referencia =
    aba['!ref']

  if (!referencia) {
    return linhaCabecalho + 1
  }

  const intervalo =
    utils.decode_range(
      referencia,
    )

  const limiteNatural =
    proximoCabecalho ??
    intervalo.e.r + 1

  for (
    let linha =
      linhaCabecalho + 1;
    linha <
    limiteNatural;
    linha += 1
  ) {
    if (
      linhaEhResumo(
        aba,
        linha,
      )
    ) {
      return linha
    }
  }

  return limiteNatural
}

function lerItensSecao(
  aba: WorkSheet,
  nomeAba: string,
  linhaCabecalho: number,
  linhaLimite: number,
  itemOpcional: boolean,
  percentualFormacaoVenda: number,
  ordemInicial: number,
) {
  const itens:
    ItemPlanilhaPreview[] = []

  let categoriaAtual:
    | string
    | null = null

  for (
    let linha =
      linhaCabecalho + 1;
    linha <
    linhaLimite;
    linha += 1
  ) {
    const numeroLinha =
      linha + 1

    const categoriaLinha =
      transformarEmTexto(
        obterValorCelula(
          aba,
          `B${numeroLinha}`,
        ),
      )

    const nomeInterno =
      obterTextoCelula(
        aba,
        `C${numeroLinha}`,
      )

    const descricaoInterna =
      obterTextoCelula(
        aba,
        `D${numeroLinha}`,
      )

    if (categoriaLinha) {
      categoriaAtual =
        categoriaLinha
    }

    if (
      !nomeInterno &&
      !descricaoInterna
    ) {
      continue
    }

    const quantidade =
      obterNumeroCelula(
        aba,
        `E${numeroLinha}`,
      )

    const custoUnitario =
      obterNumeroCelula(
        aba,
        `F${numeroLinha}`,
      )

    const custoTotalPlanilha =
      obterNumeroCelula(
        aba,
        `G${numeroLinha}`,
      )

    const tipoFaturamento =
      obterTextoCelula(
        aba,
        `H${numeroLinha}`,
      )

    const valorVendaPlanilha =
      obterNumeroCelula(
        aba,
        `I${numeroLinha}`,
      )

    const custoTotal =
      custoTotalPlanilha ||
      arredondarMoeda(
        quantidade *
          custoUnitario,
      )

    const faturamentoNormalizado =
      normalizarTexto(
        tipoFaturamento,
      )

    const faturamentoEhDireto =
      faturamentoNormalizado.includes(
        'DIRETO',
      )

    const valorVendaCalculado =
      faturamentoEhDireto
        ? custoTotal
        : percentualFormacaoVenda < 1
          ? custoTotal /
            (
              1 -
              percentualFormacaoVenda
            )
          : 0

    const valorVenda =
      arredondarMoeda(
        valorVendaPlanilha ||
          valorVendaCalculado,
      )

    itens.push({
      ordem:
        ordemInicial +
        itens.length,

      categoria:
        categoriaAtual,

      codigo: null,

      nomeInterno:
        nomeInterno ??
        descricaoInterna ??
        `Item ${numeroLinha}`,

      descricaoInterna,

      quantidadeCalculo:
        quantidade,

      unidadeCalculo: null,

      custoUnitario:
        arredondarMoeda(
          custoUnitario,
        ),

      custoTotal:
        arredondarMoeda(
          custoTotal,
        ),

      tipoFaturamento,

      valorVenda,

      faturamentoKemia:
        faturamentoEhDireto
          ? 0
          : valorVenda,

      faturamentoDireto:
        faturamentoEhDireto
          ? valorVenda
          : 0,

      margemPercentual:
        percentualFormacaoVenda,

      nomeComercial:
        nomeInterno ??
        descricaoInterna ??
        `Item ${numeroLinha}`,

      descricaoComercial:
        descricaoInterna,

      quantidadeComercial:
        quantidade,

      unidadeComercial: null,

      exibirNaProposta: true,
      itemOpcional,

      origemAba:
        nomeAba,

      origemLinha:
        numeroLinha,
    })
  }

  return itens
}

function lerAbaComposicao(
  aba: WorkSheet,
  nomeAba: string,
): ResumoAbaComposicao {
  const linhasCabecalho =
    localizarLinhasCabecalho(
      aba,
    )

  const percentualFormacaoVenda =
    obterNumeroCelula(
      aba,
      'E5',
    )

  const itens:
    ItemPlanilhaPreview[] = []

  linhasCabecalho.forEach(
    (
      linhaCabecalho,
      indice,
    ) => {
      const proximoCabecalho =
        linhasCabecalho[
          indice + 1
        ]

      const linhaLimite =
        obterLimiteSecao(
          aba,
          linhaCabecalho,
          proximoCabecalho,
        )

      const itemOpcional =
        secaoEhOpcional(
          aba,
          linhaCabecalho,
        )

      const itensSecao =
        lerItensSecao(
          aba,
          nomeAba,
          linhaCabecalho,
          linhaLimite,
          itemOpcional,
          percentualFormacaoVenda,
          itens.length,
        )

      itens.push(
        ...itensSecao,
      )
    },
  )

  const custoTotal =
    arredondarMoeda(
      itens.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.custoTotal,
        0,
      ),
    )

  const valorVendaTotal =
    arredondarMoeda(
      itens.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.valorVenda,
        0,
      ),
    )

  const faturamentoKemia =
    arredondarMoeda(
      itens.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.faturamentoKemia,
        0,
      ),
    )

  const faturamentoDireto =
    arredondarMoeda(
      itens.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.faturamentoDireto,
        0,
      ),
    )

  return {
    nomeAba,
    itens,
    custoTotal,
    valorVendaTotal,
    faturamentoKemia,
    faturamentoDireto,
  }
}

function selecionarAbaSugerida(
  abas: ResumoAbaComposicao[],
) {
  if (
    abas.length === 0
  ) {
    return null
  }

  const abaComposicaoPadrao =
    abas.find(
      (aba) =>
        normalizarTexto(
          aba.nomeAba,
        ) ===
        NOME_ABA_COMPOSICAO_PADRAO,
    )

  if (
    abaComposicaoPadrao
  ) {
    return abaComposicaoPadrao.nomeAba
  }

  return (
    abas[0]?.nomeAba ??
    null
  )
}

function workbookPossuiCamposNomeados(
  workbook: WorkBook,
) {
  return Object.values(
    CAMPOS_NOMEADOS,
  ).some(
    (nome) =>
      obterReferenciaNomeada(
        workbook,
        nome,
      ) !== null,
  )
}

export async function lerPlanilhaOrcamentaria(
  arquivo: File,
): Promise<PreviewPlanilhaOrcamentaria> {
  const extensao =
    arquivo.name
      .split('.')
      .pop()
      ?.toLowerCase()

  if (
    extensao !== 'xlsm' &&
    extensao !== 'xlsx' &&
    extensao !== 'xls'
  ) {
    throw new Error(
      'Selecione uma planilha nos formatos .xlsm, .xlsx ou .xls.',
    )
  }

  const conteudo =
    await arquivo.arrayBuffer()

  const workbook =
    read(
      conteudo,
      {
        type: 'array',
        cellDates: true,
        cellFormula: true,
        cellText: true,
        dense: false,
        bookVBA: true,
      },
    )

  const alertas: string[] = []

  const nomeAbaDados =
    encontrarNomeAba(
      workbook,
      NOME_ABA_DADOS,
    )

  const possuiCamposNomeados =
    workbookPossuiCamposNomeados(
      workbook,
    )

  const planilhaAutomatizada =
    Boolean(
      nomeAbaDados ||
      possuiCamposNomeados,
    )

  const nomesAbasComposicao =
    workbook.SheetNames.filter(
      (nomeAba) =>
        normalizarTexto(
          nomeAba,
        ).startsWith(
          PREFIXO_ABA_COMPOSICAO,
        ),
    )

  if (
    nomesAbasComposicao.length ===
    0
  ) {
    throw new Error(
      'A planilha não possui nenhuma aba de composição reconhecida.',
    )
  }

  const abasComposicao =
    nomesAbasComposicao
      .map(
        (nomeAba) =>
          lerAbaComposicao(
            workbook.Sheets[
              nomeAba
            ],
            nomeAba,
          ),
      )
      .filter(
        (aba) =>
          aba.itens.length > 0,
      )

  if (
    abasComposicao.length ===
    0
  ) {
    throw new Error(
      'Nenhuma composição preenchida foi localizada na planilha.',
    )
  }

  if (
    abasComposicao.some(
      (aba) =>
        normalizarTexto(
          aba.nomeAba,
        ).includes(
          'ELEVATORIAS',
        ),
    )
  ) {
    alertas.push(
      'A aba "COMPOSIÇÃO ELEVATÓRIAS PRFV" somente será utilizada se for selecionada manualmente.',
    )
  }

  const dadosProposta =
    lerDadosProposta(
      workbook,
    )

  if (
    planilhaAutomatizada
  ) {
    alertas.push(
      'Os dados existentes no sistema terão prioridade sobre os dados da aba DADOS.',
    )
  } else {
    alertas.push(
      'Planilha padrão reconhecida. Os dados do cliente e da proposta serão obtidos pelo sistema.',
    )
  }

  if (
    abasComposicao.some(
      (aba) =>
        aba.itens.some(
          (item) =>
            item.quantidadeCalculo >
              1 &&
            item.unidadeCalculo ===
              null,
        ),
    )
  ) {
    alertas.push(
      'Revise as quantidades comerciais antes de gerar a proposta. A quantidade de cálculo pode representar peso ou consumo interno.',
    )
  }

  return {
    nomeArquivo:
      arquivo.name,

    tamanhoBytes:
      arquivo.size,

    modeloPlanilha:
      planilhaAutomatizada
        ? 'Planilha Orçamentária Automatizada'
        : 'Planilha Orçamentária Padrão',

    versaoPlanilha:
      planilhaAutomatizada
        ? 'Com dados complementares'
        : 'Composição padrão',

    possuiMacros:
      extensao === 'xlsm',

    dadosProposta,

    abasComposicao,

    abaSugerida:
      selecionarAbaSugerida(
        abasComposicao,
      ),

    alertas,
  }
}