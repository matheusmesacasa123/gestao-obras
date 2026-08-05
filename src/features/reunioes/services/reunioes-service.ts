import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  AtualizarReuniaoPayload,
  CriarReuniaoPayload,
  Reuniao,
} from "../types";

const consultaReuniao = `
  *,
  obra:obras_execucao (
    id,
    codigo,
    nome_obra,
    cliente
  ),
  criador:usuarios!reunioes_criado_por_fkey (
    id,
    nome,
    email
  ),
  setores:reunioes_setores (
    reuniao_id,
    setor_id,
    created_at,
    setor:setores (
      id,
      nome
    )
  ),
  participantes:reunioes_participantes (
    reuniao_id,
    usuario_id,
    created_at,
    usuario:usuarios (
      id,
      nome,
      email
    )
  )
`;

function removerDuplicados(
  valores?: string[]
) {
  return Array.from(
    new Set(
      (
        valores ??
        []
      ).filter(
        Boolean
      )
    )
  );
}

export async function getReunioesPorObra(
  obraId: string
): Promise<Reuniao[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "reunioes"
    )
    .select(
      consultaReuniao
    )
    .eq(
      "obra_id",
      obraId
    )
    .order(
      "inicio",
      {
        ascending:
          true,
      }
    );

  if (error) {
    console.error(
      "Erro ao buscar reuniões da obra:",
      error
    );

    throw error;
  }

  return (
    data ??
    []
  ) as unknown as Reuniao[];
}

export async function getProximasReunioes(): Promise<
  Reuniao[]
> {
  const agora =
    new Date().toISOString();

  const {
    data,
    error,
  } = await supabase
    .from(
      "reunioes"
    )
    .select(
      consultaReuniao
    )
    .eq(
      "status",
      "agendada"
    )
    .gte(
      "inicio",
      agora
    )
    .order(
      "inicio",
      {
        ascending:
          true,
      }
    );

  if (error) {
    console.error(
      "Erro ao buscar próximas reuniões:",
      error
    );

    throw error;
  }

  return (
    data ??
    []
  ) as unknown as Reuniao[];
}

export async function getReuniaoPorId(
  id: string
): Promise<Reuniao> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "reunioes"
    )
    .select(
      consultaReuniao
    )
    .eq(
      "id",
      id
    )
    .single();

  if (error) {
    console.error(
      "Erro ao buscar reunião:",
      error
    );

    throw error;
  }

  return data as unknown as Reuniao;
}

async function inserirSetores(
  reuniaoId: string,
  setorIds?: string[]
) {
  const ids =
    removerDuplicados(
      setorIds
    );

  if (
    ids.length ===
    0
  ) {
    return;
  }

  const {
    error,
  } = await supabase
    .from(
      "reunioes_setores"
    )
    .insert(
      ids.map(
        (
          setorId
        ) => ({
          reuniao_id:
            reuniaoId,

          setor_id:
            setorId,
        })
      )
    );

  if (error) {
    console.error(
      "Erro ao vincular setores à reunião:",
      error
    );

    throw error;
  }
}

async function inserirParticipantes(
  reuniaoId: string,
  participanteIds?: string[]
) {
  const ids =
    removerDuplicados(
      participanteIds
    );

  if (
    ids.length ===
    0
  ) {
    return;
  }

  const {
    error,
  } = await supabase
    .from(
      "reunioes_participantes"
    )
    .insert(
      ids.map(
        (
          usuarioId
        ) => ({
          reuniao_id:
            reuniaoId,

          usuario_id:
            usuarioId,
        })
      )
    );

  if (error) {
    console.error(
      "Erro ao vincular participantes à reunião:",
      error
    );

    throw error;
  }
}

export async function criarReuniao(
  payload: CriarReuniaoPayload
): Promise<Reuniao> {
  const {
    setor_ids,
    participante_ids,
    ...dadosReuniao
  } = payload;

  const {
    data,
    error,
  } = await supabase
    .from(
      "reunioes"
    )
    .insert([
      {
        ...dadosReuniao,

        fim:
          dadosReuniao.fim ||
          null,

        local:
          dadosReuniao.local?.trim() ||
          null,

        link_reuniao:
          dadosReuniao.link_reuniao?.trim() ||
          null,

        pauta:
          dadosReuniao.pauta?.trim() ||
          null,

        observacoes:
          dadosReuniao.observacoes?.trim() ||
          null,

        decisoes:
          dadosReuniao.decisoes?.trim() ||
          null,

        proximos_passos:
          dadosReuniao.proximos_passos?.trim() ||
          null,
      },
    ])
    .select(
      "id"
    )
    .single();

  if (error) {
    console.error(
      "Erro ao criar reunião:",
      error
    );

    throw error;
  }

  try {
    await inserirSetores(
      data.id,
      setor_ids
    );

    await inserirParticipantes(
      data.id,
      participante_ids
    );
  } catch (error) {
    await supabase
      .from(
        "reunioes"
      )
      .delete()
      .eq(
        "id",
        data.id
      );

    throw error;
  }

  return getReuniaoPorId(
    data.id
  );
}

export async function atualizarReuniao(
  id: string,
  payload: AtualizarReuniaoPayload
): Promise<Reuniao> {
  const {
    setor_ids,
    participante_ids,
    ...dadosReuniao
  } = payload;

  const dadosAtualizacao: Record<
    string,
    unknown
  > = {
    ...dadosReuniao,
  };

  if (
    "titulo" in
    dadosReuniao
  ) {
    dadosAtualizacao.titulo =
      dadosReuniao.titulo?.trim();
  }

  if (
    "fim" in
    dadosReuniao
  ) {
    dadosAtualizacao.fim =
      dadosReuniao.fim ||
      null;
  }

  if (
    "local" in
    dadosReuniao
  ) {
    dadosAtualizacao.local =
      dadosReuniao.local?.trim() ||
      null;
  }

  if (
    "link_reuniao" in
    dadosReuniao
  ) {
    dadosAtualizacao.link_reuniao =
      dadosReuniao.link_reuniao?.trim() ||
      null;
  }

  if (
    "pauta" in
    dadosReuniao
  ) {
    dadosAtualizacao.pauta =
      dadosReuniao.pauta?.trim() ||
      null;
  }

  if (
    "observacoes" in
    dadosReuniao
  ) {
    dadosAtualizacao.observacoes =
      dadosReuniao.observacoes?.trim() ||
      null;
  }

  if (
    "decisoes" in
    dadosReuniao
  ) {
    dadosAtualizacao.decisoes =
      dadosReuniao.decisoes?.trim() ||
      null;
  }

  if (
    "proximos_passos" in
    dadosReuniao
  ) {
    dadosAtualizacao.proximos_passos =
      dadosReuniao.proximos_passos?.trim() ||
      null;
  }

  if (
    Object.keys(
      dadosAtualizacao
    ).length >
    0
  ) {
    const {
      error,
    } = await supabase
      .from(
        "reunioes"
      )
      .update(
        dadosAtualizacao
      )
      .eq(
        "id",
        id
      );

    if (error) {
      console.error(
        "Erro ao atualizar reunião:",
        error
      );

      throw error;
    }
  }

  if (
    setor_ids !==
    undefined
  ) {
    const {
      error:
        erroExcluirSetores,
    } = await supabase
      .from(
        "reunioes_setores"
      )
      .delete()
      .eq(
        "reuniao_id",
        id
      );

    if (
      erroExcluirSetores
    ) {
      console.error(
        "Erro ao atualizar setores da reunião:",
        erroExcluirSetores
      );

      throw erroExcluirSetores;
    }

    await inserirSetores(
      id,
      setor_ids
    );
  }

  if (
    participante_ids !==
    undefined
  ) {
    const {
      error:
        erroExcluirParticipantes,
    } = await supabase
      .from(
        "reunioes_participantes"
      )
      .delete()
      .eq(
        "reuniao_id",
        id
      );

    if (
      erroExcluirParticipantes
    ) {
      console.error(
        "Erro ao atualizar participantes da reunião:",
        erroExcluirParticipantes
      );

      throw erroExcluirParticipantes;
    }

    await inserirParticipantes(
      id,
      participante_ids
    );
  }

  return getReuniaoPorId(
    id
  );
}

export async function excluirReuniao(
  id: string
) {
  const {
    error,
  } = await supabase
    .from(
      "reunioes"
    )
    .delete()
    .eq(
      "id",
      id
    );

  if (error) {
    console.error(
      "Erro ao excluir reunião:",
      error
    );

    throw error;
  }
}