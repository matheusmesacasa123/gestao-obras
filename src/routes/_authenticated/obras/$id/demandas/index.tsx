import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ObraModuleLayout } from "@/features/obras/components/obra-module-layout";
import { useObra } from "@/features/obras/hooks/use-obra";
import { getDemandasPorObra } from "@/features/obras/demandas/services/demandas-service";
import { DemandaList } from "@/features/obras/demandas/components/demanda-list";
import ModalEditarDemanda from "@/features/obras/demandas/components/modal-editar-demanda";

import type { Demanda } from "@/features/obras/demandas/types";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/demandas/"
)({
  component: DemandasPage,
});

function DemandasPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const {
    obra,
    loading: loadingObra,
    error: errorObra,
  } = useObra(id);

  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loadingDemandas, setLoadingDemandas] = useState(true);
  const [demandaParaEditar, setDemandaParaEditar] = useState<Demanda | null>(
    null
  );

  async function carregarDemandas() {
    try {
      const data = await getDemandasPorObra(id);
      setDemandas(data);
    } catch (error) {
      console.error("Erro ao buscar demandas:", error);
    } finally {
      setLoadingDemandas(false);
    }
  }

  useEffect(() => {
    carregarDemandas();
  }, [id]);

  if (loadingObra || loadingDemandas) {
    return <div className="p-8">Carregando...</div>;
  }

  if (errorObra || !obra) {
    return <div className="p-8">Erro ao carregar obra.</div>;
  }

  const abertas = demandas.filter((d) => d.status === "aberta").length;
  const andamento = demandas.filter((d) => d.status === "em_andamento").length;
  const concluidas = demandas.filter((d) => d.status === "concluida").length;

  return (
    <ObraModuleLayout obra={obra}>
      <div className="space-y-8">
        <div
          className="
            flex
            justify-between
            items-center
            flex-wrap
            gap-4
          "
        >
          <div>
            <h2 className="text-2xl font-bold">Demandas</h2>
            <p className="text-muted-foreground">
              Gerenciamento das atividades da obra
            </p>
          </div>

          <button
            onClick={() =>
              navigate({
                to: "/obras/$id/demandas/nova",
                params: { id },
              })
            }
            className="
              border
              rounded-lg
              px-4
              py-2
              hover:bg-muted
            "
          >
            + Nova Demanda
          </button>
        </div>

        <div
          className="
            grid
            md:grid-cols-4
            gap-4
          "
        >
          <div className="border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Total</p>
            <strong className="text-3xl">{demandas.length}</strong>
          </div>

          <div className="border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Abertas</p>
            <strong className="text-3xl">{abertas}</strong>
          </div>

          <div className="border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Em andamento</p>
            <strong className="text-3xl">{andamento}</strong>
          </div>

          <div className="border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Concluídas</p>
            <strong className="text-3xl">{concluidas}</strong>
          </div>
        </div>

        <DemandaList
          demandas={demandas}
          obraId={id}
          onDelete={carregarDemandas}
          onEdit={(demanda) => setDemandaParaEditar(demanda)}
        />
      </div>

      {/* MODAL DE EDIÇÃO */}
      {demandaParaEditar && (
        <ModalEditarDemanda
          demanda={demandaParaEditar}
          onClose={() => setDemandaParaEditar(null)}
          onSuccess={() => {
            setDemandaParaEditar(null);
            carregarDemandas();
          }}
        />
      )}
    </ObraModuleLayout>
  );
}