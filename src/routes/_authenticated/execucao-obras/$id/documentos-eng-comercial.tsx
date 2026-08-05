import {
  createFileRoute,
  useLoaderData,
} from "@tanstack/react-router";

import {
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDocumentosPorObra,
} from "@/features/obras/documentos/services/documentos-service";

import type {
  Documento,
} from "@/features/obras/documentos/types";

export const Route = createFileRoute(
  "/_authenticated/execucao-obras/$id/documentos-eng-comercial"
)({
  component:
    DocumentosEngComercialPage,
});

interface GrupoDocumento {
  chave: string;
  titulo: string;
  totalDocumentos: number;
  numeroRevisaoAtual:
    number | null;
  revisoes: {
    chave: string;
    numeroRevisao:
      number | null;
    documentos:
      Documento[];
  }[];
}

function formatarDataHora(
  valor?: string | null
) {
  if (!valor) {
    return "Não informado";
  }

  const data =
    new Date(
      valor
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  ).format(
    data
  );
}

function formatarRevisao(
  numero?: number | null
) {
  if (
    numero === null ||
    numero === undefined
  ) {
    return "Sem revisão";
  }

  return `Rev. ${String(
    numero
  ).padStart(
    2,
    "0"
  )}`;
}

function normalizarTitulo(
  titulo: string
) {
  return titulo
    .trim()
    .toLocaleLowerCase(
      "pt-BR"
    )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    );
}

function DocumentosEngComercialPage() {
  const obra =
    useLoaderData({
      from:
        "/_authenticated/execucao-obras/$id",
    });

  const [
    documentos,
    setDocumentos,
  ] = useState<
    Documento[]
  >([]);

  const [
    carregando,
    setCarregando,
  ] = useState(
    true
  );

  const [
    atualizando,
    setAtualizando,
  ] = useState(
    false
  );

  const [
    erro,
    setErro,
  ] = useState<
    string | null
  >(
    null
  );

  const [
    gruposAbertos,
    setGruposAbertos,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const carregarDocumentos =
    useCallback(
      async (
        carregamentoInicial =
          false
      ) => {
        if (
          !obra.orcamento_id
        ) {
          setDocumentos(
            []
          );

          setCarregando(
            false
          );

          return;
        }

        try {
          if (
            carregamentoInicial
          ) {
            setCarregando(
              true
            );
          } else {
            setAtualizando(
              true
            );
          }

          setErro(
            null
          );

          const dados =
            await getDocumentosPorObra(
              obra.orcamento_id
            );

          setDocumentos(
            dados
          );
        } catch (error) {
          console.error(
            "Erro ao carregar documentos da Engenharia Comercial:",
            error
          );

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os documentos da Engenharia Comercial."
          );
        } finally {
          setCarregando(
            false
          );

          setAtualizando(
            false
          );
        }
      },
      [
        obra.orcamento_id,
      ]
    );

  useEffect(
    () => {
      carregarDocumentos(
        true
      );
    },
    [
      carregarDocumentos,
    ]
  );

  const gruposDocumentos =
    useMemo<
      GrupoDocumento[]
    >(
      () => {
        const gruposPorTitulo =
          new Map<
            string,
            {
              titulo: string;
              revisoes:
                Map<
                  string,
                  {
                    numeroRevisao:
                      number | null;
                    documentos:
                      Documento[];
                  }
                >;
            }
          >();

        for (
          const documento
          of documentos
        ) {
          const demanda =
            documento.demanda;

          const titulo =
            demanda?.titulo ||
            "Documentos gerais";

          const chaveGrupo =
            normalizarTitulo(
              titulo
            );

          const numeroRevisao =
            demanda?.numero_revisao ??
            null;

          const chaveRevisao =
            numeroRevisao ===
              null
              ? "sem-revisao"
              : String(
                  numeroRevisao
                );

          let grupo =
            gruposPorTitulo.get(
              chaveGrupo
            );

          if (!grupo) {
            grupo = {
              titulo,

              revisoes:
                new Map(),
            };

            gruposPorTitulo.set(
              chaveGrupo,
              grupo
            );
          }

          let revisao =
            grupo.revisoes.get(
              chaveRevisao
            );

          if (!revisao) {
            revisao = {
              numeroRevisao,

              documentos:
                [],
            };

            grupo.revisoes.set(
              chaveRevisao,
              revisao
            );
          }

          revisao.documentos.push(
            documento
          );
        }

        return Array.from(
          gruposPorTitulo.entries()
        )
          .map(
            ([
              chave,
              grupo,
            ]) => {
              const revisoes =
                Array.from(
                  grupo.revisoes.entries()
                )
                  .map(
                    ([
                      chaveRevisao,
                      revisao,
                    ]) => ({
                      chave:
                        chaveRevisao,

                      numeroRevisao:
                        revisao.numeroRevisao,

                      documentos:
                        revisao.documentos.sort(
                          (
                            documentoA,
                            documentoB
                          ) =>
                            new Date(
                              documentoB.created_at
                            ).getTime() -
                            new Date(
                              documentoA.created_at
                            ).getTime()
                        ),
                    })
                  )
                  .sort(
                    (
                      revisaoA,
                      revisaoB
                    ) =>
                      (
                        revisaoB.numeroRevisao ??
                        -1
                      ) -
                      (
                        revisaoA.numeroRevisao ??
                        -1
                      )
                  );

              return {
                chave,

                titulo:
                  grupo.titulo,

                totalDocumentos:
                  revisoes.reduce(
                    (
                      total,
                      revisao
                    ) =>
                      total +
                      revisao.documentos.length,
                    0
                  ),

                numeroRevisaoAtual:
                  revisoes[0]
                    ?.numeroRevisao ??
                  null,

                revisoes,
              };
            }
          )
          .sort(
            (
              grupoA,
              grupoB
            ) =>
              grupoA.titulo.localeCompare(
                grupoB.titulo,
                "pt-BR"
              )
          );
      },
      [
        documentos,
      ]
    );

  function alternarGrupo(
    chave: string
  ) {
    setGruposAbertos(
      (
        estadoAtual
      ) => ({
        ...estadoAtual,

        [chave]:
          !estadoAtual[
            chave
          ],
      })
    );
  }

  if (
    !obra.orcamento_id
  ) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto max-w-xl text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-xl font-bold text-slate-950">
            Sem Orçamentação vinculada
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Esta obra foi cadastrada diretamente e não possui documentos da Engenharia Comercial vinculados.
          </p>
        </div>
      </section>
    );
  }

  if (
    carregando
  ) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-500" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Carregando documentos da Engenharia Comercial...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Documentos Eng. Comercial
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Documentos consultados diretamente da Orçamentação vinculada. Revisões do mesmo projeto aparecem agrupadas.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              carregarDocumentos(
                false
              )
            }
            disabled={
              atualizando
            }
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                atualizando
                  ? "animate-spin"
                  : ""
              }`}
            />

            Atualizar
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5 text-sm">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
            {documentos.length} documento(s)
          </span>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
            {gruposDocumentos.length} grupo(s)
          </span>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
            Sincronizado com a Orçamentação
          </span>
        </div>
      </section>

      {erro && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-base font-bold text-red-800">
            Não foi possível carregar os documentos
          </h3>

          <p className="mt-2 text-sm text-red-700">
            {erro}
          </p>

          <button
            type="button"
            onClick={() =>
              carregarDocumentos(
                true
              )
            }
            className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
          >
            Tentar novamente
          </button>
        </section>
      )}

      {!erro &&
        documentos.length ===
          0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-slate-400" />

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              Nenhum documento encontrado
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              A Engenharia Comercial ainda não adicionou documentos nesta Orçamentação.
            </p>
          </section>
        )}

      {!erro &&
        gruposDocumentos.map(
          (
            grupo
          ) => {
            const aberto =
              Boolean(
                gruposAbertos[
                  grupo.chave
                ]
              );

            const revisaoAtual =
              grupo.revisoes[0];

            const possuiMultiplasRevisoes =
              grupo.revisoes.length >
              1;

            return (
              <section
                key={
                  grupo.chave
                }
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {possuiMultiplasRevisoes ? (
                  <button
                    type="button"
                    onClick={() =>
                      alternarGrupo(
                        grupo.chave
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 bg-slate-50 px-6 py-5 text-left transition-colors duration-200 hover:bg-slate-100"
                    aria-expanded={
                      aberto
                    }
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold text-slate-950">
                          {grupo.titulo}
                        </h3>

                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          Atual:{" "}
                          {formatarRevisao(
                            grupo.numeroRevisaoAtual
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {grupo.revisoes.length} revisão(ões) ·{" "}
                        {grupo.totalDocumentos} documento(s)
                      </p>
                    </div>

                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 ease-out ${
                        aberto
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>
                ) : (
                  <div className="flex w-full items-center justify-between gap-4 bg-slate-50 px-6 py-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold text-slate-950">
                          {grupo.titulo}
                        </h3>

                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          Atual:{" "}
                          {formatarRevisao(
                            grupo.numeroRevisaoAtual
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        1 revisão ·{" "}
                        {grupo.totalDocumentos} documento(s)
                      </p>
                    </div>
                  </div>
                )}

                {!possuiMultiplasRevisoes &&
                  revisaoAtual && (
                    <div className="border-t border-slate-200">
                      <CabecalhoRevisao
                        numeroRevisao={
                          revisaoAtual.numeroRevisao
                        }
                        totalDocumentos={
                          revisaoAtual.documentos.length
                        }
                        atual
                      />

                      <ListaDocumentos
                        documentos={
                          revisaoAtual.documentos
                        }
                      />
                    </div>
                  )}

                {possuiMultiplasRevisoes &&
                  !aberto &&
                  revisaoAtual && (
                    <div className="border-t border-slate-200">
                      <CabecalhoRevisao
                        numeroRevisao={
                          revisaoAtual.numeroRevisao
                        }
                        totalDocumentos={
                          revisaoAtual.documentos.length
                        }
                        atual
                      />

                      <ListaDocumentos
                        documentos={
                          revisaoAtual.documentos
                        }
                      />
                    </div>
                  )}

                {possuiMultiplasRevisoes && (
                  <div
                    className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
                      aberto
                        ? "grid-rows-[1fr] translate-y-0 opacity-100"
                        : "grid-rows-[0fr] -translate-y-1 opacity-0"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="divide-y divide-slate-200 border-t border-slate-200">
                        {grupo.revisoes.map(
                          (
                            revisao,
                            indice
                          ) => (
                            <div
                              key={
                                revisao.chave
                              }
                            >
                              <CabecalhoRevisao
                                numeroRevisao={
                                  revisao.numeroRevisao
                                }
                                totalDocumentos={
                                  revisao.documentos.length
                                }
                                atual={
                                  indice ===
                                  0
                                }
                              />

                              <ListaDocumentos
                                documentos={
                                  revisao.documentos
                                }
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          }
        )}
    </div>
  );
}

interface CabecalhoRevisaoProps {
  numeroRevisao:
    number | null;
  totalDocumentos: number;
  atual?: boolean;
}

function CabecalhoRevisao({
  numeroRevisao,
  totalDocumentos,
  atual =
    false,
}: CabecalhoRevisaoProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-slate-900">
          {formatarRevisao(
            numeroRevisao
          )}
        </span>

        {atual && (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Revisão atual
          </span>
        )}
      </div>

      <span className="text-xs font-semibold text-slate-500">
        {totalDocumentos} documento(s)
      </span>
    </div>
  );
}

interface ListaDocumentosProps {
  documentos:
    Documento[];
}

function ListaDocumentos({
  documentos,
}: ListaDocumentosProps) {
  return (
    <div className="divide-y divide-slate-100 border-t border-slate-100">
      {documentos.map(
        (
          documento
        ) => (
          <article
            key={
              documento.id
            }
            className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold text-slate-950">
                  {documento.nome}
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Enviado em{" "}
                  {formatarDataHora(
                    documento.created_at
                  )}
                </p>

                {documento.usuario?.nome && (
                  <p className="mt-1 text-xs text-slate-500">
                    Por{" "}
                    <span className="font-semibold text-slate-700">
                      {documento.usuario.nome}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <a
                href={
                  documento.arquivo_url
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />

                Abrir
              </a>

              <a
                href={
                  documento.arquivo_url
                }
                download
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />

                Baixar
              </a>
            </div>
          </article>
        )
      )}
    </div>
  );
}