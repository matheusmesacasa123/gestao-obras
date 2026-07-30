import type { Equipamento } from "../types";



interface EquipamentoListProps {

  equipamentos: Equipamento[];

}




export function EquipamentoList({

  equipamentos,

}: EquipamentoListProps){



  if(equipamentos.length === 0){

    return (

      <div
        className="
          border
          rounded-xl
          p-8
          text-center
        "
      >

        <h2 className="font-semibold text-lg">

          Nenhum equipamento cadastrado

        </h2>


        <p className="text-muted-foreground mt-2">

          Adicione os equipamentos desta obra.

        </p>


      </div>

    );

  }





  return (

    <div className="grid md:grid-cols-2 gap-5">


      {
        equipamentos.map((equipamento)=>(


          <div

            key={equipamento.id}

            className="
              border
              rounded-xl
              p-5
              space-y-3
            "

          >


            <h3 className="font-semibold text-lg">

              {equipamento.nome}

            </h3>



            <p>

              Quantidade:
              {" "}
              {equipamento.quantidade}

            </p>




            <p>

              Fabricante:
              {" "}
              {equipamento.fabricante ?? "-"}

            </p>




            <p>

              Modelo:
              {" "}
              {equipamento.modelo ?? "-"}

            </p>




            <p>

              Status:
              {" "}
              {equipamento.status ?? "-"}

            </p>




            {
              equipamento.observacoes && (

                <p className="text-sm text-muted-foreground">

                  {equipamento.observacoes}

                </p>

              )
            }



          </div>


        ))
      }


    </div>

  );


}