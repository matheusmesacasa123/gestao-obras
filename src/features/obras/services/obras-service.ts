import { supabase } from "@/integrations/supabase/client";

import type { Obra } from "../types";

export interface ObraPayload {
  nome?: string;
  nome_obra?: string;
  setor_id?: string | null;
  cliente_id?: string | null;
  novoClienteNome?: string;
  novoClienteRazaoSocial?: string;
  novoClienteCnpj?: string;
  novoClienteEmail?: string;
  novoClienteTelefone?: string;
  obra_execucao_id?: string | null;
  [key: string]: unknown;
}

export interface ObraExecucaoDisponivelVinculo {
  id: string;
  codigo_erp: string;
  nome_obra: string | null;
  cliente: string | null;
  cliente_id: string | null;
  setor_id: string | null;
  cidade: string | null;
  estado: string | null;
}

export interface AtualizarValoresObraPayload {
  obraId: string;
  valorOrcado: number | null;
  custoOrcado: number | null;
  valorVendido: number | null;
  custoReal: number | null;
  motivoAlteracao: string;
}

const consultaObra = `
  *,
  clientes (
    id,
    nome,
    telefone,
    email
  ),
  setor:setores (
    id,
    nome
  ),
  etapas:etapas_orcamentos (
    id,
    obra_id,
    setor_id,
    responsavel_id,
    status,
    data_inicio,
    prazo,
    data_conclusao,
    observacao,
    obrigatoria,
    ordem,
    setor:setores (
      id,
      nome
    ),
    responsavel:usuarios (
      id,
      nome,
      email
    )
  )
`;

function ordenarEtapas(obra: Obra): Obra {
  return {
    ...obra,

    etapas:
      obra.etapas?.slice().sort((etapaA, etapaB) => {
        const ordemA = etapaA.ordem ?? Number.MAX_SAFE_INTEGER;

        const ordemB = etapaB.ordem ?? Number.MAX_SAFE_INTEGER;

        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }

        return (etapaA.setor?.nome || "").localeCompare(
          etapaB.setor?.nome || "",
          "pt-BR",
        );
      }) || [],
  };
}

export async function criarObra(dados: ObraPayload) {
  const obraExecucaoId =
    typeof dados.obra_execucao_id === "string" && dados.obra_execucao_id.trim()
      ? dados.obra_execucao_id.trim()
      : null;

  let clienteIdFinal = dados.cliente_id;

  let dadosClienteFinal: {
    nome: string;
    razao_social: string | null;
    cnpj: string | null;
    email: string | null;
    telefone: string | null;
  } | null = null;

  if (clienteIdFinal) {
    const { data: clienteExistente, error: erroClienteExistente } =
      await supabase
        .from("clientes")
        .select("nome, razao_social, cnpj, email, telefone")
        .eq("id", clienteIdFinal)
        .single();

    if (erroClienteExistente) {
      console.error(
        "Erro ao buscar dados do cliente selecionado:",
        erroClienteExistente,
      );

      throw erroClienteExistente;
    }

    dadosClienteFinal = clienteExistente;
  }

  if (
    !clienteIdFinal &&
    typeof dados.novoClienteNome === "string" &&
    dados.novoClienteNome.trim() !== ""
  ) {
    const { data: novoCliente, error: erroCliente } = await supabase
      .from("clientes")
      .insert([
        {
          nome: dados.novoClienteNome.trim(),

          razao_social:
            typeof dados.novoClienteRazaoSocial === "string"
              ? dados.novoClienteRazaoSocial.trim() || null
              : null,

          cnpj:
            typeof dados.novoClienteCnpj === "string"
              ? dados.novoClienteCnpj.trim() || null
              : null,

          email:
            typeof dados.novoClienteEmail === "string"
              ? dados.novoClienteEmail.trim() || null
              : null,

          telefone:
            typeof dados.novoClienteTelefone === "string"
              ? dados.novoClienteTelefone.trim() || null
              : null,
        },
      ])
      .select()
      .single();

    if (erroCliente) {
      console.error("Erro ao criar novo cliente rápido:", erroCliente);

      throw erroCliente;
    }

    clienteIdFinal = novoCliente.id;
    dadosClienteFinal = novoCliente;
  }

  const dadosObraLimpos = {
    ...dados,
  };

  delete dadosObraLimpos.nome;
  delete dadosObraLimpos.novoClienteNome;
  delete dadosObraLimpos.novoClienteRazaoSocial;
  delete dadosObraLimpos.novoClienteCnpj;
  delete dadosObraLimpos.novoClienteEmail;
  delete dadosObraLimpos.novoClienteTelefone;
  delete dadosObraLimpos.obra_execucao_id;
  delete dadosObraLimpos.revisao;
  delete dadosObraLimpos.motivo_revisao;

  const payloadTratado = Object.fromEntries(
    Object.entries(dadosObraLimpos).map(([chave, valor]) => [
      chave,
      valor === "" ? null : valor,
    ]),
  );

  const { data, error } = await supabase
    .from("orcamentos")
    .insert([
      {
        ...payloadTratado,

        cliente_id: clienteIdFinal || null,

        cliente: dadosClienteFinal?.nome || null,

        razao_social: dadosClienteFinal?.razao_social || null,

        cnpj: dadosClienteFinal?.cnpj || null,

        email: dadosClienteFinal?.email || null,

        telefone: dadosClienteFinal?.telefone || null,
      },
    ])
    .select(consultaObra)
    .single();

  if (error) {
    console.error("Detalhes do erro do Supabase:", error);

    throw error;
  }

  if (obraExecucaoId) {
    const { data: obraVinculada, error: erroVinculo } = await supabase
      .from("obras_execucao")
      .update({
        orcamento_id: data.id,

        updated_at: new Date().toISOString(),
      })
      .eq("id", obraExecucaoId)
      .eq("incluido_erp", true)
      .is("orcamento_id", null)
      .select("id")
      .maybeSingle();

    if (erroVinculo || !obraVinculada) {
      const { error: erroDesfazer } = await supabase
        .from("orcamentos")
        .delete()
        .eq("id", data.id);

      if (erroDesfazer) {
        console.error(
          "Erro ao desfazer orçamento após falha no vínculo:",
          erroDesfazer,
        );
      }

      console.error(
        "Erro ao vincular orçamento à obra existente:",
        erroVinculo,
      );

      throw new Error(
        "Não foi possível vincular o orçamento à obra selecionada. Verifique se ela ainda está disponível.",
      );
    }
  }

  return ordenarEtapas(data as Obra);
}

export async function getObrasExecucaoDisponiveisParaVinculo(): Promise<
  ObraExecucaoDisponivelVinculo[]
> {
  const { data, error } = await supabase
    .from("obras_execucao")
    .select(
      `
        id,
        codigo_erp,
        nome_obra,
        cliente,
        cliente_id,
        setor_id,
        cidade,
        estado
      `,
    )
    .eq("incluido_erp", true)
    .is("orcamento_id", null)
    .not("codigo_erp", "is", null)
    .order("codigo_erp", {
      ascending: true,
    });

  if (error) {
    console.error("Erro ao listar obras disponíveis para vínculo:", error);

    throw error;
  }

  return (data ?? []) as ObraExecucaoDisponivelVinculo[];
}

export { criarObra as createObra };

export async function getObras(): Promise<Obra[]> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select(consultaObra)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Erro Supabase orçamentos:", error);

    throw error;
  }

  return ((data ?? []) as Obra[]).map(ordenarEtapas);
}

export async function getObraById(id: string): Promise<Obra> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select(consultaObra)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar orçamento:", error);

    throw error;
  }

  return ordenarEtapas(data as Obra);
}

export async function atualizarObra(
  id: string,
  obra: Partial<Obra>,
): Promise<Obra> {
  const {
    setor,
    clientes,
    etapas,
    progresso,
    revisao,
    motivo_revisao,
    ...dadosAtualizacao
  } = obra as Partial<Obra> & {
    revisao?: number | null;
    motivo_revisao?: string | null;
  };

  void setor;
  void clientes;
  void etapas;
  void progresso;
  void revisao;
  void motivo_revisao;

  const { data, error } = await supabase
    .from("orcamentos")
    .update(dadosAtualizacao)
    .eq("id", id)
    .select(consultaObra)
    .single();

  if (error) {
    console.error("Erro ao atualizar orçamento:", error);

    throw error;
  }

  return ordenarEtapas(data as Obra);
}

export async function atualizarValoresObra({
  obraId,
  valorOrcado,
  custoOrcado,
  valorVendido,
  custoReal,
  motivoAlteracao,
}: AtualizarValoresObraPayload): Promise<Obra> {
  const motivo = motivoAlteracao.trim();

  const { data, error } = await supabase.rpc("atualizar_valores_obra", {
    p_obra_id: obraId,

    p_valor_orcado: valorOrcado,

    p_custo_orcado: custoOrcado,

    p_valor_vendido: valorVendido,

    p_custo_real: custoReal,

    p_motivo_alteracao: motivo,
  });

  if (error) {
    console.error("Erro ao atualizar valores do orçamento:", error);

    throw error;
  }

  if (!data) {
    throw new Error("Não foi possível atualizar os valores do orçamento.");
  }

  return data as Obra;
}

export async function excluirObra(id: string) {
  const { error } = await supabase.from("orcamentos").delete().eq("id", id);

  if (error) {
    console.error("Erro ao excluir orçamento:", error);

    throw error;
  }
}

export { excluirObra as deletarObra };