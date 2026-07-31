import {
  createFileRoute,
  useLoaderData,
} from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/"
)({
  component: ObraInformacoesPage,
});

function ObraInformacoesPage() {
  const obra = useLoaderData({
    from: "/_authenticated/obras/$id",
  });

  return (
    <div className="border rounded-2xl p-6 bg-white shadow-sm space-y-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">
            Razão Social
          </h3>

          <p className="text-base font-semibold">
            {obra.razao_social || "-"}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">
            CNPJ
          </h3>

          <p className="text-base font-semibold">
            {obra.cnpj || "-"}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">
            Tipo de Projeto
          </h3>

          <p className="text-base font-semibold">
            {obra.tipo_projeto || "-"}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">
            Vazão
          </h3>

          <p className="text-base font-semibold">
            {obra.vazao ? `${obra.vazao} m³/dia` : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}