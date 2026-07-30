import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  EtapaForm,
} from "@/features/obras/cronograma/components/etapa-form";

import {
  EtapasList,
} from "@/features/obras/cronograma/components/etapas-list";



export const Route = createFileRoute(
  "/_authenticated/obras/$id/cronograma/"
)({

  component: CronogramaPage,

});





function CronogramaPage(){



  const { id } = Route.useParams();



  const [

    atualizar,

    setAtualizar,

  ] = useState(0);






  function atualizarLista(){


    setAtualizar((valor)=>valor + 1);


  }







  return (



    <div className="space-y-6">






      <div>


        <h2 className="text-2xl font-bold">

          Cronograma da Obra

        </h2>



        <p className="text-muted-foreground">

          Planejamento e acompanhamento das etapas da obra.

        </p>


      </div>









      <div

        className="
          border
          rounded-xl
          p-6
          bg-white
        "

      >



        <h3 className="font-semibold mb-4">

          Nova etapa

        </h3>





        <EtapaForm

          obraId={id}

          onSuccess={atualizarLista}

        />



      </div>









      <div

        className="
          border
          rounded-xl
          p-6
          bg-white
        "

      >



        <h3 className="font-semibold mb-4">

          Etapas cadastradas

        </h3>





        <EtapasList

          obraId={id}

          atualizar={atualizar}

        />



      </div>







    </div>



  );


}