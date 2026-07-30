import { Trash2, FileText, ExternalLink } from "lucide-react";
import type { Documento } from "../types";
import { deletarDocumento } from "../services/documentos-service";

interface DocumentoListProps {
  documentos: Documento[];
  onDelete: () => void;
}

export function DocumentoList({
  documentos,
  onDelete,
}: DocumentoListProps) {
  async function handleDelete(id: string, url: string) {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      await deletarDocumento(id, url);
      // Dispara imediatamente a atualização da listagem na tela pai
      onDelete();
    } catch (error: any) {
      console.error("Erro capturado no componente ao excluir:", error);
      alert(`Erro ao excluir documento: ${error?.message || JSON.stringify(error)}`);
    }
  }

  if (documentos.length === 0) {
    return (
      <div className="border rounded-xl p-8 text-center bg-white shadow-sm">
        <h2 className="font-semibold text-lg">Nenhum documento cadastrado</h2>
        <p className="text-muted-foreground mt-2">
          Adicione documentos desta obra.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {documentos.map((documento) => (
        <div
          key={documento.id}
          className="border rounded-xl p-5 space-y-3 bg-white shadow-sm relative group flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <h3 className="font-semibold text-lg">{documento.nome}</h3>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(documento.id, documento.arquivo_url)}
                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                title="Excluir documento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Categoria: {documento.categoria ?? "-"}
            </p>

            <p className="text-sm text-muted-foreground">
              Enviado em:{" "}
              {new Date(documento.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="pt-2 border-t mt-2">
            <a
              href={documento.arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
            >
              <span>Abrir documento</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}