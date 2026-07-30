import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute(
  "/_authenticated/obras/$id/demandas/nova"
)({
  component: NovaDemandaPage,
});



function NovaDemandaPage(){


  const { id } = Route.useParams();

  const navigate = useNavigate();



  const [titulo,setTitulo] = useState("");

  const [descricao,setDescricao] = useState("");

  const [prioridade,setPrioridade] = useState<
    "baixa" | "media" | "alta"
  >("media");

  const [prazo,setPrazo] = useState("");

  const [loading,setLoading] = useState(false);





  async function criarDemanda(){


    if(!titulo){

      alert("Informe o título da demanda");

      return;

    }



    try{


      setLoading(true);



      const { error } = await supabase
        .from("demandas")
        .insert({

          obra_id: id,

          titulo: titulo,

          descricao: descricao || null,

          prioridade: prioridade,

          prazo: prazo || null,

        });





      if(error){


        console.error(
          "ERRO SUPABASE:",
          error
        );


        alert(error.message);


        return;


      }





      navigate({

        to:"/obras/$id/demandas",

        params:{
          id,
        },

      });



    }catch(error){


      console.error(
        "ERRO GERAL:",
        error
      );


    }finally{


      setLoading(false);


    }


  }








  return (

    <div className="p-8 space-y-8">



      <button

        onClick={()=>navigate({

          to:"/obras/$id/demandas",

          params:{
            id,
          },

        })}

        className="text-sm underline"

      >

        ← Voltar para demandas

      </button>






      <div>


        <h1 className="text-3xl font-bold">

          Nova Demanda

        </h1>


        <p className="text-muted-foreground">

          Cadastre uma nova atividade para esta obra.

        </p>


      </div>








      <div className="
        border
        rounded-xl
        p-6
        space-y-5
        max-w-2xl
      ">





        <div className="space-y-2">


          <label className="font-medium">

            Título

          </label>


          <input

            value={titulo}

            onChange={(e)=>setTitulo(e.target.value)}

            className="
              w-full
              border
              rounded-lg
              px-3
              py-2
            "

            placeholder="Ex: Projeto hidráulico"

          />


        </div>







        <div className="space-y-2">


          <label className="font-medium">

            Descrição

          </label>


          <textarea

            value={descricao}

            onChange={(e)=>setDescricao(e.target.value)}

            className="
              w-full
              border
              rounded-lg
              px-3
              py-2
              min-h-32
            "

          />

        </div>








        <div className="space-y-2">


          <label className="font-medium">

            Prioridade

          </label>


          <select

            value={prioridade}

            onChange={(e)=>
              setPrioridade(
                e.target.value as
                "baixa" | "media" | "alta"
              )
            }

            className="
              w-full
              border
              rounded-lg
              px-3
              py-2
            "

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


          <label className="font-medium">

            Prazo

          </label>


          <input

            type="date"

            value={prazo}

            onChange={(e)=>setPrazo(e.target.value)}

            className="
              w-full
              border
              rounded-lg
              px-3
              py-2
            "

          />


        </div>








        <button

          disabled={loading}

          onClick={criarDemanda}

          className="
            border
            rounded-lg
            px-5
            py-2
            hover:bg-muted
          "

        >

          {
            loading
            ? "Salvando..."
            : "Criar Demanda"
          }


        </button>





      </div>



    </div>

  );

}