import { useState } from "react";

import {
  criarEtapaCronograma,
} from "../services/cronograma-service";



interface EtapaFormProps {

  obraId: string;

  onSuccess: () => void;

}




export function EtapaForm({

  obraId,

  onSuccess,

}: EtapaFormProps){



  const [etapa,setEtapa] = useState("");

  const [descricao,setDescricao] = useState("");

  const [responsavel,setResponsavel] = useState("");

  const [dataInicio,setDataInicio] = useState("");

  const [dataFim,setDataFim] = useState("");

  const [progresso,setProgresso] = useState(0);

  const [status,setStatus] = useState("planejado");



  const [loading,setLoading] = useState(false);







  async function salvar(){



    if(!etapa){


      alert(
        "Informe o nome da etapa."
      );


      return;


    }





    try{



      setLoading(true);




      await criarEtapaCronograma({

        obra_id: obraId,

        etapa,

        descricao,

        responsavel,

        data_inicio: dataInicio || undefined,

        data_fim: dataFim || undefined,

        progresso,

        status,

      });





      setEtapa("");

      setDescricao("");

      setResponsavel("");

      setDataInicio("");

      setDataFim("");

      setProgresso(0);

      setStatus("planejado");




      onSuccess();




    }catch(error){



      console.error(

        "Erro ao salvar etapa:",

        error

      );



      alert(
        "Erro ao salvar etapa."
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

        Nova Etapa

      </h3>







      <input

        value={etapa}

        onChange={(e)=>
          setEtapa(e.target.value)
        }

        placeholder="Nome da etapa"

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

      />







      <textarea

        value={descricao}

        onChange={(e)=>
          setDescricao(e.target.value)
        }

        placeholder="Descrição"

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

      />







      <input

        value={responsavel}

        onChange={(e)=>
          setResponsavel(e.target.value)
        }

        placeholder="Responsável"

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

      />







      <div className="
        grid
        md:grid-cols-2
        gap-4
      ">



        <div>


          <label className="text-sm">

            Data início

          </label>


          <input

            type="date"

            value={dataInicio}

            onChange={(e)=>
              setDataInicio(e.target.value)
            }

            className="
              border
              rounded-lg
              px-3
              py-2
              w-full
            "

          />


        </div>







        <div>


          <label className="text-sm">

            Data fim

          </label>


          <input

            type="date"

            value={dataFim}

            onChange={(e)=>
              setDataFim(e.target.value)
            }

            className="
              border
              rounded-lg
              px-3
              py-2
              w-full
            "

          />


        </div>



      </div>









      <div>


        <label className="text-sm">

          Progresso (%)

        </label>


        <input

          type="number"

          min={0}

          max={100}

          value={progresso}

          onChange={(e)=>
            setProgresso(
              Number(e.target.value)
            )
          }

          className="
            border
            rounded-lg
            px-3
            py-2
            w-full
          "

        />


      </div>









      <div>


        <label className="text-sm">

          Status

        </label>


        <select

          value={status}

          onChange={(e)=>
            setStatus(e.target.value)
          }

          className="
            border
            rounded-lg
            px-3
            py-2
            w-full
          "

        >

          <option value="planejado">
            Planejado
          </option>


          <option value="em_andamento">
            Em andamento
          </option>


          <option value="concluido">
            Concluído
          </option>


          <option value="atrasado">
            Atrasado
          </option>


        </select>


      </div>









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
          "Salvar etapa"
        }


      </button>




    </div>

  );


}