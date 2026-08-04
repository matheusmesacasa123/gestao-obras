import {
  useEffect,
  useMemo,
  useState,
} from "react";

import * as Dialog from "@radix-ui/react-dialog";

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
  atualizarDocumento,
} from "../services/documentos-service";

import type {
  Documento,
  EtapaDocumento,
  SetorDocumento,
} from "../types";

interface ModalEditarDocumentoProps {
  documento: Documento | null;
  etapas: EtapaDocumento[];
  setores: SetorDocumento[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalEditarDocumento({
  documento,
  etapas,
  setores,
  onClose,
  onSuccess,
}: ModalEditarDocumentoProps) {
  const {
    perfil,
  } = useAuth();

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
    novoArquivo,
    setNovoArquivo,
  ] = useState<File | null>(
    null
  );

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const administrador =
    perfil?.administrador ===
    true;

  const documentoDoMeuSetor =
    Boolean(
      perfil?.setor_id &&
      documento?.setor_id &&
      perfil.setor_id ===
        documento.setor_id
    );

  const podeEditar =
    administrador ||
    documentoDoMeuSetor;

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
    if (!documento) {
      return;
    }

    setNome(
      documento.nome ||
        ""
    );

    setEtapaId(
      documento.etapa_id ||
        ""
    );

    setSetorId(
      documento.setor_id ||
        documento.etapa?.setor_id ||
        ""
    );

    setNovoArquivo(
      null
    );
  }, [
    documento,
  ]);

  function handleAlterarEtapa(
    novaEtapaId: string
  ) {
    setEtapaId(
      novaEtapaId
    );

    const etapaSelecionada =
      etapas.find(
        (etapa) =>
          etapa.id ===
          novaEtapaId
      );

    if (!etapaSelecionada) {
      if (!administrador) {
        setSetorId("");
      }

      return;
    }

    setSetorId(
      etapaSelecionada.setor_id
    );
  }

  async function salvar() {
    if (!documento) {
      return;
    }

    if (!podeEditar) {
      alert(
        "Você não possui permissão para editar este documento."
      );

      return;
    }

    if (!nome.trim()) {
      alert(
        "Informe o nome do documento."
      );

      return;
    }

    if (!etapaId) {
      alert(
        "Selecione a etapa da obra."
      );

      return;
    }

    if (!setorId) {
      alert(
        "Selecione o setor responsável."
      );

      return;
    }

    try {
      setSalvando(
        true
      );

      await atualizarDocumento(
        documento,
        {
          nome:
            nome.trim(),

          etapa_id:
            etapaId,

          setor_id:
            setorId,
        },
        novoArquivo
      );

      await onSuccess();

      onClose();
    } catch (error) {
      console.error(
        "Erro ao atualizar documento:",
        error
      );

      alert(
        error instanceof Error
          ? `Erro ao atualizar documento: ${error.message}`
          : "Erro ao atualizar documento."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  return (
    <Dialog.Root
      open={
        Boolean(documento)
      }
      onOpenChange={(
        aberto
      ) => {
        if (!aberto) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[1px]" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white shadow-2xl">
          <div className="border-b px-6 py-5 pr-16">
            <Dialog.Title className="text-2xl font-bold tracking-tight text-gray-900">
              Editar documento
            </Dialog.Title>

            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Altere os dados, a etapa, o setor responsável ou substitua o arquivo.
            </Dialog.Description>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="absolute right-5 top-5 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          {!podeEditar ? (
            <div className="p-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Você só pode editar documentos do seu próprio setor.
              </div>
            </div>
          ) : (
            <div className="space-y-5 p-6">
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
                    salvando
                  }
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </label>

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
                    salvando
                  }
                  className="h-11 w-full cursor-pointer rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >
                  <option value="">
                    Selecione a etapa
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
                        {etapa.titulo ||
                          "Sem título"} — Rev.{" "}
                        {String(
                          etapa.numero_revisao
                        ).padStart(
                          2,
                          "0"
                        )} —{" "}
                        {etapa.setor?.nome ||
                          "Setor não informado"}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="block text-sm font-semibold text-gray-700">
                  Setor responsável
                </span>

                <select
                  value={
                    setorId
                  }
                  disabled={
                    true
                  }
                  className="h-11 w-full cursor-pointer rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    Selecione o setor
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
                  O setor acompanha automaticamente a etapa e a revisão selecionadas.
                </p>
              </label>

              <div className="space-y-2">
                <span className="block text-sm font-semibold text-gray-700">
                  Substituir arquivo
                </span>

                {!novoArquivo ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 transition hover:border-blue-500 hover:bg-blue-50/50">
                    <Upload className="mb-2 h-6 w-6 text-gray-400" />

                    <span className="text-sm font-medium text-gray-700">
                      Clique para escolher um novo arquivo
                    </span>

                    <span className="mt-1 text-xs text-gray-400">
                      O arquivo atual será mantido caso nenhum novo arquivo seja escolhido.
                    </span>

                    <input
                      type="file"
                      disabled={
                        salvando
                      }
                      className="hidden"
                      onChange={(
                        event
                      ) => {
                        const selecionado =
                          event.target.files?.[0];

                        if (selecionado) {
                          setNovoArquivo(
                            selecionado
                          );
                        }

                        event.target.value =
                          "";
                      }}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-5 w-5 shrink-0 text-blue-600" />

                      <span className="truncate text-sm font-medium text-gray-800">
                        {
                          novoArquivo.name
                        }
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setNovoArquivo(
                          null
                        )
                      }
                      disabled={
                        salvando
                      }
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  disabled={
                    salvando
                  }
                  className="h-11 rounded-xl border px-5 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    salvar
                  }
                  disabled={
                    salvando
                  }
                  className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ModalEditarDocumento;