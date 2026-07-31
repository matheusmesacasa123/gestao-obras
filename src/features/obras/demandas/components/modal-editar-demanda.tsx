import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import type {
  Demanda,
  PrioridadeDemanda,
  StatusDemanda,
} from "../types";

import {
  updateDemanda,
} from "../services/demandas-service";

interface ModalEditarDemandaProps {
  demanda: Demanda | null;
  onClose: () => void;
  onSuccess: () => void;
}

function obterSomenteData(
  data?: string | null
): string {
  if (!data) {
    return "";
  }

  return data.split("T")[0];
}

function converterParaDataLocal(
  data?: string | null
): Date | null {
  if (!data) {
    return null;
  }

  const dataSemHorario =
    obterSomenteData(data);

  const [ano, mes, dia] =
    dataSemHorario
      .split("-")
      .map(Number);

  if (!ano || !mes || !dia) {
    return null;
  }

  const dataLocal = new Date(
    ano,
    mes - 1,
    dia
  );

  dataLocal.setHours(
    0,
    0,
    0,
    0
  );

  return dataLocal;
}

function obterHojeFormatado(): string {
  const hoje = new Date();

  const ano = hoje.getFullYear();

  const mes = String(
    hoje.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    hoje.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterHojeLocal(): Date {
  const hoje = new Date();

  hoje.setHours(
    0,
    0,
    0,
    0
  );

  return hoje;
}

function ModalEditarDemanda({
  demanda,
  onClose,
  onSuccess,
}: ModalEditarDemandaProps) {
  const [titulo, setTitulo] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [status, setStatus] =
    useState<StatusDemanda>("aberta");

  const [prioridade, setPrioridade] =
    useState<PrioridadeDemanda>("media");

  const [prazo, setPrazo] =
    useState("");

  const [
    dataConclusao,
    setDataConclusao,
  ] = useState("");

  const [
    motivoAtraso,
    setMotivoAtraso,
  ] = useState("");

  const [salvando, setSalvando] =
    useState(false);

  useEffect(() => {
    if (!demanda) {
      return;
    }

    setTitulo(
      demanda.titulo ?? ""
    );

    setDescricao(
      demanda.descricao ?? ""
    );

    setStatus(
      demanda.status ?? "aberta"
    );

    setPrioridade(
      demanda.prioridade ?? "media"
    );

    setPrazo(
      obterSomenteData(
        demanda.prazo
      )
    );

    setDataConclusao(
      obterSomenteData(
        demanda.data_conclusao
      )
    );

    setMotivoAtraso(
      demanda.motivo_atraso ?? ""
    );
  }, [demanda]);

  const demandaEstaAtrasada =
    useMemo(() => {
      if (
        status === "concluida" ||
        status === "cancelada"
      ) {
        return false;
      }

      const dataPrazo =
        converterParaDataLocal(prazo);

      if (!dataPrazo) {
        return false;
      }

      return (
        dataPrazo <
        obterHojeLocal()
      );
    }, [prazo, status]);

  const demandaFinalizadaComAtraso =
    useMemo(() => {
      if (
        status !== "concluida"
      ) {
        return false;
      }

      const dataPrazo =
        converterParaDataLocal(prazo);

      const dataFinalizacao =
        converterParaDataLocal(
          dataConclusao
        );

      if (
        !dataPrazo ||
        !dataFinalizacao
      ) {
        return false;
      }

      return (
        dataFinalizacao >
        dataPrazo
      );
    }, [
      prazo,
      dataConclusao,
      status,
    ]);

  const deveInformarMotivo =
    demandaEstaAtrasada ||
    demandaFinalizadaComAtraso;

  function handleAlterarStatus(
    novoStatus: StatusDemanda
  ) {
    setStatus(novoStatus);

    if (
      novoStatus === "concluida"
    ) {
      if (!dataConclusao) {
        setDataConclusao(
          obterHojeFormatado()
        );
      }

      return;
    }

    setDataConclusao("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!demanda) {
      return;
    }

    if (!titulo.trim()) {
      alert(
        "Informe o título da demanda."
      );

      return;
    }

    if (
      status === "concluida" &&
      !dataConclusao
    ) {
      alert(
        "Informe a data de conclusão."
      );

      return;
    }

    if (
      deveInformarMotivo &&
      !motivoAtraso.trim()
    ) {
      alert(
        "Informe o motivo do atraso."
      );

      return;
    }

    try {
      setSalvando(true);

      await updateDemanda(
        demanda.id,
        {
          titulo:
            titulo.trim(),

          descricao:
            descricao.trim() ||
            null,

          status,

          prioridade,

          prazo:
            prazo || null,

          data_conclusao:
            status === "concluida"
              ? dataConclusao
              : null,

          motivo_atraso:
            deveInformarMotivo
              ? motivoAtraso.trim()
              : null,
        }
      );

      onSuccess();
    } catch (error) {
      console.error(
        "Erro ao atualizar demanda:",
        error
      );

      alert(
        "Erro ao salvar as alterações."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog.Root
      open={Boolean(demanda)}
      onOpenChange={(aberto) => {
        if (!aberto) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border bg-white p-6 text-gray-900 shadow-2xl">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-xl font-bold tracking-tight text-gray-900">
              Editar demanda
            </Dialog.Title>

            <Dialog.Description className="text-sm text-gray-500">
              Atualize os dados e o
              andamento da demanda.
            </Dialog.Description>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="editar-demanda-titulo"
                className="text-sm font-semibold text-gray-700"
              >
                Título
              </label>

              <input
                id="editar-demanda-titulo"
                type="text"
                value={titulo}
                onChange={(event) =>
                  setTitulo(
                    event.target.value
                  )
                }
                required
                className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título da demanda"
              />
            </div>

            <div>
              <label
                htmlFor="editar-demanda-descricao"
                className="text-sm font-semibold text-gray-700"
              >
                Descrição
              </label>

              <textarea
                id="editar-demanda-descricao"
                value={descricao}
                onChange={(event) =>
                  setDescricao(
                    event.target.value
                  )
                }
                className="mt-1 flex min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição detalhada..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="editar-demanda-status"
                  className="text-sm font-semibold text-gray-700"
                >
                  Status
                </label>

                <select
                  id="editar-demanda-status"
                  value={status}
                  onChange={(event) =>
                    handleAlterarStatus(
                      event.target
                        .value as StatusDemanda
                    )
                  }
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="aberta">
                    Aguardando início
                  </option>

                  <option value="em_andamento">
                    Em andamento
                  </option>

                  <option value="concluida">
                    Finalizada
                  </option>

                  <option value="cancelada">
                    Cancelada
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="editar-demanda-prioridade"
                  className="text-sm font-semibold text-gray-700"
                >
                  Prioridade
                </label>

                <select
                  id="editar-demanda-prioridade"
                  value={prioridade}
                  onChange={(event) =>
                    setPrioridade(
                      event.target
                        .value as PrioridadeDemanda
                    )
                  }
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="baixa">
                    Baixa
                  </option>

                  <option value="media">
                    Média
                  </option>

                  <option value="alta">
                    Alta
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="editar-demanda-prazo"
                className="text-sm font-semibold text-gray-700"
              >
                Prazo
              </label>

              <input
                id="editar-demanda-prazo"
                type="date"
                value={prazo}
                onChange={(event) =>
                  setPrazo(
                    event.target.value
                  )
                }
                className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {status ===
              "concluida" && (
              <div>
                <label
                  htmlFor="editar-demanda-data-conclusao"
                  className="text-sm font-semibold text-gray-700"
                >
                  Data de conclusão
                </label>

                <input
                  id="editar-demanda-data-conclusao"
                  type="date"
                  value={dataConclusao}
                  onChange={(event) =>
                    setDataConclusao(
                      event.target.value
                    )
                  }
                  required
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {demandaFinalizadaComAtraso && (
                  <p className="mt-2 text-sm font-medium text-amber-700">
                    A data de conclusão está
                    depois do prazo. A demanda
                    será exibida como
                    “Finalizada com atraso”.
                  </p>
                )}
              </div>
            )}

            {deveInformarMotivo && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                <label
                  htmlFor="editar-demanda-motivo-atraso"
                  className="text-sm font-semibold text-amber-900"
                >
                  Motivo do atraso
                </label>

                <p className="mt-1 text-xs text-amber-700">
                  A demanda está atrasada ou
                  foi finalizada depois do
                  prazo.
                </p>

                <textarea
                  id="editar-demanda-motivo-atraso"
                  value={motivoAtraso}
                  onChange={(event) =>
                    setMotivoAtraso(
                      event.target.value
                    )
                  }
                  required
                  className="mt-2 flex min-h-20 w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ex.: Aguardando aprovação do cliente."
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={salvando}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando
                  ? "Salvando..."
                  : "Salvar alterações"}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              type="button"
              disabled={salvando}
              className="absolute right-4 top-4 rounded-sm p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export {
  ModalEditarDemanda,
};

export default ModalEditarDemanda;