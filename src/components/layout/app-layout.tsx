import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./sidebar";
import { Header } from "./header";


export function AppLayout() {

  return (

    <div className="flex min-h-screen">

      <Sidebar />


      <main className="flex-1">

        <Header />


        <div className="p-6">

          <Outlet />

        </div>


      </main>


    </div>

  );
}