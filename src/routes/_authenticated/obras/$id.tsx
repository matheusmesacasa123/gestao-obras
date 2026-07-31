import {
  createFileRoute,
  Link,
  Outlet,
  notFound,
} from "@tanstack/react-router";

import {
  supabase,
} from "@/integrations/supabase/client";

export const Route =
  createFileRoute(
    "/_authenticated/obras/$id"
  )({
    loader: async ({
      params,
    }) => {
      const {
        data,
        error,
      } =
        await supabase
          .from("obras")
          .select("*")
          .eq(
            "id",
            params.id
          )
          .single();

      if (
        error ||
        !data
      ) {
        throw notFound();
      }

      return data;
    },

    notFoundComponent:
      () => (
        <div className="space-y-4 rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">
            Obra não encontrada
          </h2>

          <p className="text-sm text-gray-500">
            Não encontramos nenhum registro correspondente para essa rota.
          </p>

          <Link
            to="/obras"
            className="inline-block rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Voltar para Obras
          </Link>
        </div>
      ),

    component:
      ObraLayoutPage,
  });

function ObraLayoutPage() {
  const obra =
    Route.useLoaderData();

  const tabs = [
    {
      label:
        "Informações",

      to:
        "/obras/$id",

      exact:
        true,
    },
    {
      label:
        "Etapas",

      to:
        "/obras/$id/etapas",

      exact:
        false,
    },
    {
      label:
        "Demandas",

      to:
        "/obras/$id/demandas",

      exact:
        false,
    },
    {
      label:
        "Documentos",

      to:
        "/obras/$id/documentos",

      exact:
        false,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <Link
        to="/obras"
        className="flex w-fit items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-black"
      >
        ← Voltar para Obras
      </Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <span className="block text-xs font-medium text-gray-500">
            Código da obra
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {obra.codigo ||
              "Sem código"}
          </h1>

          <p className="text-base font-semibold text-gray-800">
            {obra.cliente ||
              "Cliente não informado"}
          </p>

          {(obra.cidade ||
            obra.estado) && (
            <p className="text-sm font-medium text-gray-500">
              {obra.cidade ||
                ""}

              {obra.cidade &&
              obra.estado
                ? "/"
                : ""}

              {obra.estado ||
                ""}
            </p>
          )}
        </div>
      </div>

      <nav className="flex justify-center rounded-2xl border bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tabs.map(
            (
              tab
            ) => (
              <Link
                key={
                  tab.label
                }
                to={
                  tab.to
                }
                params={{
                  id:
                    obra.id,
                }}
                activeOptions={{
                  exact:
                    tab.exact,
                }}
                activeProps={{
                  className:
                    "bg-black text-white shadow-sm",
                }}
                inactiveProps={{
                  className:
                    "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                }}
                className="block min-w-[130px] whitespace-nowrap rounded-xl px-5 py-2.5 text-center text-sm font-semibold transition-all"
              >
                {
                  tab.label
                }
              </Link>
            )
          )}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}