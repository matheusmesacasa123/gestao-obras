import {
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  atualizarItensComerciais,
} from "../services/orcamento-planilha-service";

import {
  excluirPlanilhaRevisao,
} from "../services/excluir-planilha-revisao-service";

import type {
  AtualizarItemComercialPayload,
  ImportacaoOrcamentoSalva,
} from "../services/orcamento-planilha-service";

interface EditorItensComerciaisProps {
  importacao:
    ImportacaoOrcamentoSalva;

  onAtualizado?:
    () =>
      void |
      Promise<void>;
}

interface ItemEdicao {
  id: string;
  orcamentoId: string;
  revisaoId: string;

  nomeInterno: string;
  descricaoInterna: string;

  quantidadeCalculo: number;
  unidadeCalculo: string;

  custoTotal: number;
  valorVenda: number;

  nomeComercial: string;
  descricaoComercial: string;
  quantidadeComercial: number;
  unidadeComercial: string;

  exibirNaProposta: boolean;
  itemOpcional: boolean;
}

function formatarMoeda(
  valor: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    },
  ).format(
    valor,
  );
}

function criarItensEdicao(
  importacao:
    ImportacaoOrcamentoSalva,
): ItemEdicao[] {
  return importacao.itens.map(
    (
      item,
    ) => ({
      id:
        item.id,

      orcamentoId:
        item.orcamento_id,

      revisaoId:
        item.revisao_id,

      nomeInterno:
        item.nome_interno ??
        "",

      descricaoInterna:
        item.descricao_interna ??
        "",

      quantidadeCalculo:
        Number(
          item.quantidade_calculo ??
          0,
        ),

      unidadeCalculo:
        item.unidade_calculo ??
        "",

      custoTotal:
        Number(
          item.custo_total ??
          0,
        ),

      valorVenda:
        Number(
          item.valor_venda ??
          0,
        ),

      nomeComercial:
        item.nome_comercial ??
        item.nome_interno ??
        "",

      descricaoComercial:
        item.descricao_comercial ??
        item.descricao_interna ??
        "",

      quantidadeComercial:
        Number(
          item.quantidade_comercial ??
          item.quantidade_calculo ??
          0,
        ),

      unidadeComercial:
        item.unidade_comercial ??
        "",

      exibirNaProposta:
        item.exibir_na_proposta,

      itemOpcional:
        item.item_opcional,
    }),
  );
}

export function EditorItensComerciais({
  importacao,
  onAtualizado,
}: EditorItensComerciaisProps) {
  const [
    itens,
    setItens,
  ] =
    useState<
      ItemEdicao[]
    >(
      () =>
        criarItensEdicao(
          importacao,
        ),
    );

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    excluindo,
    setExcluindo,
  ] =
    useState(false);

  const [
    confirmandoExclusao,
    setConfirmandoExclusao,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState<
      string | null
    >(null);

  const [
    sucesso,
    setSucesso,
  ] =
    useState<
      string | null
    >(null);

  useEffect(
    () => {
      setItens(
        criarItensEdicao(
          importacao,
        ),
      );

      setErro(
        null,
      );

      setSucesso(
        null,
      );

      setConfirmandoExclusao(
        false,
      );
    },
    [
      importacao,
    ],
  );

  function atualizarItem(
    id: string,
    alteracoes:
      Partial<ItemEdicao>,
  ) {
    setItens(
      (
        itensAtuais,
      ) =>
        itensAtuais.map(
          (
            item,
          ) =>
            item.id ===
            id
              ? {
                  ...item,
                  ...alteracoes,
                }
              : item,
        ),
    );

    setSucesso(
      null,
    );
  }

  async function salvar() {
    const itemSemNome =
      itens.find(
        (
          item,
        ) =>
          item.exibirNaProposta &&
          !item.nomeComercial.trim(),
      );

    if (
      itemSemNome
    ) {
      setErro(
        "Todo item exibido na proposta precisa possuir um nome comercial.",
      );

      return;
    }

    const itemQuantidadeInvalida =
      itens.find(
        (
          item,
        ) =>
          item.quantidadeComercial <
          0,
      );

    if (
      itemQuantidadeInvalida
    ) {
      setErro(
        "A quantidade comercial não pode ser negativa.",
      );

      return;
    }

    setSalvando(
      true,
    );

    setErro(
      null,
    );

    setSucesso(
      null,
    );

    try {
      const payload:
        AtualizarItemComercialPayload[] =
        itens.map(
          (
            item,
          ) => ({
            id:
              item.id,

            orcamentoId:
              item.orcamentoId,

            revisaoId:
              item.revisaoId,

            nomeComercial:
              item.nomeComercial,

            descricaoComercial:
              item.descricaoComercial,

            quantidadeComercial:
              item.quantidadeComercial,

            unidadeComercial:
              item.unidadeComercial,

            exibirNaProposta:
              item.exibirNaProposta,

            itemOpcional:
              item.itemOpcional,
          }),
        );

      await atualizarItensComerciais(
        payload,
      );

      setSucesso(
        "Informações comerciais salvas com sucesso.",
      );

      await onAtualizado?.();
    } catch (
      error
    ) {
      console.error(
        "Erro ao salvar informações comerciais:",
        error,
      );

      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível salvar as informações comerciais.",
      );
    } finally {
      setSalvando(
        false,
      );
    }
  }

  async function excluir() {
    setExcluindo(
      true,
    );

    setErro(
      null,
    );

    setSucesso(
      null,
    );

    try {
      await excluirPlanilhaRevisao(
        {
          orcamentoId:
            importacao.orcamento_id,

          revisaoId:
            importacao.revisao_id,

          importacaoId:
            importacao.id,
        },
      );

      setConfirmandoExclusao(
        false,
      );

      if (
        onAtualizado
      ) {
        await onAtualizado();
      } else {
        window.location.reload();
      }
    } catch (
      error
    ) {
      console.error(
        "Erro ao excluir planilha:",
        error,
      );

      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível excluir a planilha.",
      );
    } finally {
      setExcluindo(
        false,
      );
    }
  }

  const bloqueado =
    salvando ||
    excluindo;

  return (
    <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Informações comerciais dos itens
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Os dados internos permanecem preservados. Os campos editáveis serão utilizados no Word.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={
              () => {
                setConfirmandoExclusao(
                  true,
                );

                setErro(
                  null,
                );

                setSucesso(
                  null,
                );
              }
            }
            disabled={
              bloqueado
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />

            Excluir planilha
          </button>

          <button
            type="button"
            onClick={
              () =>
                void salvar()
            }
            disabled={
              bloqueado
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Salvando
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                Salvar alterações
              </>
            )}
          </button>
        </div>
      </div>

      {confirmandoExclusao && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

            <div className="flex-1">
              <h4 className="font-bold text-red-900">
                Excluir esta planilha?
              </h4>

              <p className="mt-2 text-sm leading-6 text-red-800">
                A planilha importada, sua composição e seus itens serão excluídos permanentemente.
                A revisão e os vínculos com as demandas serão preservados.
              </p>

              <p className="mt-2 text-sm font-semibold text-red-900">
                Essa ação não pode ser desfeita.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    () =>
                      void excluir()
                  }
                  disabled={
                    excluindo
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {excluindo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      Excluindo
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />

                      Sim, excluir planilha
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={
                    () =>
                      setConfirmandoExclusao(
                        false,
                      )
                  }
                  disabled={
                    excluindo
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />

                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {erro && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm text-red-700">
            {erro}
          </p>
        </div>
      )}

      {sucesso && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

          <p className="text-sm text-emerald-800">
            {sucesso}
          </p>
        </div>
      )}

      <div className="space-y-5">
        {itens.map(
          (
            item,
            indice,
          ) => (
            <article
              key={
                item.id
              }
              className="overflow-hidden rounded-2xl border"
            >
              <div className="flex flex-col justify-between gap-3 border-b bg-gray-50 p-4 lg:flex-row lg:items-center">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Item{" "}
                    {indice +
                      1}
                  </span>

                  <h4 className="mt-1 font-bold text-gray-900">
                    {item.nomeInterno ||
                      "Item sem nome interno"}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={
                        item.itemOpcional
                      }
                      disabled={
                        bloqueado
                      }
                      onChange={
                        (
                          evento,
                        ) =>
                          atualizarItem(
                            item.id,
                            {
                              itemOpcional:
                                evento.target.checked,
                            },
                          )
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />

                    Item opcional
                  </label>

                  <button
                    type="button"
                    disabled={
                      bloqueado
                    }
                    onClick={
                      () =>
                        atualizarItem(
                          item.id,
                          {
                            exibirNaProposta:
                              !item.exibirNaProposta,
                          },
                        )
                    }
                    className={
                      item.exibirNaProposta
                        ? "inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-100 px-3 text-xs font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        : "inline-flex h-9 items-center gap-2 rounded-xl bg-gray-200 px-3 text-xs font-semibold text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                    }
                  >
                    {item.exibirNaProposta ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}

                    {item.exibirNaProposta
                      ? "Aparece no Word"
                      : "Oculto no Word"}
                  </button>
                </div>
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-xl bg-gray-50 p-4">
                  <h5 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Dados internos da planilha
                  </h5>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <InfoInterna
                      label="Quantidade de cálculo"
                      value={`${item.quantidadeCalculo}${item.unidadeCalculo
                        ? ` ${item.unidadeCalculo}`
                        : ""}`}
                    />

                    <InfoInterna
                      label="Custo total"
                      value={
                        formatarMoeda(
                          item.custoTotal,
                        )
                      }
                    />

                    <InfoInterna
                      label="Valor de venda"
                      value={
                        formatarMoeda(
                          item.valorVenda,
                        )
                      }
                    />
                  </dl>

                  <div className="mt-4">
                    <span className="text-xs font-semibold text-gray-500">
                      Descrição interna
                    </span>

                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-700">
                      {item.descricaoInterna ||
                        "Não informada"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Nome que aparecerá no Word
                    </label>

                    <input
                      type="text"
                      value={
                        item.nomeComercial
                      }
                      disabled={
                        bloqueado
                      }
                      onChange={
                        (
                          evento,
                        ) =>
                          atualizarItem(
                            item.id,
                            {
                              nomeComercial:
                                evento.target.value,
                            },
                          )
                      }
                      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Descrição comercial
                    </label>

                    <textarea
                      value={
                        item.descricaoComercial
                      }
                      disabled={
                        bloqueado
                      }
                      onChange={
                        (
                          evento,
                        ) =>
                          atualizarItem(
                            item.id,
                            {
                              descricaoComercial:
                                evento.target.value,
                            },
                          )
                      }
                      rows={
                        5
                      }
                      className="w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        Quantidade comercial
                      </label>

                      <input
                        type="number"
                        min={
                          0
                        }
                        step="any"
                        value={
                          item.quantidadeComercial
                        }
                        disabled={
                          bloqueado
                        }
                        onChange={
                          (
                            evento,
                          ) =>
                            atualizarItem(
                              item.id,
                              {
                                quantidadeComercial:
                                  Number(
                                    evento.target.value,
                                  ),
                              },
                            )
                        }
                        className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        Unidade comercial
                      </label>

                      <input
                        type="text"
                        value={
                          item.unidadeComercial
                        }
                        disabled={
                          bloqueado
                        }
                        placeholder="un., conjunto, serviço..."
                        onChange={
                          (
                            evento,
                          ) =>
                            atualizarItem(
                              item.id,
                              {
                                unidadeComercial:
                                  evento.target.value,
                              },
                            )
                        }
                        className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

interface InfoInternaProps {
  label: string;
  value: string;
}

function InfoInterna({
  label,
  value,
}: InfoInternaProps) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-500">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-bold text-gray-900">
        {value}
      </dd>
    </div>
  );
}