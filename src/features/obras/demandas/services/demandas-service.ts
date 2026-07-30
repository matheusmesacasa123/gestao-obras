import { supabase } from "@/integrations/supabase/client";
import type { Demanda } from "../types";

// Buscar demandas da obra
export async function getDemandasPorObra(obraId: string) {
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
export async function deleteDemanda(id: string) {
  const { error } = await supabase
    .from("demandas")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

// Atualizar/Editar uma demanda
export async function updateDemanda(id: string, dados: Partial<Demanda>) {
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