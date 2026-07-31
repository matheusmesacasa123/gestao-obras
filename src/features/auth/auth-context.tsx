import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  User,
} from "@supabase/supabase-js";

import {
  supabase,
} from "@/integrations/supabase/client";

export type PerfilUsuario = {
  id: string;
  nome: string;
  email: string;
  setor_id: string | null;
  cargo_id: string | null;
  administrador: boolean;
  ativo: boolean;
};

type AuthContextType = {
  user: User | null;
  perfil: PerfilUsuario | null;
  usuarioAtivo: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType>({
    user: null,
    perfil: null,
    usuarioAtivo: false,
    loading: true,
    signOut: async () => {},
    refreshUser: async () => {},
    refreshPerfil: async () => {},
  });

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] = useState<User | null>(
    null
  );

  const [
    perfil,
    setPerfil,
  ] = useState<PerfilUsuario | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  async function buscarPerfil(
    usuarioId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("usuarios")
      .select(`
        id,
        nome,
        email,
        setor_id,
        cargo_id,
        administrador,
        ativo
      `)
      .eq(
        "id",
        usuarioId
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Erro ao buscar perfil do usuário:",
        error
      );

      setPerfil(null);
      return null;
    }

    if (!data) {
      console.error(
        "Perfil não encontrado na tabela usuarios."
      );

      setPerfil(null);
      return null;
    }

    const perfilEncontrado =
      data as PerfilUsuario;

    setPerfil(
      perfilEncontrado
    );

    return perfilEncontrado;
  }

  async function refreshPerfil() {
    if (!user?.id) {
      setPerfil(null);
      return;
    }

    await buscarPerfil(
      user.id
    );
  }

  async function refreshUser() {
    setLoading(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.getUser();

      if (error) {
        console.error(
          "Erro ao atualizar usuário:",
          error
        );

        setUser(null);
        setPerfil(null);
        return;
      }

      const usuarioAtual =
        data.user ?? null;

      setUser(
        usuarioAtual
      );

      if (usuarioAtual) {
        await buscarPerfil(
          usuarioAtual.id
        );
      } else {
        setPerfil(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setPerfil(null);
  }

  useEffect(() => {
    let componenteAtivo = true;

    async function atualizarSessao(
      usuarioSessao: User | null
    ) {
      if (!componenteAtivo) {
        return;
      }

      setUser(
        usuarioSessao
      );

      if (!usuarioSessao) {
        setPerfil(null);
        setLoading(false);
        return;
      }

      await buscarPerfil(
        usuarioSessao.id
      );

      if (
        componenteAtivo
      ) {
        setLoading(false);
      }
    }

    async function carregarSessao() {
      const {
        data,
        error,
      } =
        await supabase.auth.getSession();

      if (
        !componenteAtivo
      ) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar sessão:",
          error
        );

        setUser(null);
        setPerfil(null);
        setLoading(false);
        return;
      }

      await atualizarSessao(
        data.session?.user ??
          null
      );
    }

    carregarSessao();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          atualizarSessao(
            session?.user ??
              null
          );
        }
      );

    return () => {
      componenteAtivo =
        false;

      listener.subscription.unsubscribe();
    };
  }, []);

  const usuarioAtivo =
    Boolean(
      perfil?.ativo
    );

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        usuarioAtivo,
        loading,
        signOut,
        refreshUser,
        refreshPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}