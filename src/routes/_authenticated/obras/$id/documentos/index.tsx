import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDocumentosPorObra,
  getSetoresDocumentos,
} from "@/features/obras/documentos/services/documentos-service";

import type {
  Documento,
  SetorDocumento,
} from "@/features/obras/documentos/types";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/documentos/"
)({
  component: DocumentosPage,
});

function normalizarTexto(
  valor?: string | number | null
) {
  return String(
    valor ??
    ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function formatarDataHora(
  valor?: string | null
) {
  if (!valor) {
    return "Data não informada";
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
    return "Data não informada";
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

function formatarNumeroRevisao(
  numero?: number | null
) {
  return `Rev. ${String(
    numero ??
    0
  ).padStart(
    2,
    "0"
  )}`;
}

function DocumentosPage() {
  const {
    id,
  } = Route.useParams();

  const [
    documentos,
    setDocumentos,
  ] = useState<Documento[]>(
    []
  );

  const [
    setores,
    setSetores,
  ] = useState<SetorDocumento[]>(
    []
  );

  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    setorFiltro,
    setSetorFiltro,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState(false);

  const carregarDados =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setErro(
            false
          );

          const [
            documentosData,
            setoresData,
          ] = await Promise.all([
            getDocumentosPorObra(
              id
            ),

            getSetoresDocumentos(),
          ]);

          setDocumentos(
            documentosData
          );

          setSetores(
            setoresData
          );
        } catch (error) {
          console.error(
            "Erro ao buscar documentos:",
            error
          );

          setErro(
            true
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        id,
      ]
    );

  useEffect(() => {
    carregarDados();
  }, [
    carregarDados,
  ]);

  const documentosFiltrados =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            pesquisa
          );

        return documentos.filter(
          (
            documento
          ) => {
            if (
              setorFiltro &&
              documento.setor_id !==
                setorFiltro
            ) {
              return false;
            }

            if (!termo) {
              return true;
            }

            return [
              documento.nome,
              documento.demanda
                ?.titulo,
              documento.demanda
                ?.numero_revisao,
              documento.demanda
                ? `Revisão da demanda ${formatarNumeroRevisao(
                    documento.demanda
                      .numero_revisao
                  )}`
                : "",
              documento.setor
                ?.nome,
              documento.usuario
                ?.nome,
              documento.usuario
                ?.email,
              documento.etapa
                ?.titulo,
              documento.etapa
                ?.setor?.nome,
              documento.etapa
                ?.ordem
                ? `Etapa ${documento.etapa.ordem}`
                : "",
            ]
              .map(
                normalizarTexto
              )
              .join(
                " "
              )
              .includes(
                termo
              );
          }
        );
      },
      [
        documentos,
        pesquisa,
        setorFiltro,
      ]
    );

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        Carregando documentos...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        Erro ao carregar documentos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Documentos
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Consulte todos os documentos adicionados às demandas desta obra.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Documentos cadastrados
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            O cadastro e a exclusão são feitos dentro de cada demanda.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              value={
                pesquisa
              }
              onChange={(
                event
              ) =>
                setPesquisa(
                  event.target.value
                )
              }
              placeholder="Pesquisar documento, demanda, revisão, etapa ou usuário..."
              className="h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <select
            value={
              setorFiltro
            }
            onChange={(
              event
            ) =>
              setSetorFiltro(
                event.target.value
              )
            }
            className="h-11 w-full cursor-pointer rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              Todos os setores
            </option>

            {setores.map(
              (
                setor
              ) => (
                <option
                  key={
                    setor.id
                  }
                  value={
                    setor.id
                  }
                >
                  {setor.nome}
                </option>
              )
            )}
          </select>
        </div>

        <p className="text-sm text-gray-500">
          {documentosFiltrados.length}{" "}
          {documentosFiltrados.length ===
          1
            ? "documento encontrado"
            : "documentos encontrados"}
        </p>
      </section>

      {documentosFiltrados.length ===
      0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-gray-400" />

          <p className="mt-4 font-semibold text-gray-900">
            Nenhum documento encontrado
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Adicione documentos dentro das demandas da obra.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documentosFiltrados.map(
            (
              documento
            ) => (
              <article
                key={
                  documento.id
                }
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <FileText className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold text-gray-950">
                        {documento.nome}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">
                          Demanda:{" "}
                          {documento.demanda
                            ?.titulo ||
                            "Não informada"}
                        </p>

                        {documento.demanda && (
                          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                            Revisão da demanda —{" "}
                            {formatarNumeroRevisao(
                              documento.demanda
                                .numero_revisao
                            )}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>
                          Etapa{" "}
                          {documento.etapa
                            ?.ordem ??
                            "?"}{" "}
                          —{" "}
                          {documento.etapa
                            ?.titulo ||
                            "Sem título"}
                        </span>

                        <span>
                          {documento.setor
                            ?.nome ||
                            documento.etapa
                              ?.setor
                              ?.nome ||
                            "Setor não informado"}
                        </span>

                        <span>
                          {formatarDataHora(
                            documento.created_at
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={
                      documento.arquivo_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <ExternalLink className="h-4 w-4" />

                    Abrir documento
                  </a>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </div>
  );
}