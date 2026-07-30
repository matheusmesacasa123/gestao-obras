import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";


import { ObraModuleLayout } from "@/features/obras/components/obra-module-layout";

import { useObra } from "@/features/obras/hooks/use-obra";


import {
  getEquipamentosPorObra,
} from "@/features/obras/equipamentos/services/equipamentos-service";


import {
  EquipamentoForm,
} from "@/features/obras/equipamentos/components/equipamento-form";


import {
  EquipamentoList,
} from "@/features/obras/equipamentos/components/equipamento-list";


import type {
  Equipamento,
} from "@/features/obras/equipamentos/types";





export const Route = createFileRoute(
  "/_authenticated/obras/$id/equipamentos/"
)({
  component: EquipamentosPage,
});







function EquipamentosPage(){



  const { id } = Route.useParams();




  const {

    obra,

    loading: loadingObra,

    error: errorObra,

  } = useObra(id);






  const [

    equipamentos,

    setEquipamentos

  ] = useState<Equipamento[]>([]);






  const [

    loading,

    setLoading

  ] = useState(true);








  async function carregarEquipamentos(){



    try{



      const data =

        await getEquipamentosPorObra(id);



      setEquipamentos(data);




    }catch(error){



      console.error(

        "Erro ao buscar equipamentos:",

        error

      );




    }finally{



      setLoading(false);



    }



  }








  useEffect(()=>{



    carregarEquipamentos();



  },[id]);









  if(

    loading ||

    loadingObra

  ){



    return (

      <div className="p-8">

        Carregando equipamentos...

      </div>

    );



  }









  if(

    errorObra ||

    !obra

  ){



    return (

      <div className="p-8">

        Erro ao carregar obra.

      </div>

    );



  }









  return (

    <ObraModuleLayout obra={obra}>


      <div className="space-y-8">






        <div>


          <h2 className="text-2xl font-bold">

            Equipamentos

          </h2>



          <p className="text-muted-foreground">

            Controle dos equipamentos previstos para a obra.

          </p>



        </div>









        <EquipamentoForm


          obraId={id}


          onSuccess={carregarEquipamentos}


        />









        <EquipamentoList


          equipamentos={equipamentos}


        />







      </div>


    </ObraModuleLayout>

  );



}