import {
  createFileRoute,
  Link,
  Outlet,
  useLoaderData,
  notFound,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Função utilitária para calcular o status e a cor com base nas datas e prazos
function getStatusStyle(
  status?: string,
  dataEntregaEsperada?: string | null,
  dataEntrega?: string | null
) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Trata fuso horário interpretando a string YYYY-MM-DD
  const parseData = (d?: string | null) => {
    if (!d) return null;
    const [ano, mes, dia] = d.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  };

  const dataEsperada = parseData(dataEntregaEsperada);
  const dataFinal = parseData(dataEntrega);

  // 1. SE A OBRA FOI ENTREGUE / CONCLUÍDA
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

  // 2. SE AINDA NÃO FOI ENTREGUE (ALERTA DE PRAZO)
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

  // 3. CASOS PADRÕES POR STATUS
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

export const Route = createFileRoute("/_authenticated/obras/$id")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("obras")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      throw notFound();
    }

    return data;
  },
  // Trata o aviso de notFound component
  notFoundComponent: () => (
    <div className="p-8 text-center space-y-4 bg-white border rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Obra não encontrada</h2>
      <p className="text-sm text-gray-500">
        Não encontramos nenhum registro correspondente para essa rota.
      </p>
      <Link
        to="/obras"
        className="inline-block px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
      >
        Voltar para Obras
      </Link>
    </div>
  ),
  component: ObraLayoutPage,
});

function ObraLayoutPage() {
  const obra = useLoaderData({ from: "/_authenticated/obras/$id" });

  if (!obra) {
    return <div className="p-8">Obra não encontrada.</div>;
  }

  const statusInfo = getStatusStyle(
    obra.status,
    obra.data_entrega_esperada,
    obra.data_entrega
  );

  return (
    <div className="p-8 max-w-6xl space-y-6">
      {/* BOTÃO VOLTAR */}
      <Link
        to="/obras"
        className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1 w-fit"
      >
        ← Voltar para Obras
      </Link>

      {/* CABEÇALHO DO TOPO (LAYOUT PAI) */}
      <div className="border rounded-2xl p-6 bg-white shadow-sm flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs text-gray-500 font-medium block">
            Código da obra
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {obra.codigo || "Sem código"}
          </h1>
          <p className="text-base font-semibold text-gray-800">
            {obra.cliente || "Cliente não informado"}
          </p>
          {(obra.cidade || obra.estado) && (
            <p className="text-sm text-gray-500 font-medium">
              {obra.cidade ? `${obra.cidade}` : ""}
              {obra.cidade && obra.estado ? "/" : ""}
              {obra.estado ? `${obra.estado}` : ""}
            </p>
          )}
        </div>

        {/* BADGE DINÂMICO DE STATUS */}
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* RENDERIZA SUB-ROTAS (Aba de Informações, Demandas, etc.) */}
      <Outlet />
    </div>
  );
}