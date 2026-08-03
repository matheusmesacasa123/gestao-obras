import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  Documento,
  EtapaDocumento,
  SetorDocumento,
} from "../types";

export interface DocumentoComentario {
  id: string;
  documento_id: string;
  usuario_id: string;
  comentario: string;
  created_at: string;
  updated_at: string;

  usuario?:
    | {
        id: string;
        nome: string;
        email: string;
      }
    | null;
}

const consultaDocumento = `
  *,
  revisao:obra_revisoes!documentos_revisao_obra_fkey (
    id,
    obra_id,
    numero_revisao,
    status,
    motivo_revisao,
    observacao
  ),
  etapa:etapas_obras!documentos_etapa_id_fkey (
    id,
    obra_id,
    obra_revisao_id,
    setor_id,
    titulo,
    ordem,
    status,
    setor:setores (
      id,
      nome
    )
  ),
  setor:setores (
    id,
    nome
  ),
  usuario:usuarios (
    id,
    nome,
    email
  ),
  comentarios:documento_comentarios (
    id,
    documento_id,
    usuario_id,
    comentario,
    created_at,
    updated_at,
    usuario:usuarios (
      id,
      nome,
      email
    )
  )
`;

export async function getDocumentosPorObra(
  obraId: string,
  obraRevisaoId?: string | null
): Promise<Documento[]> {
  let consulta =
    supabase
      .from("documentos")
      .select(
        consultaDocumento
      )
      .eq(
        "obra_id",
        obraId
      );

  if (
    obraRevisaoId
  ) {
    consulta =
      consulta.eq(
        "obra_revisao_id",
        obraRevisaoId
      );
  }

  const {
    data,
    error,
  } = await consulta.order(
    "created_at",
    {
      ascending:
        false,
    }
  );

  if (error) {
    console.error(
      "Erro ao buscar documentos:",
      error
    );

    throw error;
  }

  const documentos =
    (
      data ??
      []
    ) as unknown as Array<
      Documento & {
        comentarios?: DocumentoComentario[];
      }
    >;

  for (
    const documento
    of documentos
  ) {
    documento.comentarios =
      (
        documento.comentarios ??
        []
      ).sort(
        (
          comentarioA,
          comentarioB
        ) =>
          new Date(
            comentarioA.created_at
          ).getTime() -
          new Date(
            comentarioB.created_at
          ).getTime()
      );
  }

  return documentos as Documento[];
}

export async function getEtapasDocumentosPorObra(
  obraId: string,
  obraRevisaoId?: string | null
): Promise<EtapaDocumento[]> {
  let consulta =
    supabase
      .from("etapas_obras")
      .select(`
        id,
        obra_id,
        obra_revisao_id,
        setor_id,
        titulo,
        ordem,
        status,
        setor:setores (
          id,
          nome
        )
      `)
      .eq(
        "obra_id",
        obraId
      );

  if (
    obraRevisaoId
  ) {
    consulta =
      consulta.eq(
        "obra_revisao_id",
        obraRevisaoId
      );
  }

  const {
    data,
    error,
  } = await consulta.order(
    "ordem",
    {
      ascending:
        true,
    }
  );

  if (error) {
    console.error(
      "Erro ao buscar etapas da obra:",
      error
    );

    throw error;
  }

  return (
    data ??
    []
  ) as EtapaDocumento[];
}

export type ContextoRevisaoDocumento = {
  id: string;
  obra_id: string;
  numero_revisao: number;
  status: string;
  motivo_revisao: string | null;
  observacao: string | null;
};

export async function getContextoRevisaoDocumento(
  obraRevisaoId: string
): Promise<ContextoRevisaoDocumento> {
  const {
    data,
    error,
  } = await supabase
    .from("obra_revisoes")
    .select(
      "id, obra_id, numero_revisao, status, motivo_revisao, observacao"
    )
    .eq(
      "id",
      obraRevisaoId
    )
    .single();

  if (error) {
    console.error(
      "Erro ao buscar revisão selecionada:",
      error
    );

    throw error;
  }

  return data as ContextoRevisaoDocumento;
}

export async function getSetoresDocumentos(): Promise<
  SetorDocumento[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("setores")
    .select(
      "id, nome"
    )
    .order(
      "nome",
      {
        ascending:
          true,
      }
    );

  if (error) {
    console.error(
      "Erro ao buscar setores:",
      error
    );

    throw error;
  }

  return (
    data ??
    []
  ) as SetorDocumento[];
}

export interface AtualizarDocumentoDados {
  nome: string;
  etapa_id: string;
  setor_id: string;
  obra_revisao_id?: string;
}

export async function uploadDocumento(
  obraId: string,
  etapaId: string,
  obraRevisaoId: string,
  arquivo: File,
  nome: string,
  setorId: string
): Promise<Documento> {
  const {
    data: usuarioData,
    error: usuarioError,
  } = await supabase.auth.getUser();

  if (
    usuarioError ||
    !usuarioData.user
  ) {
    throw new Error(
      "Não foi possível identificar o usuário autenticado."
    );
  }

  const nomeArquivoSeguro =
    arquivo.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

  const caminho =
    `${obraId}/${Date.now()}-${nomeArquivoSeguro}`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from("documentos")
    .upload(
      caminho,
      arquivo
    );

  if (uploadError) {
    throw uploadError;
  }

  try {
    const {
      data: urlData,
    } = supabase.storage
      .from("documentos")
      .getPublicUrl(
        caminho
      );

    const {
      data,
      error,
    } = await supabase
      .from("documentos")
      .insert({
        obra_id:
          obraId,

        etapa_id:
          etapaId,

        obra_revisao_id:
          obraRevisaoId,

        setor_id:
          setorId,

        enviado_por:
          usuarioData.user.id,

        nome,

        arquivo_url:
          urlData.publicUrl,
      })
      .select(
        consultaDocumento
      )
      .single();

    if (error) {
      throw error;
    }

    return data as Documento;
  } catch (error) {
    const {
      error: removerArquivoError,
    } = await supabase.storage
      .from("documentos")
      .remove([
        caminho,
      ]);

    if (
      removerArquivoError
    ) {
      console.warn(
        "O cadastro do documento falhou e o arquivo não pôde ser removido do Storage:",
        removerArquivoError
      );
    }

    throw error;
  }
}

export async function deletarDocumento(
  id: string,
  arquivoUrl: string
): Promise<void> {
  const {
    error: dbError,
  } = await supabase
    .from("documentos")
    .delete()
    .eq(
      "id",
      id
    );

  if (dbError) {
    console.error(
      "Erro ao excluir documento do banco:",
      dbError
    );

    throw dbError;
  }

  try {
    const partesUrl =
      arquivoUrl.split(
        "/documentos/"
      );

    const caminhoArquivo =
      partesUrl[1];

    if (
      !caminhoArquivo
    ) {
      return;
    }

    const caminhoDecodificado =
      decodeURIComponent(
        caminhoArquivo
      );

    const {
      error: storageError,
    } = await supabase.storage
      .from("documentos")
      .remove([
        caminhoDecodificado,
      ]);

    if (
      storageError
    ) {
      console.warn(
        "O registro foi removido, mas o arquivo não pôde ser excluído do Storage:",
        storageError
      );
    }
  } catch (storageError) {
    console.warn(
      "Erro ao processar o caminho do arquivo no Storage:",
      storageError
    );
  }
}

export async function atualizarDocumento(
  documento: Documento,
  dados: AtualizarDocumentoDados,
  novoArquivo?: File | null
): Promise<Documento> {
  let novoCaminho:
    | string
    | null = null;

  let novaUrl =
    documento.arquivo_url;

  if (novoArquivo) {
    const nomeArquivoSeguro =
      novoArquivo.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

    novoCaminho =
      `${documento.obra_id}/${Date.now()}-${nomeArquivoSeguro}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("documentos")
      .upload(
        novoCaminho,
        novoArquivo
      );

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: urlData,
    } = supabase.storage
      .from("documentos")
      .getPublicUrl(
        novoCaminho
      );

    novaUrl =
      urlData.publicUrl;
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from("documentos")
      .update({
        nome:
          dados.nome,

        etapa_id:
          dados.etapa_id,

        setor_id:
          dados.setor_id,

        obra_revisao_id:
          dados.obra_revisao_id ||
          documento.obra_revisao_id,

        arquivo_url:
          novaUrl,
      })
      .eq(
        "id",
        documento.id
      )
      .select(
        consultaDocumento
      )
      .single();

    if (error) {
      throw error;
    }

    if (novoArquivo) {
      const partesUrlAntiga =
        documento.arquivo_url.split(
          "/documentos/"
        );

      const caminhoAntigo =
        partesUrlAntiga[1];

      if (caminhoAntigo) {
        const {
          error: removerAntigoError,
        } = await supabase.storage
          .from("documentos")
          .remove([
            decodeURIComponent(
              caminhoAntigo
            ),
          ]);

        if (
          removerAntigoError
        ) {
          console.warn(
            "O documento foi atualizado, mas o arquivo antigo não pôde ser removido:",
            removerAntigoError
          );
        }
      }
    }

    return data as Documento;
  } catch (error) {
    if (novoCaminho) {
      const {
        error: removerNovoError,
      } = await supabase.storage
        .from("documentos")
        .remove([
          novoCaminho,
        ]);

      if (
        removerNovoError
      ) {
        console.warn(
          "A atualização falhou e o novo arquivo não pôde ser removido:",
          removerNovoError
        );
      }
    }

    throw error;
  }
}

export async function criarComentarioDocumento(
  documentoId: string,
  comentario: string
): Promise<DocumentoComentario> {
  const comentarioTratado =
    comentario.trim();

  if (!comentarioTratado) {
    throw new Error(
      "Escreva um comentário."
    );
  }

  const {
    data: usuarioData,
    error: usuarioError,
  } = await supabase.auth.getUser();

  if (
    usuarioError ||
    !usuarioData.user
  ) {
    throw new Error(
      "Não foi possível identificar o usuário autenticado."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("documento_comentarios")
    .insert({
      documento_id:
        documentoId,

      usuario_id:
        usuarioData.user.id,

      comentario:
        comentarioTratado,
    })
    .select(`
      id,
      documento_id,
      usuario_id,
      comentario,
      created_at,
      updated_at,
      usuario:usuarios (
        id,
        nome,
        email
      )
    `)
    .single();

  if (error) {
    console.error(
      "Erro ao criar comentário:",
      error
    );

    throw error;
  }

  return data as unknown as DocumentoComentario;
}

export async function deletarComentarioDocumento(
  comentarioId: string
): Promise<void> {
  const {
    error,
  } = await supabase
    .from("documento_comentarios")
    .delete()
    .eq(
      "id",
      comentarioId
    );

  if (error) {
    console.error(
      "Erro ao excluir comentário:",
      error
    );

    throw error;
  }
}