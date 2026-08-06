import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  CheckCircle2,
} from "lucide-react";

import {
  LoginForm,
} from "@/features/auth/login-form";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef4f2]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#91bda4]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-[#436f82]/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        <section className="hidden lg:block">
          <div className="mb-10 inline-flex rounded-3xl bg-white px-6 py-5 shadow-xl shadow-[#173240]/5">
            <img
              src="/kemia-logo.png"
              alt="Kemia"
              className="h-16 w-auto object-contain"
            />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4f8192]">
            Gestão integrada
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight tracking-tight text-[#173240] xl:text-5xl">
            Obras e orçamentos em um só lugar.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#5f747b]">
            Acompanhe processos, equipes e documentos com clareza em todas as etapas.
          </p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            {["Informação centralizada", "Acompanhamento por setor"].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/60 px-4 py-3 text-sm font-medium text-[#315f72] backdrop-blur"
              >
                <CheckCircle2 className="h-4 w-4 text-[#6fa083]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto w-full max-w-md">
          <LoginForm />

          <p className="mt-6 text-center text-xs text-[#6f8085]">
            Sistema interno · Kemia Engenharia
          </p>
        </div>
      </div>
    </div>
  );
}
