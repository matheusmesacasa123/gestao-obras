import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  ObraExecucao,
  StatusObraExecucao,
} from "../types";

export interface CriarObraExecucaoPayload {
  cliente_id?: string | null;
  setor_id?: string | null;
  responsavel_id?: string | null;

  codigo?: string | null;
  cliente?: string | null;
  razao_social?: string | null;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;

  nome_obra: string;
  descricao?: string | null;

  tipo_projeto?: string | null;
  tipo_efluente?: string | null;
  vazao?: number | null;

  status?: StatusObraExecucao;

  data_inicio?: string | null;
  prazo_entrega?: string | null;

  observacoes?: string | null;
  criado_por: string;
}

export interface AtualizarObraExecucaoPayload {
  setor_id?: string | null;
  responsavel_id?: string | null;

  nome_obra?: string | null;
  descricao?: string | null;

  tipo_projeto?: string | null;
  tipo_efluente?: string | null;
  vazao?: number | null;

  status?: StatusObraExecucao;

  data_inicio?: string | null;
  prazo_entrega?: string | null;
  data_entrega?: string | null;

  incluido_erp?: boolean;
  codigo_erp?: string | null;

  observacoes?: string | null;
}

const consultaObraExecucao = `
  *,
  cliente_relacionado:clientes (
    id,
    nome,
    cnpj,
    telefone,
    email
  ),
  setor:setores (
    id,
    nome
  ),
  responsavel:usuarios!obras_execucao_responsavel_id_fkey (
    id,
    nome,
    email
  ),
  incluido_erp_usuario:usuarios!obras_execucao_incluido_erp_por_fkey (
    id,
    nome,
    email
  ),
  orcamento:orcamentos (
    id,
    codigo,
    numero_proposta,
    status
  )
`;

export async function getObrasExecucao(): Promise<
  ObraExecucao[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "obras_execucao"
    )
    .select(
      consultaObraExecucao
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
      "Erro ao buscar obras em execução:",
      error
    );

    throw error;
  }

  return (
    data ??
    []
  ) as unknown as ObraExecucao[];
}

export async function getObraExecucaoPorId(
  id: string
): Promise<ObraExecucao> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "obras_execucao"
    )
    .select(
      consultaObraExecucao
    )
    .eq(
      "id",
      id
    )
    .single();

  if (error) {
    console.error(
      "Erro ao buscar obra em execução:",
      error
    );

    throw error;
  }

  return data as unknown as ObraExecucao;
}

export async function criarObraExecucao(
  payload: CriarObraExecucaoPayload
): Promise<ObraExecucao> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "obras_execucao"
    )
    .insert([
      {
        ...payload,

        orcamento_id:
          null,
      },
    ])
    .select(
      consultaObraExecucao
    )
    .single();

  if (error) {
    console.error(
      "Erro ao criar obra em execução:",
      error
    );

    throw error;
  }

  return data as unknown as ObraExecucao;
}

export async function atualizarObraExecucao(
  id: string,
  payload: AtualizarObraExecucaoPayload
): Promise<ObraExecucao> {
  const {
    data: obraAtual,
    error: erroObraAtual,
  } = await supabase
    .from(
      "obras_execucao"
    )
    .select(
      `
        incluido_erp,
        codigo_erp,
        incluido_erp_em,
        incluido_erp_por
      `
    )
    .eq(
      "id",
      id
    )
    .single();

  if (erroObraAtual) {
    console.error(
      "Erro ao consultar situação atual da obra:",
      erroObraAtual
    );

    throw erroObraAtual;
  }

  const dadosAtualizacao: Record<
    string,
    unknown
  > = {
    ...payload,

    updated_at:
      new Date().toISOString(),
  };

  if (
    payload.incluido_erp ===
    true
  ) {
    const codigoErp =
      payload.codigo_erp?.trim();

    if (!codigoErp) {
      throw new Error(
        "Informe o código da obra no ERP."
      );
    }

    dadosAtualizacao.codigo_erp =
      codigoErp;

    if (
      !obraAtual.incluido_erp
    ) {
      const {
        data: usuarioData,
        error: usuarioError,
      } =
        await supabase.auth.getUser();

      if (
        usuarioError ||
        !usuarioData.user
      ) {
        throw new Error(
          "Não foi possível identificar o usuário autenticado."
        );
      }

      dadosAtualizacao.incluido_erp_em =
        new Date().toISOString();

      dadosAtualizacao.incluido_erp_por =
        usuarioData.user.id;
    } else {
      dadosAtualizacao.incluido_erp_em =
        obraAtual.incluido_erp_em;

      dadosAtualizacao.incluido_erp_por =
        obraAtual.incluido_erp_por;
    }
  }

  if (
    payload.incluido_erp ===
    false
  ) {
    dadosAtualizacao.codigo_erp =
      null;

    dadosAtualizacao.incluido_erp_em =
      null;

    dadosAtualizacao.incluido_erp_por =
      null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "obras_execucao"
    )
    .update(
      dadosAtualizacao
    )
    .eq(
      "id",
      id
    )
    .select(
      consultaObraExecucao
    )
    .single();

  if (error) {
    console.error(
      "Erro ao atualizar obra em execução:",
      error
    );

    throw error;
  }

  return data as unknown as ObraExecucao;
}

export async function excluirObraExecucao(
  id: string
) {
  const {
    error,
  } = await supabase
    .from(
      "obras_execucao"
    )
    .delete()
    .eq(
      "id",
      id
    );

  if (error) {
    console.error(
      "Erro ao excluir obra em execução:",
      error
    );

    throw error;
  }
}