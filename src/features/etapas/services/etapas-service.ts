import {
  supabase,
} from "@/integrations/supabase/client";

export type StatusEtapaObra =
  | "nao_iniciada"
  | "em_andamento"
  | "aguardando_outro_setor"
  | "aguardando_cliente"
  | "bloqueada"
  | "concluida";

export type StatusRevisaoEtapa =
  | "ativa"
  | "encerrada";

/**
 * Tipo mantido temporariamente para evitar quebra de imports
 * em componentes ainda não migrados.
 *
 * Não representa mais uma tabela etapa_revisoes.
 */
export type RevisaoEtapaObra = {
  id: string;
  etapa_id: string;
  numero_revisao: number;
  status: StatusEtapaObra;
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

export type EtapaObra = {
  id: string;
  obra_id: string;
  setor_id: string;
  responsavel_id: string | null;

  titulo: string | null;

  status: StatusEtapaObra;

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

export type CriarEtapaObraDados = {
  obra_id: string;
  setor_id: string;
  responsavel_id?: string | null;
  titulo: string;
  status?: StatusEtapaObra;
  data_inicio?: string | null;
  prazo?: string | null;
  observacao?: string | null;
  obrigatoria?: boolean;
};

export type AtualizarEtapaObraDados = {
  responsavel_id?: string | null;
  titulo?: string | null;
  status?: StatusEtapaObra;
  data_inicio?: string | null;
  prazo?: string | null;
  data_conclusao?: string | null;
  observacao?: string | null;
  obrigatoria?: boolean;
};

export type CriarNovaRevisaoEtapaDados = {
  etapa_id: string;
  observacao?: string | null;
};

type EtapaConsulta = {
  id: string;
  obra_id: string;
  setor_id: string;
  responsavel_id: string | null;

  titulo: string | null;
  status: StatusEtapaObra;

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
  responsavel:usuarios!etapas_obras_responsavel_id_fkey (
    id,
    nome,
    email
  )
`;

function normalizarEtapa(
  etapa: EtapaConsulta
): EtapaObra {
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

async function buscarEtapaNormalizada(
  etapaId: string
): Promise<EtapaObra> {
  const {
    data,
    error,
  } = await supabase
    .from("etapas_orcamentos")
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
    data as unknown as EtapaConsulta
  );
}

export async function listarEtapasDaObra(
  obraId: string
): Promise<EtapaObra[]> {
  const {
    data,
    error,
  } = await supabase
    .from("etapas_orcamentos")
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
        etapa as unknown as EtapaConsulta
      )
  );
}

export async function criarEtapaObra(
  dados: CriarEtapaObraDados
): Promise<EtapaObra> {
  const titulo =
    dados.titulo.trim();

  if (!titulo) {
    throw new Error(
      "Informe o título da etapa."
    );
  }

  const payload: {
    obra_id: string;
    setor_id: string;
    responsavel_id: string | null;
    titulo: string;
    status: StatusEtapaObra;
    data_inicio: string | null;
    prazo: string | null;
    observacao: string | null;
    obrigatoria: boolean;
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
  };

  const {
    data,
    error,
  } = await supabase
    .from("etapas_orcamentos")
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

  return buscarEtapaNormalizada(
    data.id
  );
}

export async function atualizarEtapaObra(
  etapaId: string,
  dados: AtualizarEtapaObraDados
): Promise<EtapaObra> {
  const payload: {
    responsavel_id?: string | null;
    titulo?: string;
    status?: StatusEtapaObra;
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
    return buscarEtapaNormalizada(
      etapaId
    );
  }

  const {
    error,
  } = await supabase
    .from("etapas_orcamentos")
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

  return buscarEtapaNormalizada(
    etapaId
  );
}

/**
 * Mantida temporariamente para evitar quebra de imports antigos.
 * As revisões agora pertencem às demandas, não às etapas.
 */
export async function criarNovaRevisaoEtapa(
  _dados: CriarNovaRevisaoEtapaDados
): Promise<EtapaObra> {
  throw new Error(
    "As revisões de etapas foram removidas. Crie uma revisão na demanda."
  );
}

export type ResultadoExclusaoEtapa =
  | "etapa_excluida"
  | "revisao_excluida";

export async function excluirEtapaObra(
  etapaId: string
): Promise<ResultadoExclusaoEtapa> {
  const {
    error,
  } = await supabase
    .from("etapas_orcamentos")
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

export async function iniciarEtapaObra(
  etapaId: string
): Promise<EtapaObra> {
  const hoje =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  return atualizarEtapaObra(
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

export async function concluirEtapaObra(
  etapaId: string
): Promise<EtapaObra> {
  const hoje =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  return atualizarEtapaObra(
    etapaId,
    {
      status:
        "concluida",

      data_conclusao:
        hoje,
    }
  );
}

export async function reabrirEtapaObra(
  etapaId: string
): Promise<EtapaObra> {
  return atualizarEtapaObra(
    etapaId,
    {
      status:
        "em_andamento",

      data_conclusao:
        null,
    }
  );
}

export async function definirStatusEtapaObra(
  etapaId: string,
  status: StatusEtapaObra
): Promise<EtapaObra> {
  const dados: AtualizarEtapaObraDados = {
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

  return atualizarEtapaObra(
    etapaId,
    dados
  );
}