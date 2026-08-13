import {
  supabase,
} from "@/integrations/supabase/client";

import {
  Upload as TusUpload,
} from "tus-js-client";

export interface InformacaoClienteDocumento {
  id: string;
  obra_id: string;
  nome: string;
  arquivo_url: string;
  enviado_por: string | null;
  created_at: string;
}

const BUCKET_DOCUMENTOS =
  "documentos";

const DURACAO_URL_ASSINADA_SEGUNDOS =
  60 * 60;

const LIMITE_UPLOAD_PADRAO_BYTES =
  6 * 1024 * 1024;

const TAMANHO_BLOCO_TUS_BYTES =
  6 * 1024 * 1024;

function obterEndpointUploadResumivel() {
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error(
      "A variável VITE_SUPABASE_URL não está configurada."
    );
  }

  let projectId =
    "";

  try {
    projectId =
      new URL(
        supabaseUrl
      ).hostname.split(
        "."
      )[0] ??
      "";
  } catch {
    throw new Error(
      "A URL do Supabase configurada é inválida."
    );
  }

  if (!projectId) {
    throw new Error(
      "Não foi possível identificar o projeto do Supabase."
    );
  }

  return `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
}

async function uploadResumivel(
  caminho: string,
  arquivo: File
) {
  const {
    data: {
      session,
    },
    error: sessionError,
  } =
    await supabase.auth.getSession();

  if (
    sessionError ||
    !session?.access_token
  ) {
    throw new Error(
      "Não foi possível autenticar o envio do documento."
    );
  }

  await new Promise<void>(
    (
      resolve,
      reject
    ) => {
      const upload =
        new TusUpload(
          arquivo,
          {
            endpoint:
              obterEndpointUploadResumivel(),
            retryDelays: [
              0,
              3000,
              5000,
              10000,
              20000,
            ],
            headers: {
              authorization:
                `Bearer ${session.access_token}`,
            },
            uploadDataDuringCreation:
              true,
            removeFingerprintOnSuccess:
              true,
            metadata: {
              bucketName:
                BUCKET_DOCUMENTOS,
              objectName:
                caminho,
              contentType:
                arquivo.type ||
                "application/octet-stream",
              cacheControl:
                "3600",
            },
            chunkSize:
              TAMANHO_BLOCO_TUS_BYTES,
            onError: (
              error
            ) => {
              reject(
                new Error(
                  `Não foi possível enviar o arquivo grande: ${error.message}`
                )
              );
            },
            onSuccess: () => {
              resolve();
            },
          }
        );

      upload.start();
    }
  );
}

async function enviarArquivoParaStorage(
  caminho: string,
  arquivo: File
) {
  if (
    arquivo.size >
    LIMITE_UPLOAD_PADRAO_BYTES
  ) {
    await uploadResumivel(
      caminho,
      arquivo
    );

    return;
  }

  const {
    error,
  } = await supabase.storage
    .from(
      BUCKET_DOCUMENTOS
    )
    .upload(
      caminho,
      arquivo,
      {
        cacheControl:
          "3600",
        contentType:
          arquivo.type ||
          "application/octet-stream",
        upsert:
          false,
      }
    );

  if (error) {
    throw error;
  }
}

function extrairCaminhoArquivo(
  arquivoUrlOuCaminho: string
): string | null {
  const valor =
    arquivoUrlOuCaminho.trim();

  if (!valor) {
    return null;
  }

  function limparCaminho(
    caminho: string
  ) {
    const caminhoSemConsulta =
      caminho
        .split("?")[0]
        .replace(
          /^\/+/, 
          ""
        );

    try {
      return decodeURIComponent(
        caminhoSemConsulta
      );
    } catch {
      return caminhoSemConsulta;
    }
  }

  if (!/^https?:\/\//i.test(valor)) {
    return limparCaminho(
      valor
    );
  }

  try {
    const url =
      new URL(
        valor
      );

    const marcadores = [
      `/storage/v1/object/sign/${BUCKET_DOCUMENTOS}/`,
      `/storage/v1/object/authenticated/${BUCKET_DOCUMENTOS}/`,
      `/storage/v1/object/public/${BUCKET_DOCUMENTOS}/`,
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

      if (indice >= 0) {
        return limparCaminho(
          url.pathname.slice(
            indice +
              marcador.length
          )
        );
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function adicionarUrlAssinada(
  documento: InformacaoClienteDocumento
): Promise<InformacaoClienteDocumento> {
  const caminho =
    extrairCaminhoArquivo(
      documento.arquivo_url
    );

  if (!caminho) {
    throw new Error(
      `Não foi possível localizar o arquivo "${documento.nome}".`
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
      DURACAO_URL_ASSINADA_SEGUNDOS,
      {
        download:
          documento.nome,
      }
    );

  if (error) {
    throw error;
  }

  return {
    ...documento,
    arquivo_url:
      data.signedUrl,
  };
}

export async function listarInformacoesClienteDocumentos(
  obraId: string
): Promise<InformacaoClienteDocumento[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "informacoes_cliente_documentos"
    )
    .select(
      "id, obra_id, nome, arquivo_url, enviado_por, created_at"
    )
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
    throw error;
  }

  return Promise.all(
    (
      data ??
      []
    ).map(
      (
        documento
      ) =>
        adicionarUrlAssinada(
          documento as InformacaoClienteDocumento
        )
    )
  );
}

export async function enviarInformacaoClienteDocumento(
  obraId: string,
  arquivo: File
): Promise<InformacaoClienteDocumento> {
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

  const nomeArquivoSeguro =
    arquivo.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

  const caminho =
    `${obraId}/informacoes-cliente/${Date.now()}-${nomeArquivoSeguro}`;

  await enviarArquivoParaStorage(
    caminho,
    arquivo
  );

  try {
    const {
      data,
      error,
    } = await supabase
      .from(
        "informacoes_cliente_documentos"
      )
      .insert({
        obra_id:
          obraId,
        nome:
          arquivo.name,
        arquivo_url:
          caminho,
        enviado_por:
          usuarioData.user.id,
      })
      .select(
        "id, obra_id, nome, arquivo_url, enviado_por, created_at"
      )
      .single();

    if (error) {
      throw error;
    }

    return adicionarUrlAssinada(
      data as InformacaoClienteDocumento
    );
  } catch (error) {
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

export async function excluirInformacaoClienteDocumento(
  documento: InformacaoClienteDocumento
): Promise<void> {
  const caminho =
    extrairCaminhoArquivo(
      documento.arquivo_url
    );

  const {
    error: bancoError,
  } = await supabase
    .from(
      "informacoes_cliente_documentos"
    )
    .delete()
    .eq(
      "id",
      documento.id
    );

  if (bancoError) {
    throw bancoError;
  }

  if (!caminho) {
    return;
  }

  const {
    error: storageError,
  } = await supabase.storage
    .from(
      BUCKET_DOCUMENTOS
    )
    .remove([
      caminho,
    ]);

  if (storageError) {
    console.warn(
      "O registro foi removido, mas o arquivo não pôde ser excluído do Storage:",
      storageError
    );
  }
}