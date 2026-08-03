import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileText,
  Layers3,
  Upload,
  X,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

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

  const administrador =
    perfil?.administrador ===
    true;

  const etapasDisponiveis =
    useMemo(
      () => {
        if (administrador) {
          return etapas;
        }

        return etapas.filter(
          (etapa) =>
            etapa.setor_id ===
            perfil?.setor_id
        );
      },
      [
        administrador,
        etapas,
        perfil?.setor_id,
      ]
    );

  useEffect(() => {
    if (
      etapaId &&
      etapasDisponiveis.some(
        (etapa) =>
          etapa.id ===
          etapaId
      )
    ) {
      return;
    }

    if (
      etapasDisponiveis.length ===
      1
    ) {
      const etapaUnica =
        etapasDisponiveis[0];

      setEtapaId(
        etapaUnica.id
      );

      setSetorId(
        etapaUnica.setor_id
      );

      return;
    }

    setEtapaId("");
    setSetorId("");
  }, [
    etapaId,
    etapasDisponiveis,
  ]);

  function handleAlterarEtapa(
    novaEtapaId: string
  ) {
    setEtapaId(
      novaEtapaId
    );

    const etapaSelecionada =
      etapasDisponiveis.find(
        (etapa) =>
          etapa.id ===
          novaEtapaId
      );

    if (!etapaSelecionada) {
      setSetorId("");

      return;
    }

    setSetorId(
      etapaSelecionada.setor_id
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
        categoria.trim(),
        setorId
      );

      setNome("");
      setCategoria("");
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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
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

        <label className="space-y-2">
          <span className="block text-sm font-semibold text-gray-700">
            Categoria
          </span>

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
            placeholder="Ex.: Projeto, proposta, contrato..."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Layers3 className="h-4 w-4 text-gray-500" />

          Etapa da obra *
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
            etapasDisponiveis.length ===
              0
          }
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <option value="">
            {etapasDisponiveis.length ===
            0
              ? "Nenhuma etapa disponível"
              : "Selecione a etapa"}
          </option>

          {etapasDisponiveis.map(
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
                {etapa.setor?.nome ||
                  "Setor não informado"} —{" "}
                {etapa.titulo ||
                  "Sem título"}
              </option>
            )
          )}
        </select>

        <p className="text-xs text-gray-500">
          O setor responsável será definido automaticamente pela etapa escolhida.
        </p>
      </label>

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
          etapasDisponiveis.length ===
            0
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