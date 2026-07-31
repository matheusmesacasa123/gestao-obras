import { supabase } from "@/integrations/supabase/client";

import type {
  Demanda,
  PrioridadeDemanda,
  StatusDemanda,
} from "../types";

export interface AtualizarDemandaDados {
  titulo?: string;
  descricao?: string | null;
  status?: StatusDemanda;
  prioridade?: PrioridadeDemanda;
  prazo?: string | null;
  data_conclusao?: string | null;
  motivo_atraso?: string | null;
}

// Buscar demandas da obra
export async function getDemandasPorObra(
  obraId: string
): Promise<Demanda[]> {
  const { data, error } = await supabase
    .from("demandas")
    .select("*")
    .eq("obra_id", obraId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Demanda[];
}

// Excluir uma demanda
export async function deleteDemanda(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("demandas")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

// Atualizar uma demanda
export async function updateDemanda(
  id: string,
  dados: AtualizarDemandaDados
): Promise<Demanda> {
  const { data, error } = await supabase
    .from("demandas")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Demanda;
}