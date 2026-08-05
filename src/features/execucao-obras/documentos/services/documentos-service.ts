import {
  supabase,
} from "@/integrations/supabase/client";

const BUCKET_DOCUMENTOS =
  "documentos";

const DURACAO_URL_ASSINADA_SEGUNDOS =
  60 * 60;

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
  arquivoUrlOuCaminho: string
): string | null {
  const valor =
    arquivoUrlOuCaminho.trim();

  if (!valor) {
    return null;
  }

  if (
    !valor.startsWith("http://") &&
    !valor.startsWith("https://")
  ) {
    const caminhoDireto =
      valor.replace(
        /^\/+/,
        ""
      );

    return caminhoDireto || null;
  }

  try {
    const url =
      new URL(valor);

    const marcadores = [
      `/storage/v1/object/public/${BUCKET_DOCUMENTOS}/`,
      `/storage/v1/object/sign/${BUCKET_DOCUMENTOS}/`,
      `/storage/v1/object/authenticated/${BUCKET_DOCUMENTOS}/`,
      `/${BUCKET_DOCUMENTOS}/`,
    ];

    for (
      const marcador
      of marcadores
    ) {
      const indice =
        url.pathname.indexOf(
          marcador
        );

      if (indice === -1) {
        continue;
      }

      const caminho =
        url.pathname.slice(
          indice +
          marcador.length
        );

      if (!caminho) {
        return null;
      }

      return decodeURIComponent(
        caminho
      );
    }
  } catch {
    return null;
  }

  return null;
}

async function adicionarUrlAssinada(
  documento: DocumentoExecucao
): Promise<DocumentoExecucao> {
  const caminho =
    extrairCaminhoStorage(
      documento.arquivo_url
    );

  if (!caminho) {
    throw new Error(
      `Não foi possível identificar o arquivo do documento "${documento.nome}".`
    );
  }

  const {
    data,
    error,
  } = await supabase.storage
    .from(
      BUCKET_DOCUMENTOS
    )
    .createSignedUrl(
      caminho,
      DURACAO_URL_ASSINADA_SEGUNDOS
    );

  if (
    error ||
    !data?.signedUrl
  ) {
    throw error || new Error(
      `Não foi possível liberar o acesso temporário ao documento "${documento.nome}".`
    );
  }

  return {
    ...documento,
    arquivo_url:
      data.signedUrl,
  };
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
    throw error;
  }

  const documentos =
    (
      data ??
      []
    ) as DocumentoExecucao[];

  return Promise.all(
    documentos.map(
      adicionarUrlAssinada
    )
  );
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
      BUCKET_DOCUMENTOS
    )
    .upload(
      caminho,
      arquivo
    );

  if (uploadError) {
    throw uploadError;
  }

  let documentoCriadoId:
    | string
    | null = null;

  try {
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
          caminho,
      })
      .select(
        "*"
      )
      .single();

    if (error) {
      throw error;
    }

    const documento =
      data as DocumentoExecucao;

    documentoCriadoId =
      documento.id;

    return await adicionarUrlAssinada(
      documento
    );
  } catch (error) {
    if (documentoCriadoId) {
      await supabase
        .from(
          "documentos_obras_execucao"
        )
        .delete()
        .eq(
          "id",
          documentoCriadoId
        );
    }

    await supabase.storage
      .from(
        BUCKET_DOCUMENTOS
      )
      .remove([
        caminho,
      ]);

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
    throw dbError;
  }

  const caminhoArquivo =
    extrairCaminhoStorage(
      arquivoUrl
    );

  if (!caminhoArquivo) {
    return;
  }

  await supabase.storage
    .from(
      BUCKET_DOCUMENTOS
    )
    .remove([
      caminhoArquivo,
    ]);
}