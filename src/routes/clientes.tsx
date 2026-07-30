import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/clientes")({

  component: Clientes,

});


function Clientes(){

  return (

    <div>

      <h1 className="text-3xl font-bold">
        Clientes
      </h1>


    </div>

  );

}