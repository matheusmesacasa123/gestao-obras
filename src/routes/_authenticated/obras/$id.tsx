import {
  createFileRoute,
  Link,
  Outlet,
  notFound,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  GitBranch,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  supabase,
} from "@/integrations/supabase/client";

type StatusObraRevisao =
  | "ativa"
  | "encerrada";

type ObraRevisaoCabecalho = {
  id: string;
  obra_id: string;
  numero_revisao: number;
  status: StatusObraRevisao;
  motivo_revisao: string | null;
  observacao: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
};

type ObraSearch = {
  obraRevisaoId?: string;
  criarNovaRevisao?: boolean;
};

export const Route =
  createFileRoute(
    "/_authenticated/obras/$id"
  )({
    validateSearch: (
      search: Record<
        string,
        unknown
      >
    ): ObraSearch => ({
      obraRevisaoId:
        typeof search.obraRevisaoId ===
        "string"
          ? search.obraRevisaoId
          : undefined,

      criarNovaRevisao:
        search.criarNovaRevisao ===
          true ||
        search.criarNovaRevisao ===
          "true"
          ? true
          : undefined,
    }),

    loader: async ({
      params,
    }) => {
      const [
        respostaObra,
        respostaRevisoes,
      ] = await Promise.all([
        supabase
          .from("obras")
          .select("*")
          .eq(
            "id",
            params.id
          )
          .single(),

        supabase
          .from("obra_revisoes")
          .select(`
            id,
            obra_id,
            numero_revisao,
            status,
            motivo_revisao,
            observacao,
            criado_por,
            created_at,
            updated_at
          `)
          .eq(
            "obra_id",
            params.id
          )
          .order(
            "numero_revisao",
            {
              ascending: true,
            }
          ),
      ]);

      if (
        respostaObra.error ||
        !respostaObra.data
      ) {
        throw notFound();
      }

      if (
        respostaRevisoes.error
      ) {
        console.error(
          "Erro ao carregar revisões da obra:",
          respostaRevisoes.error
        );

        throw respostaRevisoes.error;
      }

      return {
        obra:
          respostaObra.data,

        revisoes:
          (
            respostaRevisoes.data ||
            []
          ) as ObraRevisaoCabecalho[],
      };
    },

    notFoundComponent:
      () => (
        <div className="space-y-4 rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">
            Obra não encontrada
          </h2>

          <p className="text-sm text-gray-500">
            Não encontramos nenhum registro correspondente para essa rota.
          </p>

          <Link
            to="/obras"
            className="inline-block rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Voltar para Obras
          </Link>
        </div>
      ),

    component:
      ObraLayoutPage,
  });

function formatarNumeroRevisao(
  numero: number
) {
  return String(
    numero
  ).padStart(
    2,
    "0"
  );
}

function obterLabelStatus(
  status: StatusObraRevisao
) {
  if (
    status === "ativa"
  ) {
    return "Atual";
  }

  return "Encerrada";
}

function ObraLayoutPage() {
  const {
    obra,
    revisoes,
  } =
    Route.useLoaderData();

  const {
    obraRevisaoId,
  } =
    Route.useSearch();

  const navigate =
    useNavigate();

  const {
    perfil,
  } = useAuth();

  const administrador =
    perfil?.administrador ===
    true;

  const [
    modalNovaRevisaoAberto,
    setModalNovaRevisaoAberto,
  ] = useState(false);

  const [
    motivoNovaRevisao,
    setMotivoNovaRevisao,
  ] = useState("");

  const [
    observacaoNovaRevisao,
    setObservacaoNovaRevisao,
  ] = useState("");

  const [
    criandoNovaRevisao,
    setCriandoNovaRevisao,
  ] = useState(false);

  const [
    erroNovaRevisao,
    setErroNovaRevisao,
  ] = useState("");

  const [
    excluindoRevisao,
    setExcluindoRevisao,
  ] = useState(false);

  const [
    erroExclusaoRevisao,
    setErroExclusaoRevisao,
  ] = useState("");

  const opcoesRevisao =
    useMemo(
      () =>
        revisoes
          .slice()
          .sort(
            (
              revisaoA,
              revisaoB
            ) =>
              revisaoA.numero_revisao -
              revisaoB.numero_revisao
          ),
      [
        revisoes,
      ]
    );

  const revisaoAtiva =
    opcoesRevisao.find(
      (
        revisao
      ) =>
        revisao.status ===
        "ativa"
    ) ||
    null;

  const revisaoSelecionadaId =
    obraRevisaoId &&
    opcoesRevisao.some(
      (
        revisao
      ) =>
        revisao.id ===
        obraRevisaoId
    )
      ? obraRevisaoId
      : revisaoAtiva?.id ||
        opcoesRevisao[
          opcoesRevisao.length - 1
        ]?.id ||
        "";

  const revisaoSelecionada =
    opcoesRevisao.find(
      (
        revisao
      ) =>
        revisao.id ===
        revisaoSelecionadaId
    ) ||
    null;

  useEffect(() => {
    if (
      !revisaoSelecionadaId ||
      obraRevisaoId ===
        revisaoSelecionadaId
    ) {
      return;
    }

    navigate({
      search:
        (
          searchAtual
        ) => ({
          ...searchAtual,

          obraRevisaoId:
            revisaoSelecionadaId,

          criarNovaRevisao:
            undefined,
        }),

      replace:
        true,
    });
  }, [
    navigate,
    obraRevisaoId,
    revisaoSelecionadaId,
  ]);

  const tabs = [
    {
      label:
        "Informações",

      to:
        "/obras/$id",

      exact:
        true,
    },
    {
      label:
        "Etapas",

      to:
        "/obras/$id/etapas",

      exact:
        false,
    },
    {
      label:
        "Demandas",

      to:
        "/obras/$id/demandas",

      exact:
        false,
    },
    {
      label:
        "Documentos",

      to:
        "/obras/$id/documentos",

      exact:
        false,
    },
    {
      label:
        "Histórico",

      to:
        "/obras/$id/historico",

      exact:
        false,
    },
  ] as const;

  function handleSelecionarRevisao(
    novaRevisaoId: string
  ) {
    navigate({
      search:
        (
          searchAtual
        ) => ({
          ...searchAtual,

          obraRevisaoId:
            novaRevisaoId ||
            undefined,

          criarNovaRevisao:
            undefined,
        }),

      replace:
        true,
    });
  }


  function abrirModalNovaRevisao() {
    setErroNovaRevisao("");
    setMotivoNovaRevisao("");
    setObservacaoNovaRevisao("");
    setModalNovaRevisaoAberto(true);
  }

  function fecharModalNovaRevisao() {
    if (criandoNovaRevisao) {
      return;
    }

    setModalNovaRevisaoAberto(false);
    setErroNovaRevisao("");
    setMotivoNovaRevisao("");
    setObservacaoNovaRevisao("");
  }

  async function confirmarNovaRevisao(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const motivo =
      motivoNovaRevisao.trim();

    if (!motivo) {
      setErroNovaRevisao(
        "Informe o motivo da nova revisão."
      );

      return;
    }

    try {
      setCriandoNovaRevisao(true);
      setErroNovaRevisao("");

      const {
        error: erroCriacao,
      } = await supabase.rpc(
        "criar_nova_revisao_obra",
        {
          p_obra_id:
            obra.id,

          p_motivo_revisao:
            motivo,

          p_observacao:
            observacaoNovaRevisao.trim() ||
            null,
        }
      );

      if (erroCriacao) {
        throw erroCriacao;
      }

      const {
        data: novaRevisao,
        error: erroBusca,
      } = await supabase
        .from("obra_revisoes")
        .select("id")
        .eq("obra_id", obra.id)
        .eq("status", "ativa")
        .single();

      if (
        erroBusca ||
        !novaRevisao
      ) {
        throw (
          erroBusca ||
          new Error(
            "A revisão foi criada, mas não foi possível carregá-la."
          )
        );
      }

      setModalNovaRevisaoAberto(false);
      setMotivoNovaRevisao("");
      setObservacaoNovaRevisao("");

      navigate({
        to:
          "/obras/$id",

        params: {
          id:
            obra.id,
        },

        search: {
          obraRevisaoId:
            novaRevisao.id,
        },

        replace:
          true,
      });

      window.location.reload();
    } catch (error: any) {
      console.error(
        "Erro ao criar nova revisão da obra:",
        error
      );

      setErroNovaRevisao(
        error?.message ||
        error?.details ||
        "Não foi possível criar a nova revisão."
      );
    } finally {
      setCriandoNovaRevisao(false);
    }
  }

  async function excluirRevisaoSelecionada() {
    if (
      !revisaoSelecionada
    ) {
      return;
    }

    if (
      !administrador
    ) {
      setErroExclusaoRevisao(
        "Somente administradores podem excluir revisões."
      );

      return;
    }

    const confirmado =
      window.confirm(
        `Deseja excluir a Rev. ${formatarNumeroRevisao(
          revisaoSelecionada.numero_revisao
        )}? A exclusão só será permitida se esta revisão não possuir etapas, demandas ou documentos.`
      );

    if (
      !confirmado
    ) {
      return;
    }

    try {
      setExcluindoRevisao(true);
      setErroExclusaoRevisao("");

      const {
        data: novaRevisaoAtivaId,
        error,
      } = await supabase.rpc(
        "excluir_revisao_obra",
        {
          p_revisao_id:
            revisaoSelecionada.id,
        }
      );

      if (
        error
      ) {
        throw error;
      }

      navigate({
        to:
          "/obras/$id",

        params: {
          id:
            obra.id,
        },

        search: {
          obraRevisaoId:
            typeof novaRevisaoAtivaId ===
            "string"
              ? novaRevisaoAtivaId
              : undefined,
        },

        replace:
          true,
      });

      window.location.reload();
    } catch (
      error: any
    ) {
      console.error(
        "Erro ao excluir revisão da obra:",
        error
      );

      setErroExclusaoRevisao(
        error?.message ||
        error?.details ||
        "Não foi possível excluir a revisão."
      );
    } finally {
      setExcluindoRevisao(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <Link
        to="/obras"
        className="flex w-fit items-center gap-1 text-sm font-medium text-gray-600 transition hover:text-black"
      >
        ← Voltar para Obras
      </Link>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex min-h-[145px] flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="space-y-1">
            <span className="block text-xs font-medium text-gray-500">
              Código da obra
            </span>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                {obra.codigo ||
                  "Sem código"}
              </h1>

              {revisaoSelecionada && (
                <span
                  className={
                    revisaoSelecionada.status ===
                    "ativa"
                      ? "rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700"
                      : "rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-bold text-gray-600"
                  }
                >
                  Rev.{" "}
                  {formatarNumeroRevisao(
                    revisaoSelecionada.numero_revisao
                  )}
                </span>
              )}
            </div>

            <p className="text-base font-semibold text-gray-800">
              {obra.cliente ||
                "Cliente não informado"}
            </p>

            {(obra.cidade ||
              obra.estado) && (
              <p className="text-sm font-medium text-gray-500">
                {obra.cidade ||
                  ""}

                {obra.cidade &&
                obra.estado
                  ? "/"
                  : ""}

                {obra.estado ||
                  ""}
              </p>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[390px]">
            {opcoesRevisao.length >
            0 ? (
              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Revisão da obra selecionada
                </span>

                <select
                  value={
                    revisaoSelecionadaId
                  }
                  onChange={(
                    event
                  ) =>
                    handleSelecionarRevisao(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {opcoesRevisao.map(
                    (
                      revisao
                    ) => (
                      <option
                        key={
                          revisao.id
                        }
                        value={
                          revisao.id
                        }
                      >
                        Rev.{" "}
                        {formatarNumeroRevisao(
                          revisao.numero_revisao
                        )}
                        {" — "}
                        {obterLabelStatus(
                          revisao.status
                        )}
                      </option>
                    )
                  )}
                </select>

                {revisaoSelecionada && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                      {revisaoSelecionada.status ===
                      "ativa"
                        ? "Esta é a revisão atual da obra."
                        : "Esta revisão está disponível somente para consulta e histórico."}
                    </p>

                    {revisaoSelecionada.motivo_revisao && (
                      <p className="text-xs text-gray-500">
                        Motivo:{" "}
                        {
                          revisaoSelecionada.motivo_revisao
                        }
                      </p>
                    )}
                  </div>
                )}
              </label>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Esta obra ainda não possui uma revisão cadastrada.
              </div>
            )}
            {revisaoAtiva && (
              <button
                type="button"
                onClick={
                  abrirModalNovaRevisao
                }
                className="inline-flex w-fit items-center gap-2 self-end rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <GitBranch className="h-4 w-4" />

                Criar nova revisão
              </button>
            )}

            {administrador &&
              revisaoSelecionada && (
              <button
                type="button"
                onClick={
                  excluirRevisaoSelecionada
                }
                disabled={
                  excluindoRevisao
                }
                className="inline-flex w-fit items-center gap-2 self-end rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {excluindoRevisao ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                Excluir revisão
              </button>
            )}

            <Link
              to="/obras/$id/editar"
              params={{
                id:
                  obra.id,
              }}
              search={{
                obraRevisaoId:
                  revisaoSelecionadaId ||
                  undefined,
              }}
              className="inline-flex w-fit shrink-0 items-center gap-2 self-end rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />

              Editar obra
            </Link>
          </div>
        </div>
      </div>

      {erroExclusaoRevisao && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erroExclusaoRevisao}
        </div>
      )}

      <nav className="flex justify-center rounded-2xl border bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tabs.map(
            (
              tab
            ) => (
              <Link
                key={
                  tab.label
                }
                to={
                  tab.to
                }
                params={{
                  id:
                    obra.id,
                }}
                search={{
                  obraRevisaoId:
                    revisaoSelecionadaId ||
                    undefined,
                }}
                activeOptions={{
                  exact:
                    tab.exact,
                }}
                activeProps={{
                  className:
                    "bg-black text-white shadow-sm",
                }}
                inactiveProps={{
                  className:
                    "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                }}
                className="block min-w-[130px] whitespace-nowrap rounded-xl px-5 py-2.5 text-center text-sm font-semibold transition-all"
              >
                {
                  tab.label
                }
              </Link>
            )
          )}
        </div>
      </nav>

      <Outlet />

      {modalNovaRevisaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Criar nova revisão
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  A revisão atual será encerrada e uma nova revisão vazia será criada para a obra.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModalNovaRevisao}
                disabled={criandoNovaRevisao}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={confirmarNovaRevisao}
              className="space-y-5 p-6"
            >
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                A nova revisão não copiará etapas, demandas ou documentos da revisão anterior.
              </div>

              {erroNovaRevisao && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erroNovaRevisao}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="motivo-nova-revisao"
                  className="text-sm font-semibold text-gray-700"
                >
                  Motivo da nova revisão *
                </label>

                <input
                  id="motivo-nova-revisao"
                  type="text"
                  value={motivoNovaRevisao}
                  onChange={(event) =>
                    setMotivoNovaRevisao(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: Alteração do escopo"
                  disabled={criandoNovaRevisao}
                  required
                  autoFocus
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="observacao-nova-revisao"
                  className="text-sm font-semibold text-gray-700"
                >
                  Observação
                </label>

                <textarea
                  id="observacao-nova-revisao"
                  value={observacaoNovaRevisao}
                  onChange={(event) =>
                    setObservacaoNovaRevisao(
                      event.target.value
                    )
                  }
                  placeholder="Descreva o que motivou esta revisão..."
                  disabled={criandoNovaRevisao}
                  rows={4}
                  className="w-full resize-none rounded-xl border p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={fecharModalNovaRevisao}
                  disabled={criandoNovaRevisao}
                  className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    criandoNovaRevisao ||
                    !motivoNovaRevisao.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {criandoNovaRevisao ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitBranch className="h-4 w-4" />
                  )}

                  Criar revisão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}