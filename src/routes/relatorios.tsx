import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/relatorios")({

  component: Relatorios,

});


function Relatorios(){

  return (

    <div>

      <h1 className="text-3xl font-bold">
        Relatórios
      </h1>


    </div>

  );

}