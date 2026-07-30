import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useState,
} from "react";

import { createObra } from "@/features/obras/services/create-obra";


export const Route = createFileRoute(
  "/_authenticated/obras/nova"
)({
  component: NovaObraPage,
});


function NovaObraPage(){

  const navigate = useNavigate();


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
    observacoes:"",

  });


  const [loading,setLoading] = useState(false);


  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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


      await createObra({

        ...form,

        vazao: form.vazao
          ? Number(form.vazao)
          : null,

        prazo_entrega:
          form.prazo_entrega || null,

      });


      navigate({
        to:"/obras",
      });


    } catch(error){

      console.error(error);
      alert("Erro ao criar obra");

    } finally {

      setLoading(false);

    }

  }



  return (

    <div className="p-8 max-w-3xl">

      <h1 className="text-3xl font-bold mb-6">
        Nova Obra
      </h1>


      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >


        {
          Object.keys(form)
          .filter(
            key=>key !== "observacoes"
          )
          .map(field=>(

            <input

              key={field}

              name={field}

              value={(form as any)[field]}

              onChange={handleChange}

              placeholder={
                field.replace("_"," ")
              }

              className="
              w-full
              border
              rounded
              px-3
              py-2
              "

            />

          ))
        }


        <textarea

          name="observacoes"

          value={form.observacoes}

          onChange={handleChange}

          placeholder="Observações"

          className="
          w-full
          border
          rounded
          px-3
          py-2
          "

        />


        <button

          disabled={loading}

          className="
          bg-black
          text-white
          px-5
          py-2
          rounded
          "

        >

          {
            loading
            ? "Salvando..."
            : "Criar Obra"
          }

        </button>


      </form>


    </div>

  );

}