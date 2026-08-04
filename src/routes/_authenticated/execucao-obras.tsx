import {
  createFileRoute,
  Outlet,
} from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/execucao-obras"
)({
  component:
    ExecucaoObrasLayout,
});

function ExecucaoObrasLayout() {
  return <Outlet />;
}