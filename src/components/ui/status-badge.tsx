interface StatusBadgeProps {

  status?: string | null;

}



export function StatusBadge({

  status,

}: StatusBadgeProps) {



  function configurarStatus(){


    const valor = status?.toLowerCase() ?? "";



    if(

      valor.includes("andamento")

    ){

      return {

        texto:"Em andamento",

        classe:
          "bg-green-100 text-green-700"

      };

    }





    if(

      valor.includes("planejamento") ||

      valor.includes("planejado")

    ){

      return {

        texto:"Planejamento",

        classe:
          "bg-yellow-100 text-yellow-700"

      };

    }







    if(

      valor.includes("atras")

    ){

      return {

        texto:"Atrasada",

        classe:
          "bg-red-100 text-red-700"

      };

    }







    if(

      valor.includes("concl")

    ){

      return {

        texto:"Concluída",

        classe:
          "bg-blue-100 text-blue-700"

      };

    }







    if(

      valor.includes("receb")

    ){

      return {

        texto:"Recebida",

        classe:
          "bg-purple-100 text-purple-700"

      };

    }







    return {

      texto: status ?? "Sem status",

      classe:
        "bg-gray-100 text-gray-700"

    };


  }






  const configuracao = configurarStatus();






  return (


    <span

      className={`
        inline-flex
        items-center
        px-3
        py-1
        rounded-full
        text-xs
        font-medium
        ${configuracao.classe}
      `}

    >

      {configuracao.texto}


    </span>


  );


}