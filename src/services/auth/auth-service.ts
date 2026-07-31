import {
  supabase,
} from "@/integrations/supabase/client";

export async function signIn(
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(
  nome: string,
  email: string,
  password: string
) {
  return supabase.auth.signUp({
    email,
    password,

    options: {
      data: {
        nome,
      },
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function atualizarNomeUsuario(
  nome: string
) {
  return supabase.auth.updateUser({
    data: {
      nome,
    },
  });
}

export async function atualizarSenhaUsuario(
  novaSenha: string
) {
  return supabase.auth.updateUser({
    password: novaSenha,
  });
}