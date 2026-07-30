import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

import { SectionCard } from "@/components/common/section-card";
import { StatusBadge } from "@/components/badges/status-badge";
import { PrioridadeBadge } from "@/components/badges/prioridade-badge";

import type { Demanda } from "../types";

interface DemandaCardProps {
  demanda: Demanda;
  obraId: string;
}

export function DemandaCard({
  demanda,
  obraId,
}: DemandaCardProps) {
  return (
    <SectionCard title={demanda.titulo}>
      <div className="space-y-4">
        {demanda.descricao && (
          <p className="text-muted-foreground">
            {demanda.descricao}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            status={demanda.status}
          />

          <PrioridadeBadge
            prioridade={demanda.prioridade}
          />
        </div>

        {demanda.prazo && (
          <p className="text-sm text-muted-foreground">
            Prazo:{" "}
            {new Date(
              demanda.prazo
            ).toLocaleDateString("pt-BR")}
          </p>
        )}

        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link
              to="/obras/$id/demandas/$demandaId"
              params={{
                id: obraId,
                demandaId: demanda.id,
              }}
            >
              Ver detalhes
            </Link>
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}