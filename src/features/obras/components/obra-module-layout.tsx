import { ReactNode } from "react";

import {
  Link,
  useRouterState,
} from "@tanstack/react-router";

import type { Obra } from "../types";

import { StatusBadge } from "@/components/ui/status-badge";




interface ObraModuleLayoutProps {

  obra: Obra;

  children: ReactNode;

}





export function ObraModuleLayout({

  obra,

  children,

}: ObraModuleLayoutProps) {



  const pathname = useRouterState({

    select:(state)=>
      state.location.pathname,

  });







  const abas = [


    {

      nome:"Informações",

      rota:"/obras/$id",

    },



    {

      nome:"Demandas",

      rota:"/obras/$id/demandas",

    },



    {

      nome:"Documentos",

      rota:"/obras/$id/documentos",

    },



    {

      nome:"Equipamentos",

      rota:"/obras/$id/equipamentos",

    },



    {

      nome:"Cronograma",

      rota:"/obras/$id/cronograma",

    },



    {

      nome:"Financeiro",

      rota:"/obras/$id/financeiro",

    },



    {

      nome:"Histórico",

      rota:"/obras/$id/historico",

    },


  ];









  return (


    <div className="p-8 space-y-6">







      <Link


        to="/obras"


        className="
          text-sm
          text-muted-foreground
          hover:text-black
          cursor-pointer
        "


      >

        ← Voltar para Obras


      </Link>









      <div


        className="
          border
          rounded-2xl
          p-6
          bg-white
          shadow-sm
        "


      >





        <div className="flex justify-between items-start gap-4">






          <div>



            <p className="text-sm text-muted-foreground">

              Código da obra

            </p>





            <h1 className="text-3xl font-bold">

              {obra.codigo ?? "Sem código"}

            </h1>






            <p className="text-muted-foreground mt-1">

              {obra.cliente ?? "-"}

            </p>





            <p className="text-sm text-muted-foreground mt-2">


              {obra.cidade ?? "-"}

              /

              {obra.estado ?? "-"}


            </p>




          </div>








          <StatusBadge

            status={obra.status}

          />





        </div>






      </div>












      <div


        className="
          border
          rounded-xl
          p-2
          bg-white
          shadow-sm
          flex
          flex-wrap
          gap-2
        "


      >





        {

          abas.map((aba)=>{



            const caminho =

              aba.rota.replace(

                "$id",

                obra.id

              );







            const ativa =

              pathname === caminho ||

              pathname.startsWith(

                caminho + "/"

              );







            return (



              <Link



                key={aba.nome}



                to={aba.rota}



                params={{

                  id:obra.id,

                }}



                className={`

                  px-4

                  py-2

                  rounded-lg

                  text-sm

                  transition

                  cursor-pointer


                  ${

                    ativa

                    ?

                    "bg-black text-white"

                    :

                    "hover:bg-muted"

                  }


                `}



              >


                {aba.nome}



              </Link>



            );



          })


        }






      </div>









      {children}





    </div>


  );


}