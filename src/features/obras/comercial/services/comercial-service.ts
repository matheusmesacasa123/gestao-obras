import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  AcompanhamentoComercial,
  CategoriaRecusa,
  MovimentacaoComercial,
  StatusComercial,
} from "../types";

export interface DemandaOpcaoComercial {
  id: string;
  titulo: string;
  numero_revisao: number;
  grupo_revisao_id: string;
  status_revisao: string;
}

export interface UsuarioOpcaoComercial {
  id: string;
  nome: string;
  email: string;
}

export interface DocumentoOpcaoComercial {
  id: string;
  demanda_id: string;
  nome: string;
  arquivo_url: string;
}

export interface DadosRegistroComercial {
  demandaId: string;
  statusNovo: StatusComercial;
  dataEnvio?: string | null;
  dataUltimoContato?: string | null;
  dataProximoContato?: string | null;
  responsavelId?: string | null;
  documentoId?: string | null;
  valorProposta?: number | null;
  numeroPedido?: string | null;
  motivoEspera?: string | null;
  motivoRecusa?: string | null;
  categoriaRecusa?: CategoriaRecusa | null;
  observacao?: string | null;
}

interface AcompanhamentoComercialConsulta {
  id: string;
  obra_id: string;
  demanda_id: string;
  status: AcompanhamentoComercial["status"];
  data_envio: string | null;
  data_ultimo_contato: string | null;
  data_proximo_contato: string | null;
  responsavel_id: string | null;
  documento_id: string | null;
  valor_proposta: number | null;
  numero_pedido: string | null;
  motivo_espera: string | null;
  motivo_recusa: string | null;
  categoria_recusa: AcompanhamentoComercial["categoria_recusa"];
  observacao: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;

  demanda:
    | {
        id: string;
        titulo: string;
        numero_revisao: number;
        grupo_revisao_id: string;
        status_revisao: string;
      }
    | {
        id: string;
        titulo: string;
        numero_revisao: number;
        grupo_revisao_id: string;
        status_revisao: string;
      }[];

  responsavel:
    | {
        id: string;
        nome: string;
        email: string;
      }
    | {
        id: string;
        nome: string;
        email: string;
      }[]
    | null;

  documento:
    | {
        id: string;
        nome: string;
        arquivo_url: string;
      }
    | {
        id: string;
        nome: string;
        arquivo_url: string;
      }[]
    | null;
}

interface MovimentacaoComercialConsulta {
  id: string;
  acompanhamento_id: string;
  status_anterior: MovimentacaoComercial["status_anterior"];
  status_novo: MovimentacaoComercial["status_novo"];
  data_movimentacao: string;
  usuario_id: string | null;
  observacao: string | null;
  motivo: string | null;
  created_at: string;

  usuario:
    | {
        id: string;
        nome: string;
        email: string;
      }
    | {
        id: string;
        nome: string;
        email: string;
      }[]
    | null;
}

function primeiroRelacionamento<T>(
  valor: T | T[] | null
): T | null {
  if (Array.isArray(valor)) {
    return valor[0] ?? null;
  }

  return valor;
}

export async function getAcompanhamentosComerciaisPorObra(
  obraId: string
): Promise<AcompanhamentoComercial[]> {
  const {
    data: acompanhamentos,
    error: acompanhamentosError,
  } = await supabase
    .from("acompanhamentos_comerciais")
    .select(`
      id,
      obra_id,
      demanda_id,
      status,
      data_envio,
      data_ultimo_contato,
      data_proximo_contato,
      responsavel_id,
      documento_id,
      valor_proposta,
      numero_pedido,
      motivo_espera,
      motivo_recusa,
      categoria_recusa,
      observacao,
      criado_por,
      created_at,
      updated_at,
      demanda:demandas!acompanhamentos_comerciais_demanda_id_fkey (
        id,
        titulo,
        numero_revisao,
        grupo_revisao_id,
        status_revisao
      ),
      responsavel:usuarios!acompanhamentos_comerciais_responsavel_id_fkey (
        id,
        nome,
        email
      ),
      documento:documentos!acompanhamentos_comerciais_documento_id_fkey (
        id,
        nome,
        arquivo_url
      )
    `)
    .eq(
      "obra_id",
      obraId
    )
    .order(
      "updated_at",
      {
        ascending:
          false,
      }
    );

  if (acompanhamentosError) {
    throw acompanhamentosError;
  }

  const listaAcompanhamentos =
    (
      acompanhamentos ??
      []
    ) as unknown as AcompanhamentoComercialConsulta[];

  if (
    listaAcompanhamentos.length ===
    0
  ) {
    return [];
  }

  const acompanhamentoIds =
    listaAcompanhamentos.map(
      (
        acompanhamento
      ) =>
        acompanhamento.id
    );

  const {
    data: movimentacoes,
    error: movimentacoesError,
  } = await supabase
    .from(
      "acompanhamento_comercial_movimentacoes"
    )
    .select(`
      id,
      acompanhamento_id,
      status_anterior,
      status_novo,
      data_movimentacao,
      usuario_id,
      observacao,
      motivo,
      created_at,
      usuario:usuarios!acompanhamento_comercial_movimentacoes_usuario_id_fkey (
        id,
        nome,
        email
      )
    `)
    .in(
      "acompanhamento_id",
      acompanhamentoIds
    )
    .order(
      "data_movimentacao",
      {
        ascending:
          false,
      }
    );

  if (movimentacoesError) {
    throw movimentacoesError;
  }

  const listaMovimentacoes =
    (
      movimentacoes ??
      []
    ) as unknown as MovimentacaoComercialConsulta[];

  const movimentacoesPorAcompanhamento =
    new Map<
      string,
      MovimentacaoComercial[]
    >();

  for (
    const movimentacao
    of listaMovimentacoes
  ) {
    const listaAtual =
      movimentacoesPorAcompanhamento.get(
        movimentacao.acompanhamento_id
      ) ??
      [];

    listaAtual.push({
      id:
        movimentacao.id,

      acompanhamento_id:
        movimentacao.acompanhamento_id,

      status_anterior:
        movimentacao.status_anterior,

      status_novo:
        movimentacao.status_novo,

      data_movimentacao:
        movimentacao.data_movimentacao,

      usuario_id:
        movimentacao.usuario_id,

      observacao:
        movimentacao.observacao,

      motivo:
        movimentacao.motivo,

      created_at:
        movimentacao.created_at,

      usuario:
        primeiroRelacionamento(
          movimentacao.usuario
        ),
    });

    movimentacoesPorAcompanhamento.set(
      movimentacao.acompanhamento_id,
      listaAtual
    );
  }

  return listaAcompanhamentos.map(
    (
      acompanhamento
    ) => {
      const demanda =
        primeiroRelacionamento(
          acompanhamento.demanda
        );

      if (!demanda) {
        throw new Error(
          "A demanda vinculada ao acompanhamento comercial não foi encontrada."
        );
      }

      return {
        id:
          acompanhamento.id,

        obra_id:
          acompanhamento.obra_id,

        demanda_id:
          acompanhamento.demanda_id,

        status:
          acompanhamento.status,

        data_envio:
          acompanhamento.data_envio,

        data_ultimo_contato:
          acompanhamento.data_ultimo_contato,

        data_proximo_contato:
          acompanhamento.data_proximo_contato,

        responsavel_id:
          acompanhamento.responsavel_id,

        documento_id:
          acompanhamento.documento_id,

        valor_proposta:
          acompanhamento.valor_proposta,

        numero_pedido:
          acompanhamento.numero_pedido,

        motivo_espera:
          acompanhamento.motivo_espera,

        motivo_recusa:
          acompanhamento.motivo_recusa,

        categoria_recusa:
          acompanhamento.categoria_recusa,

        observacao:
          acompanhamento.observacao,

        criado_por:
          acompanhamento.criado_por,

        created_at:
          acompanhamento.created_at,

        updated_at:
          acompanhamento.updated_at,

        demanda,

        responsavel:
          primeiroRelacionamento(
            acompanhamento.responsavel
          ),

        documento:
          primeiroRelacionamento(
            acompanhamento.documento
          ),

        movimentacoes:
          movimentacoesPorAcompanhamento.get(
            acompanhamento.id
          ) ??
          [],
      };
    }
  );
}

export async function getDemandasComerciaisPorObra(
  obraId: string
): Promise<DemandaOpcaoComercial[]> {
  const {
    data,
    error,
  } = await supabase
    .from("demandas")
    .select(`
      id,
      titulo,
      numero_revisao,
      grupo_revisao_id,
      status_revisao
    `)
    .eq(
      "obra_id",
      obraId
    )
    .order(
      "titulo",
      {
        ascending:
          true,
      }
    )
    .order(
      "numero_revisao",
      {
        ascending:
          false,
      }
    );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as DemandaOpcaoComercial[];
}

export async function getUsuariosAtivosComercial(): Promise<
  UsuarioOpcaoComercial[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("usuarios")
    .select(`
      id,
      nome,
      email
    `)
    .eq(
      "ativo",
      true
    )
    .order(
      "nome",
      {
        ascending:
          true,
      }
    );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as UsuarioOpcaoComercial[];
}

export async function getDocumentosComerciaisPorObra(
  obraId: string
): Promise<DocumentoOpcaoComercial[]> {
  const {
    data,
    error,
  } = await supabase
    .from("documentos")
    .select(`
      id,
      demanda_id,
      nome,
      arquivo_url
    `)
    .eq(
      "obra_id",
      obraId
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      }
    );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as DocumentoOpcaoComercial[];
}

export async function registrarMovimentacaoComercial(
  dados: DadosRegistroComercial
): Promise<string> {
  const {
    data,
    error,
  } = await supabase.rpc(
    "registrar_movimentacao_comercial",
    {
      p_demanda_id:
        dados.demandaId,

      p_status_novo:
        dados.statusNovo,

      p_data_envio:
        dados.dataEnvio ||
        null,

      p_data_ultimo_contato:
        dados.dataUltimoContato ||
        null,

      p_data_proximo_contato:
        dados.dataProximoContato ||
        null,

      p_responsavel_id:
        dados.responsavelId ||
        null,

      p_documento_id:
        dados.documentoId ||
        null,

      p_valor_proposta:
        dados.valorProposta ??
        null,

      p_numero_pedido:
        dados.numeroPedido ||
        null,

      p_motivo_espera:
        dados.motivoEspera ||
        null,

      p_motivo_recusa:
        dados.motivoRecusa ||
        null,

      p_categoria_recusa:
        dados.categoriaRecusa ||
        null,

      p_observacao:
        dados.observacao ||
        null,
    }
  );

  if (error) {
    throw error;
  }

  if (
    typeof data !==
    "string"
  ) {
    throw new Error(
      "O acompanhamento comercial foi salvo, mas o identificador não foi retornado."
    );
  }

  return data;
}