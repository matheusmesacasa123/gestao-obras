import { supabase } from "@/integrations/supabase/client";
import type { Documento } from "../types";

export async function getDocumentosPorObra(
  obraId: string
): Promise<Documento[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .eq("obra_id", obraId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Erro ao buscar documentos:", error);
    throw error;
  }

  return data ?? [];
}

export async function uploadDocumento(
  obraId: string,
  arquivo: File,
  nome: string,
  categoria?: string
) {
  const caminho = `${obraId}/${Date.now()}-${arquivo.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(caminho, arquivo);

  if (uploadError) {
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from("documentos")
    .getPublicUrl(caminho);

  const { data, error } = await supabase
    .from("documentos")
    .insert({
      obra_id: obraId,
      nome,
      categoria: categoria ?? null,
      arquivo_url: urlData.publicUrl,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deletarDocumento(id: string, arquivoUrl: string) {
  console.log("Iniciando exclusão do documento ID:", id);

  // 1. Remove o registro do banco de dados primeiro
  const { error: dbError } = await supabase
    .from("documentos")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.error("Erro detalhado do Supabase ao deletar do banco:", dbError);
    throw dbError;
  }

  console.log("Registro removido do banco com sucesso.");

  // 2. Tenta remover o arquivo do Storage em segundo plano
  try {
    const partesUrl = arquivoUrl.split("/documentos/");
    const caminhoArquivo = partesUrl[1];

    if (caminhoArquivo) {
      const { error: storageError } = await supabase.storage
        .from("documentos")
        .remove([decodeURIComponent(caminhoArquivo)]);

      if (storageError) {
        console.warn("Aviso ao remover arquivo físico do storage:", storageError);
      }
    }
  } catch (storageError) {
    console.warn("Erro ao processar caminho do storage:", storageError);
  }
}