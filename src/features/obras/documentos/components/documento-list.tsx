import {
  useState,
} from "react";

import {
  ExternalLink,
  Eye,
  FileText,
  Trash2,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  Documento,
} from "../types";

import {
  deletarDocumento,
} from "../services/documentos-service";

interface DocumentoListProps {
  documentos: Documento[];
  onDelete: () => void;
}

export function DocumentoList({
  documentos,
  onDelete,
}: DocumentoListProps) {
  const {
    perfil,
  } = useAuth();

  const [
    documentoExcluindoId,
    setDocumentoExcluindoId,
  ] = useState<string | null>(
    null
  );

  const administrador =
    perfil?.administrador ===
    true;

  function podeExcluirDocumento(
    documento: Documento
  ): boolean {
    if (administrador) {
      return true;
    }

    return Boolean(
      perfil?.setor_id &&
      documento.setor_id &&
      perfil.setor_id ===
        documento.setor_id
    );
  }

  async function validarPermissaoAtual(
    documentoId: string
  ): Promise<boolean> {
    if (administrador) {
      return true;
    }

    const setorUsuarioId =
      perfil?.setor_id;

    if (!setorUsuarioId) {
      return false;
    }

    const {
      data,
      error,
    } = await supabase
      .from("documentos")
      .select(
        "setor_id"
      )
      .eq(
        "id",
        documentoId
      )
      .single();

    if (error) {
      console.error(
        "Erro ao verificar setor do documento:",
        error
      );

      throw new Error(
        "Não foi possível confirmar sua permissão para excluir este documento."
      );
    }

    return (
      data.setor_id ===
      setorUsuarioId
    );
  }

  async function handleDelete(
    documento: Documento
  ) {
    if (
      !podeExcluirDocumento(
        documento
      )
    ) {
      alert(
        "Você só pode excluir documentos enviados pelo seu próprio setor."
      );

      return;
    }

    const confirmou =
      confirm(
        `Tem certeza que deseja excluir o documento "${documento.nome}"?`
      );

    if (!confirmou) {
      return;
    }

    try {
      setDocumentoExcluindoId(
        documento.id
      );

      const permissaoAtual =
        await validarPermissaoAtual(
          documento.id
        );

      if (!permissaoAtual) {
        alert(
          "Este documento não pertence ao seu setor e não pode ser excluído."
        );

        onDelete();

        return;
      }

      await deletarDocumento(
        documento.id,
        documento.arquivo_url
      );

      await onDelete();
    } catch (error) {
      console.error(
        "Erro ao excluir documento:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao excluir documento."
      );
    } finally {
      setDocumentoExcluindoId(
        null
      );
    }
  }

  if (
    documentos.length ===
    0
  ) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold">
          Nenhum documento cadastrado
        </h2>

        <p className="mt-2 text-muted-foreground">
          Adicione documentos desta obra.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {documentos.map(
        (
          documento
        ) => {
          const podeExcluir =
            podeExcluirDocumento(
              documento
            );

          const excluindo =
            documentoExcluindoId ===
            documento.id;

          return (
            <div
              key={
                documento.id
              }
              className="group relative flex flex-col justify-between space-y-3 rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />

                    <h3 className="truncate text-lg font-semibold">
                      {
                        documento.nome
                      }
                    </h3>
                  </div>

                  {podeExcluir ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          documento
                        )
                      }
                      disabled={
                        excluindo
                      }
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Excluir documento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <div
                      className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500"
                      title="Documento enviado por outro setor"
                    >
                      <Eye className="h-3.5 w-3.5" />

                      Visualização
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  Categoria:{" "}
                  {documento.categoria ??
                    "-"}
                </p>

                <p className="text-sm text-muted-foreground">
                  Enviado em:{" "}
                  {new Date(
                    documento.created_at
                  ).toLocaleDateString(
                    "pt-BR"
                  )}
                </p>
              </div>

              <div className="mt-2 border-t pt-2">
                <a
                  href={
                    documento.arquivo_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-800"
                >
                  <span>
                    Abrir documento
                  </span>

                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}