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

const consultaDemanda = `
  *,
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
    data ?? []
  ) as Demanda[];
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
    .update(dados)
    .eq(
      "id",
      id
    )
    .select(
      consultaDemanda
    )
    .single();

  if (error) {
    throw error;
  }

  return data as Demanda;
}