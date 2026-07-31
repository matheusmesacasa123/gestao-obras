import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDemandasPorObra,
} from "@/features/obras/demandas/services/demandas-service";

import {
  DemandaList,
} from "@/features/obras/demandas/components/demanda-list";

import ModalEditarDemanda from "@/features/obras/demandas/components/modal-editar-demanda";

import type {
  Demanda,
} from "@/features/obras/demandas/types";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/demandas/"
)({
  component: DemandasPage,
});

function DemandasPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loadingDemandas, setLoadingDemandas] = useState(true);
  const [erroDemandas, setErroDemandas] = useState(false);

  const [demandaParaEditar, setDemandaParaEditar] =
    useState<Demanda | null>(null);

  const carregarDemandas = useCallback(async () => {
    try {
      setLoadingDemandas(true);
      setErroDemandas(false);

      const data = await getDemandasPorObra(id);

      setDemandas(data);
    } catch (error) {
      console.error("Erro ao buscar demandas:", error);
      setErroDemandas(true);
    } finally {
      setLoadingDemandas(false);
    }
  }, [id]);

  useEffect(() => {
    carregarDemandas();
  }, [carregarDemandas]);

  if (loadingDemandas) {
    return (
      <div className="border rounded-2xl p-8 bg-white shadow-sm">
        Carregando demandas...
      </div>
    );
  }

  if (erroDemandas) {
    return (
      <div className="border rounded-2xl p-8 bg-white shadow-sm">
        Erro ao carregar demandas.
      </div>
    );
  }

  const abertas = demandas.filter(
    (demanda) => demanda.status === "aberta"
  ).length;

  const andamento = demandas.filter(
    (demanda) => demanda.status === "em_andamento"
  ).length;

  const concluidas = demandas.filter(
    (demanda) => demanda.status === "concluida"
  ).length;

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Demandas
            </h2>

            <p className="text-muted-foreground">
              Gerenciamento das atividades da obra
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/obras/$id/demandas/nova",
                params: { id },
              })
            }
            className="border rounded-lg px-4 py-2 hover:bg-muted transition"
          >
            + Nova Demanda
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-xl p-5 bg-white">
            <p className="text-sm text-muted-foreground">
              Total
            </p>

            <strong className="text-3xl">
              {demandas.length}
            </strong>
          </div>

          <div className="border rounded-xl p-5 bg-white">
            <p className="text-sm text-muted-foreground">
              Abertas
            </p>

            <strong className="text-3xl">
              {abertas}
            </strong>
          </div>

          <div className="border rounded-xl p-5 bg-white">
            <p className="text-sm text-muted-foreground">
              Em andamento
            </p>

            <strong className="text-3xl">
              {andamento}
            </strong>
          </div>

          <div className="border rounded-xl p-5 bg-white">
            <p className="text-sm text-muted-foreground">
              Concluídas
            </p>

            <strong className="text-3xl">
              {concluidas}
            </strong>
          </div>
        </div>

        <DemandaList
          demandas={demandas}
          obraId={id}
          onDelete={carregarDemandas}
          onEdit={(demanda) => {
            setDemandaParaEditar(demanda);
          }}
        />
      </div>

      {demandaParaEditar && (
        <ModalEditarDemanda
          demanda={demandaParaEditar}
          onClose={() => {
            setDemandaParaEditar(null);
          }}
          onSuccess={() => {
            setDemandaParaEditar(null);
            carregarDemandas();
          }}
        />
      )}
    </>
  );
}