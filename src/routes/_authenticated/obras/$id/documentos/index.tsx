import {
  createFileRoute,
} from "@tanstack/react-router";

import {
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
  getEtapasDocumentosPorObra,
  getSetoresDocumentos,
} from "@/features/obras/documentos/services/documentos-service";

import {
  DocumentoList,
} from "@/features/obras/documentos/components/documento-list";

import {
  DocumentoForm,
} from "@/features/obras/documentos/components/documento-form";

import {
  ModalEditarDocumento,
} from "@/features/obras/documentos/components/modal-editar-documento";

import type {
  Documento,
  EtapaDocumento,
  SetorDocumento,
} from "@/features/obras/documentos/types";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/documentos/"
)({
  component: DocumentosPage,
});

function normalizarTexto(
  valor?: string | null
) {
  return (
    valor ||
    ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
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
    etapas,
    setEtapas,
  ] = useState<EtapaDocumento[]>(
    []
  );

  const [
    setores,
    setSetores,
  ] = useState<SetorDocumento[]>(
    []
  );

  const [
    documentoEditando,
    setDocumentoEditando,
  ] = useState<Documento | null>(
    null
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
    etapaFiltro,
    setEtapaFiltro,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    erro,
    setErro,
  ] = useState(
    false
  );

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
            etapasData,
            setoresData,
          ] =
            await Promise.all([
              getDocumentosPorObra(
                id
              ),

              getEtapasDocumentosPorObra(
                id
              ),

              getSetoresDocumentos(),
            ]);

          setDocumentos(
            documentosData
          );

          setEtapas(
            etapasData
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

  const recarregarDocumentos =
    useCallback(
      async () => {
        try {
          const data =
            await getDocumentosPorObra(
              id
            );

          setDocumentos(
            data
          );
        } catch (error) {
          console.error(
            "Erro ao atualizar documentos:",
            error
          );

          setErro(
            true
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
            const correspondeSetor =
              !setorFiltro ||
              documento.setor_id ===
                setorFiltro;

            const correspondeEtapa =
              !etapaFiltro ||
              documento.etapa_id ===
                etapaFiltro;

            if (
              !correspondeSetor ||
              !correspondeEtapa
            ) {
              return false;
            }

            if (!termo) {
              return true;
            }

            const conteudoPesquisavel =
              [
                documento.nome,
                documento.categoria,
                documento.setor?.nome,
                documento.usuario?.nome,
                documento.usuario?.email,
                documento.etapa?.titulo,
                documento.etapa?.setor?.nome,
                documento.etapa?.ordem
                  ? `Etapa ${documento.etapa.ordem}`
                  : "",
              ]
                .map(
                  normalizarTexto
                )
                .join(
                  " "
                );

            return conteudoPesquisavel.includes(
              termo
            );
          }
        );
      },
      [
        documentos,
        pesquisa,
        setorFiltro,
        etapaFiltro,
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">
          Documentos
        </h2>

        <p className="text-muted-foreground">
          Controle dos documentos da obra.
        </p>
      </div>

      <DocumentoForm
        obraId={
          id
        }
        etapas={
          etapas
        }
        setores={
          setores
        }
        onSuccess={
          recarregarDocumentos
        }
      />

      <section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Documentos cadastrados
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Pesquise por nome, categoria, etapa, setor responsável ou usuário.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_260px_260px]">
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
              placeholder="Pesquisar documentos..."
              className="h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <select
            value={
              etapaFiltro
            }
            onChange={(
              event
            ) =>
              setEtapaFiltro(
                event.target.value
              )
            }
            className="h-11 w-full cursor-pointer rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              Todas as etapas
            </option>

            {etapas.map(
              (
                etapa
              ) => (
                <option
                  key={
                    etapa.id
                  }
                  value={
                    etapa.id
                  }
                >
                  Etapa{" "}
                  {etapa.ordem ??
                    "?"} —{" "}
                  {etapa.titulo ||
                    "Sem título"}
                </option>
              )
            )}
          </select>

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
                  {
                    setor.nome
                  }
                </option>
              )
            )}
          </select>
        </div>

        <p className="text-sm text-gray-500">
          {
            documentosFiltrados.length
          }{" "}
          {documentosFiltrados.length ===
          1
            ? "documento encontrado"
            : "documentos encontrados"}
        </p>
      </section>

      <DocumentoList
        documentos={
          documentosFiltrados
        }
        onDelete={
          recarregarDocumentos
        }
        onEdit={
          setDocumentoEditando
        }
      />

      <ModalEditarDocumento
        documento={
          documentoEditando
        }
        etapas={
          etapas
        }
        setores={
          setores
        }
        onClose={() =>
          setDocumentoEditando(
            null
          )
        }
        onSuccess={
          recarregarDocumentos
        }
      />
    </div>
  );
}