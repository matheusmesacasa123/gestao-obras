import {
  useState,
} from "react";

import {
  FileText,
  Upload,
  X,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  uploadDocumento,
} from "../services/documentos-service";

interface DocumentoFormProps {
  obraId: string;
  onSuccess: () => void;
}

export function DocumentoForm({
  obraId,
  onSuccess,
}: DocumentoFormProps) {
  const {
    perfil,
  } = useAuth();

  const [
    nome,
    setNome,
  ] = useState("");

  const [
    categoria,
    setCategoria,
  ] = useState("");

  const [
    arquivo,
    setArquivo,
  ] = useState<File | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function enviar() {
    if (
      !nome.trim() ||
      !arquivo
    ) {
      alert(
        "Informe o nome e selecione um arquivo."
      );

      return;
    }

    try {
      setLoading(
        true
      );

      await uploadDocumento(
        obraId,
        arquivo,
        nome.trim(),
        categoria.trim(),
        perfil?.setor_id ??
          null
      );

      setNome("");
      setCategoria("");
      setArquivo(null);

      onSuccess();
    } catch (error) {
      console.error(
        "Erro ao enviar documento:",
        error
      );

      alert(
        error instanceof Error
          ? `Erro ao enviar documento: ${error.message}`
          : "Erro ao enviar documento. Verifique as permissões do Supabase."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold">
        Novo Documento
      </h3>

      <input
        value={
          nome
        }
        onChange={(
          event
        ) =>
          setNome(
            event.target.value
          )
        }
        disabled={
          loading
        }
        placeholder="Nome do documento"
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
      />

      <input
        value={
          categoria
        }
        onChange={(
          event
        ) =>
          setCategoria(
            event.target.value
          )
        }
        disabled={
          loading
        }
        placeholder="Categoria"
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
      />

      <div className="space-y-2">
        {!arquivo ? (
          <label
            className={`
              flex
              flex-col
              items-center
              justify-center
              rounded-xl
              border-2
              border-dashed
              border-gray-300
              p-6
              transition
              ${
                loading
                  ? "cursor-not-allowed bg-gray-100 opacity-60"
                  : "cursor-pointer hover:border-blue-500 hover:bg-blue-50/50"
              }
            `}
          >
            <Upload className="mb-2 h-6 w-6 text-gray-400" />

            <span className="text-sm font-medium text-gray-700">
              Clique para selecionar o arquivo
            </span>

            <span className="mt-1 text-xs text-gray-400">
              PDF, planilhas, imagens ou documentos
            </span>

            <input
              type="file"
              disabled={
                loading
              }
              className="hidden"
              onChange={(
                event
              ) => {
                const arquivoSelecionado =
                  event.target.files?.[0];

                if (
                  arquivoSelecionado
                ) {
                  setArquivo(
                    arquivoSelecionado
                  );
                }

                event.target.value =
                  "";
              }}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
            <div className="flex min-w-0 items-center space-x-2">
              <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />

              <span className="truncate text-sm font-medium text-gray-800">
                {
                  arquivo.name
                }
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setArquivo(
                  null
                )
              }
              disabled={
                loading
              }
              className="rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Remover arquivo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={
          enviar
        }
        disabled={
          loading
        }
        className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Enviando..."
          : "Salvar documento"}
      </button>
    </div>
  );
}