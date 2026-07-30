import { useState } from "react";

import {
  criarEquipamento,
} from "../services/equipamentos-service";



interface EquipamentoFormProps {

  obraId: string;

  onSuccess: () => void;

}




export function EquipamentoForm({

  obraId,

  onSuccess,

}: EquipamentoFormProps){



  const [nome,setNome] =
    useState("");



  const [fabricante,setFabricante] =
    useState("");



  const [modelo,setModelo] =
    useState("");



  const [quantidade,setQuantidade] =
    useState(1);



  const [status,setStatus] =
    useState("");



  const [observacoes,setObservacoes] =
    useState("");



  const [loading,setLoading] =
    useState(false);







  async function salvar(){



    if(!nome){

      alert(
        "Informe o nome do equipamento."
      );

      return;

    }






    try{


      setLoading(true);



      await criarEquipamento({

        obra_id: obraId,

        nome,

        fabricante,

        modelo,

        quantidade,

        status,

        observacoes,

      });





      setNome("");

      setFabricante("");

      setModelo("");

      setQuantidade(1);

      setStatus("");

      setObservacoes("");



      onSuccess();





    }catch(error){


      console.error(
        "Erro ao salvar equipamento:",
        error
      );


      alert(
        "Erro ao salvar equipamento."
      );



    }finally{


      setLoading(false);


    }


  }







  return (

    <div
      className="
        border
        rounded-xl
        p-5
        space-y-4
      "
    >



      <h3 className="font-semibold">

        Novo Equipamento

      </h3>





      <input

        value={nome}

        onChange={(e)=>
          setNome(e.target.value)
        }

        placeholder="Nome do equipamento"

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

      />






      <input

        value={fabricante}

        onChange={(e)=>
          setFabricante(e.target.value)
        }

        placeholder="Fabricante"

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

      />







      <input

        value={modelo}

        onChange={(e)=>
          setModelo(e.target.value)
        }

        placeholder="Modelo"

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

      />







      <input

        type="number"

        value={quantidade}

        onChange={(e)=>
          setQuantidade(
            Number(e.target.value)
          )
        }

        min={1}

        placeholder="Quantidade"

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

      />







      <input

        value={status}

        onChange={(e)=>
          setStatus(e.target.value)
        }

        placeholder="Status"

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

      />







      <textarea

        value={observacoes}

        onChange={(e)=>
          setObservacoes(e.target.value)
        }

        placeholder="Observações"

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

      />







      <button

        onClick={salvar}

        disabled={loading}

        className="
          border
          rounded-lg
          px-4
          py-2
          hover:bg-muted
        "

      >

        {
          loading
          ?
          "Salvando..."
          :
          "Salvar equipamento"
        }


      </button>



    </div>

  );


}