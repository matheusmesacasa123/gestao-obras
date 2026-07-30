import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/obras/$id/editar")({
  component: EditarObraPage,
});

function getStatusStyle(
  status?: string,
  dataEntregaEsperada?: string | null,
  dataEntrega?: string | null
) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const parseData = (d?: string | null) => {
    if (!d) return null;
    const [ano, mes, dia] = d.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  };

  const dataEsperada = parseData(dataEntregaEsperada);
  const dataFinal = parseData(dataEntrega);

  if (status === "concluida" || dataFinal) {
    if (dataEsperada && dataFinal && dataFinal > dataEsperada) {
      return {
        label: "Finalizada com atraso",
        bg: "bg-amber-100 text-amber-800 border-amber-300",
      };
    }

    return {
      label: "Finalizada",
      bg: "bg-green-100 text-green-800 border-green-300",
    };
  }

  if (dataEsperada) {
    const diffEmTempo = dataEsperada.getTime() - hoje.getTime();
    const diffEmDias = Math.ceil(diffEmTempo / (1000 * 3600 * 24));

    if (diffEmDias < 0) {
      return {
        label: "Em andamento (Atrasada)",
        bg: "bg-red-100 text-red-800 border-red-300",
      };
    }

    if (diffEmDias <= 3) {
      return {
        label: "Em andamento (Atrasando)",
        bg: "bg-red-100 text-red-800 border-red-300",
      };
    }
  }

  switch (status) {
    case "em_desenvolvimento":
    case "em_andamento":
      return {
        label: "Em andamento",
        bg: "bg-blue-100 text-blue-800 border-blue-300",
      };
    case "em_analise":
      return {
        label: "Em análise",
        bg: "bg-amber-100 text-amber-800 border-amber-300",
      };
    case "aguardando_cliente":
      return {
        label: "Aguardando cliente",
        bg: "bg-orange-100 text-orange-800 border-orange-300",
      };
    default:
      return {
        label: "Recebida",
        bg: "bg-gray-100 text-gray-800 border-gray-300",
      };
  }
}

function EditarObraPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [form, setForm] = useState<any>({
    codigo: "",
    cliente: "",
    razao_social: "",
    cnpj: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",

    numero_proposta: "",
    revisao: "",
    motivo_revisao: "",
    vendedor: "",
    data_entrada: "",
    data_entrega_esperada: "",
    tipo_proposta: "",
    tipo_orcamentacao: "",

    nome_obra: "",
    descricao: "",
    complexidade: "",
    responsavel_engenheiro: "",

    vazao: "",
    tipo_projeto: "",
    tipo_efluente: "",

    data_inicio: "",
    data_entrega: "",
    situacao_especial: "",
    motivo_atraso: "",

    status: "recebida",
    observacoes: "",
  });

  function formatarCnpj(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function formatarTelefone(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  useEffect(() => {
    carregarObra();
  }, [id]);

  async function carregarObra() {
    try {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setForm((prevForm) => {
        const novoForm = { ...prevForm, ...data };

        if (novoForm.data_entrega) {
          novoForm.status = "concluida";
        } else if (novoForm.data_inicio) {
          novoForm.status = "em_desenvolvimento";
        }

        return novoForm;
      });
    } catch (error) {
      console.error("Erro ao carregar obra", error);
    } finally {
      setCarregando(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name } = e.target;
    let valor = e.target.value;

    if (name === "cnpj") {
      valor = formatarCnpj(valor);
    }

    if (name === "telefone") {
      valor = formatarTelefone(valor);
    }

    setForm((prevForm) => {
      const proximoForm = {
        ...prevForm,
        [name]: valor,
      };

      if (proximoForm.data_entrega) {
        proximoForm.status = "concluida";
      } else if (proximoForm.data_inicio) {
        proximoForm.status = "em_desenvolvimento";
      }

      return proximoForm;
    });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      const statusFinal = form.data_entrega
        ? "concluida"
        : form.data_inicio
          ? "em_desenvolvimento"
          : form.status;

      const { error } = await supabase
        .from("obras")
        .update({
          codigo: form.codigo || null,
          cliente: form.cliente,
          razao_social: form.razao_social || null,
          cnpj: form.cnpj || null,
          email: form.email || null,
          telefone: form.telefone || null,
          cidade: form.cidade || null,
          estado: form.estado || null,

          numero_proposta: form.numero_proposta || null,
          revisao: form.revisao ? Number(form.revisao) : null,
          motivo_revisao: form.motivo_revisao || null,
          vendedor: form.vendedor || null,
          data_entrada: form.data_entrada || null,
          data_entrega_esperada: form.data_entrega_esperada || null,
          tipo_proposta: form.tipo_proposta || null,
          tipo_orcamentacao: form.tipo_orcamentacao || null,

          nome_obra: form.nome_obra || null,
          descricao: form.descricao || null,
          complexidade: form.complexidade || null,
          responsavel_engenheiro: form.responsavel_engenheiro || null,

          vazao: form.vazao ? Number(form.vazao) : null,
          tipo_projeto: form.tipo_projeto || null,
          tipo_efluente: form.tipo_efluente || null,

          data_inicio: form.data_inicio || null,
          data_entrega: form.data_entrega || null,
          situacao_especial: form.situacao_especial || null,
          motivo_atraso: form.motivo_atraso || null,

          status: statusFinal,

          observacoes: form.observacoes || null,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Re-executa o loader da rota pai imediatamente
      await router.invalidate();

      navigate({
        to: "/obras/$id",
        params: {
          id,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar obra:", error);
      alert("Erro ao salvar alterações");
    } finally {
      setLoading(false);
    }
  }

  const currentStatusInfo = getStatusStyle(
    form.status,
    form.data_entrega_esperada,
    form.data_entrega
  );

  if (carregando) {
    return <div className="p-8">Carregando obra...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar Obra</h1>
      </div>

      <form onSubmit={salvar} className="space-y-8">
        {/* DADOS GERAIS */}
        <div className="border rounded-2xl p-6 space-y-5 bg-white">
          <h2 className="text-xl font-semibold">Dados Gerais</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              ["codigo", "Código da obra"],
              ["nome_obra", "Nome da obra"],
              ["cliente", "Cliente"],
              ["razao_social", "Razão social"],
              ["cnpj", "CNPJ"],
              ["email", "E-mail"],
              ["telefone", "Telefone"],
              ["cidade", "Cidade"],
              ["estado", "Estado"],
            ].map(([campo, label]) => (
              <div key={campo} className="space-y-2">
                <label className="text-sm font-medium">{label}</label>
                <input
                  name={campo}
                  value={form[campo] ?? ""}
                  onChange={handleChange}
                  className="border rounded-lg p-3 w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* INFORMAÇÕES COMERCIAIS */}
        <div className="border rounded-2xl p-6 space-y-5 bg-white">
          <h2 className="text-xl font-semibold">Informações Comerciais</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              ["numero_proposta", "Nº Proposta"],
              ["revisao", "Revisão"],
              ["motivo_revisao", "Motivo da revisão"],
              ["vendedor", "Vendedor"],
              ["data_entrada", "Data Entrada"],
              ["data_entrega_esperada", "Data Entrega Esperada"],
              ["tipo_proposta", "Tipo de Proposta"],
              ["tipo_orcamentacao", "Tipo de Orçamentação"],
            ].map(([campo, label]) => (
              <div key={campo} className="space-y-2">
                <label className="text-sm font-medium">{label}</label>
                <input
                  type={campo.includes("data") ? "date" : "text"}
                  name={campo}
                  value={form[campo] ?? ""}
                  onChange={handleChange}
                  className="border rounded-lg p-3 w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* DADOS TÉCNICOS */}
        <div className="border rounded-2xl p-6 space-y-5 bg-white">
          <h2 className="text-xl font-semibold">Dados Técnicos</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              ["vazao", "Vazão (m³/dia)"],
              ["tipo_projeto", "Tipo de projeto"],
              ["tipo_efluente", "Tipo de efluente"],
              ["complexidade", "Complexidade"],
              ["responsavel_engenheiro", "Responsável Eng."],
            ].map(([campo, label]) => (
              <div key={campo} className="space-y-2">
                <label className="text-sm font-medium">{label}</label>
                <input
                  name={campo}
                  value={form[campo] ?? ""}
                  onChange={handleChange}
                  className="border rounded-lg p-3 w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* EXECUÇÃO */}
        <div className="border rounded-2xl p-6 space-y-5 bg-white">
          <h2 className="text-xl font-semibold">Execução</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              ["data_inicio", "Data de início"],
              ["data_entrega", "Data de entrega"],
              ["situacao_especial", "Situação especial"],
              ["motivo_atraso", "Motivo de atraso"],
            ].map(([campo, label]) => (
              <div key={campo} className="space-y-2">
                <label className="text-sm font-medium">{label}</label>
                <input
                  type={campo.includes("data") ? "date" : "text"}
                  name={campo}
                  value={form[campo] ?? ""}
                  onChange={handleChange}
                  className="border rounded-lg p-3 w-full"
                />
              </div>
            ))}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Status da obra</label>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${currentStatusInfo.bg}`}
                >
                  {currentStatusInfo.label}
                </span>
              </div>

              <select
                name="status"
                value={form.status ?? ""}
                disabled={!!form.data_inicio || !!form.data_entrega}
                onChange={handleChange}
                className="
                  border
                  rounded-lg
                  p-3
                  w-full
                  cursor-pointer
                  disabled:bg-gray-100
                  disabled:cursor-not-allowed
                "
              >
                <option value="recebida">Recebida</option>
                <option value="em_analise">Em análise</option>
                <option value="em_desenvolvimento">Em andamento</option>
                <option value="aguardando_cliente">Aguardando cliente</option>
                <option value="concluida">Finalizada</option>
              </select>
            </div>
          </div>
        </div>

        {/* OBSERVAÇÕES */}
        <div className="border rounded-2xl p-6 space-y-3 bg-white">
          <label className="text-sm font-medium">Observações</label>
          <textarea
            name="observacoes"
            value={form.observacoes ?? ""}
            onChange={handleChange}
            rows={5}
            className="border rounded-lg p-3 w-full"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="bg-black text-white px-8 py-3 rounded-xl cursor-pointer hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>
    </div>
  );
}