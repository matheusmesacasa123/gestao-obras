import { DemandaCard } from "./demanda-card";

import type { Demanda } from "../types";

interface DemandaListProps {
  demandas: Demanda[];
  obraId: string;
  onDelete?: () => void;
  onEdit?: (demanda: Demanda) => void;
}

export function DemandaList({
  demandas,
  obraId,
  onDelete,
  onEdit,
}: DemandaListProps) {
  if (demandas.length === 0) {
    return (
      <div
        className="
          border
          rounded-xl
          p-8
          text-center
        "
      >
        <h2 className="text-lg font-semibold">
          Nenhuma demanda cadastrada
        </h2>

        <p className="text-muted-foreground mt-2">
          Crie a primeira demanda desta obra.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {demandas.map((demanda) => (
        <DemandaCard
          key={demanda.id}
          demanda={demanda}
          obraId={obraId}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}