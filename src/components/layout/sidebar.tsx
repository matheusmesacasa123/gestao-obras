import { Link, useRouterState } from "@tanstack/react-router";

import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
} from "lucide-react";





export function Sidebar() {



  const pathname = useRouterState({

    select:(state)=>
      state.location.pathname,

  });






  const menus = [


    {
      nome:"Dashboard",
      rota:"/",
      icone:LayoutDashboard,
    },


    {
      nome:"Obras",
      rota:"/obras",
      icone:Building2,
    },


    {
      nome:"Clientes",
      rota:"/clientes",
      icone:Users,
    },


    {
      nome:"Relatórios",
      rota:"/relatorios",
      icone:FileText,
    },


  ];









  return (



    <aside

      className="
        w-64
        min-h-screen
        bg-slate-950
        text-white
        flex
        flex-col
        p-6
      "

    >







      <div className="mb-10">





        <div

          className="
            flex
            items-center
            mb-4
          "

        >



          <img

            src="/kemia-logo.png"

            alt="Kemia"

            className="
              h-14
              w-auto
              object-contain
            "

          />



        </div>







        <p

          className="
            text-sm
            text-white
            font-medium
          "

        >

          Gestão de Obras


        </p>





      </div>









      <div className="mb-3">


        <p

          className="
            text-xs
            uppercase
            tracking-wider
            text-slate-500
          "

        >

          Menu


        </p>


      </div>









      <nav

        className="
          flex
          flex-col
          gap-2
        "

      >





        {

          menus.map((menu)=>{



            const ativa =

              menu.rota === "/"

              ?

              pathname === "/"

              :

              pathname.startsWith(menu.rota);







            const Icon = menu.icone;







            return (



              <Link



                key={menu.nome}



                to={menu.rota}



                className={`

                  flex

                  items-center

                  gap-3

                  px-4

                  py-3

                  rounded-xl

                  text-sm

                  cursor-pointer

                  transition


                  ${

                    ativa

                    ?

                    "bg-white text-slate-950 font-semibold"

                    :

                    "text-slate-300 hover:bg-slate-800 hover:text-white"

                  }


                `}



              >




                <Icon

                  size={18}

                />





                {menu.nome}





              </Link>



            );



          })

        }







      </nav>









      <div

        className="
          mt-auto
          pt-6
          border-t
          border-slate-800
        "

      >





        <p

          className="
            text-xs
            text-slate-400
          "

        >

          Sistema interno


        </p>




        <p

          className="
            text-xs
            text-slate-600
            mt-1
          "

        >

          Kemia Engenharia


        </p>





      </div>







    </aside>


  );


}