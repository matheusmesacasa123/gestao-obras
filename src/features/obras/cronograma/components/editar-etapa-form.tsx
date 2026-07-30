import {
  useState,
} from "react";

import {
  atualizarEtapaCronograma,
} from "../services/cronograma-service";

import type {
  CronogramaEtapa,
} from "../types";



interface EditarEtapaFormProps {

  etapaAtual: CronogramaEtapa;

  onSuccess: () => void;

  onCancel: () => void;

}





export function EditarEtapaForm({

  etapaAtual,

  onSuccess,

  onCancel,

}: EditarEtapaFormProps){



  const [etapa,setEtapa] = useState(
    etapaAtual.etapa
  );


  const [descricao,setDescricao] = useState(
    etapaAtual.descricao ?? ""
  );


  const [responsavel,setResponsavel] = useState(
    etapaAtual.responsavel ?? ""
  );


  const [dataInicio,setDataInicio] = useState(
    etapaAtual.data_inicio ?? ""
  );


  const [dataFim,setDataFim] = useState(
    etapaAtual.data_fim ?? ""
  );


  const [progresso,setProgresso] = useState(
    etapaAtual.progresso ?? 0
  );


  const [status,setStatus] = useState(
    etapaAtual.status ?? "planejado"
  );


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



      await atualizarEtapaCronograma(

        etapaAtual.id,

        {

          etapa,

          descricao,

          responsavel,

          data_inicio:
            dataInicio || undefined,

          data_fim:
            dataFim || undefined,

          progresso,

          status,

        }

      );




      onSuccess();




    }catch(error){


      console.error(

        "Erro ao editar etapa:",

        error

      );


      alert(
        "Erro ao editar etapa."
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
        bg-muted/20
      "
    >



      <h3 className="font-semibold">

        Editar etapa

      </h3>





      <input

        value={etapa}

        onChange={(e)=>
          setEtapa(e.target.value)
        }

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

        placeholder="Nome da etapa"

      />





      <textarea

        value={descricao}

        onChange={(e)=>
          setDescricao(e.target.value)
        }

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

        placeholder="Descrição"

      />







      <input

        value={responsavel}

        onChange={(e)=>
          setResponsavel(e.target.value)
        }

        className="
          border
          rounded-lg
          px-3
          py-2
          w-full
        "

        placeholder="Responsável"

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








      <div className="
        flex
        gap-3
      ">


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
            "Salvar"
          }


        </button>





        <button

          onClick={onCancel}

          className="
            border
            rounded-lg
            px-4
            py-2
          "

        >

          Cancelar

        </button>



      </div>



    </div>


  );


}