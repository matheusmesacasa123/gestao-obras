import { EmptyState } from "@/components/feedback/empty-state";

import type { Demanda } from "../types";

import { DemandaCard } from "./demanda-card";

interface DemandaListProps {
  demandas: Demanda[];
  obraId: string;
}

export function DemandaList({
  demandas,
  obraId,
}: DemandaListProps) {
  if (demandas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma demanda cadastrada"
        description="Cadastre a primeira demanda desta obra."
      />
    );
  }

  return (
    <div className="space-y-4">
      {demandas.map((demanda) => (
        <DemandaCard
          key={demanda.id}
          demanda={demanda}
          obraId={obraId}
        />
      ))}
    </div>
  );
}