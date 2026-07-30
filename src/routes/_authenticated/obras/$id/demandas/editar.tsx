import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { updateDemanda } from "@/features/obras/demandas/services/demandas-service";
import type { Demanda } from "@/features/obras/demandas/types";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/demandas/editar"
)({
  component: EditarDemandaPage,
});

function EditarDemandaPage() {
  const { id: obraId, demandaId } = Route.useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("aberta");
  const [prioridade, setPrioridade] = useState("media");
  const [prazo, setPrazo] = useState("");

  useEffect(() => {
    async function carregarDemanda() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("demandas")
          .select("*")
          .eq("id", demandaId)
          .single();

        if (error) throw error;

        if (data) {
          const d = data as Demanda;
          setTitulo(d.titulo || "");
          setDescricao(d.descricao || "");
          setStatus(d.status || "aberta");
          setPrioridade(d.prioridade || "media");
          setPrazo(d.prazo ? d.prazo.split("T")[0] : "");
        }
      } catch (err) {
        console.error("Erro ao carregar demanda:", err);
        alert("Erro ao carregar dados da demanda.");
      } finally {
        setLoading(false);
      }
    }

    carregarDemanda();
  }, [demandaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      await updateDemanda(demandaId, {
        titulo,
        descricao,
        status: status as Demanda["status"],
        prioridade: prioridade as Demanda["prioridade"],
        prazo: prazo ? prazo : null,
      });

      // Volta para a lista de demandas da obra
      navigate({
        to: "/obras/$id/demandas",
        params: { id: obraId },
      });
    } catch (err) {
      console.error("Erro ao atualizar demanda:", err);
      alert("Erro ao salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Carregando demanda...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar Demanda</h1>
        <button
          type="button"
          onClick={() =>
            navigate({
              to: "/obras/$id/demandas",
              params: { id: obraId },
            })
          }
          className="text-sm border px-3 py-1.5 rounded-lg hover:bg-muted"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border rounded-xl p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título</label>
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Descrição</label>

          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="aberta">Aberta</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prioridade</label>

            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Prazo</label>

          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}