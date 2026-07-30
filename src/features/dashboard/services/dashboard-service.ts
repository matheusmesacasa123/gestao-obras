import { supabase } from "@/integrations/supabase/client";



export async function getResumoCronograma(){


  const hoje = new Date()
    .toISOString()
    .split("T")[0];




  const { data, error } = await supabase

    .from("cronogramas")

    .select("*")

    .order("data_fim", {

      ascending:true,

    });





  if(error){


    console.error(

      "Erro ao buscar cronograma dashboard:",

      error

    );


    throw error;


  }





  const etapas = data ?? [];





  const atrasadas = etapas.filter((etapa)=>

    etapa.data_fim &&

    etapa.data_fim < hoje &&

    etapa.status !== "concluido"

  );






  const proximas = etapas.filter((etapa)=>

    etapa.data_fim &&

    etapa.data_fim >= hoje &&

    etapa.status !== "concluido"

  ).slice(0,5);






  const andamento = etapas.filter((etapa)=>

    etapa.status === "em_andamento"

  ).length;






  return {

    atrasadas,

    proximas,

    andamento,

  };


}