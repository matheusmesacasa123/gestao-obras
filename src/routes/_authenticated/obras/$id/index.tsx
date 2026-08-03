import {
  createFileRoute,
  useLoaderData,
  useRouter,
} from "@tanstack/react-router";

import {
  useState,
} from "react";

import type {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
} from "react";

import {
  atualizarValoresObra,
} from "@/features/obras/services/obras-service";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/"
)({
  component:
    ObraInformacoesPage,
});

function formatarMoeda(
  valor?: number | null
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "Não informado";
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    valor
  );
}

function formatarPercentual(
  valor?: number | null
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      valor
    )
  ) {
    return "Não calculado";
  }

  return (
    new Intl.NumberFormat(
      "pt-BR",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    ).format(
      valor
    ) + "%"
  );
}

function getIndicadorClassName(
  valor?: number | null,
  positivoEhBom = true
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === 0
  ) {
    return "text-gray-800";
  }

  const resultadoPositivo =
    positivoEhBom
      ? valor > 0
      : valor < 0;

  return resultadoPositivo
    ? "text-emerald-700"
    : "text-red-700";
}

function formatarValorInput(
  valor: string
) {
  const valorSemPrefixo =
    valor
      .replace(
        /R\$/gi,
        ""
      )
      .trim();

  if (!valorSemPrefixo) {
    return "";
  }

  const somentePermitidos =
    valorSemPrefixo.replace(
      /[^\d,]/g,
      ""
    );

  if (!somentePermitidos) {
    return "";
  }

  const [
    parteInteiraOriginal,
    ...partesDecimais
  ] = somentePermitidos.split(
    ","
  );

  const parteInteiraLimpa =
    parteInteiraOriginal
      .replace(
        /^0+(?=\d)/,
        ""
      ) ||
    "0";

  const parteInteiraFormatada =
    Number(
      parteInteiraLimpa
    ).toLocaleString(
      "pt-BR"
    );

  const parteDecimalDigitada =
    partesDecimais
      .join("")
      .slice(
        0,
        2
      );

  const parteDecimal =
    parteDecimalDigitada.padEnd(
      2,
      "0"
    );

  return `R$ ${parteInteiraFormatada},${parteDecimal}`;
}

function obterParteInteiraInput(
  valor: string
) {
  const semPrefixo =
    valor
      .replace(
        /R\$/gi,
        ""
      )
      .trim();

  const parteInteira =
    semPrefixo.split(
      ","
    )[0];

  return parteInteira.replace(
    /\D/g,
    ""
  );
}

function formatarInteiroComoMoeda(
  valor: string
) {
  const apenasNumeros =
    valor.replace(
      /\D/g,
      ""
    );

  if (!apenasNumeros) {
    return "";
  }

  const semZerosIniciais =
    apenasNumeros.replace(
      /^0+(?=\d)/,
      ""
    );

  return `R$ ${Number(
    semZerosIniciais ||
      "0"
  ).toLocaleString(
    "pt-BR"
  )},00`;
}

function tratarTeclaMoeda(
  event:
    KeyboardEvent<HTMLInputElement>,
  valorAtual: string,
  atualizarValor: (
    valor: string
  ) => void
) {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) {
    return;
  }

  const teclasPermitidas = [
    "Tab",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
  ];

  if (
    teclasPermitidas.includes(
      event.key
    )
  ) {
    return;
  }

  const input =
    event.currentTarget;

  const selecionouTudo =
    input.selectionStart ===
      0 &&
    input.selectionEnd ===
      input.value.length;

  if (/^\d$/.test(event.key)) {
    event.preventDefault();

    const valorBase =
      selecionouTudo
        ? ""
        : obterParteInteiraInput(
            valorAtual
          );

    atualizarValor(
      formatarInteiroComoMoeda(
        `${valorBase}${event.key}`
      )
    );

    return;
  }

  if (
    event.key ===
    "Backspace"
  ) {
    event.preventDefault();

    if (selecionouTudo) {
      atualizarValor("");

      return;
    }

    const valorBase =
      obterParteInteiraInput(
        valorAtual
      );

    atualizarValor(
      formatarInteiroComoMoeda(
        valorBase.slice(
          0,
          -1
        )
      )
    );

    return;
  }

  if (
    event.key ===
    "Delete"
  ) {
    event.preventDefault();

    atualizarValor("");

    return;
  }

  event.preventDefault();
}

function tratarColagemMoeda(
  event:
    ClipboardEvent<HTMLInputElement>,
  atualizarValor: (
    valor: string
  ) => void
) {
  event.preventDefault();

  const textoColado =
    event.clipboardData.getData(
      "text"
    );

  atualizarValor(
    formatarInteiroComoMoeda(
      textoColado
    )
  );
}


function valorParaInput(
  valor?: number | null
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  const valorFormatado =
    new Intl.NumberFormat(
      "pt-BR",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    ).format(
      valor
    );

  return `R$ ${valorFormatado}`;
}

function converterValor(
  valor: string
): number | null {
  const valorLimpo =
    valor
      .trim()
      .replace(
        /\s/g,
        ""
      )
      .replace(
        /R\$/gi,
        ""
      );

  if (!valorLimpo) {
    return null;
  }

  let valorNormalizado =
    valorLimpo;

  if (
    valorNormalizado.includes(
      ","
    )
  ) {
    valorNormalizado =
      valorNormalizado
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );
  }

  const numero =
    Number(
      valorNormalizado
    );

  if (
    !Number.isFinite(
      numero
    )
  ) {
    throw new Error(
      `O valor "${valor}" não é válido.`
    );
  }

  if (
    numero < 0
  ) {
    throw new Error(
      "Os valores não podem ser negativos."
    );
  }

  return numero;
}

function ObraInformacoesPage() {
  const obra =
    useLoaderData({
      from:
        "/_authenticated/obras/$id",
    });

  const router =
    useRouter();

  const [
    modalAberto,
    setModalAberto,
  ] = useState(
    false
  );

  const [
    salvando,
    setSalvando,
  ] = useState(
    false
  );

  const [
    erroFormulario,
    setErroFormulario,
  ] = useState<
    string | null
  >(
    null
  );

  const [
    valorOrcado,
    setValorOrcado,
  ] = useState(
    ""
  );

  const [
    custoOrcado,
    setCustoOrcado,
  ] = useState(
    ""
  );

  const [
    valorVendido,
    setValorVendido,
  ] = useState(
    ""
  );

  const [
    custoReal,
    setCustoReal,
  ] = useState(
    ""
  );

  const [
    motivoAlteracao,
    setMotivoAlteracao,
  ] = useState(
    ""
  );

  const possuiValorOrcado =
    obra.valor_orcado !==
      null &&
    obra.valor_orcado !==
      undefined;

  const possuiCustoOrcado =
    obra.custo_orcado !==
      null &&
    obra.custo_orcado !==
      undefined;

  const possuiValorVendido =
    obra.valor_vendido !==
      null &&
    obra.valor_vendido !==
      undefined;

  const possuiCustoReal =
    obra.custo_real !==
      null &&
    obra.custo_real !==
      undefined;

  const resultadoOrcado =
    possuiValorOrcado &&
    possuiCustoOrcado
      ? obra.valor_orcado -
        obra.custo_orcado
      : null;

  const margemOrcada =
    resultadoOrcado !==
      null &&
    possuiValorOrcado &&
    obra.valor_orcado >
      0
      ? (
          resultadoOrcado /
          obra.valor_orcado
        ) *
        100
      : null;

  const diferencaComercial =
    possuiValorOrcado &&
    possuiValorVendido
      ? obra.valor_vendido -
        obra.valor_orcado
      : null;

  const desvioCusto =
    possuiValorOrcado &&
    possuiCustoReal
      ? obra.custo_real -
        obra.valor_orcado
      : null;

  const resultadoBruto =
    possuiValorVendido &&
    possuiCustoReal
      ? obra.valor_vendido -
        obra.custo_real
      : null;

  const margemBruta =
    resultadoBruto !==
      null &&
    possuiValorVendido &&
    obra.valor_vendido >
      0
      ? (
          resultadoBruto /
          obra.valor_vendido
        ) *
        100
      : null;

  function abrirModal() {
    setValorOrcado(
      valorParaInput(
        obra.valor_orcado
      )
    );

    setCustoOrcado(
      valorParaInput(
        obra.custo_orcado
      )
    );

    setValorVendido(
      valorParaInput(
        obra.valor_vendido
      )
    );

    setCustoReal(
      valorParaInput(
        obra.custo_real
      )
    );

    setMotivoAlteracao(
      ""
    );

    setErroFormulario(
      null
    );

    setModalAberto(
      true
    );
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(
      false
    );

    setErroFormulario(
      null
    );
  }

  async function handleSalvarValores(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErroFormulario(
      null
    );

    try {
      const valorOrcadoConvertido =
        converterValor(
          valorOrcado
        );

      const custoOrcadoConvertido =
        converterValor(
          custoOrcado
        );

      const valorVendidoConvertido =
        converterValor(
          valorVendido
        );

      const custoRealConvertido =
        converterValor(
          custoReal
        );

      setSalvando(
        true
      );

      await atualizarValoresObra({
        obraId:
          obra.id,

        valorOrcado:
          valorOrcadoConvertido,

        custoOrcado:
          custoOrcadoConvertido,

        valorVendido:
          valorVendidoConvertido,

        custoReal:
          custoRealConvertido,

        motivoAlteracao,
      });

      await router.invalidate();

      setModalAberto(
        false
      );
    } catch (error) {
      console.error(
        "Erro ao salvar valores:",
        error
      );

      setErroFormulario(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar os valores."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  return (
    <>
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Informações gerais
            </h2>

            <p className="text-sm text-gray-500">
              Dados cadastrais e técnicos da obra.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Razão Social
              </h3>

              <p className="text-base font-semibold text-gray-900">
                {obra.razao_social ||
                  "-"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                CNPJ
              </h3>

              <p className="text-base font-semibold text-gray-900">
                {obra.cnpj ||
                  "-"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Tipo de Projeto
              </h3>

              <p className="text-base font-semibold text-gray-900">
                {obra.tipo_projeto ||
                  "-"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Vazão
              </h3>

              <p className="text-base font-semibold text-gray-900">
                {obra.vazao
                  ? `${obra.vazao} m³/dia`
                  : "-"}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Valores e Resultado
              </h2>

              <p className="text-sm text-gray-500">
                Comparação entre orçamento, venda e custo real da obra.
              </p>
            </div>

            <button
              type="button"
              onClick={
                abrirModal
              }
              className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Atualizar valores
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border bg-gray-50 p-4">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Valor orçado
              </span>

              <strong className="mt-2 block text-xl font-bold text-gray-900">
                {formatarMoeda(
                  obra.valor_orcado
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Valor teórico calculado
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Custo orçado
              </span>

              <strong className="mt-2 block text-xl font-bold text-gray-900">
                {formatarMoeda(
                  obra.custo_orcado
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Custo previsto no orçamento
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Valor vendido
              </span>

              <strong className="mt-2 block text-xl font-bold text-gray-900">
                {formatarMoeda(
                  obra.valor_vendido
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Valor fechado com o cliente
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Custo real
              </span>

              <strong className="mt-2 block text-xl font-bold text-gray-900">
                {formatarMoeda(
                  obra.custo_real
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Custo efetivo da execução
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border p-4">
              <span className="block text-xs font-medium text-gray-500">
                Resultado orçado
              </span>

              <strong
                className={`mt-2 block text-lg font-bold ${getIndicadorClassName(
                  resultadoOrcado,
                  true
                )}`}
              >
                {formatarMoeda(
                  resultadoOrcado
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Valor orçado menos custo orçado
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <span className="block text-xs font-medium text-gray-500">
                Margem orçada
              </span>

              <strong
                className={`mt-2 block text-lg font-bold ${getIndicadorClassName(
                  margemOrcada,
                  true
                )}`}
              >
                {formatarPercentual(
                  margemOrcada
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Resultado previsto sobre o valor orçado
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <span className="block text-xs font-medium text-gray-500">
                Diferença comercial
              </span>

              <strong
                className={`mt-2 block text-lg font-bold ${getIndicadorClassName(
                  diferencaComercial,
                  true
                )}`}
              >
                {formatarMoeda(
                  diferencaComercial
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Vendido menos orçado
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <span className="block text-xs font-medium text-gray-500">
                Desvio de custo
              </span>

              <strong
                className={`mt-2 block text-lg font-bold ${getIndicadorClassName(
                  desvioCusto,
                  false
                )}`}
              >
                {formatarMoeda(
                  desvioCusto
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Custo real menos orçado
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <span className="block text-xs font-medium text-gray-500">
                Resultado bruto
              </span>

              <strong
                className={`mt-2 block text-lg font-bold ${getIndicadorClassName(
                  resultadoBruto,
                  true
                )}`}
              >
                {formatarMoeda(
                  resultadoBruto
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Vendido menos custo real
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <span className="block text-xs font-medium text-gray-500">
                Margem bruta
              </span>

              <strong
                className={`mt-2 block text-lg font-bold ${getIndicadorClassName(
                  margemBruta,
                  true
                )}`}
              >
                {formatarPercentual(
                  margemBruta
                )}
              </strong>

              <p className="mt-1 text-xs text-gray-500">
                Resultado sobre o valor vendido
              </p>
            </div>
          </div>
        </section>
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={
            fecharModal
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-valores"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
            className="w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="titulo-modal-valores"
                  className="text-xl font-bold text-gray-900"
                >
                  Atualizar valores
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Preencha somente os valores já conhecidos. Campos vazios serão salvos como não informados.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharModal
                }
                disabled={
                  salvando
                }
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Fechar
              </button>
            </div>

            <form
              onSubmit={
                handleSalvarValores
              }
              className="mt-6 space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">
                    Valor orçado
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      valorOrcado
                    }
                    onChange={(
                      event
                    ) =>
                      setValorOrcado(
                        formatarValorInput(
                          event.target.value
                        )
                      )
                    }
                    onKeyDown={(
                      event
                    ) =>
                      tratarTeclaMoeda(
                        event,
                        valorOrcado,
                        setValorOrcado
                      )
                    }
                    onPaste={(
                      event
                    ) =>
                      tratarColagemMoeda(
                        event,
                        setValorOrcado
                      )
                    }
                    placeholder="R$ 500.000,00"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">
                    Custo orçado
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      custoOrcado
                    }
                    onChange={(
                      event
                    ) =>
                      setCustoOrcado(
                        formatarValorInput(
                          event.target.value
                        )
                      )
                    }
                    onKeyDown={(
                      event
                    ) =>
                      tratarTeclaMoeda(
                        event,
                        custoOrcado,
                        setCustoOrcado
                      )
                    }
                    onPaste={(
                      event
                    ) =>
                      tratarColagemMoeda(
                        event,
                        setCustoOrcado
                      )
                    }
                    placeholder="R$ 100.000,00"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">
                    Valor vendido
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      valorVendido
                    }
                    onChange={(
                      event
                    ) =>
                      setValorVendido(
                        formatarValorInput(
                          event.target.value
                        )
                      )
                    }
                    onKeyDown={(
                      event
                    ) =>
                      tratarTeclaMoeda(
                        event,
                        valorVendido,
                        setValorVendido
                      )
                    }
                    onPaste={(
                      event
                    ) =>
                      tratarColagemMoeda(
                        event,
                        setValorVendido
                      )
                    }
                    placeholder="R$ 550.000,00"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-700">
                    Custo real
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      custoReal
                    }
                    onChange={(
                      event
                    ) =>
                      setCustoReal(
                        formatarValorInput(
                          event.target.value
                        )
                      )
                    }
                    onKeyDown={(
                      event
                    ) =>
                      tratarTeclaMoeda(
                        event,
                        custoReal,
                        setCustoReal
                      )
                    }
                    onPaste={(
                      event
                    ) =>
                      tratarColagemMoeda(
                        event,
                        setCustoReal
                      )
                    }
                    placeholder="R$ 430.000,00"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="block text-sm font-semibold text-gray-700">
                  Motivo da alteração (opcional)
                </span>

                <textarea
                  value={
                    motivoAlteracao
                  }
                  onChange={(
                    event
                  ) =>
                    setMotivoAlteracao(
                      event.target.value
                    )
                  }
                  rows={
                    4
                  }
                  placeholder="Ex.: atualização dos custos dos equipamentos e inclusão do frete."
                  className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                />
              </label>

              {erroFormulario && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {
                    erroFormulario
                  }
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={
                    salvando
                  }
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    salvando
                  }
                  className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar valores"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}