import {
  supabase,
} from "@/integrations/supabase/client";

export interface Cliente {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  created_at?: string;

  quantidade_obras?: number;
  valor_total_vendido?: number;
}

export interface ObraCliente {
  id: string;
  cliente_id: string | null;
  codigo: string | null;
  numero_proposta: string | null;
  revisao: number | null;
  nome_obra: string | null;
  status: string | null;
  cidade: string | null;
  estado: string | null;
  data_entrada: string | null;
  data_entrega_esperada: string | null;
  data_entrega: string | null;
  tipo_proposta: string | null;
  tipo_orcamentacao: string | null;
  valor_orcado: number | null;
  valor_vendido: number | null;
  created_at: string;
}

export interface ClienteComObras
  extends Cliente {
  obras: ObraCliente[];
}

type ClienteComResumoSupabase = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  created_at?: string;
  obras:
    | {
        id: string;
        valor_vendido: number | null;
      }[]
    | null;
};

export async function getClientes(): Promise<
  Cliente[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("clientes")
    .select(`
      id,
      nome,
      email,
      telefone,
      created_at,
      obras (
        id,
        valor_vendido
      )
    `)
    .order(
      "nome",
      {
        ascending:
          true,
      }
    );

  if (error) {
    console.error(
      "Erro ao buscar clientes:",
      error
    );

    throw error;
  }

  return (
    (
      data ??
      []
    ) as ClienteComResumoSupabase[]
  ).map(
    (
      cliente
    ) => {
      const obras =
        cliente.obras ??
        [];

      const valorTotalVendido =
        obras.reduce(
          (
            total,
            obra
          ) =>
            total +
            (
              Number(
                obra.valor_vendido
              ) ||
              0
            ),
          0
        );

      return {
        id:
          cliente.id,

        nome:
          cliente.nome,

        email:
          cliente.email,

        telefone:
          cliente.telefone,

        created_at:
          cliente.created_at,

        quantidade_obras:
          obras.length,

        valor_total_vendido:
          valorTotalVendido,
      };
    }
  );
}

export async function getClienteComObras(
  clienteId: string
): Promise<ClienteComObras> {
  const {
    data: cliente,
    error: erroCliente,
  } = await supabase
    .from("clientes")
    .select(
      "id, nome, email, telefone, created_at"
    )
    .eq(
      "id",
      clienteId
    )
    .single();

  if (erroCliente) {
    console.error(
      "Erro ao buscar cliente:",
      erroCliente
    );

    throw erroCliente;
  }

  const {
    data: obras,
    error: erroObras,
  } = await supabase
    .from("obras")
    .select(`
      id,
      cliente_id,
      codigo,
      numero_proposta,
      revisao,
      nome_obra,
      status,
      cidade,
      estado,
      data_entrada,
      data_entrega_esperada,
      data_entrega,
      tipo_proposta,
      tipo_orcamentacao,
      valor_orcado,
      valor_vendido,
      created_at
    `)
    .eq(
      "cliente_id",
      clienteId
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      }
    );

  if (erroObras) {
    console.error(
      "Erro ao buscar obras do cliente:",
      erroObras
    );

    throw erroObras;
  }

  const obrasTratadas =
    (
      obras ??
      []
    ) as ObraCliente[];

  return {
    ...cliente,

    quantidade_obras:
      obrasTratadas.length,

    valor_total_vendido:
      obrasTratadas.reduce(
        (
          total,
          obra
        ) =>
          total +
          (
            Number(
              obra.valor_vendido
            ) ||
            0
          ),
        0
      ),

    obras:
      obrasTratadas,
  };
}

export async function atualizarCliente(
  id: string,
  dados: {
    nome: string;
    email: string | null;
    telefone: string | null;
  }
): Promise<Cliente> {
  const nome =
    dados.nome.trim();

  if (!nome) {
    throw new Error(
      "O nome do cliente é obrigatório."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("clientes")
    .update({
      nome,

      email:
        dados.email?.trim() ||
        null,

      telefone:
        dados.telefone?.trim() ||
        null,
    })
    .eq(
      "id",
      id
    )
    .select(
      "id, nome, email, telefone, created_at"
    )
    .single();

  if (error) {
    console.error(
      "Erro ao atualizar cliente:",
      error
    );

    throw error;
  }

  return data as Cliente;
}

export async function criarCliente(
  cliente: Omit<
    Cliente,
    | "id"
    | "created_at"
    | "quantidade_obras"
    | "valor_total_vendido"
  >
) {
  const {
    data,
    error,
  } = await supabase
    .from("clientes")
    .insert([
      cliente,
    ])
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao criar cliente:",
      error
    );

    throw error;
  }

  return data;
}

export async function excluirCliente(
  id: string
) {
  const {
    count,
    error:
      erroContagem,
  } = await supabase
    .from("obras")
    .select(
      "id",
      {
        count:
          "exact",
        head:
          true,
      }
    )
    .eq(
      "cliente_id",
      id
    );

  if (erroContagem) {
    console.error(
      "Erro ao verificar obras do cliente:",
      erroContagem
    );

    throw erroContagem;
  }

  if (
    (
      count ??
      0
    ) >
    0
  ) {
    throw new Error(
      "Este cliente possui obras vinculadas e não pode ser excluído."
    );
  }

  const {
    error,
  } = await supabase
    .from("clientes")
    .delete()
    .eq(
      "id",
      id
    );

  if (error) {
    console.error(
      "Erro ao excluir cliente:",
      error
    );

    throw error;
  }
}