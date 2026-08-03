import {
  useState,
} from "react";

import {
  Building2,
  ExternalLink,
  Eye,
  FileText,
  Layers3,
  Pencil,
  Trash2,
  UserRound,
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
  onEdit: (
    documento: Documento
  ) => void;
}

export function DocumentoList({
  documentos,
  onDelete,
  onEdit,
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

        await onDelete();

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
          Nenhum documento encontrado
        </h2>

        <p className="mt-2 text-muted-foreground">
          Ajuste os filtros ou adicione um novo documento.
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

          const nomeUsuario =
            documento.usuario?.nome ||
            documento.usuario?.email ||
            "Usuário não identificado";

          const nomeSetor =
            documento.setor?.nome ||
            documento.etapa?.setor?.nome ||
            "Setor não informado";

          const nomeEtapa =
            documento.etapa
              ? `Etapa ${
                  documento.etapa.ordem ??
                  "?"
                } — ${
                  documento.etapa.setor?.nome ||
                  nomeSetor
                } — ${
                  documento.etapa.titulo ||
                  "Sem título"
                }`
              : "Etapa não vinculada";

          return (
            <div
              key={
                documento.id
              }
              className="group relative flex flex-col justify-between space-y-4 rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="space-y-3">
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
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onEdit(
                            documento
                          )
                        }
                        disabled={
                          excluindo
                        }
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Editar documento"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

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
                    </div>
                  ) : (
                    <div
                      className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500"
                      title="Documento de outro setor"
                    >
                      <Eye className="h-3.5 w-3.5" />

                      Visualização
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  Categoria:{" "}
                  <span className="font-medium text-gray-800">
                    {documento.categoria ??
                      "-"}
                  </span>
                </p>

                <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Layers3 className="h-4 w-4 shrink-0" />

                    <span className="text-xs font-semibold">
                      Etapa vinculada
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-blue-950">
                    {
                      nomeEtapa
                    }
                  </p>
                </div>

                <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-4 w-4 shrink-0 text-slate-500" />

                    <span>
                      Setor responsável:{" "}
                      <strong className="font-semibold text-gray-800">
                        {
                          nomeSetor
                        }
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <UserRound className="h-4 w-4 shrink-0 text-slate-500" />

                    <span>
                      Enviado por:{" "}
                      <strong className="font-semibold text-gray-800">
                        {
                          nomeUsuario
                        }
                      </strong>
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Enviado em:{" "}
                  {new Date(
                    documento.created_at
                  ).toLocaleDateString(
                    "pt-BR"
                  )}
                </p>
              </div>

              <div className="border-t pt-3">
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