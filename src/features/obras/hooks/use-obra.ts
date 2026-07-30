import { useEffect, useState } from "react";

import { getObraById } from "../services/obras-service";

import type { Obra } from "../types";


export function useObra(id: string) {


  const [obra, setObra] = useState<Obra | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);



  useEffect(() => {


    async function carregar() {


      try {


        const data = await getObraById(id);

        setObra(data);



      } catch (err) {


        console.error(
          "Erro ao buscar obra:",
          err
        );

        setError(true);



      } finally {


        setLoading(false);


      }


    }



    carregar();



  }, [id]);



  return {

    obra,

    loading,

    error,

  };


}