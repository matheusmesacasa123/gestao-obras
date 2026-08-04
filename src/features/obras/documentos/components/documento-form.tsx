import {
  useEffect,
  useState,
} from "react";

import {
  FileText,
  Layers3,
  Upload,
  X,
} from "lucide-react";

import {
  uploadDocumento,
} from "../services/documentos-service";

import type {
  EtapaDocumento,
  SetorDocumento,
} from "../types";

interface DocumentoFormProps {
  obraId: string;
  etapas: EtapaDocumento[];
  setores: SetorDocumento[];
  onSuccess: () => void;
}

export function DocumentoForm({
  obraId,
  etapas,
  setores,
  onSuccess,
}: DocumentoFormProps) {
  const [
    nome,
    setNome,
  ] = useState("");

  const [
    etapaId,
    setEtapaId,
  ] = useState("");

  const [
    setorId,
    setSetorId,
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

  useEffect(() => {
    setEtapaId(
      (
        etapaAtual
      ) => {
        const etapaAindaExiste =
          etapas.some(
            (
              etapa
            ) =>
              etapa.id ===
              etapaAtual
          );

        if (
          etapaAindaExiste
        ) {
          return etapaAtual;
        }

        return "";
      }
    );

    setSetorId(
      (
        setorAtual
      ) => {
        const etapaAtual =
          etapas.find(
            (
              etapa
            ) =>
              etapa.id ===
              etapaId
          );

        if (
          etapaAtual
        ) {
          return etapaAtual.setor_id;
        }

        return setorAtual &&
          etapas.some(
            (
              etapa
            ) =>
              etapa.setor_id ===
              setorAtual
          )
          ? setorAtual
          : "";
      }
    );
  }, [
    etapas,
    etapaId,
  ]);

  function handleAlterarEtapa(
    novaEtapaId: string
  ) {
    setEtapaId(
      novaEtapaId
    );

    const etapaSelecionada =
      etapas.find(
        (
          etapa
        ) =>
          etapa.id ===
          novaEtapaId
      );

    setSetorId(
      etapaSelecionada?.setor_id ||
      ""
    );
  }

  async function enviar() {
    if (
      !nome.trim() ||
      !arquivo ||
      !etapaId ||
      !setorId
    ) {
      alert(
        "Informe o nome, selecione a etapa da obra e escolha um arquivo."
      );

      return;
    }

    try {
      setLoading(
        true
      );

      await uploadDocumento(
        obraId,
        etapaId,
        arquivo,
        nome.trim(),
        setorId
      );

      setNome("");
      setArquivo(null);
      setEtapaId("");
      setSetorId("");

      await onSuccess();
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

  const etapaSelecionada =
    etapas.find(
      (
        etapa
      ) =>
        etapa.id ===
        etapaId
    ) ||
    null;

  return (
    <div className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Novo documento
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Cadastre o arquivo e vincule-o a uma etapa da obra.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="block text-sm font-semibold text-gray-700">
          Nome do documento
        </span>

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
          placeholder="Ex.: Memorial descritivo"
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
        />
      </label>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Layers3 className="h-4 w-4 text-gray-500" />

          Etapa da obra
        </span>

        <select
          value={
            etapaId
          }
          onChange={(
            event
          ) =>
            handleAlterarEtapa(
              event.target.value
            )
          }
          disabled={
            loading ||
            etapas.length ===
              0
          }
          className="w-full cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <option value="">
            {etapas.length ===
            0
              ? "Nenhuma etapa disponível"
              : "Selecione a etapa e a revisão"}
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
                  "?"}{" "}
                —{" "}
                {etapa.titulo ||
                  "Sem título"}{" "}
                — Rev.{" "}
                {String(
                  etapa.numero_revisao
                ).padStart(
                  2,
                  "0"
                )}{" "}
                —{" "}
                {etapa.setor?.nome ||
                  "Setor não informado"}
              </option>
            )
          )}
        </select>

        <p className="text-xs text-gray-500">
          Selecione exatamente a etapa e a revisão às quais o documento pertence.
        </p>
      </label>

      {etapaSelecionada && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-semibold text-blue-950">
            Etapa{" "}
            {etapaSelecionada.ordem ??
              "?"}{" "}
            —{" "}
            {etapaSelecionada.titulo ||
              "Sem título"}{" "}
            — Rev.{" "}
            {String(
              etapaSelecionada.numero_revisao
            ).padStart(
              2,
              "0"
            )}{" "}
            —{" "}
            {etapaSelecionada.setor?.nome ||
              "Setor não informado"}
          </p>

          <p className="mt-1 text-xs text-blue-700">
            O documento será vinculado especificamente a esta revisão da etapa.
          </p>
        </div>
      )}

      <label className="block space-y-2">
        <span className="block text-sm font-semibold text-gray-700">
          Setor responsável
        </span>

        <select
          value={
            setorId
          }
          disabled
          className="w-full rounded-lg border bg-gray-100 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed"
        >
          <option value="">
            Selecione primeiro a etapa
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

        <p className="text-xs text-gray-500">
          O setor é definido automaticamente conforme a etapa selecionada.
        </p>
      </label>

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
          loading ||
          !nome.trim() ||
          !arquivo ||
          !etapaId ||
          !setorId
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