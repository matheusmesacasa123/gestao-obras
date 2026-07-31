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
  responsavel:usuarios (
    id,
    nome,
    email
  )
`;

export async function listarEtapasDaObra(
  obraId: string
): Promise<EtapaObra[]> {
  const {
    data,
    error,
  } = await supabase
    .from("etapas_obras")
    .select(selectEtapa)
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
  ) as unknown as EtapaObra[];
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

  const payload = {
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
    .from("etapas_obras")
    .insert(payload)
    .select(selectEtapa)
    .single();

  if (error) {
    console.error(
      "Erro ao criar etapa da obra:",
      error
    );

    throw error;
  }

  return data as unknown as EtapaObra;
}

export async function atualizarEtapaObra(
  etapaId: string,
  dados: AtualizarEtapaObraDados
): Promise<EtapaObra> {
  const payload: AtualizarEtapaObraDados = {
    ...dados,
  };

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
      "observacao"
    )
  ) {
    payload.observacao =
      dados.observacao?.trim() ||
      null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("etapas_obras")
    .update(payload)
    .eq(
      "id",
      etapaId
    )
    .select(selectEtapa)
    .single();

  if (error) {
    console.error(
      "Erro ao atualizar etapa da obra:",
      error
    );

    throw error;
  }

  return data as unknown as EtapaObra;
}

export async function excluirEtapaObra(
  etapaId: string
): Promise<void> {
  const {
    error,
  } = await supabase
    .from("etapas_obras")
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
      "em_andamento" &&
    !dados.data_inicio
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