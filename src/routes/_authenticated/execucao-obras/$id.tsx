import {
  createFileRoute,
  Link,
  Outlet,
  useLoaderData,
} from "@tanstack/react-router";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  History,
  Layers3,
  MapPin,
  FileSearch2,
  UsersRound,
} from "lucide-react";

import {
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

            <h1
              className={`mt-1 truncate text-3xl font-bold tracking-tight ${
                obra.codigo_erp
                  ? "text-slate-950"
                  : "text-amber-700"
              }`}
            >
              {numeroErp}
            </h1>

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