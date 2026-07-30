import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/integrations/supabase/client";

import { criarObra } from "@/features/obras/services/obras-service";
import { getClientes, type Cliente } from "@/features/clientes/services/clientes-service";

export const Route = createFileRoute(
  "/_authenticated/obras/nova"
)({
  component: NovaObraPage,
});

function NovaObraPage(){
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clientesLista, setClientesLista] = useState<Cliente[]>([]);
  const [modoNovoCliente, setModoNovoCliente] = useState(false);

  const [form, setForm] = useState({
    // Gerais
    codigo:"",
    cliente_id:"", // ID do cliente selecionado
    novoClienteNome:"", // Nome para cadastro rápido
    novoClienteTelefone:"", // Telefone para cadastro rápido
    razao_social:"",
    cnpj:"",
    email:"",
    telefone:"",
    cidade:"",
    estado:"",

    // Comercial
    numero_proposta:"",
    revisao:"",
    motivo_revisao:"",
    vendedor:"",
    data_entrada:"",
    data_entrega_esperada:"",
    tipo_proposta:"",
    tipo_orcamentacao:"",

    // Obra
    nome_obra:"",
    descricao:"",
    complexidade:"",
    responsavel_engenheiro:"",

    // Técnico
    vazao:"",
    tipo_projeto:"",
    tipo_efluente:"",

    // Execução
    data_inicio:"",
    data_entrega:"",
    situacao_especial:"",
    motivo_atraso:"",
    prazo_entrega:"",

    status:"recebida",
    observacoes:"",
  });

  // Busca a lista de clientes ao carregar a página
  useEffect(() => {
    getClientes()
      .then(setClientesLista)
      .catch((err) => console.error("Erro ao carregar clientes:", err));
  }, []);

  function formatarCnpj(valor:string){
    return valor
      .replace(/\D/g,"")
      .slice(0,14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function formatarTelefone(valor:string){
    return valor
      .replace(/\D/g,"")
      .slice(0,11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ){
    let valor = e.target.value;

    if(e.target.name === "cnpj"){
      valor = formatarCnpj(valor);
    }

    if(e.target.name === "telefone" || e.target.name === "novoClienteTelefone"){
      valor = formatarTelefone(valor);
    }

    setForm({
      ...form,
      [e.target.name]: valor,
    });
  }

  async function handleSubmit(
    e: React.FormEvent
  ){
    e.preventDefault();

    try{
      setLoading(true);

      // Utiliza a função criarObra do service para tratar o cliente (existente ou novo)
      await criarObra({
        codigo: form.codigo || null,
        cliente_id: form.cliente_id || null,
        novoClienteNome: modoNovoCliente ? form.novoClienteNome : undefined,
        novoClienteTelefone: modoNovoCliente ? form.novoClienteTelefone : undefined,
        razao_social: form.razao_social || null,
        cnpj: form.cnpj || null,
        email: form.email || null,
        telefone: form.telefone || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        numero_proposta: form.numero_proposta || null,
        revisao: form.revisao ? Number(form.revisao) : 0,
        motivo_revisao: form.motivo_revisao || null,
        vendedor: form.vendedor || null,
        data_entrada: form.data_entrada || null,
        data_entrega_esperada: form.data_entrega_esperada || null,
        tipo_proposta: form.tipo_proposta || null,
        tipo_orcamentacao: form.tipo_orcamentacao || null,
        nome_obra: form.nome_obra || "Obra sem nome",
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
        prazo_entrega: form.prazo_entrega || null,
        status: form.status,
        observacoes: form.observacoes || null,
      });

      navigate({
        to:"/obras",
      });

    }catch(error){
      console.error(
        "Erro ao criar obra:",
        error
      );
      alert(
        "Erro ao cadastrar obra"
      );
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Nova Obra
        </h1>
        <p className="text-muted-foreground">
          Cadastro comercial e técnico da obra.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="border rounded-2xl p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Dados Gerais & Cliente
            </h2>
            <button
              type="button"
              onClick={() => {
                setModoNovoCliente(!modoNovoCliente);
                setForm({ ...form, cliente_id: "", novoClienteNome: "", novoClienteTelefone: "" });
              }}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              {modoNovoCliente ? "Selecionar cliente existente" : "+ Cadastrar novo cliente rápido"}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="codigo"
              placeholder="Código da obra"
              value={form.codigo}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />

            <input
              name="nome_obra"
              placeholder="Nome da obra *"
              value={form.nome_obra}
              onChange={handleChange}
              className="border rounded-lg p-3"
              required
            />

            {/* Bloco condicional para Cliente: Select da lista (exibindo apenas o nome) ou Inputs de Cadastro Rápido */}
            {!modoNovoCliente ? (
              <select
                name="cliente_id"
                value={form.cliente_id}
                onChange={handleChange}
                className="border rounded-lg p-3 bg-white"
              >
                <option value="">Selecione um cliente...</option>
                {clientesLista.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.nome}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:col-span-2 bg-gray-50 p-3 rounded-lg border">
                <input
                  name="novoClienteNome"
                  placeholder="Nome do novo cliente *"
                  value={form.novoClienteNome}
                  onChange={handleChange}
                  className="border rounded-lg p-3 bg-white"
                />
                <input
                  name="novoClienteTelefone"
                  placeholder="Telefone do novo cliente"
                  value={form.novoClienteTelefone}
                  onChange={handleChange}
                  maxLength={15}
                  className="border rounded-lg p-3 bg-white"
                />
              </div>
            )}

            <input
              name="razao_social"
              placeholder="Razão social"
              value={form.razao_social}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />

            <input
              name="cnpj"
              placeholder="CNPJ"
              value={form.cnpj}
              onChange={handleChange}
              maxLength={18}
              className="border rounded-lg p-3"
            />

            <input
              name="telefone"
              placeholder="Telefone"
              value={form.telefone}
              onChange={handleChange}
              maxLength={15}
              className="border rounded-lg p-3"
            />

            <input
              name="email"
              placeholder="E-mail"
              value={form.email}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />

            <input
              name="cidade"
              placeholder="Cidade"
              value={form.cidade}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />

            <input
              name="estado"
              placeholder="Estado"
              value={form.estado}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
          </div>
        </div>

        {/* Informações Comerciais */}
        <div className="border rounded-2xl p-6 space-y-5">
          <h2 className="text-xl font-semibold">
            Informações Comerciais
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="numero_proposta"
              placeholder="Nº Proposta"
              value={form.numero_proposta}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="revisao"
              type="number"
              placeholder="Revisão"
              value={form.revisao}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="vendedor"
              placeholder="Vendedor"
              value={form.vendedor}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="data_entrada"
              type="date"
              value={form.data_entrada}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="data_entrega_esperada"
              type="date"
              value={form.data_entrega_esperada}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="tipo_proposta"
              placeholder="Tipo de proposta"
              value={form.tipo_proposta}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="tipo_orcamentacao"
              placeholder="Tipo de orçamentação"
              value={form.tipo_orcamentacao}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
          </div>
          <textarea
            name="motivo_revisao"
            placeholder="Motivo da revisão"
            value={form.motivo_revisao}
            onChange={handleChange}
            className="border rounded-lg p-3 w-full"
          />
        </div>

        {/* Dados Técnicos */}
        <div className="border rounded-2xl p-6 space-y-5">
          <h2 className="text-xl font-semibold">
            Dados Técnicos
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="vazao"
              placeholder="Vazão (m³/dia)"
              type="number"
              value={form.vazao}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="tipo_projeto"
              placeholder="Tipo de projeto"
              value={form.tipo_projeto}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="tipo_efluente"
              placeholder="Tipo de efluente"
              value={form.tipo_efluente}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="complexidade"
              placeholder="Complexidade"
              value={form.complexidade}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
          </div>
        </div>

        {/* Execução */}
        <div className="border rounded-2xl p-6 space-y-5">
          <h2 className="text-xl font-semibold">
            Execução
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="responsavel_engenheiro"
              placeholder="Responsável Eng."
              value={form.responsavel_engenheiro}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="data_inicio"
              type="date"
              value={form.data_inicio}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="data_entrega"
              type="date"
              value={form.data_entrega}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
            <input
              name="situacao_especial"
              placeholder="Situação especial"
              value={form.situacao_especial}
              onChange={handleChange}
              className="border rounded-lg p-3"
            />
          </div>
          <textarea
            name="motivo_atraso"
            placeholder="Motivo de atraso"
            value={form.motivo_atraso}
            onChange={handleChange}
            className="border rounded-lg p-3 w-full"
          />
        </div>

        <textarea
          name="descricao"
          placeholder="Descrição da obra"
          value={form.descricao}
          onChange={handleChange}
          rows={4}
          className="border rounded-lg p-3 w-full"
        />

        <textarea
          name="observacoes"
          placeholder="Observações"
          value={form.observacoes}
          onChange={handleChange}
          rows={4}
          className="border rounded-lg p-3 w-full"
        />

        <button
          disabled={loading}
          className="
            bg-black
            text-white
            px-8
            py-3
            rounded-xl
            cursor-pointer
            hover:bg-gray-800
            transition
          "
        >
          {
            loading
              ? "Salvando..."
              : "Cadastrar Obra"
          }
        </button>
      </form>
    </div>
  );
}