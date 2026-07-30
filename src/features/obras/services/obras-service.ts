import { supabase } from "@/integrations/supabase/client";
import type { Obra } from "../types";

export interface ObraPayload {
  nome?: string;
  nome_obra?: string;
  cliente_id?: string | null;
  novoClienteNome?: string;
  novoClienteTelefone?: string;
  [key: string]: any; 
}

export async function criarObra(dados: ObraPayload) {
  let clienteIdFinal = dados.cliente_id;

  // Se o usuário optou por cadastrar um novo cliente rápido
  if (!clienteIdFinal && dados.novoClienteNome && dados.novoClienteNome.trim() !== "") {
    const { data: novoCliente, error: erroCliente } = await supabase
      .from("clientes")
      .insert([{ 
        nome: dados.novoClienteNome, 
        telefone: dados.novoClienteTelefone || null 
      }])
      .select()
      .single();

    if (erroCliente) {
      console.error("Erro ao criar novo cliente rápido:", erroCliente);
      throw erroCliente;
    }
    clienteIdFinal = novoCliente.id;
  }

  // Remove as propriedades temporárias de novo cliente
  const { novoClienteNome, novoClienteTelefone, nome, ...dadosObraLimpos } = dados;

  // Limpa campos vazios ("") para null e garante que se 'nome_obra' foi preenchido, ele seja enviado corretamente
  const payloadTratado = Object.fromEntries(
    Object.entries(dadosObraLimpos).map(([key, value]) => [
      key,
      value === "" ? null : value,
    ])
  );

  const { data, error } = await supabase
    .from("obras")
    .insert([{
      ...payloadTratado,
      cliente_id: clienteIdFinal || null,
    }])
    .select()
    .single();

  if (error) {
    console.error("=== DETALHES DO ERRO DO SUPABASE ==:", error);
    throw error;
  }

  return data;
}

export { criarObra as createObra };

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

export { excluirObra as deletarObra };