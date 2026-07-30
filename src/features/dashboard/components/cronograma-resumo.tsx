interface Props {

  atrasadas:number;

  andamento:number;

  proximas:any[];

}




export function CronogramaResumo({

  atrasadas,

  andamento,

  proximas,

}:Props){



  return (


    <div

      className="
        bg-white
        border
        rounded-2xl
        p-6
        shadow-sm
      "

    >




      <div className="flex items-center justify-between mb-5">


        <h2 className="font-semibold text-lg">

          Cronograma

        </h2>



        <span

          className="
            text-xs
            bg-muted
            px-3
            py-1
            rounded-full
          "

        >

          Acompanhamento

        </span>



      </div>








      <div

        className="
          grid
          md:grid-cols-2
          gap-4
          mb-6
        "

      >




        <div

          className="
            border
            rounded-xl
            p-4
            hover:shadow-sm
            transition
          "

        >


          <p className="text-sm text-muted-foreground">

            Etapas atrasadas

          </p>



          <div className="flex items-center justify-between mt-2">


            <p className="text-3xl font-bold text-red-600">

              {atrasadas}

            </p>


            <span

              className="
                text-xs
                bg-red-100
                text-red-700
                px-3
                py-1
                rounded-full
              "

            >

              Atenção

            </span>


          </div>


        </div>







        <div

          className="
            border
            rounded-xl
            p-4
            hover:shadow-sm
            transition
          "

        >



          <p className="text-sm text-muted-foreground">

            Em andamento

          </p>




          <div className="flex items-center justify-between mt-2">


            <p className="text-3xl font-bold text-blue-600">

              {andamento}

            </p>



            <span

              className="
                text-xs
                bg-blue-100
                text-blue-700
                px-3
                py-1
                rounded-full
              "

            >

              Execução

            </span>



          </div>



        </div>




      </div>








      <h3 className="font-semibold mb-3">

        Próximas entregas

      </h3>







      {
        proximas.length === 0 ? (


          <div

            className="
              border
              rounded-xl
              p-4
              text-muted-foreground
            "

          >

            Nenhuma entrega próxima.

          </div>



        ) : (


          <div className="space-y-3">


            {
              proximas.map((item)=>(


                <div

                  key={item.id}

                  className="
                    border
                    rounded-xl
                    p-4
                    hover:bg-muted/50
                    transition
                  "

                >



                  <div className="flex justify-between gap-3">


                    <p className="font-medium">

                      {item.etapa}

                    </p>



                    {
                      item.status && (

                        <span

                          className="
                            text-xs
                            bg-muted
                            px-2
                            py-1
                            rounded-full
                          "

                        >

                          {item.status}

                        </span>

                      )
                    }



                  </div>





                  <p className="text-sm text-muted-foreground mt-2">

                    Entrega:

                    {" "}

                    {item.data_fim ?? "-"}

                  </p>



                </div>


              ))

            }


          </div>


        )
      }




    </div>


  );


}