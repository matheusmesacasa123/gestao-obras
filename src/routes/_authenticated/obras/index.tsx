import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import {
  getObras,
} from "@/features/obras/services/obras-service";

import type {
  Obra,
} from "@/features/obras/types";

import {
  ObraCard,
} from "@/features/obras/components/obra-card";


export const Route = createFileRoute(
  "/_authenticated/obras/"
)({
  component: ObrasPage,
});


function ObrasPage(){

  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);



  useEffect(()=>{

    async function load(){

      try {

        const data = await getObras();

        setObras(data);


      } catch(error){

        console.error(
          "Erro ao buscar obras:",
          error
        );

        setError(true);


      } finally {

        setLoading(false);

      }

    }


    load();

  },[]);



  if(loading){

    return (

      <div className="p-8">

        Carregando obras...

      </div>

    );

  }



  if(error){

    return (

      <div className="p-8">

        <h1 className="text-xl font-bold">
          Erro ao carregar obras
        </h1>

        <p className="text-muted-foreground mt-2">
          Não foi possível buscar as obras.
        </p>

      </div>

    );

  }



  return (

    <div className="p-8 space-y-6">


      <div className="flex items-center justify-between">


        <div>

          <h1 className="text-3xl font-bold">
            Gestão de Obras
          </h1>

          <p className="text-muted-foreground">
            Controle dos projetos em andamento.
          </p>

        </div>



        <Link

          to="/obras/nova"

          className="
            bg-black
            text-white
            px-4
            py-2
            rounded-md
            hover:opacity-90
          "

        >

          Nova Obra

        </Link>


      </div>




      {
        obras.length === 0 ? (

          <div
            className="
              border
              rounded-lg
              p-8
              text-center
            "
          >

            Nenhuma obra cadastrada.

          </div>


        ) : (


          <div
            className="
              grid
              gap-4
              md:grid-cols-3
            "
          >

            {
              obras.map((obra)=>(

                <ObraCard

                  key={obra.id}

                  obra={obra}

                />

              ))
            }


          </div>


        )
      }


    </div>

  );

}