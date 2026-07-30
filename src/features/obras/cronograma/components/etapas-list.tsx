import {
  useEffect,
  useState,
} from "react";


import {
  getCronogramaPorObra,
  excluirEtapaCronograma,
  atualizarEtapaCronograma,
} from "../services/cronograma-service";



interface EtapasListProps {

  obraId: string;

  atualizar: number;

}





function formatarData(data?: string){

  if(!data) return "-";


  return new Date(data).toLocaleDateString(
    "pt-BR"
  );

}





function calcularDuracao(

  inicio?: string,

  fim?: string

){


  if(!inicio || !fim){

    return null;

  }



  const diferenca =

    new Date(fim).getTime()
    -
    new Date(inicio).getTime();



  return Math.ceil(

    diferenca /
    (1000 * 60 * 60 * 24)

  );


}








export function EtapasList({

  obraId,

  atualizar,

}: EtapasListProps){



  const [etapas,setEtapas] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);



  const [editando,setEditando] = useState<string | null>(null);



  const [form,setForm] = useState<any>({});








  async function carregar(){


    try{


      setLoading(true);



      const data = await getCronogramaPorObra(

        obraId

      );



      setEtapas(data);



    }catch(error){


      console.error(

        "Erro ao carregar etapas:",

        error

      );



    }finally{


      setLoading(false);


    }


  }







  useEffect(()=>{


    carregar();


  },[

    obraId,

    atualizar

  ]);









  function iniciarEdicao(etapa:any){


    setEditando(etapa.id);



    setForm({

      etapa: etapa.etapa,

      descricao: etapa.descricao ?? "",

      responsavel: etapa.responsavel ?? "",

      data_inicio: etapa.data_inicio ?? "",

      data_fim: etapa.data_fim ?? "",

      progresso: etapa.progresso ?? 0,

      status: etapa.status ?? "planejado",

    });


  }









  async function salvarEdicao(id:string){


    try{


      await atualizarEtapaCronograma(

        id,

        form

      );



      setEditando(null);



      carregar();



    }catch(error){


      console.error(error);



      alert(

        "Erro ao atualizar etapa."

      );


    }


  }








  async function excluir(id:string){


    const confirmar = window.confirm(

      "Deseja excluir esta etapa?"

    );



    if(!confirmar) return;



    try{


      await excluirEtapaCronograma(

        id

      );



      carregar();



    }catch(error){


      console.error(error);



      alert(

        "Erro ao excluir etapa."

      );


    }


  }









  if(loading){


    return (

      <div>

        Carregando etapas...

      </div>

    );

  }









  if(etapas.length === 0){


    return (

      <div
        className="
          border
          rounded-xl
          p-5
        "
      >

        Nenhuma etapa cadastrada.

      </div>

    );


  }








  return (

    <div className="space-y-4">


      {
        etapas.map((etapa)=>(


          <div

            key={etapa.id}

            className="
              border
              rounded-xl
              p-5
              space-y-4
            "

          >





            {
              editando === etapa.id ? (


                <>


                  <input

                    value={form.etapa}

                    onChange={(e)=>

                      setForm({

                        ...form,

                        etapa:e.target.value

                      })

                    }

                    className="
                      border
                      rounded-lg
                      px-3
                      py-2
                      w-full
                    "

                  />





                  <textarea

                    value={form.descricao}

                    onChange={(e)=>

                      setForm({

                        ...form,

                        descricao:e.target.value

                      })

                    }

                    className="
                      border
                      rounded-lg
                      px-3
                      py-2
                      w-full
                    "

                  />





                  <input

                    value={form.responsavel}

                    onChange={(e)=>

                      setForm({

                        ...form,

                        responsavel:e.target.value

                      })

                    }

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

                    value={form.progresso}

                    onChange={(e)=>

                      setForm({

                        ...form,

                        progresso:Number(e.target.value)

                      })

                    }

                    className="
                      border
                      rounded-lg
                      px-3
                      py-2
                      w-full
                    "

                  />





                  <select

                    value={form.status}

                    onChange={(e)=>

                      setForm({

                        ...form,

                        status:e.target.value

                      })

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





                  <div className="flex gap-3">


                    <button

                      onClick={()=>salvarEdicao(etapa.id)}

                      className="
                        border
                        rounded-lg
                        px-4
                        py-2
                      "

                    >

                      Salvar

                    </button>




                    <button

                      onClick={()=>setEditando(null)}

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



                </>



              ) : (


                <>



                  <div className="flex justify-between items-start">


                    <h3 className="text-lg font-semibold">

                      {etapa.etapa}

                    </h3>




                    <span

                      className={`
                        text-sm
                        px-3
                        py-1
                        rounded-full

                        ${
                          etapa.status === "concluido"
                          ?
                          "bg-green-100 text-green-700"

                          :

                          etapa.status === "em_andamento"
                          ?
                          "bg-blue-100 text-blue-700"

                          :

                          etapa.status === "atrasado"
                          ?
                          "bg-red-100 text-red-700"

                          :

                          "bg-gray-100 text-gray-700"

                        }

                      `}

                    >

                      {etapa.status?.replace("_"," ")}

                    </span>


                  </div>








                  {
                    etapa.descricao && (

                      <p className="text-muted-foreground">

                        {etapa.descricao}

                      </p>

                    )
                  }








                  <p>

                    Responsável:
                    {" "}

                    {etapa.responsavel || "-"}

                  </p>









                  <div className="text-sm text-muted-foreground space-y-1">


                    <p>

                      Início:
                      {" "}

                      {formatarData(etapa.data_inicio)}

                    </p>



                    <p>

                      Fim:
                      {" "}

                      {formatarData(etapa.data_fim)}

                    </p>





                    {
                      calcularDuracao(

                        etapa.data_inicio,

                        etapa.data_fim

                      ) && (

                        <p>

                          Duração:
                          {" "}

                          {
                            calcularDuracao(

                              etapa.data_inicio,

                              etapa.data_fim

                            )
                          }

                          {" "}

                          dias

                        </p>


                      )

                    }


                  </div>









                  <div>


                    <div className="flex justify-between text-sm mb-1">


                      <span>

                        Progresso

                      </span>



                      <span>

                        {etapa.progresso}%

                      </span>



                    </div>





                    <div

                      className="
                        h-3
                        bg-muted
                        rounded-full
                        overflow-hidden
                      "

                    >


                      <div

                        className="
                          h-full
                          bg-black
                          transition-all
                        "

                        style={{

                          width:`${etapa.progresso}%`

                        }}

                      />


                    </div>


                  </div>








                  <div className="flex gap-3 pt-3">


                    <button

                      onClick={()=>iniciarEdicao(etapa)}

                      className="
                        border
                        rounded-lg
                        px-3
                        py-1
                      "

                    >

                      Editar

                    </button>





                    <button

                      onClick={()=>excluir(etapa.id)}

                      className="
                        border
                        rounded-lg
                        px-3
                        py-1
                      "

                    >

                      Excluir

                    </button>


                  </div>




                </>


              )

            }



          </div>


        ))

      }


    </div>


  );


}