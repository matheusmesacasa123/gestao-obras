import {
  Link,
} from "@tanstack/react-router";

import {
  Building2,
  CalendarDays,
  FileCheck2,
  Layers3,
  MapPin,
} from "lucide-react";

import {
  excluirObraExecucao,
} from "../services/execucao-obras-service";

import type {
  ObraExecucao,
  StatusObraExecucao,
} from "../types";

interface ObraExecucaoCardProps {
  obra: ObraExecucao;
  onDelete?: () => void;
}

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

function obterStatusInfo(
  status: StatusObraExecucao
) {
  switch (status) {
    case "em_andamento":
      return {
        label:
          "Em andamento",

        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "aguardando_cliente":
      return {
        label:
          "Aguardando cliente",

        className:
          "border-orange-200 bg-orange-50 text-orange-700",
      };

    case "paralisada":
      return {
        label:
          "Paralisada",

        className:
          "border-purple-200 bg-purple-50 text-purple-700",
      };

    case "atrasada":
      return {
        label:
          "Atrasada",

        className:
          "border-red-200 bg-red-50 text-red-700",
      };

    case "concluida":
      return {
        label:
          "Concluída",

        className:
          "border-green-200 bg-green-50 text-green-700",
      };

    case "cancelada":
      return {
        label:
          "Cancelada",

        className:
          "border-slate-300 bg-slate-100 text-slate-700",
      };

    default:
      return {
        label:
          "Não iniciada",

        className:
          "border-gray-200 bg-gray-50 text-gray-700",
      };
  }
}

export function ObraExecucaoCard({
  obra,
  onDelete,
}: ObraExecucaoCardProps) {
  const statusInfo =
    obterStatusInfo(
      obra.status
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

  const setorAtual =
    obra.setor?.nome ||
    "Setor não informado";

  const vinculadaAoOrcamento =
    Boolean(
      obra.orcamento_id
    );

  async function handleExcluir() {
    const confirmado =
      window.confirm(
        `Tem certeza que deseja excluir a obra ${numeroErp}?`
      );

    if (!confirmado) {
      return;
    }

    try {
      await excluirObraExecucao(
        obra.id
      );

      onDelete?.();
    } catch (error) {
      console.error(
        "Erro ao excluir obra:",
        error
      );

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido.";

      alert(
        `Não foi possível excluir a obra: ${mensagem}`
      );
    }
  }

  return (
    <article className="flex h-full flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Numeração ERP
          </span>

          <h3
            className={`mt-1 truncate text-xl font-bold tracking-tight ${
              obra.codigo_erp
                ? "text-slate-950"
                : "text-slate-500"
            }`}
          >
            {numeroErp}
          </h3>

          <div className="mt-3">
            <span className="block text-xs font-medium text-slate-500">
              Proposta comercial
            </span>

            <span className="block truncate text-sm font-semibold text-slate-800">
              {numeroProposta}
            </span>
          </div>

          <p className="mt-3 truncate text-sm font-medium text-slate-600">
            {cliente}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Building2 className="h-5 w-5 shrink-0 text-slate-500" />

        <div className="min-w-0">
          <span className="block text-xs font-medium text-slate-500">
            Nome da obra
          </span>

          <span className="block truncate text-sm font-semibold text-slate-800">
            {obra.nome_obra ||
              "Não informado"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />

            <span className="text-xs font-medium text-slate-500">
              Prazo de entrega
            </span>
          </div>

          <span className="mt-2 block text-sm font-bold text-slate-800">
            {formatarData(
              obra.prazo_entrega
            )}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-500" />

            <span className="text-xs font-medium text-slate-500">
              Local
            </span>
          </div>

          <span className="mt-2 block truncate text-sm font-bold text-slate-800">
            {localizacao}
          </span>
        </div>

        <div className="col-span-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 shrink-0 text-blue-600" />

            <span className="text-xs font-medium text-blue-700">
              Setor atual
            </span>
          </div>

          <span className="mt-2 block truncate text-sm font-bold text-blue-950">
            {setorAtual}
          </span>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
          vinculadaAoOrcamento
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        <FileCheck2 className="h-4 w-4 shrink-0" />

        <span>
          {vinculadaAoOrcamento
            ? "Gerada a partir de orçamento aprovado"
            : "Obra cadastrada diretamente"}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        {onDelete ? (
          <button
            type="button"
            onClick={
              handleExcluir
            }
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Excluir
          </button>
        ) : (
          <span />
        )}

        <Link
          to="/execucao-obras/$id"
          params={{
            id:
              obra.id,
          }}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Abrir obra
        </Link>
      </div>
    </article>
  );
}