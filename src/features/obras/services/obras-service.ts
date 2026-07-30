import { supabase } from "@/integrations/supabase/client";
import type { Obra } from "../types";


export async function getObras(): Promise<Obra[]> {

  const { data, error } = await supabase
    .from("obras")
    .select("*")
    .order("created_at", {
      ascending: false,
    });


  if (error) {

    console.error("Erro Supabase obras:", error);

    throw error;

  }


  console.log("Obras buscadas:", data);

  return data ?? [];

}