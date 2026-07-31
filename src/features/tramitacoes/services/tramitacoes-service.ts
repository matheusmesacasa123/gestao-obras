import {
  supabase,
} from "@/integrations/supabase/client";

export type ObraTramitacao = {
  id: string;
  codigo: string | null;
  nome_obra: string | null;
  cliente: string | null;
  setor_id: string | null;

  setor?: {
    id: string;
    nome: string;
  } | null;
};

export type SetorTramitacao = {
  id: string;
  nome: string;
};

export type HistoricoTramitacao = {
  id: string;
  obra_id: string;

  setor_origem_id: string | null;
  setor_destino_id: string | null;

  tramitado_por: string | null;

  obra_codigo: string | null;
  obra_nome: string | null;

  setor_origem_nome: string | null;
  setor_destino_nome: string | null;

  usuario_nome: string | null;
  usuario_email: string | null;

  observacao: string | null;
  created_at: string;
};

export async function listarObrasParaTramitacao(
  setorId: string | null,
  administrador: boolean
): Promise<ObraTramitacao[]> {
  let consulta = supabase
    .from("obras")
    .select(`
      id,
      codigo,
      nome_obra,
      cliente,
      setor_id,
      setor:setores (
        id,
        nome
      )
    `)
    .order("codigo", {
      ascending: true,
    });

  if (!administrador) {
    if (!setorId) {
      return [];
    }

    consulta = consulta.eq(
      "setor_id",
      setorId
    );
  }

  const {
    data,
    error,
  } = await consulta;

  if (error) {
    console.error(
      "Erro ao listar obras para tramitação:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ) as unknown as ObraTramitacao[];
}

export async function listarSetoresDestino(): Promise<
  SetorTramitacao[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("setores")
    .select(`
      id,
      nome
    `)
    .eq(
      "ativo",
      true
    )
    .order("nome", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Erro ao listar setores de destino:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ) as SetorTramitacao[];
}

export async function tramitarObras(
  obrasIds: string[],
  setorDestinoId: string,
  observacao?: string
): Promise<number> {
  const {
    data,
    error,
  } = await supabase.rpc(
    "tramitar_obras",
    {
      p_obras_ids:
        obrasIds,

      p_setor_destino_id:
        setorDestinoId,

      p_observacao:
        observacao?.trim() ||
        null,
    }
  );

  if (error) {
    console.error(
      "Erro ao tramitar obras:",
      error
    );

    throw error;
  }

  return Number(
    data ?? 0
  );
}

export async function listarHistoricoTramitacoes(): Promise<
  HistoricoTramitacao[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("tramitacoes_obras")
    .select(`
      id,
      obra_id,
      setor_origem_id,
      setor_destino_id,
      tramitado_por,
      obra_codigo,
      obra_nome,
      setor_origem_nome,
      setor_destino_nome,
      usuario_nome,
      usuario_email,
      observacao,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Erro ao listar histórico de tramitações:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ) as HistoricoTramitacao[];
}