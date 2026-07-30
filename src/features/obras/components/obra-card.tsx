import { useNavigate } from "@tanstack/react-router";

import type { Obra } from "../types";


export function ObraCard({
  obra,
}: {
  obra: Obra;
}) {

  const navigate = useNavigate();


  return (

    <div
      className="
        rounded-xl
        border
        p-5
        space-y-3
        cursor-pointer
        hover:bg-muted/50
        transition
      "

      onClick={() =>
        navigate({
          to: "/_authenticated/obras/$id",
          params: {
            id: obra.id,
          },
        })
      }

    >


      <div>

        <h2 className="text-lg font-bold">
          {obra.codigo ?? "Sem código"}
        </h2>


        <p className="text-sm text-muted-foreground">
          {obra.cliente}
        </p>

      </div>



      <div className="space-y-1">


        <p>
          <strong>Projeto:</strong>{" "}
          {obra.tipo_projeto ?? "-"}
        </p>


        <p>
          <strong>Vazão:</strong>{" "}
          {obra.vazao
            ? `${obra.vazao} m³/dia`
            : "-"
          }
        </p>


        <p>
          <strong>Status:</strong>{" "}
          {obra.status ?? "-"}
        </p>


      </div>



      <button
        className="
          text-sm
          underline
          mt-2
        "
        onClick={(e)=>{

          e.stopPropagation();

          navigate({
            to: "/_authenticated/obras/$id",
            params:{
              id: obra.id,
            },
          });

        }}
      >
        Ver detalhes
      </button>



    </div>

  )

}