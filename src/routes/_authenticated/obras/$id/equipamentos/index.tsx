import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getEquipamentosPorObra,
} from "@/features/obras/equipamentos/services/equipamentos-service";

import {
  EquipamentoForm,
} from "@/features/obras/equipamentos/components/equipamento-form";

import {
  EquipamentoList,
} from "@/features/obras/equipamentos/components/equipamento-list";

import type {
  Equipamento,
} from "@/features/obras/equipamentos/types";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/equipamentos/"
)({
  component: EquipamentosPage,
});

function EquipamentosPage() {
  const { id } = Route.useParams();

  const [equipamentos, setEquipamentos] =
    useState<Equipamento[]>([]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregarEquipamentos = useCallback(async () => {
    try {
      setLoading(true);
      setErro(false);

      const data = await getEquipamentosPorObra(id);

      setEquipamentos(data);
    } catch (error) {
      console.error(
        "Erro ao buscar equipamentos:",
        error
      );

      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregarEquipamentos();
  }, [carregarEquipamentos]);

  if (loading) {
    return (
      <div className="border rounded-2xl p-8 bg-white shadow-sm">
        Carregando equipamentos...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="border rounded-2xl p-8 bg-white shadow-sm">
        Erro ao carregar equipamentos.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">
          Equipamentos
        </h2>

        <p className="text-muted-foreground">
          Controle dos equipamentos previstos para a obra.
        </p>
      </div>

      <EquipamentoForm
        obraId={id}
        onSuccess={carregarEquipamentos}
      />

      <EquipamentoList
        equipamentos={equipamentos}
      />
    </div>
  );
}