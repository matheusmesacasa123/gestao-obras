import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  CheckCircle2,
  CirclePause,
  Clock3,
  ListTodo,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  supabase,
} from "@/integrations/supabase/client";

import {
  getDemandasPorObra,
} from "@/features/obras/demandas/services/demandas-service";

import {
  DemandaList,
} from "@/features/obras/demandas/components/demanda-list";

import ModalEditarDemanda from "@/features/obras/demandas/components/modal-editar-demanda";

import type {
  Demanda,
} from "@/features/obras/demandas/types";

interface SetorFiltro {
  id: string;
  nome: string;
}


export const Route =
  createFileRoute(
    "/_authenticated/obras/$id/demandas/"
  )({
    component:
      DemandasPage,
  });

function DemandasPage() {
  const {
    id,
  } = Route.useParams();

  const navigate =
    useNavigate();

  const {
    perfil,
  } = useAuth();

  const [
    demandas,
    setDemandas,
  ] = useState<Demanda[]>(
    []
  );

  const [
    setores,
    setSetores,
  ] = useState<SetorFiltro[]>(
    []
  );


  const [
    setorSelecionadoId,
    setSetorSelecionadoId,
  ] = useState("");

  const [
    filtroInicialAplicado,
    setFiltroInicialAplicado,
  ] = useState(false);

  const [
    loadingDemandas,
    setLoadingDemandas,
  ] = useState(true);


  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    erroDemandas,
    setErroDemandas,
  ] = useState(false);

  const [
    erroSetores,
    setErroSetores,
  ] = useState(false);


  const [
    demandaParaEditar,
    setDemandaParaEditar,
  ] =
    useState<Demanda | null>(
      null
    );

  const administrador =
    perfil?.administrador ===
    true;

  const podeCriarDemanda =
    administrador ||
    Boolean(
      perfil?.setor_id
    );

  const carregarSetores =
    useCallback(
      async () => {
        try {
          setErroSetores(
            false
          );

          const {
            data,
            error,
          } = await supabase
            .from("setores")
            .select(
              "id, nome"
            )
            .eq(
              "ativo",
              true
            )
            .order(
              "nome",
              {
                ascending:
                  true,
              }
            );

          if (error) {
            throw error;
          }

          setSetores(
            (
              data ??
              []
            ) as SetorFiltro[]
          );
        } catch (error) {
          console.error(
            "Erro ao carregar setores:",
            error
          );

          setErroSetores(
            true
          );
        }
      },
      []
    );

  const carregarDemandas =
    useCallback(
      async (
        exibirCarregamentoInicial =
          true
      ) => {
        try {
          if (
            exibirCarregamentoInicial
          ) {
            setLoadingDemandas(
              true
            );
          } else {
            setAtualizando(
              true
            );
          }

          setErroDemandas(
            false
          );

          const data =
            await getDemandasPorObra(
              id
            );

          setDemandas(
            data
          );
        } catch (error) {
          console.error(
            "Erro ao buscar demandas:",
            error
          );

          setErroDemandas(
            true
          );
        } finally {
          setLoadingDemandas(
            false
          );

          setAtualizando(
            false
          );
        }
      },
      [
        id,
      ]
    );

  const atualizarPagina =
    useCallback(
      async () => {
        await carregarDemandas(
          false
        );
      },
      [
        carregarDemandas,
      ]
    );

  useEffect(() => {
    Promise.all([
      carregarDemandas(),
      carregarSetores(),
    ]);
  }, [
    carregarDemandas,
    carregarSetores,
  ]);

  useEffect(() => {
    if (
      filtroInicialAplicado
    ) {
      return;
    }

    if (
      perfil?.setor_id
    ) {
      setSetorSelecionadoId(
        perfil.setor_id
      );

      setFiltroInicialAplicado(
        true
      );

      return;
    }

    if (perfil) {
      setSetorSelecionadoId(
        "todos"
      );

      setFiltroInicialAplicado(
        true
      );
    }
  }, [
    perfil,
    filtroInicialAplicado,
  ]);

  const demandasFiltradas =
    useMemo(() => {
      if (
        !setorSelecionadoId ||
        setorSelecionadoId ===
          "todos"
      ) {
        return demandas;
      }

      if (
        setorSelecionadoId ===
        "sem_setor"
      ) {
        return demandas.filter(
          (
            demanda
          ) =>
            !demanda.setor_id
        );
      }

      return demandas.filter(
        (
          demanda
        ) =>
          demanda.setor_id ===
          setorSelecionadoId
      );
    }, [
      demandas,
      setorSelecionadoId,
    ]);

  const totais =
    useMemo(() => {
      const abertas =
        demandasFiltradas.filter(
          (
            demanda
          ) =>
            demanda.status ===
            "aberta"
        ).length;

      const andamento =
        demandasFiltradas.filter(
          (
            demanda
          ) =>
            demanda.status ===
            "em_andamento"
        ).length;

      const concluidas =
        demandasFiltradas.filter(
          (
            demanda
          ) =>
            demanda.status ===
            "concluida"
        ).length;

      return {
        total:
          demandasFiltradas.length,

        abertas,

        andamento,

        concluidas,
      };
    }, [
      demandasFiltradas,
    ]);

  const nomeSetorSelecionado =
    useMemo(() => {
      if (
        setorSelecionadoId ===
        "todos"
      ) {
        return "Todos os setores";
      }

      if (
        setorSelecionadoId ===
        "sem_setor"
      ) {
        return "Sem setor definido";
      }

      return (
        setores.find(
          (
            setor
          ) =>
            setor.id ===
            setorSelecionadoId
        )?.nome ||
        "Setor não encontrado"
      );
    }, [
      setores,
      setorSelecionadoId,
    ]);

  if (
    loadingDemandas
  ) {
    return (
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <RefreshCw className="h-4 w-4 animate-spin" />

          Carregando demandas...
        </div>
      </div>
    );
  }

  if (
    erroDemandas
  ) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-8">
        <div>
          <h2 className="font-semibold text-red-800">
            Erro ao carregar demandas
          </h2>

          <p className="mt-1 text-sm text-red-700">
            Não foi possível buscar as demandas desta obra.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            carregarDemandas()
          }
          className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Demandas
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Gerenciamento das atividades da obra
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={
                atualizarPagina
              }
              disabled={
                atualizando
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  atualizando
                    ? "animate-spin"
                    : ""
                }`}
              />

              Atualizar
            </button>

            {podeCriarDemanda && (
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to:
                        "/obras/$id/demandas/nova",

                      params: {
                        id,
                      },
                    })
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />

                  Nova demanda
                </button>
              )}
          </div>
        </div>


        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[240px] flex-1">
              <label
                htmlFor="filtro-setor-demandas"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700"
              >
                <Building2 className="h-4 w-4 text-gray-500" />

                Setor das demandas
              </label>

              <select
                id="filtro-setor-demandas"
                value={
                  setorSelecionadoId
                }
                onChange={(
                  event
                ) =>
                  setSetorSelecionadoId(
                    event.target.value
                  )
                }
                disabled={
                  erroSetores
                }
                className="mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="todos">
                  Todos os setores
                </option>

                {setores.map(
                  (
                    setor
                  ) => (
                    <option
                      key={
                        setor.id
                      }
                      value={
                        setor.id
                      }
                    >
                      {
                        setor.nome
                      }
                    </option>
                  )
                )}

                <option value="sem_setor">
                  Sem setor definido
                </option>
              </select>

              {erroSetores && (
                <p className="mt-2 text-xs text-red-600">
                  Não foi possível carregar os setores.
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-slate-50 px-4 py-3">
              <span className="block text-xs font-medium text-slate-500">
                Visualizando
              </span>

              <span className="mt-0.5 block text-sm font-semibold text-slate-800">
                {
                  nomeSetorSelecionado
                }
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total
                </p>

                <strong className="mt-1 block text-3xl font-bold text-gray-900">
                  {
                    totais.total
                  }
                </strong>
              </div>

              <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                <ListTodo className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Aguardando início
                </p>

                <strong className="mt-1 block text-3xl font-bold text-gray-900">
                  {
                    totais.abertas
                  }
                </strong>
              </div>

              <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                <CirclePause className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Em andamento
                </p>

                <strong className="mt-1 block text-3xl font-bold text-gray-900">
                  {
                    totais.andamento
                  }
                </strong>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Concluídas
                </p>

                <strong className="mt-1 block text-3xl font-bold text-gray-900">
                  {
                    totais.concluidas
                  }
                </strong>
              </div>

              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

                <DemandaList
          demandas={
            demandasFiltradas
          }
          obraId={
            id
          }
          onDelete={() =>
            carregarDemandas(
              false
            )
          }
          onEdit={(
            demanda
          ) => {
            setDemandaParaEditar(
              demanda
            );
          }}
        />
      </div>

      {demandaParaEditar && (
        <ModalEditarDemanda
          demanda={
            demandaParaEditar
          }
          obraId={
            id
          }
          onClose={() => {
            setDemandaParaEditar(
              null
            );
          }}
          onSuccess={() => {
            setDemandaParaEditar(
              null
            );

            atualizarPagina();
          }}
        />
      )}
    </>
  );
}