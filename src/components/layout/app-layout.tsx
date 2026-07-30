import { Outlet } from "@tanstack/react-router";

import { Sidebar } from "./sidebar";
import { Header } from "./header";


export function AppLayout() {


  return (

    <div
      className="
        flex
        min-h-screen
        bg-muted/30
      "
    >


      <Sidebar />



      <main
        className="
          flex-1
          flex
          flex-col
        "
      >


        <Header />



        <div
          className="
            flex-1
            p-8
          "
        >

          <Outlet />

        </div>



      </main>



    </div>

  );

}