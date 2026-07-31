import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  CirclePlay,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  UserRound,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  atualizarEtapaObra,
  concluirEtapaObra,
  criarEtapaObra,
  iniciarEtapaObra,
  listarEtapasDaObra,
  reabrirEtapaObra,
  type EtapaObra,
  type StatusEtapaObra,
} from "@/features/etapas/services/etapas-service";

import {
  supabase,
} from "@/integrations/supabase/client";

export const Route =
  createFileRoute(
    "/_authenticated/obras/$id/etapas"
  )({
    component:
      EtapasObraPage,
  });

type SetorOpcao = {
  id: string;
  nome: string;
};

type UsuarioOpcao = {
  id: string;
  nome: string;
  email: string;
  setor_id: string | null;
};

type EdicaoEtapa = {
  responsavel_id: string;
  status: StatusEtapaObra;
  data_inicio: string;
  prazo: string;
  observacao: string;
  obrigatoria: boolean;
  ordem: string;
};

const opcoesStatus: {
  valor: StatusEtapaObra;
  label: string;
}[] = [
  {
    valor:
      "nao_iniciada",
    label:
      "Não iniciada",
  },
  {
    valor:
      "em_andamento",
    label:
      "Em andamento",
  },
  {
    valor:
      "aguardando_outro_setor",
    label:
      "Aguardando outro setor",
  },
  {
    valor:
      "aguardando_cliente",
    label:
      "Aguardando cliente",
  },
  {
    valor:
      "bloqueada",
    label:
      "Bloqueada",
  },
  {
    valor:
      "concluida",
    label:
      "Concluída",
  },
];

function obterLabelStatus(
  status: StatusEtapaObra
) {
  return (
    opcoesStatus.find(
      (opcao) =>
        opcao.valor ===
        status
    )?.label ||
    status
  );
}

function obterClasseStatus(
  status: StatusEtapaObra
) {
  switch (status) {
    case "em_andamento":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "aguardando_outro_setor":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "aguardando_cliente":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "bloqueada":
      return "border-red-200 bg-red-50 text-red-700";

    case "concluida":
      return "border-green-200 bg-green-50 text-green-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatarData(
  valor?: string | null
) {
  if (!valor) {
    return "Não informada";
  }

  const [
    ano,
    mes,
    dia,
  ] = valor
    .split("-")
    .map(Number);

  const data =
    new Date(
      ano,
      mes - 1,
      dia
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(data);
}

function EtapasObraPage() {
  const {
    id: obraId,
  } = Route.useParams();

  const {
    perfil,
  } = useAuth();

  const [
    etapas,
    setEtapas,
  ] = useState<EtapaObra[]>(
    []
  );

  const [
    setores,
    setSetores,
  ] = useState<SetorOpcao[]>(
    []
  );

  const [
    usuarios,
    setUsuarios,
  ] = useState<UsuarioOpcao[]>(
    []
  );

  const [
    edicoes,
    setEdicoes,
  ] = useState<
    Record<
      string,
      EdicaoEtapa
    >
  >({});

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvandoEtapaId,
    setSalvandoEtapaId,
  ] = useState<string | null>(
    null
  );

  const [
    executandoAcaoId,
    setExecutandoAcaoId,
  ] = useState<string | null>(
    null
  );

  const [
    mostrandoFormulario,
    setMostrandoFormulario,
  ] = useState(false);

  const [
    criando,
    setCriando,
  ] = useState(false);

  const [
    novoSetorId,
    setNovoSetorId,
  ] = useState("");

  const [
    novoResponsavelId,
    setNovoResponsavelId,
  ] = useState("");

  const [
    novoPrazo,
    setNovoPrazo,
  ] = useState("");

  const [
    novaObservacao,
    setNovaObservacao,
  ] = useState("");

  const [
    novaOrdem,
    setNovaOrdem,
  ] = useState("");

  const [
    novaObrigatoria,
    setNovaObrigatoria,
  ] = useState(true);

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  const administrador =
    Boolean(
      perfil?.administrador
    );

  const setorUsuarioId =
    perfil?.setor_id ||
    null;

  const setoresDisponiveis =
    useMemo(
      () => {
        const setoresJaUtilizados =
          new Set(
            etapas.map(
              (etapa) =>
                etapa.setor_id
            )
          );

        return setores.filter(
          (setor) =>
            !setoresJaUtilizados.has(
              setor.id
            )
        );
      },
      [
        etapas,
        setores,
      ]
    );

  const usuariosNovoSetor =
    useMemo(
      () =>
        usuarios.filter(
          (usuario) =>
            usuario.setor_id ===
            novoSetorId
        ),
      [
        usuarios,
        novoSetorId,
      ]
    );

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [
        etapasEncontradas,
        respostaSetores,
        respostaUsuarios,
      ] = await Promise.all([
        listarEtapasDaObra(
          obraId
        ),

        supabase
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
          ),

        supabase
          .from("usuarios")
          .select(
            "id, nome, email, setor_id"
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
          ),
      ]);

      if (
        respostaSetores.error
      ) {
        throw respostaSetores.error;
      }

      if (
        respostaUsuarios.error
      ) {
        throw respostaUsuarios.error;
      }

      const setoresEncontrados =
        (
          respostaSetores.data ||
          []
        ) as SetorOpcao[];

      const usuariosEncontrados =
        (
          respostaUsuarios.data ||
          []
        ) as UsuarioOpcao[];

      setEtapas(
        etapasEncontradas
      );

      setSetores(
        setoresEncontrados
      );

      setUsuarios(
        usuariosEncontrados
      );

      const novasEdicoes: Record<
        string,
        EdicaoEtapa
      > = {};

      for (
        const etapa
        of etapasEncontradas
      ) {
        novasEdicoes[
          etapa.id
        ] = {
          responsavel_id:
            etapa.responsavel_id ||
            "",

          status:
            etapa.status,

          data_inicio:
            etapa.data_inicio ||
            "",

          prazo:
            etapa.prazo ||
            "",

          observacao:
            etapa.observacao ||
            "",

          obrigatoria:
            etapa.obrigatoria,

          ordem:
            etapa.ordem !==
            null
              ? String(
                  etapa.ordem
                )
              : "",
        };
      }

      setEdicoes(
        novasEdicoes
      );

      if (
        !novoSetorId
      ) {
        if (
          administrador &&
          setoresDisponiveis.length >
            0
        ) {
          setNovoSetorId(
            setoresDisponiveis[0]
              ?.id ||
              ""
          );
        } else if (
          setorUsuarioId
        ) {
          setNovoSetorId(
            setorUsuarioId
          );
        }
      }
    } catch (error) {
      console.error(
        "Erro ao carregar etapas:",
        error
      );

      setErro(
        "Não foi possível carregar as etapas da obra."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [
    obraId,
    perfil?.id,
    perfil?.setor_id,
    perfil?.administrador,
  ]);

  useEffect(() => {
    setNovoResponsavelId(
      ""
    );
  }, [
    novoSetorId,
  ]);

  function podeEditarEtapa(
    etapa: EtapaObra
  ) {
    return (
      administrador ||
      (
        Boolean(
          setorUsuarioId
        ) &&
        etapa.setor_id ===
          setorUsuarioId
      )
    );
  }

  function atualizarEdicao(
    etapaId: string,
    campo: keyof EdicaoEtapa,
    valor:
      | string
      | boolean
  ) {
    setEdicoes(
      (
        estadoAtual
      ) => ({
        ...estadoAtual,

        [etapaId]: {
          ...estadoAtual[
            etapaId
          ],

          [campo]:
            valor,
        },
      })
    );
  }

  async function handleCriarEtapa(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (!novoSetorId) {
      setErro(
        "Selecione o setor da etapa."
      );

      return;
    }

    if (
      !administrador &&
      novoSetorId !==
        setorUsuarioId
    ) {
      setErro(
        "Você só pode criar uma etapa para o seu próprio setor."
      );

      return;
    }

    try {
      setCriando(true);

      await criarEtapaObra({
        obra_id:
          obraId,

        setor_id:
          novoSetorId,

        responsavel_id:
          novoResponsavelId ||
          null,

        status:
          "nao_iniciada",

        prazo:
          novoPrazo ||
          null,

        observacao:
          novaObservacao ||
          null,

        obrigatoria:
          novaObrigatoria,

        ordem:
          novaOrdem
            ? Number(
                novaOrdem
              )
            : null,
      });

      setMensagem(
        "Etapa criada com sucesso."
      );

      setNovoResponsavelId(
        ""
      );

      setNovoPrazo(
        ""
      );

      setNovaObservacao(
        ""
      );

      setNovaOrdem(
        ""
      );

      setNovaObrigatoria(
        true
      );

      setMostrandoFormulario(
        false
      );

      await carregarDados();
    } catch (error: any) {
      console.error(
        "Erro ao criar etapa:",
        error
      );

      if (
        error?.code ===
        "23505"
      ) {
        setErro(
          "Esta obra já possui uma etapa para o setor selecionado."
        );
      } else {
        setErro(
          error?.message ||
            "Não foi possível criar a etapa."
        );
      }
    } finally {
      setCriando(false);
    }
  }

  async function salvarEtapa(
    etapa: EtapaObra
  ) {
    const edicao =
      edicoes[
        etapa.id
      ];

    if (!edicao) {
      return;
    }

    if (
      !podeEditarEtapa(
        etapa
      )
    ) {
      setErro(
        "Você não possui permissão para alterar esta etapa."
      );

      return;
    }

    try {
      setErro("");
      setMensagem("");

      setSalvandoEtapaId(
        etapa.id
      );

      await atualizarEtapaObra(
        etapa.id,
        {
          responsavel_id:
            edicao.responsavel_id ||
            null,

          status:
            edicao.status,

          data_inicio:
            edicao.data_inicio ||
            null,

          prazo:
            edicao.prazo ||
            null,

          data_conclusao:
            edicao.status ===
            "concluida"
              ? etapa.data_conclusao ||
                new Date()
                  .toISOString()
                  .slice(
                    0,
                    10
                  )
              : null,

          observacao:
            edicao.observacao
              .trim() ||
            null,

          obrigatoria:
            edicao.obrigatoria,

          ordem:
            edicao.ordem
              ? Number(
                  edicao.ordem
                )
              : null,
        }
      );

      setMensagem(
        "Etapa atualizada com sucesso."
      );

      await carregarDados();
    } catch (error: any) {
      console.error(
        "Erro ao salvar etapa:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível atualizar a etapa."
      );
    } finally {
      setSalvandoEtapaId(
        null
      );
    }
  }

  async function executarAcaoEtapa(
    etapa: EtapaObra,
    acao:
      | "iniciar"
      | "concluir"
      | "reabrir"
  ) {
    if (
      !podeEditarEtapa(
        etapa
      )
    ) {
      setErro(
        "Você não possui permissão para alterar esta etapa."
      );

      return;
    }

    if (
      acao ===
      "concluir"
    ) {
      const confirmado =
        window.confirm(
          `Deseja concluir a etapa do setor "${
            etapa.setor?.nome ||
            "não informado"
          }"?`
        );

      if (!confirmado) {
        return;
      }
    }

    try {
      setErro("");
      setMensagem("");

      setExecutandoAcaoId(
        etapa.id
      );

      if (
        acao ===
        "iniciar"
      ) {
        await iniciarEtapaObra(
          etapa.id
        );

        setMensagem(
          "Etapa iniciada com sucesso."
        );
      }

      if (
        acao ===
        "concluir"
      ) {
        await concluirEtapaObra(
          etapa.id
        );

        setMensagem(
          "Etapa concluída com sucesso."
        );
      }

      if (
        acao ===
        "reabrir"
      ) {
        await reabrirEtapaObra(
          etapa.id
        );

        setMensagem(
          "Etapa reaberta com sucesso."
        );
      }

      await carregarDados();
    } catch (error: any) {
      console.error(
        "Erro ao alterar etapa:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível alterar a etapa."
      );
    } finally {
      setExecutandoAcaoId(
        null
      );
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />

          Carregando etapas...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Etapas da obra
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Controle o andamento, o prazo e a conclusão de cada setor separadamente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={
              carregarDados
            }
            className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />

            Atualizar
          </button>

          <button
            type="button"
            onClick={() =>
              setMostrandoFormulario(
                (
                  estadoAtual
                ) =>
                  !estadoAtual
              )
            }
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            Nova etapa
          </button>
        </div>
      </div>

      {mensagem && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />

          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {mostrandoFormulario && (
        <form
          onSubmit={
            handleCriarEtapa
          }
          className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div>
            <h3 className="text-lg font-semibold">
              Nova etapa
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Adicione um setor ao fluxo desta obra.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Setor
              </label>

              <select
                value={
                  novoSetorId
                }
                onChange={(
                  event
                ) =>
                  setNovoSetorId(
                    event.target.value
                  )
                }
                disabled={
                  !administrador
                }
                required
                className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
              >
                <option value="">
                  Selecione o setor
                </option>

                {setoresDisponiveis.map(
                  (setor) => (
                    <option
                      key={
                        setor.id
                      }
                      value={
                        setor.id
                      }
                    >
                      {setor.nome}
                    </option>
                  )
                )}
              </select>

              {!administrador && (
                <p className="text-xs text-muted-foreground">
                  Usuários comuns podem criar etapas somente para o próprio setor.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Responsável
              </label>

              <select
                value={
                  novoResponsavelId
                }
                onChange={(
                  event
                ) =>
                  setNovoResponsavelId(
                    event.target.value
                  )
                }
                disabled={
                  !novoSetorId
                }
                className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
              >
                <option value="">
                  Sem responsável definido
                </option>

                {usuariosNovoSetor.map(
                  (usuario) => (
                    <option
                      key={
                        usuario.id
                      }
                      value={
                        usuario.id
                      }
                    >
                      {usuario.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Prazo da etapa
              </label>

              <input
                type="date"
                value={
                  novoPrazo
                }
                onChange={(
                  event
                ) =>
                  setNovoPrazo(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ordem
              </label>

              <input
                type="number"
                min="1"
                value={
                  novaOrdem
                }
                onChange={(
                  event
                ) =>
                  setNovaOrdem(
                    event.target.value
                  )
                }
                placeholder="Ex.: 1"
                className="h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Observação
            </label>

            <textarea
              value={
                novaObservacao
              }
              onChange={(
                event
              ) =>
                setNovaObservacao(
                  event.target.value
                )
              }
              rows={3}
              placeholder="Informações sobre esta etapa..."
              className="w-full resize-none rounded-lg border p-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={
                novaObrigatoria
              }
              onChange={(
                event
              ) =>
                setNovaObrigatoria(
                  event.target.checked
                )
              }
              className="h-4 w-4 cursor-pointer"
            />

            Etapa obrigatória para concluir a obra
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                setMostrandoFormulario(
                  false
                )
              }
              className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                criando ||
                !novoSetorId
              }
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {criando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              Criar etapa
            </button>
          </div>
        </form>
      )}

      {etapas.length ===
      0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <Clock3 className="mx-auto h-10 w-10 text-muted-foreground" />

          <p className="mt-4 font-medium">
            Nenhuma etapa cadastrada
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Adicione os setores que participarão desta obra.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {etapas.map(
            (
              etapa,
              indice
            ) => {
              const edicao =
                edicoes[
                  etapa.id
                ];

              if (!edicao) {
                return null;
              }

              const podeEditar =
                podeEditarEtapa(
                  etapa
                );

              const usuariosDoSetor =
                usuarios.filter(
                  (usuario) =>
                    usuario.setor_id ===
                    etapa.setor_id
                );

              const salvando =
                salvandoEtapaId ===
                etapa.id;

              const executando =
                executandoAcaoId ===
                etapa.id;

              return (
                <article
                  key={
                    etapa.id
                  }
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                          {etapa.ordem ??
                            indice +
                              1}
                        </span>

                        <div>
                          <h3 className="text-lg font-semibold">
                            {etapa.setor
                              ?.nome ||
                              "Setor não informado"}
                          </h3>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {etapa.obrigatoria
                              ? "Etapa obrigatória"
                              : "Etapa opcional"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseStatus(
                        etapa.status
                      )}`}
                    >
                      {obterLabelStatus(
                        etapa.status
                      )}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />

                        Início
                      </div>

                      <p className="mt-2 text-sm font-semibold">
                        {formatarData(
                          etapa.data_inicio
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock3 className="h-4 w-4" />

                        Prazo
                      </div>

                      <p className="mt-2 text-sm font-semibold">
                        {formatarData(
                          etapa.prazo
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />

                        Conclusão
                      </div>

                      <p className="mt-2 text-sm font-semibold">
                        {formatarData(
                          etapa.data_conclusao
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Status
                      </label>

                      <select
                        value={
                          edicao.status
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarEdicao(
                            etapa.id,
                            "status",
                            event.target
                              .value as StatusEtapaObra
                          )
                        }
                        disabled={
                          !podeEditar
                        }
                        className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
                      >
                        {opcoesStatus.map(
                          (
                            opcao
                          ) => (
                            <option
                              key={
                                opcao.valor
                              }
                              value={
                                opcao.valor
                              }
                            >
                              {
                                opcao.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Responsável
                      </label>

                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <select
                          value={
                            edicao.responsavel_id
                          }
                          onChange={(
                            event
                          ) =>
                            atualizarEdicao(
                              etapa.id,
                              "responsavel_id",
                              event.target.value
                            )
                          }
                          disabled={
                            !podeEditar
                          }
                          className="h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
                        >
                          <option value="">
                            Sem responsável definido
                          </option>

                          {usuariosDoSetor.map(
                            (
                              usuario
                            ) => (
                              <option
                                key={
                                  usuario.id
                                }
                                value={
                                  usuario.id
                                }
                              >
                                {
                                  usuario.nome
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Data de início
                      </label>

                      <input
                        type="date"
                        value={
                          edicao.data_inicio
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarEdicao(
                            etapa.id,
                            "data_inicio",
                            event.target.value
                          )
                        }
                        disabled={
                          !podeEditar
                        }
                        className="h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Prazo da etapa
                      </label>

                      <input
                        type="date"
                        value={
                          edicao.prazo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarEdicao(
                            etapa.id,
                            "prazo",
                            event.target.value
                          )
                        }
                        disabled={
                          !podeEditar
                        }
                        className="h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Ordem
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={
                          edicao.ordem
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarEdicao(
                            etapa.id,
                            "ordem",
                            event.target.value
                          )
                        }
                        disabled={
                          !podeEditar
                        }
                        className="h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
                      />
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 self-end pb-3 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          edicao.obrigatoria
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarEdicao(
                            etapa.id,
                            "obrigatoria",
                            event.target.checked
                          )
                        }
                        disabled={
                          !podeEditar
                        }
                        className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                      />

                      Etapa obrigatória
                    </label>
                  </div>

                  <div className="mt-5 space-y-2">
                    <label className="text-sm font-medium">
                      Observação
                    </label>

                    <textarea
                      value={
                        edicao.observacao
                      }
                      onChange={(
                        event
                      ) =>
                        atualizarEdicao(
                          etapa.id,
                          "observacao",
                          event.target.value
                        )
                      }
                      disabled={
                        !podeEditar
                      }
                      rows={3}
                      className="w-full resize-none rounded-lg border p-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                    {!podeEditar ? (
                      <p className="text-xs text-muted-foreground">
                        Somente usuários deste setor ou administradores podem alterar esta etapa.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {etapa.status ===
                          "nao_iniciada" && (
                          <button
                            type="button"
                            onClick={() =>
                              executarAcaoEtapa(
                                etapa,
                                "iniciar"
                              )
                            }
                            disabled={
                              executando
                            }
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CirclePlay className="h-4 w-4" />

                            Iniciar etapa
                          </button>
                        )}

                        {etapa.status !==
                          "concluida" && (
                          <button
                            type="button"
                            onClick={() =>
                              executarAcaoEtapa(
                                etapa,
                                "concluir"
                              )
                            }
                            disabled={
                              executando
                            }
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />

                            Concluir etapa
                          </button>
                        )}

                        {etapa.status ===
                          "concluida" && (
                          <button
                            type="button"
                            onClick={() =>
                              executarAcaoEtapa(
                                etapa,
                                "reabrir"
                              )
                            }
                            disabled={
                              executando
                            }
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RotateCcw className="h-4 w-4" />

                            Reabrir etapa
                          </button>
                        )}
                      </div>
                    )}

                    {podeEditar && (
                      <button
                        type="button"
                        onClick={() =>
                          salvarEtapa(
                            etapa
                          )
                        }
                        disabled={
                          salvando ||
                          executando
                        }
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {salvando ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}

                        Salvar alterações
                      </button>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}