import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  Demanda,
  PrioridadeDemanda,
  StatusDemanda,
} from "../types";

export interface AtualizarDemandaDados {
  titulo?: string;

  descricao?:
    | string
    | null;

  status?: StatusDemanda;

  prioridade?: PrioridadeDemanda;

  etapa_id?:
    | string
    | null;

  setor_id?:
    | string
    | null;

  responsavel_id?:
    | string
    | null;

  prazo?:
    | string
    | null;

  data_inicio?:
    | string
    | null;

  data_conclusao?:
    | string
    | null;

  motivo_atraso?:
    | string
    | null;
}

export type DemandaItem = {
  id: string;
  demanda_id: string;
  titulo: string;
  concluido: boolean;
  ordem: number;
  data_conclusao: string | null;
  created_at: string;
  updated_at: string;
};

const consultaDemanda = `
  *,
  etapa:etapas_obras!demandas_etapa_obra_fkey (
    id,
    obra_id,
    setor_id,
    titulo,
    ordem,
    status,
    data_inicio,
    prazo,
    data_conclusao,
    setor:setores (
      id,
      nome
    )
  ),
  setor:setores!demandas_setor_id_fkey (
    id,
    nome
  ),
  responsavel:usuarios!demandas_responsavel_id_fkey (
    id,
    nome,
    email,
    setor_id,
    setor:setores!usuarios_setor_id_fkey (
      id,
      nome
    )
  ),
  itens:demanda_itens (
    id,
    demanda_id,
    titulo,
    concluido,
    ordem,
    data_conclusao,
    created_at,
    updated_at
  )
`;

export async function getDemandasPorObra(
  obraId: string
): Promise<Demanda[]> {
  const {
    data,
    error,
  } = await supabase
    .from("demandas")
    .select(
      consultaDemanda
    )
    .eq(
      "obra_id",
      obraId
    )
    .order(
      "numero_revisao",
      {
        ascending:
          false,
      }
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      }
    );

  if (error) {
    console.error(
      "Erro ao buscar demandas da obra:",
      error
    );

    throw error;
  }

  const demandas =
    (
      data ??
      []
    ) as unknown as Array<
      Demanda & {
        itens?: DemandaItem[];
      }
    >;

  return demandas.map(
    (
      demanda
    ) => ({
      ...demanda,

      itens:
        (
          demanda.itens ??
          []
        ).sort(
          (
            itemA,
            itemB
          ) =>
            itemA.ordem -
            itemB.ordem
        ),
    })
  ) as unknown as Demanda[];
}

export async function criarNovaRevisaoDemanda(
  demandaId: string
): Promise<string> {
  const {
    data,
    error,
  } = await supabase.rpc(
    "criar_nova_revisao_demanda",
    {
      p_demanda_id:
        demandaId,
    }
  );

  if (error) {
    console.error(
      "Erro ao criar nova revisão da demanda:",
      error
    );

    throw error;
  }

  if (
    typeof data !==
      "string" ||
    !data
  ) {
    throw new Error(
      "A nova revisão foi criada, mas o identificador não foi retornado."
    );
  }

  return data;
}

export async function iniciarDemanda(
  demandaId: string
): Promise<void> {
  const {
    error,
  } = await supabase.rpc(
    "iniciar_demanda",
    {
      p_demanda_id:
        demandaId,
    }
  );

  if (error) {
    console.error(
      "Erro ao iniciar demanda:",
      error
    );

    throw error;
  }
}

export async function concluirDemanda(
  demandaId: string
): Promise<void> {
  const {
    error,
  } = await supabase.rpc(
    "concluir_demanda",
    {
      p_demanda_id:
        demandaId,
    }
  );

  if (error) {
    console.error(
      "Erro ao concluir demanda:",
      error
    );

    throw error;
  }
}

export async function deleteDemanda(
  id: string
): Promise<void> {
  const {
    error,
  } = await supabase
    .from("demandas")
    .delete()
    .eq(
      "id",
      id
    );

  if (error) {
    console.error(
      "Erro ao excluir demanda:",
      error
    );

    throw error;
  }
}

export async function updateDemanda(
  id: string,
  dados: AtualizarDemandaDados
): Promise<Demanda> {
  const {
    data,
    error,
  } = await supabase
    .from("demandas")
    .update(
      dados
    )
    .eq(
      "id",
      id
    )
    .select(
      consultaDemanda
    )
    .single();

  if (error) {
    console.error(
      "Erro ao atualizar demanda:",
      error
    );

    throw error;
  }

  return data as unknown as Demanda;
}

export async function listarItensDemanda(
  demandaId: string
): Promise<DemandaItem[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "demanda_itens" as never
    )
    .select(
      "*"
    )
    .eq(
      "demanda_id",
      demandaId
    )
    .order(
      "ordem",
      {
        ascending:
          true,
      }
    );

  if (error) {
    console.error(
      "Erro ao listar itens da demanda:",
      error
    );

    throw error;
  }

  return (
    data ??
    []
  ) as unknown as DemandaItem[];
}

export async function criarItemDemanda(
  demandaId: string,
  titulo: string
): Promise<DemandaItem> {
  const tituloTratado =
    titulo.trim();

  if (!tituloTratado) {
    throw new Error(
      "Informe o título do item."
    );
  }

  const {
    data: ultimoItem,
    error: erroOrdem,
  } = await supabase
    .from(
      "demanda_itens" as never
    )
    .select(
      "ordem"
    )
    .eq(
      "demanda_id",
      demandaId
    )
    .order(
      "ordem",
      {
        ascending:
          false,
      }
    )
    .limit(
      1
    )
    .maybeSingle();

  if (erroOrdem) {
    console.error(
      "Erro ao buscar a ordem do último item:",
      erroOrdem
    );

    throw erroOrdem;
  }

  const proximaOrdem =
    Number(
      (
        ultimoItem as {
          ordem?: number;
        } | null
      )?.ordem ??
      0
    ) +
    1;

  const {
    data,
    error,
  } = await supabase
    .from(
      "demanda_itens" as never
    )
    .insert({
      demanda_id:
        demandaId,

      titulo:
        tituloTratado,

      ordem:
        proximaOrdem,
    } as never)
    .select(
      "*"
    )
    .single();

  if (error) {
    console.error(
      "Erro ao criar item da demanda:",
      error
    );

    throw error;
  }

  return data as unknown as DemandaItem;
}

export async function atualizarItemDemanda(
  itemId: string,
  dados: {
    titulo?: string;
    concluido?: boolean;
  }
): Promise<DemandaItem> {
  const payload: {
    titulo?: string;
    concluido?: boolean;
    data_conclusao?: string | null;
  } = {};

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "titulo"
    )
  ) {
    const tituloTratado =
      dados.titulo?.trim() ||
      "";

    if (!tituloTratado) {
      throw new Error(
        "O título do item não pode ficar vazio."
      );
    }

    payload.titulo =
      tituloTratado;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      "concluido"
    )
  ) {
    payload.concluido =
      dados.concluido;

    payload.data_conclusao =
      dados.concluido
        ? new Date()
            .toISOString()
            .slice(
              0,
              10
            )
        : null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "demanda_itens" as never
    )
    .update(
      payload as never
    )
    .eq(
      "id",
      itemId
    )
    .select(
      "*"
    )
    .single();

  if (error) {
    console.error(
      "Erro ao atualizar item da demanda:",
      error
    );

    throw error;
  }

  return data as unknown as DemandaItem;
}

export async function excluirItemDemanda(
  itemId: string
): Promise<void> {
  const {
    error,
  } = await supabase
    .from(
      "demanda_itens" as never
    )
    .delete()
    .eq(
      "id",
      itemId
    );

  if (error) {
    console.error(
      "Erro ao excluir item da demanda:",
      error
    );

    throw error;
  }
}