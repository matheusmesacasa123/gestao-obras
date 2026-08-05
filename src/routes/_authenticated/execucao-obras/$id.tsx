import {
  createFileRoute,
  Link,
  Outlet,
  useLoaderData,
  useRouter,
} from "@tanstack/react-router";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  History,
  Layers3,
  Loader2,
  MapPin,
  FileSearch2,
  Save,
  UsersRound,
  X,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import {
  atualizarObraExecucao,
  getObraExecucaoPorId,
} from "@/features/execucao-obras/services/execucao-obras-service";

import type {
  StatusObraExecucao,
} from "@/features/execucao-obras/types";

export const Route = createFileRoute(
  "/_authenticated/execucao-obras/$id"
)({
  loader: async ({
    params,
  }) =>
    getObraExecucaoPorId(
      params.id
    ),

  component:
    ObraExecucaoDetalhesLayout,
});

const statusInfo: Record<
  StatusObraExecucao,
  {
    label: string;
    className: string;
  }
> = {
  nao_iniciada: {
    label:
      "Não iniciada",

    className:
      "border-slate-200 bg-slate-100 text-slate-700",
  },

  em_andamento: {
    label:
      "Em andamento",

    className:
      "border-blue-200 bg-blue-50 text-blue-700",
  },

  aguardando_cliente: {
    label:
      "Aguardando cliente",

    className:
      "border-orange-200 bg-orange-50 text-orange-700",
  },

  paralisada: {
    label:
      "Paralisada",

    className:
      "border-purple-200 bg-purple-50 text-purple-700",
  },

  atrasada: {
    label:
      "Atrasada",

    className:
      "border-red-200 bg-red-50 text-red-700",
  },

  concluida: {
    label:
      "Concluída",

    className:
      "border-green-200 bg-green-50 text-green-700",
  },

  cancelada: {
    label:
      "Cancelada",

    className:
      "border-gray-300 bg-gray-100 text-gray-700",
  },
};

function formatarData(
  data?: string | null
) {
  if (!data) {
    return "Não informado";
  }

  const [
    ano,
    mes,
    dia,
  ] = data
    .split("-")
    .map(Number);

  const dataFormatada =
    new Date(
      ano,
      mes - 1,
      dia
    );

  if (
    Number.isNaN(
      dataFormatada.getTime()
    )
  ) {
    return data;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    dataFormatada
  );
}

function ObraExecucaoDetalhesLayout() {
  const obra =
    useLoaderData({
      from:
        "/_authenticated/execucao-obras/$id",
    });

  const router =
    useRouter();

  const [
    modalErpAberto,
    setModalErpAberto,
  ] = useState(
    false
  );

  const [
    codigoErp,
    setCodigoErp,
  ] = useState(
    obra.codigo_erp ||
      ""
  );

  const [
    salvandoErp,
    setSalvandoErp,
  ] = useState(
    false
  );

  const [
    erroErp,
    setErroErp,
  ] = useState<
    string | null
  >(
    null
  );

  const numeroErp =
    obra.codigo_erp ||
    "Ainda não lançado no ERP";

  const numeroProposta =
    obra.numero_proposta ||
    obra.orcamento
      ?.numero_proposta ||
    obra.orcamento
      ?.codigo ||
    "Não informado";

  const cliente =
    obra.cliente_relacionado?.nome ||
    obra.cliente ||
    "Cliente não informado";

  const localizacao =
    [
      obra.cidade,
      obra.estado,
    ]
      .filter(Boolean)
      .join(" / ") ||
    "Local não informado";

  const status =
    statusInfo[
      obra.status
    ];

  const abas = [
    {
      label:
        "Visão geral",

      to:
        "/execucao-obras/$id/",

      icon:
        Building2,

      exact:
        true,
    },
    {
      label:
        "Documentos Eng. Comercial",

      to:
        "/execucao-obras/$id/documentos-eng-comercial",

      icon:
        FileText,
    },
    {
      label:
        "Reuniões",

      to:
        "/execucao-obras/$id/reunioes",

      icon:
        UsersRound,
    },
    {
      label:
        "Etapas",

      to:
        "/execucao-obras/$id/etapas",

      icon:
        Layers3,
    },
    {
      label:
        "Demandas",

      to:
        "/execucao-obras/$id/demandas",

      icon:
        ClipboardList,
    },
    {
      label:
        "Análises Críticas",

      to:
        "/execucao-obras/$id/analises-criticas",

      icon:
        FileSearch2,
    },
    {
      label:
        "Histórico",

      to:
        "/execucao-obras/$id/historico",

      icon:
        History,
    },
  ] as const;

  function abrirModalErp() {
    setCodigoErp(
      obra.codigo_erp ||
        ""
    );

    setErroErp(
      null
    );

    setModalErpAberto(
      true
    );
  }

  function fecharModalErp() {
    if (salvandoErp) {
      return;
    }

    setModalErpAberto(
      false
    );

    setErroErp(
      null
    );
  }

  async function handleSalvarErp(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const codigo =
      codigoErp.trim();

    if (!codigo) {
      setErroErp(
        "Informe a numeração da obra no ERP."
      );

      return;
    }

    try {
      setSalvandoErp(
        true
      );

      setErroErp(
        null
      );

      await atualizarObraExecucao(
        obra.id,
        {
          incluido_erp:
            true,

          codigo_erp:
            codigo,
        }
      );

      await router.invalidate();

      setModalErpAberto(
        false
      );
    } catch (error) {
      console.error(
        "Erro ao lançar obra no ERP:",
        error
      );

      setErroErp(
        error instanceof Error
          ? error.message
          : "Não foi possível lançar a obra no ERP."
      );
    } finally {
      setSalvandoErp(
        false
      );
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <Link
          to="/execucao-obras"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />

          Voltar para obras
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Execução da obra
              </p>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <span className="mt-5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Numeração ERP
            </span>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1
                className={`break-words text-3xl font-bold tracking-tight ${
                  obra.codigo_erp
                    ? "text-slate-950"
                    : "text-amber-700"
                }`}
              >
                {numeroErp}
              </h1>

              {!obra.codigo_erp && (
                <button
                  type="button"
                  onClick={
                    abrirModalErp
                  }
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700"
                >
                  <Save className="h-4 w-4" />

                  Lançar no ERP
                </button>
              )}
            </div>

            <div className="mt-3">
              <span className="block text-xs font-medium text-slate-500">
                Proposta comercial
              </span>

              <span className="block text-sm font-bold text-slate-800">
                {numeroProposta}
              </span>
            </div>

            <p className="mt-3 text-base font-semibold text-slate-700">
              {obra.nome_obra ||
                "Nome da obra não informado"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {cliente}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
            <InformacaoCabecalho
              icone={
                MapPin
              }
              titulo="Local"
              valor={
                localizacao
              }
            />

            <InformacaoCabecalho
              icone={
                CalendarDays
              }
              titulo="Prazo de entrega"
              valor={formatarData(
                obra.prazo_entrega
              )}
            />

            <InformacaoCabecalho
              icone={
                Building2
              }
              titulo="Origem"
              valor={
                obra.orcamento_id
                  ? "Orçamento aprovado"
                  : "Cadastro manual"
              }
            />

            <InformacaoCabecalho
              icone={
                ClipboardList
              }
              titulo="Responsável"
              valor={
                obra.responsavel?.nome ||
                "Não informado"
              }
            />
          </div>
        </div>
      </section>

      <nav className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {abas.map(
            (
              aba
            ) => {
              const Icone =
                aba.icon;

              return (
                <Link
                  key={
                    aba.to
                  }
                  to={
                    aba.to
                  }
                  params={{
                    id:
                      obra.id,
                  }}
                  activeOptions={{
                    exact:
                      "exact" in aba
                        ? aba.exact
                        : false,
                  }}
                  activeProps={{
                    className:
                      "bg-slate-950 text-white shadow-sm",
                  }}
                  inactiveProps={{
                    className:
                      "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
                >
                  <Icone className="h-4 w-4" />

                  {aba.label}
                </Link>
              );
            }
          )}
        </div>
      </nav>

      <Outlet />

      {modalErpAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModalErp();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Lançar obra no ERP
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Informe a numeração recebida no sistema ERP.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharModalErp
                }
                disabled={
                  salvandoErp
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                handleSalvarErp
              }
            >
              <div className="space-y-5 p-6">
                {erroErp && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    {erroErp}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="codigo-erp-rapido"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Numeração ERP
                  </label>

                  <input
                    id="codigo-erp-rapido"
                    type="text"
                    value={
                      codigoErp
                    }
                    onChange={(
                      event
                    ) =>
                      setCodigoErp(
                        event.target.value
                      )
                    }
                    disabled={
                      salvandoErp
                    }
                    autoFocus
                    placeholder="Digite a numeração da obra"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-900">
                    Ao salvar, a obra será registrada como incluída no ERP, junto com a data e o usuário responsável.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    fecharModalErp
                  }
                  disabled={
                    salvandoErp
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    salvandoErp
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvandoErp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {salvandoErp
                    ? "Salvando..."
                    : "Confirmar lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface InformacaoCabecalhoProps {
  icone:
    typeof Building2;

  titulo: string;
  valor: string;
}

function InformacaoCabecalho({
  icone: Icone,
  titulo,
  valor,
}: InformacaoCabecalhoProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icone className="h-4 w-4 shrink-0" />

        <span className="text-xs font-semibold uppercase tracking-wide">
          {titulo}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-bold text-slate-900">
        {valor}
      </p>
    </div>
  );
}