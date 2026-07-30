import { Link } from "@tanstack/react-router";


export function Sidebar() {

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-5">

      <h1 className="text-xl font-bold mb-8">
        KEMIA
      </h1>


      <nav className="flex flex-col gap-3">

        <Link to="/">
          Dashboard
        </Link>

        <Link to="/obras">
          Obras
        </Link>

        <Link to="/clientes">
          Clientes
        </Link>

        <Link to="/relatorios">
          Relatórios
        </Link>

      </nav>

    </aside>
  );
}