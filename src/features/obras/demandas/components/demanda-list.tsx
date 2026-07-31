import {
  DemandaCard,
} from "./demanda-card";

import type {
  Demanda,
} from "../types";

interface DemandaListProps {
  demandas: Demanda[];
  obraId: string;
  obraSetorId: string | null;
  onDelete?: () => void;
  onEdit?: (
    demanda: Demanda
  ) => void;
}

export function DemandaList({
  demandas,
  obraId,
  obraSetorId,
  onDelete,
  onEdit,
}: DemandaListProps) {
  if (
    demandas.length ===
    0
  ) {
    return (
      <div
        className="
          rounded-xl
          border
          p-8
          text-center
        "
      >
        <h2 className="text-lg font-semibold">
          Nenhuma demanda cadastrada
        </h2>

        <p className="mt-2 text-muted-foreground">
          Crie a primeira demanda desta obra.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {demandas.map(
        (
          demanda
        ) => (
          <DemandaCard
            key={
              demanda.id
            }
            demanda={
              demanda
            }
            obraId={
              obraId
            }
            obraSetorId={
              obraSetorId
            }
            onDelete={
              onDelete
            }
            onEdit={
              onEdit
            }
          />
        )
      )}
    </div>
  );
}