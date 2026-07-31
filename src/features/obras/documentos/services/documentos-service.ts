import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  Documento,
} from "../types";

export async function getDocumentosPorObra(
  obraId: string
): Promise<Documento[]> {
  const {
    data,
    error,
  } = await supabase
    .from("documentos")
    .select("*")
    .eq(
      "obra_id",
      obraId
    )
    .order(
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

  return (
    data ??
    []
  ) as Documento[];
}

export async function uploadDocumento(
  obraId: string,
  arquivo: File,
  nome: string,
  categoria: string,
  setorId: string | null
): Promise<Documento> {
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

        setor_id:
          setorId,

        nome,

        categoria:
          categoria ||
          null,

        arquivo_url:
          urlData.publicUrl,
      })
      .select()
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