import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDocumentosPorObra,
} from "@/features/obras/documentos/services/documentos-service";

import {
  DocumentoList,
} from "@/features/obras/documentos/components/documento-list";

import {
  DocumentoForm,
} from "@/features/obras/documentos/components/documento-form";

import type {
  Documento,
} from "@/features/obras/documentos/types";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/documentos/"
)({
  component: DocumentosPage,
});

function DocumentosPage() {
  const { id } = Route.useParams();

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregarDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      setErro(false);

      const data = await getDocumentosPorObra(id);

      setDocumentos(data);
    } catch (error) {
      console.error(
        "Erro ao buscar documentos:",
        error
      );

      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregarDocumentos();
  }, [carregarDocumentos]);

  if (loading) {
    return (
      <div className="border rounded-2xl p-8 bg-white shadow-sm">
        Carregando documentos...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="border rounded-2xl p-8 bg-white shadow-sm">
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
        obraId={id}
        onSuccess={carregarDocumentos}
      />

      <DocumentoList
        documentos={documentos}
        onDelete={carregarDocumentos}
      />
    </div>
  );
}