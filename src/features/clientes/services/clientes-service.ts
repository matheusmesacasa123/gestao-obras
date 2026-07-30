// src/features/clientes/services/clientes-service.ts

import { supabase } from "@/integrations/supabase/client";

export interface Cliente {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  created_at?: string;
}

export async function getClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar clientes:", error);
    throw error;
  }

  return data ?? [];
}

export async function criarCliente(cliente: Omit<Cliente, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("clientes")
    .insert([cliente])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar cliente:", error);
    throw error;
  }

  return data;
}

export async function excluirCliente(id: string) {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir cliente:", error);
    throw error;
  }
}