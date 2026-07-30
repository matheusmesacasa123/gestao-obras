import { supabase } from "@/integrations/supabase/client";
import type { Obra } from "../types";

export interface ObraPayload extends Partial<Obra> {
  novoClienteNome?: string;
  novoClienteTelefone?: string;
}

export async function createObra(
  obra: ObraPayload
) {
  let clienteIdFinal = obra.cliente_id;

  // Se o usuário optou por cadastrar um novo cliente rápido direto na criação da obra
  if (!clienteIdFinal && obra.novoClienteNome && obra.novoClienteNome.trim() !== "") {
    const { data: novoCliente, error: erroCliente } = await supabase
      .from("clientes")
      .insert([{ 
        nome: obra.novoClienteNome, 
        telefone: obra.novoClienteTelefone || null 
      }])
      .select()
      .single();

    if (erroCliente) {
      console.error("Erro ao criar novo cliente rápido:", erroCliente);
      throw erroCliente;
    }
    clienteIdFinal = novoCliente.id;
  }

  // Remove as propriedades temporárias de novo cliente antes de enviar para a tabela obras
  const { novoClienteNome, novoClienteTelefone, ...dadosObraLimpos } = obra;

  const {
    data,
    error,
  } = await supabase
    .from("obras")
    .insert([{
      ...dadosObraLimpos,
      cliente_id: clienteIdFinal || null,
    }])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar obra:", error);
    throw error;
  }

  return data;
}

export async function getObras(): Promise<Obra[]> {
  const { data, error } = await supabase
    .from("obras")
    .select("*, clientes(id, nome, telefone, email)")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Erro Supabase obras:", error);
    throw error;
  }

  return data ?? [];
}

export async function getObraById(
  id: string
): Promise<Obra> {
  const { data, error } = await supabase
    .from("obras")
    .select("*, clientes(id, nome, telefone, email)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar obra:", error);
    throw error;
  }

  return data;
}

export async function atualizarObra(
  id: string,
  obra: Partial<Obra>
) {
  const { data, error } = await supabase
    .from("obras")
    .update({
      ...obra,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar obra:", error);
    throw error;
  }

  return data;
}

export async function excluirObra(
  id: string
) {
  const { error } = await supabase
    .from("obras")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir obra:", error);
    throw error;
  }
}

// Exporta também como deletarObra para compatibilidade com o card
export { excluirObra as deletarObra };