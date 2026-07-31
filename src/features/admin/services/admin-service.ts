import {
  supabase,
} from "@/integrations/supabase/client";

export type Setor = {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
};

export type Cargo = {
  id: string;
  setor_id: string;
  nome: string;
  ativo: boolean;
  created_at: string;

  setor?: {
    id: string;
    nome: string;
  } | null;
};

export type UsuarioAdministrativo = {
  id: string;
  nome: string;
  email: string;
  setor_id: string | null;
  cargo_id: string | null;
  administrador: boolean;
  ativo: boolean;
  created_at: string;

  setor?: {
    id: string;
    nome: string;
  } | null;

  cargo?: {
    id: string;
    nome: string;
  } | null;
};

export async function verificarAdministrador(
  usuarioId: string
): Promise<boolean> {
  const {
    data,
    error,
  } = await supabase
    .from("usuarios")
    .select("administrador")
    .eq("id", usuarioId)
    .single();

  if (error) {
    console.error(
      "Erro ao verificar administrador:",
      error
    );

    return false;
  }

  return Boolean(
    data?.administrador
  );
}

export async function listarUsuarios() {
  return supabase
    .from("usuarios")
    .select(`
      id,
      nome,
      email,
      setor_id,
      cargo_id,
      administrador,
      ativo,
      created_at,
      setor:setores (
        id,
        nome
      ),
      cargo:cargos (
        id,
        nome
      )
    `)
    .order(
      "nome",
      {
        ascending: true,
      }
    );
}

export async function atualizarUsuarioAdministrativo(
  usuarioId: string,
  dados: {
    setor_id: string | null;
    cargo_id: string | null;
    administrador: boolean;
    ativo: boolean;
  }
) {
  return supabase
    .from("usuarios")
    .update(dados)
    .eq(
      "id",
      usuarioId
    )
    .select()
    .single();
}

export async function listarSetores(
  somenteAtivos = false
) {
  let consulta =
    supabase
      .from("setores")
      .select(`
        id,
        nome,
        ativo,
        created_at
      `)
      .order(
        "nome",
        {
          ascending: true,
        }
      );

  if (somenteAtivos) {
    consulta =
      consulta.eq(
        "ativo",
        true
      );
  }

  return consulta;
}

export async function criarSetor(
  nome: string
) {
  return supabase
    .from("setores")
    .insert({
      nome,
      ativo: true,
    })
    .select()
    .single();
}

export async function atualizarSetor(
  setorId: string,
  dados: {
    nome?: string;
    ativo?: boolean;
  }
) {
  return supabase
    .from("setores")
    .update(dados)
    .eq(
      "id",
      setorId
    )
    .select()
    .single();
}

export async function excluirSetor(
  setorId: string
) {
  return supabase
    .from("setores")
    .delete()
    .eq(
      "id",
      setorId
    );
}

export async function listarCargos(
  somenteAtivos = false
) {
  let consulta =
    supabase
      .from("cargos")
      .select(`
        id,
        setor_id,
        nome,
        ativo,
        created_at,
        setor:setores (
          id,
          nome
        )
      `)
      .order(
        "nome",
        {
          ascending: true,
        }
      );

  if (somenteAtivos) {
    consulta =
      consulta.eq(
        "ativo",
        true
      );
  }

  return consulta;
}

export async function criarCargo(
  nome: string,
  setorId: string
) {
  return supabase
    .from("cargos")
    .insert({
      nome,
      setor_id:
        setorId,
      ativo: true,
    })
    .select()
    .single();
}

export async function atualizarCargo(
  cargoId: string,
  dados: {
    nome?: string;
    setor_id?: string;
    ativo?: boolean;
  }
) {
  return supabase
    .from("cargos")
    .update(dados)
    .eq(
      "id",
      cargoId
    )
    .select()
    .single();
}

export async function excluirCargo(
  cargoId: string
) {
  return supabase
    .from("cargos")
    .delete()
    .eq(
      "id",
      cargoId
    );
}