import {
  createFileRoute,
  Link,
  Outlet,
  notFound,
} from "@tanstack/react-router";

import {
  Pencil,
} from "lucide-react";

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
        data: obra,
        error,
      } = await supabase
        .from("orcamentos")
        .select("*")
        .eq(
          "id",
          params.id
        )
        .single();

      if (
        error ||
        !obra
      ) {
        throw notFound();
      }

      return {
        obra,
      };
    },

    notFoundComponent:
      () => (
        <div className="space-y-4 rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">
            Orçamento não encontrado
          </h2>

          <p className="text-sm text-gray-500">
            Não encontramos nenhum registro correspondente para essa rota.
          </p>

          <Link
            to="/obras"
            className="inline-block rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Voltar para Orçamentação
          </Link>
        </div>
      ),

    component:
      ObraLayoutPage,
  });

function ObraLayoutPage() {
  const {
    obra,
  } =
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
        "Comercial",

      to:
        "/obras/$id/comercial",

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
    {
      label:
        "Histórico",

      to:
        "/obras/$id/historico",

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
        ← Voltar para Orçamentação
      </Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex min-h-[145px] flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="space-y-1">
            <span className="block text-xs font-medium text-gray-500">
              Número da proposta
            </span>

            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {obra.numero_proposta ||
                "Sem número de proposta"}
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

          <Link
            to="/obras/$id/editar"
            params={{
              id:
                obra.id,
            }}
            className="inline-flex w-fit shrink-0 items-center gap-2 self-end rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" />

            Editar orçamento
          </Link>
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