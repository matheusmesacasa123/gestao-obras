import {
  useState,
} from "react";

import {
  Building2,
  ExternalLink,
  Eye,
  FileText,
  MessageSquare,
  Send,
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
  criarComentarioDocumento,
  deletarComentarioDocumento,
  deletarDocumento,
  type DocumentoComentario,
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

  const [
    comentariosPorDocumento,
    setComentariosPorDocumento,
  ] = useState<
    Record<
      string,
      DocumentoComentario[]
    >
  >(() => {
    const estadoInicial: Record<
      string,
      DocumentoComentario[]
    > = {};

    for (
      const documento
      of documentos
    ) {
      estadoInicial[
        documento.id
      ] =
        (
          documento as Documento & {
            comentarios?: DocumentoComentario[];
          }
        ).comentarios ??
        [];
    }

    return estadoInicial;
  });

  const [
    novoComentarioPorDocumento,
    setNovoComentarioPorDocumento,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

  const [
    comentandoDocumentoId,
    setComentandoDocumentoId,
  ] = useState<string | null>(
    null
  );

  const [
    comentarioExcluindoId,
    setComentarioExcluindoId,
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

  async function adicionarComentario(
    documentoId: string
  ) {
    const texto =
      novoComentarioPorDocumento[
        documentoId
      ]?.trim() ||
      "";

    if (!texto) {
      return;
    }

    try {
      setComentandoDocumentoId(
        documentoId
      );

      const comentario =
        await criarComentarioDocumento(
          documentoId,
          texto
        );

      setComentariosPorDocumento(
        (
          estadoAtual
        ) => ({
          ...estadoAtual,

          [documentoId]: [
            ...(
              estadoAtual[
                documentoId
              ] ??
              []
            ),
            comentario,
          ],
        })
      );

      setNovoComentarioPorDocumento(
        (
          estadoAtual
        ) => ({
          ...estadoAtual,

          [documentoId]:
            "",
        })
      );
    } catch (error) {
      console.error(
        "Erro ao adicionar comentário:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar o comentário."
      );
    } finally {
      setComentandoDocumentoId(
        null
      );
    }
  }

  async function excluirComentario(
    comentario:
      DocumentoComentario
  ) {
    const podeExcluirComentario =
      administrador ||
      comentario.usuario_id ===
        perfil?.id;

    if (!podeExcluirComentario) {
      alert(
        "Você só pode excluir os seus próprios comentários."
      );

      return;
    }

    const confirmou =
      window.confirm(
        "Deseja excluir este comentário?"
      );

    if (!confirmou) {
      return;
    }

    try {
      setComentarioExcluindoId(
        comentario.id
      );

      await deletarComentarioDocumento(
        comentario.id
      );

      setComentariosPorDocumento(
        (
          estadoAtual
        ) => ({
          ...estadoAtual,

          [comentario.documento_id]:
            (
              estadoAtual[
                comentario.documento_id
              ] ??
              []
            ).filter(
              (
                item
              ) =>
                item.id !==
                comentario.id
            ),
        })
      );
    } catch (error) {
      console.error(
        "Erro ao excluir comentário:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o comentário."
      );
    } finally {
      setComentarioExcluindoId(
        null
      );
    }
  }

  function formatarDataComentario(
    data: string
  ) {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle:
          "short",

        timeStyle:
          "short",
      }
    ).format(
      new Date(
        data
      )
    );
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

          const revisao =
            (
              documento as Documento & {
                revisao?: {
                  numero_revisao: number;
                  status: string;
                } | null;
              }
            ).revisao;

          const comentarios =
            comentariosPorDocumento[
              documento.id
            ] ??
            [];

          const novoComentario =
            novoComentarioPorDocumento[
              documento.id
            ] ??
            "";

          const enviandoComentario =
            comentandoDocumentoId ===
            documento.id;

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

                  {revisao && (
                    <span className="mt-2 inline-flex rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-bold text-blue-700">
                      Rev.{" "}
                      {String(
                        revisao.numero_revisao
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>
                  )}
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

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-500" />

                    <span className="text-sm font-semibold text-gray-800">
                      Comentários
                    </span>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {comentarios.length}
                  </span>
                </div>

                {comentarios.length ===
                0 ? (
                  <p className="rounded-lg border border-dashed bg-slate-50 p-3 text-sm text-gray-500">
                    Nenhum comentário adicionado.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {comentarios.map(
                      (
                        comentario
                      ) => {
                        const podeExcluirComentario =
                          administrador ||
                          comentario.usuario_id ===
                            perfil?.id;

                        return (
                          <div
                            key={
                              comentario.id
                            }
                            className="rounded-xl border bg-slate-50 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-gray-800">
                                  {comentario.usuario?.nome ||
                                    comentario.usuario?.email ||
                                    "Usuário não identificado"}
                                </p>

                                <p className="mt-0.5 text-[11px] text-gray-500">
                                  {formatarDataComentario(
                                    comentario.created_at
                                  )}
                                </p>
                              </div>

                              {podeExcluirComentario && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    excluirComentario(
                                      comentario
                                    )
                                  }
                                  disabled={
                                    comentarioExcluindoId ===
                                    comentario.id
                                  }
                                  title="Excluir comentário"
                                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5 text-gray-700">
                              {comentario.comentario}
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <textarea
                    value={
                      novoComentario
                    }
                    onChange={(
                      event
                    ) =>
                      setNovoComentarioPorDocumento(
                        (
                          estadoAtual
                        ) => ({
                          ...estadoAtual,

                          [documento.id]:
                            event.target.value,
                        })
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();

                        adicionarComentario(
                          documento.id
                        );
                      }
                    }}
                    rows={2}
                    maxLength={2000}
                    placeholder="Escreva um comentário..."
                    disabled={
                      enviandoComentario
                    }
                    className="min-h-[44px] flex-1 resize-y rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      adicionarComentario(
                        documento.id
                      )
                    }
                    disabled={
                      enviandoComentario ||
                      !novoComentario.trim()
                    }
                    title="Adicionar comentário"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-[11px] text-gray-500">
                  Pressione Enter para enviar ou Shift + Enter para quebrar a linha.
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