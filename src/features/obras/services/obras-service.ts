import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  Obra,
} from "../types";

export interface ObraPayload {
  nome?: string;
  nome_obra?: string;
  setor_id?: string | null;
  cliente_id?: string | null;
  novoClienteNome?: string;
  novoClienteCnpj?: string;
  novoClienteEmail?: string;
  novoClienteTelefone?: string;
  [key: string]: unknown;
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
  etapas:etapas_obras (
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

function ordenarEtapas(
  obra: Obra
): Obra {
  return {
    ...obra,

    etapas:
      obra.etapas
        ?.slice()
        .sort(
          (
            etapaA,
            etapaB
          ) => {
            const ordemA =
              etapaA.ordem ??
              Number.MAX_SAFE_INTEGER;

            const ordemB =
              etapaB.ordem ??
              Number.MAX_SAFE_INTEGER;

            if (
              ordemA !==
              ordemB
            ) {
              return (
                ordemA -
                ordemB
              );
            }

            return (
              etapaA.setor?.nome ||
              ""
            ).localeCompare(
              etapaB.setor?.nome ||
                "",
              "pt-BR"
            );
          }
        ) || [],
  };
}

export async function criarObra(
  dados: ObraPayload
) {
  let clienteIdFinal =
    dados.cliente_id;

  if (
    !clienteIdFinal &&
    typeof dados.novoClienteNome ===
      "string" &&
    dados.novoClienteNome.trim() !==
      ""
  ) {
    const {
      data: novoCliente,
      error: erroCliente,
    } = await supabase
      .from("clientes")
      .insert([
        {
          nome:
            dados.novoClienteNome.trim(),

          cnpj:
            typeof dados.novoClienteCnpj ===
            "string"
              ? dados.novoClienteCnpj.trim() ||
                null
              : null,

          email:
            typeof dados.novoClienteEmail ===
            "string"
              ? dados.novoClienteEmail.trim() ||
                null
              : null,

          telefone:
            typeof dados.novoClienteTelefone ===
            "string"
              ? dados.novoClienteTelefone.trim() ||
                null
              : null,
        },
      ])
      .select()
      .single();

    if (erroCliente) {
      console.error(
        "Erro ao criar novo cliente rápido:",
        erroCliente
      );

      throw erroCliente;
    }

    clienteIdFinal =
      novoCliente.id;
  }

  const dadosObraLimpos = {
    ...dados,
  };

  delete dadosObraLimpos.nome;
  delete dadosObraLimpos.novoClienteNome;
  delete dadosObraLimpos.novoClienteCnpj;
  delete dadosObraLimpos.novoClienteEmail;
  delete dadosObraLimpos.novoClienteTelefone;
  delete dadosObraLimpos.revisao;
  delete dadosObraLimpos.motivo_revisao;

  const payloadTratado =
    Object.fromEntries(
      Object.entries(
        dadosObraLimpos
      ).map(
        ([
          chave,
          valor,
        ]) => [
          chave,
          valor === ""
            ? null
            : valor,
        ]
      )
    );

  const {
    data,
    error,
  } = await supabase
    .from("obras")
    .insert([
      {
        ...payloadTratado,

        cliente_id:
          clienteIdFinal ||
          null,
      },
    ])
    .select(
      consultaObra
    )
    .single();

  if (error) {
    console.error(
      "Detalhes do erro do Supabase:",
      error
    );

    throw error;
  }

  return ordenarEtapas(
    data as Obra
  );
}

export {
  criarObra as createObra,
};

export async function getObras(): Promise<
  Obra[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("obras")
    .select(
      consultaObra
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    console.error(
      "Erro Supabase obras:",
      error
    );

    throw error;
  }

  return (
    (
      data ??
      []
    ) as Obra[]
  ).map(
    ordenarEtapas
  );
}

export async function getObraById(
  id: string
): Promise<Obra> {
  const {
    data,
    error,
  } = await supabase
    .from("obras")
    .select(
      consultaObra
    )
    .eq(
      "id",
      id
    )
    .single();

  if (error) {
    console.error(
      "Erro ao buscar obra:",
      error
    );

    throw error;
  }

  return ordenarEtapas(
    data as Obra
  );
}

export async function atualizarObra(
  id: string,
  obra: Partial<Obra>
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

  const {
    data,
    error,
  } = await supabase
    .from("obras")
    .update(
      dadosAtualizacao
    )
    .eq(
      "id",
      id
    )
    .select(
      consultaObra
    )
    .single();

  if (error) {
    console.error(
      "Erro ao atualizar obra:",
      error
    );

    throw error;
  }

  return ordenarEtapas(
    data as Obra
  );
}

export async function atualizarValoresObra({
  obraId,
  valorOrcado,
  custoOrcado,
  valorVendido,
  custoReal,
  motivoAlteracao,
}: AtualizarValoresObraPayload): Promise<Obra> {
  const motivo =
    motivoAlteracao.trim();

  const {
    data,
    error,
  } = await supabase.rpc(
    "atualizar_valores_obra",
    {
      p_obra_id:
        obraId,

      p_valor_orcado:
        valorOrcado,

      p_custo_orcado:
        custoOrcado,

      p_valor_vendido:
        valorVendido,

      p_custo_real:
        custoReal,

      p_motivo_alteracao:
        motivo,
    }
  );

  if (error) {
    console.error(
      "Erro ao atualizar valores da obra:",
      error
    );

    throw error;
  }

  if (!data) {
    throw new Error(
      "Não foi possível atualizar os valores da obra."
    );
  }

  return data as Obra;
}

export async function excluirObra(
  id: string
) {
  const {
    error,
  } = await supabase
    .from("obras")
    .delete()
    .eq(
      "id",
      id
    );

  if (error) {
    console.error(
      "Erro ao excluir obra:",
      error
    );

    throw error;
  }
}

export {
  excluirObra as deletarObra,
};