import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/obras")({

  component: Obras,

});


function Obras(){

  return (

    <div>

      <h1 className="text-3xl font-bold">
        Obras
      </h1>


      <p className="mt-3 text-gray-600">
        Cadastro e acompanhamento das obras.
      </p>


    </div>

  );

}