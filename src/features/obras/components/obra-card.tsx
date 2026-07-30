// src/features/obras/components/obra-card.tsx

import { Link, useNavigate } from "@tanstack/react-router";
import { deletarObra } from "../services/obras-service";

export interface Obra {
  id: string;
  codigo?: string | null;
  cliente?: string | null;
  tipo_projeto?: string | null;
  vazao?: number | null;
  status?: string | null;
  progresso?: number | null;
  data_entrega_esperada?: string | null;
  data_entrega?: string | null;
}

interface ObraCardProps {
  obra: Obra;
  onDelete?: () => void;
}

function getStatusStyle(
  status?: string | null,
  dataEntregaEsperada?: string | null,
  dataEntrega?: string | null
) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const parseData = (d?: string | null) => {
    if (!d) return null;
    const [ano, mes, dia] = d.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  };

  const dataEsperada = parseData(dataEntregaEsperada);
  const dataFinal = parseData(dataEntrega);

  if (status === "concluida" || dataFinal) {
    if (dataEsperada && dataFinal && dataFinal > dataEsperada) {
      return {
        label: "Finalizada com atraso",
        className: "bg-amber-100 text-amber-800 border-amber-300",
      };
    }

    return {
      label: "Finalizada",
      className: "bg-green-100 text-green-800 border-green-300",
    };
  }

  if (dataEsperada) {
    const diffEmTempo = dataEsperada.getTime() - hoje.getTime();
    const diffEmDias = Math.ceil(diffEmTempo / (1000 * 3600 * 24));

    if (diffEmDias < 0) {
      return {
        label: "Em andamento (Atrasada)",
        className: "bg-red-100 text-red-800 border-red-300",
      };
    }

    if (diffEmDias <= 3) {
      return {
        label: "Em andamento (Atrasando)",
        className: "bg-red-100 text-red-800 border-red-300",
      };
    }
  }

  switch (status) {
    case "em_desenvolvimento":
    case "em_andamento":
      return {
        label: "Em andamento",
        className: "bg-blue-100 text-blue-800 border-blue-300",
      };
    case "em_analise":
      return {
        label: "Em análise",
        className: "bg-amber-100 text-amber-800 border-amber-300",
      };
    case "aguardando_cliente":
      return {
        label: "Aguardando cliente",
        className: "bg-orange-100 text-orange-800 border-orange-300",
      };
    default:
      return {
        label: "Recebida",
        className: "bg-gray-100 text-gray-800 border-gray-300",
      };
  }
}

export function ObraCard({ obra, onDelete }: ObraCardProps) {
  const navigate = useNavigate();

  const statusInfo = getStatusStyle(
    obra.status,
    obra.data_entrega_esperada,
    obra.data_entrega
  );

  const progressoValor =
    obra.progresso ?? (obra.status === "concluida" || obra.data_entrega ? 100 : 0);

  const handleCardClick = () => {
    navigate({
      to: "/obras/$id",
      params: { id: obra.id },
    });
  };

  async function handleExcluir(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const confirmado = window.confirm(
      `Tem certeza que deseja excluir a obra ${obra.codigo || "sem código"}?`
    );

    if (!confirmado) {
      return;
    }

    try {
      await deletarObra(obra.id);
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      console.error("Erro ao excluir obra:", error);
      alert(`Erro ao excluir obra: ${error?.message || "Erro desconhecido"}`);
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="border rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer space-y-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-gray-900">
            {obra.codigo || "Sem código"}
          </h3>
          <p className="text-sm font-medium text-gray-600">
            {obra.cliente || "Cliente não informado"}
          </p>
        </div>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-xl p-3 bg-gray-50/50">
          <span className="text-xs font-medium text-gray-500 block">
            Projeto
          </span>
          <span className="text-sm font-bold text-gray-800">
            {obra.tipo_projeto || "—"}
          </span>
        </div>

        <div className="border rounded-xl p-3 bg-gray-50/50">
          <span className="text-xs font-medium text-gray-500 block">
            Vazão
          </span>
          <span className="text-sm font-bold text-gray-800">
            {obra.vazao ? `${obra.vazao} m³/dia` : "—"}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-gray-600">
          <span>Progresso</span>
          <span>{progressoValor}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressoValor}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Link
          to="/obras/$id/editar"
          params={{ id: obra.id }}
          onClick={(e) => e.stopPropagation()}
          className="border rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-50 text-gray-800 transition-colors"
        >
          Editar
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={handleExcluir}
            className="border border-red-200 text-red-600 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-red-50 transition-colors z-10 relative"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}