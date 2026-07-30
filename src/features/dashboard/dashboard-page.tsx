import { useEffect, useState } from "react";
import { DashboardCard } from "./dashboard-card";
import { StatusObrasChart } from "./components/status-obras-chart";
import { CronogramaResumo } from "./components/cronograma-resumo";
import { getObras } from "@/features/obras/services/obras-service";
import { getResumoCronograma } from "./services/dashboard-service";
import { useNavigate } from "@tanstack/react-router";

// Helper para determinar se uma obra está atrasada com base em datas
function isObraAtrasada(obra: any): boolean {
  if (obra.data_entrega || obra.status === "concluida" || obra.status === "entregue") {
    return false;
  }

  if (!obra.data_entrega_esperada) return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [ano, mes, dia] = obra.data_entrega_esperada.split("-").map(Number);
  const dataEsperada = new Date(ano, mes - 1, dia);

  return dataEsperada < hoje;
}

export function DashboardPage() {
  const navigate = useNavigate();

  const [obras, setObras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [cronograma, setCronograma] = useState({
    atrasadas: 0,
    andamento: 0,
    proximas: [],
  });

  useEffect(() => {
    async function carregar() {
      try {
        const [obrasData, cronogramaData] = await Promise.all([
          getObras(),
          getResumoCronograma(),
        ]);

        setObras(obrasData);

        setCronograma({
          atrasadas: cronogramaData.atrasadas.length,
          andamento: cronogramaData.andamento,
          proximas: cronogramaData.proximas as any,
        });
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  if (loading) {
    return <div className="p-8">Carregando dashboard...</div>;
  }

  // 1. Obras Ativas (todas não concluídas)
  const obrasAtivas = obras.filter(
    (obra) => obra.status !== "concluida" && obra.status !== "entregue" && !obra.data_entrega
  ).length;

  // 2. Obras Atrasadas (obras ativas com prazo estourado)
  const obrasAtrasadas = obras.filter(isObraAtrasada).length;

  // 3. Obras em Andamento (todas que estão sendo executadas, mesmo que atrasadas)
  const obrasEmAndamento = obrasAtivas;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das obras e acompanhamento dos projetos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <DashboardCard
          title="Obras Ativas"
          value={obrasAtivas}
          description="Total em aberto"
        />

        <DashboardCard
          title="Obras Atrasadas"
          value={obrasAtrasadas}
          description="Necessitam atenção"
        />

        <DashboardCard
          title="Clientes"
          value={new Set(obras.map((obra) => obra.cliente)).size}
          description="Clientes cadastrados"
        />

        <DashboardCard
          title="Obras em Andamento"
          value={obrasEmAndamento}
          description="Em execução"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <StatusObrasChart obras={obras} />

        <CronogramaResumo
          atrasadas={cronograma.atrasadas}
          andamento={cronograma.andamento}
          proximas={cronograma.proximas}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Obras recentes</h2>

        <div className="grid gap-4">
          {obras.slice(0, 5).map((obra) => (
            <div
              key={obra.id}
              onClick={() =>
                navigate({
                  to: "/obras/$id",
                  params: { id: obra.id },
                })
              }
              className="bg-white border rounded-xl p-5 cursor-pointer hover:bg-muted/50 transition"
            >
              <h3 className="font-bold text-lg">
                {obra.codigo ?? "Sem código"}
              </h3>

              <p className="text-muted-foreground">Cliente: {obra.cliente}</p>

              <span className="inline-block mt-3 px-3 py-1 rounded-full text-sm bg-muted">
                {isObraAtrasada(obra)
                  ? "Em andamento (Atrasada)"
                  : obra.status ?? "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}