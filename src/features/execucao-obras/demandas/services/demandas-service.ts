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

type DemandaComItens = Demanda & {
  itens?: DemandaItem[];
};

const consultaDemanda = `
  *,
  etapa:etapas_obras_execucao!demandas_obras_execucao_etapa_obra_fkey (
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
  setor:setores!demandas_obras_execucao_setor_id_fkey (
    id,
    nome
  ),
  responsavel:usuarios!demandas_obras_execucao_responsavel_id_fkey (
    id,
    nome,
    email,
    setor_id,
    setor:setores!usuarios_setor_id_fkey (
      id,
      nome
    )
  ),
  itens:demanda_itens_obras_execucao (
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

function obterDataHoje() {
  return new Date()
    .toISOString()
    .slice(
      0,
      10
    );
}

function ordenarItens(
  itens?: DemandaItem[]
) {
  return [
    ...(itens ?? []),
  ].sort(
    (
      itemA,
      itemB
    ) =>
      Number(
        itemA.ordem ??
        0
      ) -
      Number(
        itemB.ordem ??
        0
      )
  );
}

async function buscarDemandaPorId(
  demandaId: string
): Promise<Demanda> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
    .select(
      consultaDemanda
    )
    .eq(
      "id",
      demandaId
    )
    .single();

  if (error) {
    console.error(
      "Erro ao buscar demanda da execução:",
      error
    );

    throw error;
  }

  const demanda =
    data as unknown as DemandaComItens;

  return {
    ...demanda,

    itens:
      ordenarItens(
        demanda.itens
      ),
  } as unknown as Demanda;
}

export async function getDemandasPorObra(
  obraId: string
): Promise<Demanda[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
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
      "Erro ao buscar demandas da execução:",
      error
    );

    throw error;
  }

  const demandas =
    (
      data ??
      []
    ) as unknown as DemandaComItens[];

  return demandas.map(
    (
      demanda
    ) => ({
      ...demanda,

      itens:
        ordenarItens(
          demanda.itens
        ),
    })
  ) as unknown as Demanda[];
}

export async function criarNovaRevisaoDemanda(
  demandaId: string
): Promise<string> {
  const demandaAtual =
    await buscarDemandaPorId(
      demandaId
    ) as unknown as DemandaComItens;

  const {
    data: respostaAuth,
    error: erroAuth,
  } =
    await supabase.auth.getUser();

  if (
    erroAuth ||
    !respostaAuth.user
  ) {
    throw (
      erroAuth ||
      new Error(
        "Usuário não autenticado."
      )
    );
  }

  const grupoRevisaoId =
    demandaAtual.grupo_revisao_id ||
    demandaAtual.id;

  const proximaRevisao =
    Number(
      demandaAtual.numero_revisao ??
      0
    ) +
    1;

  const {
    data: novaDemanda,
    error: erroNovaDemanda,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
    .insert({
      obra_id:
        demandaAtual.obra_id,

      etapa_id:
        demandaAtual.etapa_id,

      titulo:
        demandaAtual.titulo,

      descricao:
        demandaAtual.descricao,

      status:
        "aberta",

      prioridade:
        demandaAtual.prioridade ||
        "media",

      responsavel_id:
        demandaAtual.responsavel_id,

      setor_id:
        demandaAtual.setor_id,

      prazo:
        demandaAtual.prazo,

      data_inicio:
        null,

      data_conclusao:
        null,

      motivo_atraso:
        null,

      criado_por:
        respostaAuth.user.id,

      grupo_revisao_id:
        grupoRevisaoId,

      numero_revisao:
        proximaRevisao,

      revisao_anterior_id:
        demandaAtual.id,

      status_revisao:
        "ativa",
    })
    .select(
      "id"
    )
    .single();

  if (
    erroNovaDemanda ||
    !novaDemanda
  ) {
    console.error(
      "Erro ao criar nova revisão da demanda:",
      erroNovaDemanda
    );

    throw (
      erroNovaDemanda ||
      new Error(
        "A revisão foi criada sem retornar um identificador."
      )
    );
  }

  try {
    const itensAnteriores =
      ordenarItens(
        demandaAtual.itens
      );

    if (
      itensAnteriores.length >
      0
    ) {
      const {
        error: erroItens,
      } = await supabase
        .from(
          "demanda_itens_obras_execucao"
        )
        .insert(
          itensAnteriores.map(
            (
              item,
              indice
            ) => ({
              demanda_id:
                novaDemanda.id,

              titulo:
                item.titulo,

              concluido:
                false,

              ordem:
                item.ordem ??
                indice + 1,

              data_conclusao:
                null,
            })
          )
        );

      if (erroItens) {
        throw erroItens;
      }
    }

    const {
      error: erroEncerramento,
    } = await supabase
      .from(
        "demandas_obras_execucao"
      )
      .update({
        status_revisao:
          "encerrada",
      })
      .eq(
        "id",
        demandaAtual.id
      );

    if (erroEncerramento) {
      throw erroEncerramento;
    }

    return novaDemanda.id;
  } catch (error) {
    await supabase
      .from(
        "demandas_obras_execucao"
      )
      .delete()
      .eq(
        "id",
        novaDemanda.id
      );

    console.error(
      "Erro ao finalizar criação da revisão:",
      error
    );

    throw error;
  }
}

export async function iniciarDemanda(
  demandaId: string
): Promise<void> {
  const hoje =
    obterDataHoje();

  const {
    data: demanda,
    error: erroDemanda,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
    .select(
      "id, etapa_id, data_inicio"
    )
    .eq(
      "id",
      demandaId
    )
    .single();

  if (erroDemanda) {
    console.error(
      "Erro ao buscar demanda para iniciar:",
      erroDemanda
    );

    throw erroDemanda;
  }

  const {
    error,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
    .update({
      status:
        "em_andamento",

      data_inicio:
        demanda.data_inicio ||
        hoje,

      data_conclusao:
        null,
    })
    .eq(
      "id",
      demandaId
    );

  if (error) {
    console.error(
      "Erro ao iniciar demanda da execução:",
      error
    );

    throw error;
  }

  if (
    demanda.etapa_id
  ) {
    const {
      data: etapa,
      error: erroEtapa,
    } = await supabase
      .from(
        "etapas_obras_execucao"
      )
      .select(
        "id, status, data_inicio"
      )
      .eq(
        "id",
        demanda.etapa_id
      )
      .single();

    if (erroEtapa) {
      console.error(
        "A demanda foi iniciada, mas não foi possível verificar a etapa:",
        erroEtapa
      );

      throw erroEtapa;
    }

    if (
      etapa.status ===
      "nao_iniciada"
    ) {
      const {
        error: erroInicioEtapa,
      } = await supabase
        .from(
          "etapas_obras_execucao"
        )
        .update({
          status:
            "em_andamento",

          data_inicio:
            etapa.data_inicio ||
            hoje,

          data_conclusao:
            null,
        })
        .eq(
          "id",
          etapa.id
        );

      if (erroInicioEtapa) {
        console.error(
          "A demanda foi iniciada, mas não foi possível iniciar a etapa:",
          erroInicioEtapa
        );

        throw erroInicioEtapa;
      }
    }
  }
}

export async function concluirDemanda(
  demandaId: string
): Promise<void> {
  const itens =
    await listarItensDemanda(
      demandaId
    );

  const itensPendentes =
    itens.filter(
      (
        item
      ) =>
        !item.concluido
    );

  if (
    itensPendentes.length >
    0
  ) {
    throw new Error(
      `Conclua todos os itens do checklist antes de finalizar a demanda. Restam ${itensPendentes.length} item(ns).`
    );
  }

  const {
    data: demanda,
    error: erroBusca,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
    .select(
      "data_inicio"
    )
    .eq(
      "id",
      demandaId
    )
    .single();

  if (erroBusca) {
    console.error(
      "Erro ao buscar demanda para conclusão:",
      erroBusca
    );

    throw erroBusca;
  }

  const hoje =
    obterDataHoje();

  const {
    error,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
    .update({
      status:
        "concluida",

      data_inicio:
        demanda.data_inicio ||
        hoje,

      data_conclusao:
        hoje,
    })
    .eq(
      "id",
      demandaId
    );

  if (error) {
    console.error(
      "Erro ao concluir demanda da execução:",
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
    .from(
      "demandas_obras_execucao"
    )
    .delete()
    .eq(
      "id",
      id
    );

  if (error) {
    console.error(
      "Erro ao excluir demanda da execução:",
      error
    );

    throw error;
  }
}

export async function updateDemanda(
  id: string,
  dados: AtualizarDemandaDados
): Promise<Demanda> {
  const payload = {
    ...dados,
  };

  if (
    payload.status ===
    "concluida" &&
    !payload.data_conclusao
  ) {
    payload.data_conclusao =
      obterDataHoje();
  }

  if (
    payload.status ===
    "em_andamento" &&
    !payload.data_inicio
  ) {
    payload.data_inicio =
      obterDataHoje();
  }

  if (
    payload.status &&
    payload.status !==
    "concluida"
  ) {
    payload.data_conclusao =
      null;
  }

  const {
    error,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
    .update(
      payload
    )
    .eq(
      "id",
      id
    );

  if (error) {
    console.error(
      "Erro ao atualizar demanda da execução:",
      error
    );

    throw error;
  }

  return buscarDemandaPorId(
    id
  );
}

export async function listarItensDemanda(
  demandaId: string
): Promise<DemandaItem[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "demanda_itens_obras_execucao"
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
      "Erro ao listar itens da demanda da execução:",
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
      "demanda_itens_obras_execucao"
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
      "demanda_itens_obras_execucao"
    )
    .insert({
      demanda_id:
        demandaId,

      titulo:
        tituloTratado,

      concluido:
        false,

      ordem:
        proximaOrdem,

      data_conclusao:
        null,
    })
    .select(
      "*"
    )
    .single();

  if (error) {
    console.error(
      "Erro ao criar item da demanda da execução:",
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
        ? obterDataHoje()
        : null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "demanda_itens_obras_execucao"
    )
    .update(
      payload
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
      "Erro ao atualizar item da demanda da execução:",
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
      "demanda_itens_obras_execucao"
    )
    .delete()
    .eq(
      "id",
      itemId
    );

  if (error) {
    console.error(
      "Erro ao excluir item da demanda da execução:",
      error
    );

    throw error;
  }
}