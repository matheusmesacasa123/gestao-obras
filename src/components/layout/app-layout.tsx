import { Outlet } from "@tanstack/react-router";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <Header />

        <div className="flex-1 p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
