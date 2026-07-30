import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

import type { Obra } from "@/features/obras/types";


export const Route = createFileRoute(
  "/_authenticated/obras/$id"
)({
  component: ObraDetalhesPage,
});


function ObraDetalhesPage(){

  const { id } = Route.useParams();

  const navigate = useNavigate();

  const [obra,setObra] = useState<Obra | null>(null);
  const [loading,setLoading] = useState(true);


  useEffect(()=>{

    async function carregar(){

      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .eq("id", id)
        .single();


      if(error){

        console.error(error);
        setLoading(false);
        return;

      }


      setObra(data);
      setLoading(false);

    }


    carregar();

  },[id]);



  if(loading){

    return (
      <div className="p-8">
        Carregando obra...
      </div>
    )

  }



  if(!obra){

    return (
      <div className="p-8">
        Obra não encontrada.
      </div>
    )

  }



  return (

    <div className="p-8 space-y-6">


      <button
        onClick={()=>navigate({
          to:"/_authenticated/obras"
        })}
        className="text-sm underline"
      >
        ← Voltar
      </button>



      <div>

        <h1 className="text-3xl font-bold">
          {obra.codigo ?? "Sem código"}
        </h1>

        <p className="text-muted-foreground">
          {obra.cliente}
        </p>

      </div>



      <div className="grid md:grid-cols-2 gap-5">


        <div className="border rounded-xl p-5 space-y-3">

          <h2 className="font-semibold text-lg">
            Dados do Cliente
          </h2>


          <p>
            Razão social: {obra.razao_social ?? "-"}
          </p>

          <p>
            CNPJ: {obra.cnpj ?? "-"}
          </p>

          <p>
            Telefone: {obra.telefone ?? "-"}
          </p>

          <p>
            Local:
            {" "}
            {obra.cidade ?? "-"}
            /
            {obra.estado ?? "-"}
          </p>


        </div>




        <div className="border rounded-xl p-5 space-y-3">


          <h2 className="font-semibold text-lg">
            Dados Técnicos
          </h2>


          <p>
            Vazão:
            {" "}
            {obra.vazao ?? "-"}
          </p>


          <p>
            Tipo projeto:
            {" "}
            {obra.tipo_projeto ?? "-"}
          </p>


          <p>
            Efluente:
            {" "}
            {obra.tipo_efluente ?? "-"}
          </p>


        </div>


      </div>




      <div className="border rounded-xl p-5 space-y-3">


        <h2 className="font-semibold text-lg">
          Status da Obra
        </h2>


        <p>
          {obra.status ?? "-"}
        </p>


        <p>
          Prazo:
          {" "}
          {obra.prazo_entrega
            ? new Date(obra.prazo_entrega)
              .toLocaleDateString("pt-BR")
            : "-"
          }
        </p>


      </div>




      <div className="border rounded-xl p-5">


        <h2 className="font-semibold text-lg mb-2">
          Observações
        </h2>


        <p>
          {obra.observacoes ?? "Nenhuma observação"}
        </p>


      </div>



    </div>

  )

}