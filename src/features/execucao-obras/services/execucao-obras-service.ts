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

const consultaObraExecucao = `
  *,
  cliente_relacionado:clientes (
    id,
    nome,
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