import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useState,
  type FormEvent,
} from "react";

import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  PrioridadeDemanda,
} from "@/features/obras/demandas/types";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/demandas/nova"
)({
  component: NovaDemandaPage,
});

function NovaDemandaPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [titulo, setTitulo] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [prioridade, setPrioridade] =
    useState<PrioridadeDemanda>(
      "media"
    );

  const [prazo, setPrazo] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function criarDemanda(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!titulo.trim()) {
      alert(
        "Informe o título da demanda."
      );

      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("demandas")
        .insert({
          obra_id: id,

          titulo:
            titulo.trim(),

          descricao:
            descricao.trim() || null,

          status: "aberta",

          prioridade,

          prazo:
            prazo || null,

          data_conclusao: null,

          motivo_atraso: null,
        });

      if (error) {
        console.error(
          "Erro Supabase:",
          error
        );

        alert(error.message);
        return;
      }

      navigate({
        to: "/obras/$id/demandas",
        params: {
          id,
        },
      });
    } catch (error) {
      console.error(
        "Erro ao criar demanda:",
        error
      );

      alert(
        "Erro ao criar a demanda."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-8">
      <button
        type="button"
        onClick={() =>
          navigate({
            to: "/obras/$id/demandas",
            params: {
              id,
            },
          })
        }
        className="text-sm underline"
      >
        ← Voltar para demandas
      </button>

      <div>
        <h1 className="text-3xl font-bold">
          Nova demanda
        </h1>

        <p className="text-muted-foreground">
          Cadastre uma nova atividade
          para esta obra.
        </p>
      </div>

      <form
        onSubmit={criarDemanda}
        className="max-w-2xl space-y-5 rounded-xl border p-6"
      >
        <div className="space-y-2">
          <label
            htmlFor="nova-demanda-titulo"
            className="font-medium"
          >
            Título
          </label>

          <input
            id="nova-demanda-titulo"
            value={titulo}
            onChange={(event) =>
              setTitulo(event.target.value)
            }
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Ex.: Projeto hidráulico"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="nova-demanda-descricao"
            className="font-medium"
          >
            Descrição
          </label>

          <textarea
            id="nova-demanda-descricao"
            value={descricao}
            onChange={(event) =>
              setDescricao(
                event.target.value
              )
            }
            className="min-h-32 w-full rounded-lg border px-3 py-2"
            placeholder="Descreva a atividade..."
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="nova-demanda-prioridade"
            className="font-medium"
          >
            Prioridade
          </label>

          <select
            id="nova-demanda-prioridade"
            value={prioridade}
            onChange={(event) =>
              setPrioridade(
                event.target
                  .value as PrioridadeDemanda
              )
            }
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="baixa">
              Baixa
            </option>

            <option value="media">
              Média
            </option>

            <option value="alta">
              Alta
            </option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="nova-demanda-prazo"
            className="font-medium"
          >
            Prazo
          </label>

          <input
            id="nova-demanda-prazo"
            type="date"
            value={prazo}
            onChange={(event) =>
              setPrazo(event.target.value)
            }
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border px-5 py-2 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Salvando..."
            : "Criar demanda"}
        </button>
      </form>
    </div>
  );
}