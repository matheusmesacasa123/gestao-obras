import {
  supabase,
} from "@/integrations/supabase/client";

export type StatusEtapaExecucao =
  | "nao_iniciada"
  | "em_andamento"
  | "aguardando_outro_setor"
  | "aguardando_cliente"
  | "bloqueada"
  | "concluida";

export type StatusRevisaoEtapaExecucao =
  | "ativa"
  | "encerrada";

/**
 * Tipo mantido para preservar o mesmo contrato visual das etapas da Orçamentação
 * em componentes ainda não migrados.
 *
 * Não representa mais uma tabela etapa_revisoes.
 */
export type RevisaoEtapaExecucao = {
  id: string;
  etapa_id: string;
  numero_revisao: number;
  status: StatusEtapaExecucao;
  responsavel_id: string | null;
  data_inicio: string | null;
  prazo: string | null;
  data_conclusao: string | null;
  motivo_revisao: string | null;
  observacao: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;

  responsavel?: {
    id: string;
    nome: string;
    email: string;
  } | null;
};

export type EtapaExecucao = {
  id: string;
  obra_id: string;
  setor_id: string;
  responsavel_id: string | null;

  titulo: string | null;

  status: StatusEtapaExecucao;

  data_inicio: string | null;
  prazo: string | null;
  data_conclusao: string | null;

  observacao: string | null;

  obrigatoria: boolean;
  ordem: number | null;

  created_at: string;
  updated_at: string;

  setor?: {
    id: string;
    nome: string;
  } | null;

  responsavel?: {
    id: string;
    nome: string;
    email: string;
  } | null;

};

export type CriarEtapaExecucaoDados = {
  obra_id: string;
  setor_id: string;
  responsavel_id?: string | null;
  titulo: string;
  status?: StatusEtapaExecucao;
  data_inicio?: string | null;
  prazo?: string | null;
  observacao?: string | null;
  obrigatoria?: boolean;
};

export type AtualizarEtapaExecucaoDados = {
  responsavel_id?: string | null;
  titulo?: string | null;
  status?: StatusEtapaExecucao;
  data_inicio?: string | null;
  prazo?: string | null;
  data_conclusao?: string | null;
  observacao?: string | null;
  obrigatoria?: boolean;
};

export type CriarNovaRevisaoEtapaExecucaoDados = {
  etapa_id: string;
  observacao?: string | null;
};

type EtapaExecucaoConsulta = {
  id: string;
  obra_id: string;
  setor_id: string;
  responsavel_id: string | null;

  titulo: string | null;
  status: StatusEtapaExecucao;

  data_inicio: string | null;
  prazo: string | null;
  data_conclusao: string | null;

  observacao: string | null;

  obrigatoria: boolean;
  ordem: number | null;

  created_at: string;
  updated_at: string;

  setor?: {
    id: string;
    nome: string;
  } | null;

  responsavel?: {
    id: string;
    nome: string;
    email: string;
  } | null;

};

const selectEtapa = `
  id,
  obra_id,
  setor_id,
  responsavel_id,
  titulo,
  status,
  data_inicio,
  prazo,
  data_conclusao,
  observacao,
  obrigatoria,
  ordem,
  created_at,
  updated_at,
  setor:setores (
    id,
    nome
  ),
  responsavel:usuarios!etapas_obras_execucao_responsavel_id_fkey (
    id,
    nome,
    email
  )
`;

function normalizarEtapa(
  etapa: EtapaExecucaoConsulta
): EtapaExecucao {
  return {
    id:
      etapa.id,

    obra_id:
      etapa.obra_id,

    setor_id:
      etapa.setor_id,

    responsavel_id:
      etapa.responsavel_id,

    titulo:
      etapa.titulo,

    status:
      etapa.status,

    data_inicio:
      etapa.data_inicio,

    prazo:
      etapa.prazo,

    data_conclusao:
      etapa.data_conclusao,

    observacao:
      etapa.observacao,

    obrigatoria:
      etapa.obrigatoria,

    ordem:
      etapa.ordem,

    created_at:
      etapa.created_at,

    updated_at:
      etapa.updated_at,

    setor:
      etapa.setor ?? null,

    responsavel:
      etapa.responsavel ?? null,

  };
}

async function buscarEtapaExecucaoNormalizada(
  etapaId: string
): Promise<EtapaExecucao> {
  const {
    data,
    error,
  } = await supabase
    .from("etapas_obras_execucao")
    .select(
      selectEtapa
    )
    .eq(
      "id",
      etapaId
    )
    .single();

  if (error) {
    console.error(
      "Erro ao buscar etapa da obra:",
      error
    );

    throw error;
  }

  return normalizarEtapa(
    data as unknown as EtapaExecucaoConsulta
  );
}

export async function listarEtapasDaObraExecucao(
  obraId: string
): Promise<EtapaExecucao[]> {
  const {
    data,
    error,
  } = await supabase
    .from("etapas_obras_execucao")
    .select(
      selectEtapa
    )
    .eq(
      "obra_id",
      obraId
    )
    .order(
      "ordem",
      {
        ascending: true,
        nullsFirst: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  if (error) {
    console.error(
      "Erro ao listar etapas da obra:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ).map(
    (
      etapa
    ) =>
      normalizarEtapa(
        etapa as unknown as EtapaExecucaoConsulta
      )
  );
}

export async function criarEtapaExecucao(
  dados: CriarEtapaExecucaoDados
): Promise<EtapaExecucao> {
  const titulo =
    dados.titulo.trim();

  if (!titulo) {
    throw new Error(
      "Informe o título da etapa."
    );
  }

  const {
    data: ultimaEtapa,
    error: erroUltimaEtapa,
  } = await supabase
    .from("etapas_obras_execucao")
    .select("ordem")
    .eq(
      "obra_id",
      dados.obra_id
    )
    .not(
      "ordem",
      "is",
      null
    )
    .order(
      "ordem",
      {
        ascending:
          false,
      }
    )
    .limit(1)
    .maybeSingle();

  if (erroUltimaEtapa) {
    console.error(
      "Erro ao calcular a ordem da nova etapa:",
      erroUltimaEtapa
    );

    throw erroUltimaEtapa;
  }

  const proximaOrdem =
    (
      ultimaEtapa?.ordem ??
      0
    ) + 1;

  const payload: {
    obra_id: string;
    setor_id: string;
    responsavel_id: string | null;
    titulo: string;
    status: StatusEtapaExecucao;
    data_inicio: string | null;
    prazo: string | null;
    observacao: string | null;
    obrigatoria: boolean;
    ordem: number;
  } = {
    obra_id:
      dados.obra_id,

    setor_id:
      dados.setor_id,

    responsavel_id:
      dados.responsavel_id ||
      null,

    titulo,

    status:
      dados.status ||
      "nao_iniciada",

    data_inicio:
      dados.data_inicio ||
      null,

    prazo:
      dados.prazo ||
      null,

    observacao:
      dados.observacao?.trim() ||
      null,

    obrigatoria:
      dados.obrigatoria ??
      true,

    ordem:
      proximaOrdem,
  };

  const {
    data,
    error,
  } = await supabase
    .from("etapas_obras_execucao")
    .insert(
      payload
    )
    .select("id")
    .single();

  if (error) {
    console.error(
      "Erro ao criar etapa da obra:",
      error
    );

    throw error;
  }

  return buscarEtapaExecucaoNormalizada(
    data.id
  );
}

export async function atualizarEtapaExecucao(
  etapaId: string,
  dados: AtualizarEtapaExecucaoDados
): Promise<EtapaExecucao> {
  const payload: {
    responsavel_id?: string | null;
    titulo?: string;
    status?: StatusEtapaExecucao;
    data_inicio?: string | null;
    prazo?: string | null;
    data_conclusao?: string | null;
    observacao?: string | null;
    obrigatoria?: boolean;
  } = {};

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "titulo"
    )
  ) {
    const titulo =
      dados.titulo?.trim() ||
      "";

    if (!titulo) {
      throw new Error(
        "O título da etapa não pode ficar vazio."
      );
    }

    payload.titulo =
      titulo;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "responsavel_id"
    )
  ) {
    payload.responsavel_id =
      dados.responsavel_id ||
      null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "status"
    ) &&
    dados.status
  ) {
    payload.status =
      dados.status;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "data_inicio"
    )
  ) {
    payload.data_inicio =
      dados.data_inicio ||
      null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "prazo"
    )
  ) {
    payload.prazo =
      dados.prazo ||
      null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "data_conclusao"
    )
  ) {
    payload.data_conclusao =
      dados.data_conclusao ||
      null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "observacao"
    )
  ) {
    payload.observacao =
      dados.observacao?.trim() ||
      null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "obrigatoria"
    )
  ) {
    payload.obrigatoria =
      Boolean(
        dados.obrigatoria
      );
  }

  if (
    Object.keys(
      payload
    ).length === 0
  ) {
    return buscarEtapaExecucaoNormalizada(
      etapaId
    );
  }

  const {
    error,
  } = await supabase
    .from("etapas_obras_execucao")
    .update(
      payload
    )
    .eq(
      "id",
      etapaId
    );

  if (error) {
    console.error(
      "Erro ao atualizar etapa da obra:",
      error
    );

    throw error;
  }

  return buscarEtapaExecucaoNormalizada(
    etapaId
  );
}

/**
 * Mantida temporariamente para evitar quebra de imports antigos.
 * As revisões pertencem às demandas da execução, não às etapas.
 */
export async function criarNovaRevisaoEtapaExecucao(
  _dados: CriarNovaRevisaoEtapaExecucaoDados
): Promise<EtapaExecucao> {
  throw new Error(
    "As revisões de etapas não são utilizadas. Crie uma revisão na demanda da execução."
  );
}

export type ResultadoExclusaoEtapaExecucao =
  | "etapa_excluida"
  | "revisao_excluida";

export async function excluirEtapaExecucao(
  etapaId: string
): Promise<ResultadoExclusaoEtapaExecucao> {
  const {
    error,
  } = await supabase
    .from("etapas_obras_execucao")
    .delete()
    .eq(
      "id",
      etapaId
    );

  if (error) {
    console.error(
      "Erro ao excluir etapa da obra:",
      error
    );

    throw error;
  }

  return "etapa_excluida";
}

export async function iniciarEtapaExecucao(
  etapaId: string
): Promise<EtapaExecucao> {
  const hoje =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  return atualizarEtapaExecucao(
    etapaId,
    {
      status:
        "em_andamento",

      data_inicio:
        hoje,

      data_conclusao:
        null,
    }
  );
}

export async function concluirEtapaExecucao(
  etapaId: string
): Promise<EtapaExecucao> {
  const hoje =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  return atualizarEtapaExecucao(
    etapaId,
    {
      status:
        "concluida",

      data_conclusao:
        hoje,
    }
  );
}

export async function reabrirEtapaExecucao(
  etapaId: string
): Promise<EtapaExecucao> {
  return atualizarEtapaExecucao(
    etapaId,
    {
      status:
        "em_andamento",

      data_conclusao:
        null,
    }
  );
}

export async function definirStatusEtapaExecucao(
  etapaId: string,
  status: StatusEtapaExecucao
): Promise<EtapaExecucao> {
  const dados: AtualizarEtapaExecucaoDados = {
    status,
  };

  if (
    status ===
    "concluida"
  ) {
    dados.data_conclusao =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );
  } else {
    dados.data_conclusao =
      null;
  }

  if (
    status ===
    "em_andamento"
  ) {
    dados.data_inicio =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );
  }

  return atualizarEtapaExecucao(
    etapaId,
    dados
  );
}