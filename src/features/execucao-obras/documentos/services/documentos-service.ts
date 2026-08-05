import {
  supabase,
} from "@/integrations/supabase/client";

export interface DocumentoExecucao {
  id: string;

  obra_id:
    | string
    | null;

  etapa_id: string;

  demanda_id: string;

  nome: string;

  categoria:
    | string
    | null;

  arquivo_url: string;

  setor_id:
    | string
    | null;

  enviado_por:
    | string
    | null;

  created_at:
    | string
    | null;
}

interface DemandaDocumentoExecucao {
  id: string;
  obra_id: string;
  etapa_id: string;
  setor_id: string | null;
}

function criarNomeArquivoSeguro(
  nomeArquivo: string
) {
  return nomeArquivo.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );
}

function extrairCaminhoStorage(
  arquivoUrl: string
): string | null {
  const marcador =
    "/documentos/";

  const indiceMarcador =
    arquivoUrl.indexOf(
      marcador
    );

  if (
    indiceMarcador ===
    -1
  ) {
    return null;
  }

  const caminho =
    arquivoUrl.slice(
      indiceMarcador +
      marcador.length
    );

  if (!caminho) {
    return null;
  }

  return decodeURIComponent(
    caminho
  );
}

async function buscarDemandaDocumento(
  demandaId: string
): Promise<DemandaDocumentoExecucao> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
    .select(
      "id, obra_id, etapa_id, setor_id"
    )
    .eq(
      "id",
      demandaId
    )
    .single();

  if (error) {
    console.error(
      "Erro ao buscar a demanda para o documento:",
      error
    );

    throw error;
  }

  return data as DemandaDocumentoExecucao;
}

export async function getDocumentosPorDemanda(
  demandaId: string
): Promise<DocumentoExecucao[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "documentos_obras_execucao"
    )
    .select(
      "*"
    )
    .eq(
      "demanda_id",
      demandaId
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
      "Erro ao buscar documentos da demanda da execução:",
      error
    );

    throw error;
  }

  return (
    data ??
    []
  ) as DocumentoExecucao[];
}

export async function uploadDocumentoDaDemanda(
  demandaId: string,
  obraId: string,
  arquivo: File,
  nome: string
): Promise<DocumentoExecucao> {
  const nomeTratado =
    nome.trim();

  if (!nomeTratado) {
    throw new Error(
      "Informe o nome do documento."
    );
  }

  const {
    data: usuarioData,
    error: usuarioError,
  } =
    await supabase.auth.getUser();

  if (
    usuarioError ||
    !usuarioData.user
  ) {
    throw new Error(
      "Não foi possível identificar o usuário autenticado."
    );
  }

  const demanda =
    await buscarDemandaDocumento(
      demandaId
    );

  if (
    demanda.obra_id !==
    obraId
  ) {
    throw new Error(
      "A demanda selecionada não pertence a esta obra."
    );
  }

  if (!demanda.etapa_id) {
    throw new Error(
      "A demanda não possui uma etapa válida."
    );
  }

  const nomeArquivoSeguro =
    criarNomeArquivoSeguro(
      arquivo.name
    );

  const caminho =
    `execucao-obras/${obraId}/demandas/${demandaId}/${Date.now()}-${nomeArquivoSeguro}`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from(
      "documentos"
    )
    .upload(
      caminho,
      arquivo
    );

  if (uploadError) {
    console.error(
      "Erro ao enviar documento para o Storage:",
      uploadError
    );

    throw uploadError;
  }

  try {
    const {
      data: urlData,
    } = supabase.storage
      .from(
        "documentos"
      )
      .getPublicUrl(
        caminho
      );

    const {
      data,
      error,
    } = await supabase
      .from(
        "documentos_obras_execucao"
      )
      .insert({
        obra_id:
          demanda.obra_id,

        etapa_id:
          demanda.etapa_id,

        demanda_id:
          demanda.id,

        setor_id:
          demanda.setor_id,

        enviado_por:
          usuarioData.user.id,

        nome:
          nomeTratado,

        categoria:
          "demanda",

        arquivo_url:
          urlData.publicUrl,
      })
      .select(
        "*"
      )
      .single();

    if (error) {
      throw error;
    }

    return data as DocumentoExecucao;
  } catch (error) {
    const {
      error:
        erroRemocaoStorage,
    } = await supabase.storage
      .from(
        "documentos"
      )
      .remove([
        caminho,
      ]);

    if (
      erroRemocaoStorage
    ) {
      console.warn(
        "O cadastro do documento falhou e o arquivo não pôde ser removido do Storage:",
        erroRemocaoStorage
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
    .from(
      "documentos_obras_execucao"
    )
    .delete()
    .eq(
      "id",
      id
    );

  if (dbError) {
    console.error(
      "Erro ao excluir documento da execução no banco:",
      dbError
    );

    throw dbError;
  }

  const caminhoArquivo =
    extrairCaminhoStorage(
      arquivoUrl
    );

  if (!caminhoArquivo) {
    console.warn(
      "O registro foi excluído, mas não foi possível identificar o caminho do arquivo no Storage."
    );

    return;
  }

  const {
    error: storageError,
  } = await supabase.storage
    .from(
      "documentos"
    )
    .remove([
      caminhoArquivo,
    ]);

  if (storageError) {
    console.warn(
      "O registro foi removido, mas o arquivo não pôde ser excluído do Storage:",
      storageError
    );
  }
}