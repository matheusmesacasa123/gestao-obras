import { Link } from "@tanstack/react-router";


export function Header() {


  return (

    <header
      className="
        h-16
        bg-white
        border-b
        flex
        items-center
        justify-between
        px-8
      "
    >



      <div
        className="
          flex
          items-center
          gap-4
        "
      >


        <Link
          to="/"
          className="
            font-bold
            text-xl
          "
        >

          Kemia

        </Link>




        <div
          className="
            h-6
            w-px
            bg-border
          "
        />



        <span
          className="
            text-muted-foreground
            font-medium
          "
        >

          Gestão de Obras

        </span>


      </div>






      <div
        className="
          flex
          items-center
          gap-3
        "
      >


        <div
          className="
            text-right
          "
        >

          <p
            className="
              text-sm
              font-medium
            "
          >

            Usuário

          </p>


          <p
            className="
              text-xs
              text-muted-foreground
            "
          >

            Administrador

          </p>


        </div>



      </div>




    </header>

  );

}