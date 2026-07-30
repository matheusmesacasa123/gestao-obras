import { supabase } from "@/integrations/supabase/client";

import type { Equipamento } from "../types";



export async function getEquipamentosPorObra(

  obraId: string

): Promise<Equipamento[]> {



  const { data, error } = await supabase

    .from("equipamentos")

    .select("*")

    .eq("obra_id", obraId)

    .order("created_at", {

      ascending: false,

    });





  if(error){


    console.error(

      "Erro detalhado ao buscar equipamentos:",

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









export async function criarEquipamento(

  equipamento: {

    obra_id: string;

    nome: string;

    fabricante?: string;

    modelo?: string;

    quantidade?: number;

    status?: string;

    observacoes?: string;

  }

) {



  const { data, error } = await supabase

    .from("equipamentos")

    .insert({

      obra_id: equipamento.obra_id,

      nome: equipamento.nome,

      fabricante: equipamento.fabricante ?? null,

      modelo: equipamento.modelo ?? null,

      quantidade: equipamento.quantidade ?? 1,

      status: equipamento.status ?? null,

      observacoes: equipamento.observacoes ?? null,

    })

    .select()

    .single();






  if(error){



    console.error(

      "Erro detalhado ao criar equipamento:",

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