import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { uploadDocumento } from "../services/documentos-service";

interface DocumentoFormProps {
  obraId: string;
  onSuccess: () => void;
}

export function DocumentoForm({ obraId, onSuccess }: DocumentoFormProps) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function enviar() {
    if (!nome || !arquivo) {
      alert("Informe o nome e selecione um arquivo.");
      return;
    }

    try {
      setLoading(true);
      await uploadDocumento(obraId, arquivo, nome, categoria);

      setNome("");
      setCategoria("");
      setArquivo(null);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar documento. Verifique as permissões (RLS) do bucket no Supabase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-xl p-5 space-y-4 bg-white shadow-sm">
      <h3 className="font-semibold text-lg">Novo Documento</h3>

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do documento"
        className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        placeholder="Categoria"
        className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Input de arquivo customizado com botão de remover */}
      <div className="space-y-2">
        {!arquivo ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition">
            <Upload className="w-6 h-6 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Clique para selecionar o arquivo</span>
            <span className="text-xs text-gray-400 mt-1">PDF, planilhas, imagens ou documentos</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setArquivo(e.target.files[0]);
                }
              }}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center space-x-2 truncate">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800 truncate">{arquivo.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setArquivo(null)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
              title="Remover arquivo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={enviar}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition w-full"
      >
        {loading ? "Enviando..." : "Salvar documento"}
      </button>
    </div>
  );
}