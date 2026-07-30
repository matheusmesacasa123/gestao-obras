import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ObraModuleLayout } from "@/features/obras/components/obra-module-layout";

import { useObra } from "@/features/obras/hooks/use-obra";

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

  const {
    obra,
    loading: loadingObra,
    error: errorObra,
  } = useObra(id);

  const [
    documentos,
    setDocumentos,
  ] = useState<Documento[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  async function carregarDocumentos() {
    try {
      const data =
        await getDocumentosPorObra(id);
      setDocumentos(data);
    } catch(error) {
      console.error(
        "Erro ao buscar documentos:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{
    carregarDocumentos();
  },[id]);

  if(
    loading ||
    loadingObra
  ){
    return (
      <div className="p-8">
        Carregando documentos...
      </div>
    );
  }

  if(
    errorObra ||
    !obra
  ){
    return (
      <div className="p-8">
        Erro ao carregar obra.
      </div>
    );
  }

  return (
    <ObraModuleLayout obra={obra}>
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
    </ObraModuleLayout>
  );
}