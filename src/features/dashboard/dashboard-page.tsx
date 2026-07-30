import { DashboardCard } from "./dashboard-card";


export function DashboardPage() {


  return (

    <div className="space-y-8">


      <div>

        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>


        <p className="text-gray-500 mt-1">
          Visão geral das obras
        </p>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


        <DashboardCard
          title="Obras Ativas"
          value="12"
          description="Em execução"
        />


        <DashboardCard
          title="Obras Atrasadas"
          value="2"
          description="Necessitam atenção"
        />


        <DashboardCard
          title="Clientes"
          value="8"
          description="Clientes cadastrados"
        />


      </div>




      <div>

        <h2 className="text-xl font-semibold mb-4">
          Obras recentes
        </h2>



        <div className="grid gap-4">


          <div className="bg-white border rounded-xl p-5">


            <h3 className="font-bold text-lg">
              ETE Itabirinha
            </h3>


            <p className="text-gray-500">
              Cliente: COPASA
            </p>


            <span className="inline-block mt-3 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
              Em andamento
            </span>


          </div>



          <div className="bg-white border rounded-xl p-5">


            <h3 className="font-bold text-lg">
              ETA Chapecó
            </h3>


            <p className="text-gray-500">
              Cliente: Cliente exemplo
            </p>


            <span className="inline-block mt-3 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
              Planejamento
            </span>


          </div>


        </div>


      </div>


    </div>

  );

}