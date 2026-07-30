import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/obras/$id/")({
  component: ObraInformacoesPage,
});

function ObraInformacoesPage() {
  const obra = useLoaderData({ from: "/_authenticated/obras/$id" });

  if (!obra) {
    return <div className="p-4">Carregando informações...</div>;
  }

  // Lista de abas apontando para suas rotas correspondentes
  const tabs = [
    { label: "Informações", to: "/obras/$id" },
    { label: "Demandas", to: "/obras/$id/demandas" },
    { label: "Documentos", to: "/obras/$id/documentos" },
    { label: "Equipamentos", to: "/obras/$id/equipamentos" },
    { label: "Cronograma", to: "/obras/$id/cronograma" },
    { label: "Financeiro", to: "/obras/$id/financeiro" },
    { label: "Histórico", to: "/obras/$id/historico" },
  ];

  return (
    <div className="space-y-6">
      {/* BARRA DE TABS USANDO LINKS DE ROTA DO TANSTACK */}
      <div className="border rounded-2xl p-2 bg-white flex items-center gap-2 overflow-x-auto shadow-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            params={{ id: obra.id }}
            activeProps={{ className: "bg-black text-white" }}
            inactiveProps={{ className: "text-gray-600 hover:bg-gray-100" }}
            activeOptions={{ exact: tab.to === "/obras/$id" }}
            className="px-4 py-2 text-sm font-medium rounded-xl transition-all block whitespace-nowrap"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* CONTEÚDO ESPECÍFICO DA ABA "INFORMAÇÕES" */}
      <div className="border rounded-2xl p-6 bg-white shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Razão Social</h3>
            <p className="text-base font-semibold">{obra.razao_social || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">CNPJ</h3>
            <p className="text-base font-semibold">{obra.cnpj || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tipo de Projeto</h3>
            <p className="text-base font-semibold">{obra.tipo_projeto || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Vazão</h3>
            <p className="text-base font-semibold">
              {obra.vazao ? `${obra.vazao} m³/dia` : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}