import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  CadastroForm,
} from "@/features/auth/cadastro-form";

export const Route =
  createFileRoute("/cadastro")({
    component: CadastroPage,
  });

function CadastroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img
            src="/kemia-logo.png"
            alt="Kemia"
            className="mx-auto h-20 w-auto object-contain"
          />

          <p className="mt-2 text-sm text-muted-foreground">
            Gestão de Obras
          </p>
        </div>

        <CadastroForm />
      </div>
    </div>
  );
}