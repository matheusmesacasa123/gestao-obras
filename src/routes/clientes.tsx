// src/routes/clientes.tsx

import { createFileRoute } from "@tanstack/react-router";
import { ClientesPage } from "@/features/clientes/pages/clientes-page";

export const Route = createFileRoute("/clientes")({
  component: Clientes,
});

function Clientes() {
  return <ClientesPage />;
}