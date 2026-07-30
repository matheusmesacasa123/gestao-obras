import { supabase } from "@/integrations/supabase/client";


export async function signIn(
  email:string,
  password:string
) {

  return await supabase.auth.signInWithPassword({
    email,
    password,
  });

}