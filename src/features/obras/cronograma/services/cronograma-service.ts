import { supabase } from "@/integrations/supabase/client";

import type {
  CronogramaEtapa,
} from "../types";





export async function getCronogramaPorObra(

  obraId: string

): Promise<CronogramaEtapa[]> {



  const { data, error } = await supabase

    .from("cronogramas")

    .select("*")

    .eq("obra_id", obraId)

    .order("created_at", {

      ascending: true,

    });






  if(error){


    console.error(

      "Erro ao buscar cronograma:",

      {

        message: error.message,

        details: error.details,

        hint: error.hint,

        code: error.code,

      }

    );


    throw error;


  }






  return data ?? [];

}









export async function criarEtapaCronograma(

  etapa: {

    obra_id: string;

    etapa: string;

    descricao?: string;

    responsavel?: string;

    data_inicio?: string;

    data_fim?: string;

    progresso?: number;

    status?: string;

  }

){





  const { data, error } = await supabase

    .from("cronogramas")

    .insert({


      obra_id: etapa.obra_id,


      etapa: etapa.etapa,


      descricao:
        etapa.descricao ?? null,


      responsavel:
        etapa.responsavel ?? null,


      data_inicio:
        etapa.data_inicio ?? null,


      data_fim:
        etapa.data_fim ?? null,


      progresso:
        etapa.progresso ?? 0,


      status:
        etapa.status ?? "planejado",


    })

    .select()

    .single();








  if(error){



    console.error(

      "Erro ao criar etapa:",

      {

        message: error.message,

        details: error.details,

        hint: error.hint,

        code: error.code,

      }

    );



    throw error;


  }







  return data;


}









export async function atualizarEtapaCronograma(

  id: string,

  etapa: {

    etapa?: string;

    descricao?: string;

    responsavel?: string;

    data_inicio?: string;

    data_fim?: string;

    progresso?: number;

    status?: string;

  }

){





  const { data, error } = await supabase

    .from("cronogramas")

    .update({


      ...(etapa.etapa !== undefined && {

        etapa: etapa.etapa,

      }),



      ...(etapa.descricao !== undefined && {

        descricao: etapa.descricao,

      }),



      ...(etapa.responsavel !== undefined && {

        responsavel: etapa.responsavel,

      }),



      ...(etapa.data_inicio !== undefined && {

        data_inicio: etapa.data_inicio,

      }),



      ...(etapa.data_fim !== undefined && {

        data_fim: etapa.data_fim,

      }),



      ...(etapa.progresso !== undefined && {

        progresso: etapa.progresso,

      }),



      ...(etapa.status !== undefined && {

        status: etapa.status,

      }),



    })

    .eq("id", id)

    .select()

    .single();








  if(error){



    console.error(

      "Erro ao atualizar etapa:",

      {

        message: error.message,

        details: error.details,

        hint: error.hint,

        code: error.code,

      }

    );


    throw error;


  }







  return data;


}









export async function excluirEtapaCronograma(

  id: string

){





  const { error } = await supabase

    .from("cronogramas")

    .delete()

    .eq("id", id);








  if(error){



    console.error(

      "Erro ao excluir etapa:",

      {

        message: error.message,

        details: error.details,

        hint: error.hint,

        code: error.code,

      }

    );



    throw error;


  }


}