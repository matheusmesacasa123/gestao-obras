import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Users,
  Activity,
} from "lucide-react";



type Props = {

  title: string;

  value: string | number;

  description?: string;

};





export function DashboardCard({

  title,

  value,

  description,

}: Props) {





  function getConfig(){


    if(title.toLowerCase().includes("atras")){


      return {

        icon: AlertTriangle,

        color: "text-red-600",

        bg: "bg-red-50",

      };


    }




    if(title.toLowerCase().includes("concl")){


      return {

        icon: CheckCircle2,

        color: "text-green-600",

        bg: "bg-green-50",

      };


    }




    if(title.toLowerCase().includes("cliente")){


      return {

        icon: Users,

        color: "text-purple-600",

        bg: "bg-purple-50",

      };


    }




    if(title.toLowerCase().includes("andamento")){


      return {

        icon: Activity,

        color: "text-blue-600",

        bg: "bg-blue-50",

      };


    }




    return {

      icon: ClipboardList,

      color: "text-gray-700",

      bg: "bg-gray-100",

    };


  }






  const config = getConfig();


  const Icon = config.icon;







  return (


    <div

      className="
        bg-white
        border
        rounded-2xl
        p-5
        shadow-sm
        hover:shadow-md
        transition
      "

    >




      <div

        className="
          flex
          items-start
          justify-between
        "

      >



        <div>


          <p

            className="
              text-sm
              text-muted-foreground
            "

          >

            {title}

          </p>





          <h2

            className="
              text-4xl
              font-bold
              mt-2
            "

          >

            {value}

          </h2>



        </div>







        <div

          className={`
            p-3
            rounded-xl
            ${config.bg}
          `}

        >


          <Icon

            className={`
              w-6
              h-6
              ${config.color}
            `}

          />


        </div>




      </div>







      {
        description && (


          <p

            className="
              text-sm
              text-muted-foreground
              mt-4
            "

          >

            {description}

          </p>


        )
      }





    </div>


  );


}