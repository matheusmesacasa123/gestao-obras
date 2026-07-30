import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useState,
} from "react";

import {
  supabase,
} from "@/integrations/supabase/client";


export const Route = createFileRoute(
  "/_authenticated/obras/nova"
)({
  component: NovaObraPage,
});


function NovaObraPage(){

  const navigate = useNavigate();


  const [loading,setLoading] = useState(false);


  const [form,setForm] = useState({

    codigo:"",
    cliente:"",
    razao_social:"",
    cnpj:"",
    email:"",
    telefone:"",
    cidade:"",
    estado:"",
    vazao:"",
    tipo_projeto:"",
    tipo_efluente:"",
    prazo_entrega:"",
    status:"recebida",
    observacoes:"",

  });



  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ){

    setForm({

      ...form,

      [e.target.name]: e.target.value,

    });

  }



  async function handleSubmit(
    e: React.FormEvent
  ){

    e.preventDefault();


    try {

      setLoading(true);


      const {
        error
      } = await supabase
        .from("obras")
        .insert({

          codigo: form.codigo || null,

          cliente: form.cliente,

          razao_social:
            form.razao_social || null,

          cnpj:
            form.cnpj || null,

          email:
            form.email || null,

          telefone:
            form.telefone || null,

          cidade:
            form.cidade || null,

          estado:
            form.estado || null,

          vazao:
            form.vazao
              ? Number(form.vazao)
              : null,

          tipo_projeto:
            form.tipo_projeto || null,

          tipo_efluente:
            form.tipo_efluente || null,

          prazo_entrega:
            form.prazo_entrega || null,

          status:
            form.status,

          observacoes:
            form.observacoes || null,

        });



      if(error){

        throw error;

      }



      navigate({
        to:"/obras",
      });



    } catch(error){

      console.error(
        "Erro ao criar obra:",
        error
      );

      alert(
        "Erro ao cadastrar obra"
      );


    } finally {

      setLoading(false);

    }

  }



  return (

    <div className="p-8 max-w-4xl">


      <h1 className="text-3xl font-bold mb-6">
        Nova Obra
      </h1>



      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >


        <div className="grid md:grid-cols-2 gap-4">


          <input
            name="codigo"
            placeholder="Código da obra"
            value={form.codigo}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="cliente"
            placeholder="Cliente *"
            value={form.cliente}
            onChange={handleChange}
            required
            className="border rounded-md p-2"
          />


          <input
            name="razao_social"
            placeholder="Razão social"
            value={form.razao_social}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="cnpj"
            placeholder="CNPJ"
            value={form.cnpj}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="email"
            placeholder="E-mail"
            value={form.email}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="telefone"
            placeholder="Telefone"
            value={form.telefone}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="cidade"
            placeholder="Cidade"
            value={form.cidade}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="estado"
            placeholder="Estado"
            value={form.estado}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="vazao"
            placeholder="Vazão (m³/dia)"
            type="number"
            value={form.vazao}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="tipo_projeto"
            placeholder="Tipo de projeto"
            value={form.tipo_projeto}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="tipo_efluente"
            placeholder="Tipo de efluente"
            value={form.tipo_efluente}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


          <input
            name="prazo_entrega"
            type="date"
            value={form.prazo_entrega}
            onChange={handleChange}
            className="border rounded-md p-2"
          />


        </div>



        <select

          name="status"

          value={form.status}

          onChange={handleChange}

          className="border rounded-md p-2 w-full"

        >

          <option value="recebida">
            Recebida
          </option>

          <option value="em_analise">
            Em análise
          </option>

          <option value="em_desenvolvimento">
            Em desenvolvimento
          </option>

          <option value="aguardando_cliente">
            Aguardando cliente
          </option>

          <option value="concluida">
            Concluída
          </option>

        </select>



        <textarea

          name="observacoes"

          placeholder="Observações"

          value={form.observacoes}

          onChange={handleChange}

          rows={5}

          className="border rounded-md p-2 w-full"

        />



        <button

          disabled={loading}

          className="
            bg-black
            text-white
            px-6
            py-2
            rounded-md
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