import { supabase } from "@/integrations/supabase/client";
import type { Obra } from "../types";


export async function createObra(
  obra: Partial<Obra>
) {

  const {
    data,
    error,
  } = await supabase
    .from("obras")
    .insert(obra)
    .select()
    .single();


  if(error){
    throw error;
  }


  return data;

}