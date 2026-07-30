import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteDemanda } from "../services/demandas-service";
import type { Demanda } from "../types";

interface DemandaCardProps {
  demanda: Demanda;
  obraId: string;
  onDelete?: () => void;
  onEdit?: (demanda: Demanda) => void;
}

export function DemandaCard({
  demanda,
  obraId,
  onDelete,
  onEdit,
}: DemandaCardProps) {
  const [excluindo, setExcluindo] = useState(false);

  function corStatus() {
    switch (demanda.status) {
      case "aberta":
        return "bg-blue-100 text-blue-700";
      case "em_andamento":
        return "bg-yellow-100 text-yellow-700";
      case "concluida":
        return "bg-green-100 text-green-700";
      case "cancelada":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted";
    }
  }

  function corPrioridade() {
    switch (demanda.prioridade) {
      case "baixa":
        return "bg-gray-100 text-gray-700";
      case "media":
        return "bg-orange-100 text-orange-700";
      case "alta":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted";
    }
  }

  async function handleExcluir(e: React.MouseEvent) {
    e.stopPropagation(); // Impede clique no card principal

    if (!confirm(`Deseja excluir "${demanda.titulo}"?`)) return;

    try {
      setExcluindo(true);
      await deleteDemanda(demanda.id);
      if (onDelete) onDelete();
    } catch (err) {
      console.error("Erro ao excluir demanda:", err);
      alert("Erro ao excluir a demanda.");
    } finally {
      setExcluindo(false);
    }
  }

  function handleEditar(e: React.MouseEvent) {
    e.stopPropagation();
    if (onEdit) {
      onEdit(demanda);
    } else {
      console.log("Ação de editar demanda:", demanda.id);
    }
  }

  return (
    <div
      onClick={() => console.log("Card clicado:", demanda.id)}
      className="
        border
        rounded-xl
        p-5
        space-y-4
        cursor-pointer
        hover:bg-muted/40
        transition
        relative
      "
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="text-lg font-semibold">{demanda.titulo}</h2>
          {demanda.descricao && (
            <p className="text-sm text-muted-foreground mt-1">
              {demanda.descricao}
            </p>
          )}
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleEditar}
            type="button"
            title="Editar demanda"
            className="p-1.5 text-gray-500 hover:text-black hover:bg-muted rounded-lg transition"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            onClick={handleExcluir}
            disabled={excluindo}
            type="button"
            title="Excluir demanda"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <span
          className={`
            px-3
            py-1
            rounded-full
            text-xs
            font-medium
            ${corStatus()}
          `}
        >
          {demanda.status}
        </span>

        <span
          className={`
            px-3
            py-1
            rounded-full
            text-xs
            font-medium
            ${corPrioridade()}
          `}
        >
          {demanda.prioridade}
        </span>
      </div>

      {demanda.prazo && (
        <p className="text-sm">
          Prazo: {new Date(demanda.prazo).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}