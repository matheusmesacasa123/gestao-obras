import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CirclePause,
  Clock3,
  Loader2,
  Plus,
  ShieldAlert,
  Layers3,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  PrioridadeDemanda,
  StatusDemanda,
} from "@/features/execucao-obras/demandas/types";

interface SetorOpcao {
  id: string;
  nome: string;
}

interface UsuarioOpcao {
  id: string;
  nome: string;
  email: string;
  setor_id: string | null;
}

interface EtapaOpcao {
  id: string;
  obra_id: string;
  setor_id: string;
  titulo: string | null;
  ordem: number | null;
  status: string;
  prazo: string | null;
  setor:
    | {
        id: string;
        nome: string;
      }
    | null;
}

interface ObraPermissao {
  id: string;
  setor_id: string | null;
  codigo: string | null;
  nome_obra: string | null;
  setor:
    | {
        id: string;
        nome: string;
      }
    | null;
}

interface NovoItemChecklist {
  idTemporario: string;
  titulo: string;
  concluido: boolean;
}

export const Route =
  createFileRoute(
    "/_authenticated/execucao-obras/$id/demandas/nova"
  )({
    component:
      NovaDemandaPage,
  });

function converterParaDataLocal(
  data?: string | null
): Date | null {
  if (!data) {
    return null;
  }

  const [
    ano,
    mes,
    dia,
  ] = data
    .split("-")
    .map(Number);

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return null;
  }

  const resultado =
    new Date(
      ano,
      mes - 1,
      dia
    );

  resultado.setHours(
    0,
    0,
    0,
    0
  );

  return resultado;
}

function obterStatusAutomatico(
  cancelada: boolean,
  dataInicio: string,
  dataConclusao: string
): StatusDemanda {
  if (cancelada) {
    return "cancelada";
  }

  if (dataConclusao) {
    return "concluida";
  }

  if (dataInicio) {
    return "em_andamento";
  }

  return "aberta";
}

function obterStatusVisual(
  status: StatusDemanda
) {
  switch (status) {
    case "em_andamento":
      return {
        label:
          "Em andamento",

        className:
          "border-blue-200 bg-blue-50 text-blue-700",

        icone:
          Clock3,
      };

    case "concluida":
      return {
        label:
          "Finalizada",

        className:
          "border-green-200 bg-green-50 text-green-700",

        icone:
          CheckCircle2,
      };

    case "cancelada":
      return {
        label:
          "Cancelada",

        className:
          "border-red-200 bg-red-50 text-red-700",

        icone:
          XCircle,
      };

    default:
      return {
        label:
          "Aguardando início",

        className:
          "border-slate-200 bg-slate-50 text-slate-700",

        icone:
          CirclePause,
      };
  }
}


function formatarNomeEtapa(
  etapa: EtapaOpcao
): string {
  const partes = [
    etapa.ordem !== null &&
    etapa.ordem !== undefined
      ? `Etapa ${etapa.ordem}`
      : null,

    etapa.titulo ||
      "Sem título",

    etapa.setor?.nome ||
      "Setor não informado",
  ].filter(Boolean);

  return partes.join(
    " — "
  );
}

function NovaDemandaPage() {
  const {
    id,
  } = Route.useParams();

  const navigate =
    useNavigate();

  const {
    perfil,
  } = useAuth();

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    prioridade,
    setPrioridade,
  ] =
    useState<PrioridadeDemanda>(
      "media"
    );

  const [
    setorId,
    setSetorId,
  ] = useState("");

  const [
    etapaId,
    setEtapaId,
  ] = useState("");

  const [
    etapas,
    setEtapas,
  ] = useState<EtapaOpcao[]>(
    []
  );

  const [
    carregandoEtapas,
    setCarregandoEtapas,
  ] = useState(true);

  const [
    responsavelId,
    setResponsavelId,
  ] = useState("");

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
    obra,
    setObra,
  ] =
    useState<ObraPermissao | null>(
      null
    );

  const [
    dataInicio,
    setDataInicio,
  ] = useState("");

  const [
    dataConclusao,
    setDataConclusao,
  ] = useState("");

  const [
    motivoAtraso,
    setMotivoAtraso,
  ] = useState("");

  const [
    cancelada,
    setCancelada,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    itensChecklist,
    setItensChecklist,
  ] = useState<NovoItemChecklist[]>(
    []
  );

  const [
    novoItemChecklist,
    setNovoItemChecklist,
  ] = useState("");

  const [
    carregandoPermissao,
    setCarregandoPermissao,
  ] = useState(true);

  const [
    carregandoSetores,
    setCarregandoSetores,
  ] = useState(true);

  const [
    carregandoUsuarios,
    setCarregandoUsuarios,
  ] = useState(false);

  const [
    erroOpcoes,
    setErroOpcoes,
  ] = useState("");

  const [
    erroPermissao,
    setErroPermissao,
  ] = useState("");

  const administrador =
    perfil?.administrador ===
    true;

  const podeCriarDemanda =
    administrador ||
    Boolean(
      perfil?.setor_id
    );

  useEffect(() => {
    async function carregarPermissao() {
      try {
        setCarregandoPermissao(
          true
        );

        setErroPermissao("");

        const {
          data,
          error,
        } = await supabase
          .from("obras_execucao")
          .select(`
            id,
            setor_id,
            codigo,
            nome_obra,
            setor:setores (
              id,
              nome
            )
          `)
          .eq(
            "id",
            id
          )
          .single();

        if (error) {
          throw error;
        }

        setObra(
          data as ObraPermissao
        );
      } catch (error) {
        console.error(
          "Erro ao carregar dados da obra:",
          error
        );

        setObra(
          null
        );

        setErroPermissao(
          "Não foi possível carregar os dados da obra."
        );
      } finally {
        setCarregandoPermissao(
          false
        );
      }
    }

    carregarPermissao();
  }, [
    id,
  ]);

  useEffect(() => {
    async function carregarSetores() {
      try {
        setCarregandoSetores(
          true
        );

        setErroOpcoes("");

        let consulta =
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
            );

        if (
          !administrador &&
          perfil?.setor_id
        ) {
          consulta =
            consulta.eq(
              "id",
              perfil.setor_id
            );
        }

        const {
          data,
          error,
        } = await consulta;

        if (error) {
          throw error;
        }

        const setoresEncontrados =
          (
            data ??
            []
          ) as SetorOpcao[];

        setSetores(
          setoresEncontrados
        );

        if (
          administrador
        ) {
          setSetorId(
            (
              setorAtual
            ) => {
              if (
                setorAtual
              ) {
                return setorAtual;
              }

              return (
                obra?.setor_id ||
                ""
              );
            }
          );

          return;
        }

        if (
          perfil?.setor_id
        ) {
          setSetorId(
            perfil.setor_id
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar setores:",
          error
        );

        setSetores(
          []
        );

        setErroOpcoes(
          "Não foi possível carregar os setores."
        );
      } finally {
        setCarregandoSetores(
          false
        );
      }
    }

    if (
      carregandoPermissao
    ) {
      return;
    }

    carregarSetores();
  }, [
    administrador,
    perfil?.setor_id,
    obra?.setor_id,
    carregandoPermissao,
  ]);

  useEffect(() => {
    async function carregarEtapasDaObra() {
      try {
        setCarregandoEtapas(
          true
        );

        setErroOpcoes("");

        const {
          data,
          error,
        } = await supabase
          .from("etapas_obras_execucao")
          .select(`
            id,
            obra_id,
            setor_id,
            titulo,
            ordem,
            status,
            prazo,
            setor:setores (
              id,
              nome
            )
          `)
          .eq(
            "obra_id",
            id
          )
          .order(
            "ordem",
            {
              ascending:
                true,
            }
          );

        if (error) {
          throw error;
        }

        const etapasEncontradas =
          (
            data ??
            []
          ) as unknown as EtapaOpcao[];

        const etapasPermitidas =
          administrador
            ? etapasEncontradas
            : etapasEncontradas.filter(
                (
                  etapa
                ) =>
                  etapa.setor_id ===
                  perfil?.setor_id
              );

        setEtapas(
          etapasPermitidas
        );

        setEtapaId(
          (
            etapaAtual
          ) => {
            const etapaAindaExiste =
              etapasPermitidas.some(
                (
                  etapa
                ) =>
                  etapa.id ===
                  etapaAtual
              );

            if (
              etapaAindaExiste
            ) {
              return etapaAtual;
            }

            return (
              etapasPermitidas[0]?.id ||
              ""
            );
          }
        );

        const primeiraEtapa =
          etapasPermitidas[0];

        if (
          primeiraEtapa
        ) {
          setSetorId(
            primeiraEtapa.setor_id
          );
        } else {
          setSetorId("");
        }

        if (
          etapasPermitidas.length ===
          0
        ) {
          setErroOpcoes(
            administrador
              ? "Nenhuma etapa foi cadastrada nesta execução."
              : "Nenhuma etapa desta execução está disponível para o seu setor."
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar etapas da execução:",
          error
        );

        setEtapas([]);
        setEtapaId("");
        setSetorId("");

        setErroOpcoes(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as etapas da execução."
        );
      } finally {
        setCarregandoEtapas(
          false
        );
      }
    }

    carregarEtapasDaObra();
  }, [
    id,
    administrador,
    perfil?.setor_id,
  ]);


  useEffect(() => {
    if (!setorId) {
      setUsuarios([]);
      setResponsavelId("");

      return;
    }

    async function carregarUsuarios() {
      try {
        setCarregandoUsuarios(
          true
        );

        setErroOpcoes("");

        const {
          data,
          error,
        } = await supabase
          .from("usuarios")
          .select(
            "id, nome, email, setor_id"
          )
          .eq(
            "setor_id",
            setorId
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

        const usuariosEncontrados =
          (
            data ??
            []
          ) as UsuarioOpcao[];

        setUsuarios(
          usuariosEncontrados
        );

        setResponsavelId(
          (
            responsavelAtual
          ) => {
            const responsavelValido =
              usuariosEncontrados.some(
                (
                  usuario
                ) =>
                  usuario.id ===
                  responsavelAtual
              );

            return responsavelValido
              ? responsavelAtual
              : "";
          }
        );
      } catch (error) {
        console.error(
          "Erro ao carregar usuários:",
          error
        );

        setUsuarios([]);
        setResponsavelId("");

        setErroOpcoes(
          "Não foi possível carregar os usuários do setor."
        );
      } finally {
        setCarregandoUsuarios(
          false
        );
      }
    }

    carregarUsuarios();
  }, [
    setorId,
  ]);

  const statusAutomatico =
    useMemo(
      () =>
        obterStatusAutomatico(
          cancelada,
          dataInicio,
          dataConclusao
        ),
      [
        cancelada,
        dataInicio,
        dataConclusao,
      ]
    );

  const statusVisual =
    obterStatusVisual(
      statusAutomatico
    );

  const StatusIcon =
    statusVisual.icone;

  const prazoEtapaSelecionada =
    useMemo(
      () =>
        etapas.find(
          (
            etapa
          ) =>
            etapa.id ===
            etapaId
        )?.prazo ||
        "",
      [
        etapas,
        etapaId,
      ]
    );

  const finalizadaComAtraso =
    useMemo(() => {
      const dataPrazo =
        converterParaDataLocal(
          prazoEtapaSelecionada
        );

      const dataFinal =
        converterParaDataLocal(
          dataConclusao
        );

      return Boolean(
        dataPrazo &&
          dataFinal &&
          dataFinal >
            dataPrazo
      );
    }, [
      prazoEtapaSelecionada,
      dataConclusao,
    ]);

  const demandaAtrasada =
    useMemo(() => {
      if (
        statusAutomatico ===
          "concluida" ||
        statusAutomatico ===
          "cancelada"
      ) {
        return false;
      }

      const dataPrazo =
        converterParaDataLocal(
          prazoEtapaSelecionada
        );

      if (!dataPrazo) {
        return false;
      }

      const hoje =
        new Date();

      hoje.setHours(
        0,
        0,
        0,
        0
      );

      return (
        dataPrazo <
        hoje
      );
    }, [
      prazoEtapaSelecionada,
      statusAutomatico,
    ]);

  const deveInformarMotivo =
    demandaAtrasada ||
    finalizadaComAtraso;

  const totalItensChecklist =
    itensChecklist.length;

  const totalItensConcluidos =
    itensChecklist.filter(
      (
        item
      ) =>
        item.concluido
    ).length;

  const checklistCompleto =
    totalItensChecklist ===
      0 ||
    totalItensConcluidos ===
      totalItensChecklist;

  function adicionarItemChecklist() {
    const tituloTratado =
      novoItemChecklist.trim();

    if (!tituloTratado) {
      return;
    }

    setItensChecklist(
      (
        itensAtuais
      ) => [
        ...itensAtuais,
        {
          idTemporario:
            crypto.randomUUID(),

          titulo:
            tituloTratado,

          concluido:
            false,
        },
      ]
    );

    setNovoItemChecklist(
      ""
    );
  }

  function alternarItemChecklist(
    idTemporario: string
  ) {
    setItensChecklist(
      (
        itensAtuais
      ) =>
        itensAtuais.map(
          (
            item
          ) =>
            item.idTemporario ===
              idTemporario
              ? {
                  ...item,
                  concluido:
                    !item.concluido,
                }
              : item
        )
    );
  }

  function removerItemChecklist(
    idTemporario: string
  ) {
    setItensChecklist(
      (
        itensAtuais
      ) =>
        itensAtuais.filter(
          (
            item
          ) =>
            item.idTemporario !==
            idTemporario
        )
    );
  }

  function voltarParaDemandas() {
    navigate({
      to:
        "/execucao-obras/$id/demandas",

      params: {
        id,
      },
    });
  }

  function handleAlterarEtapa(
    novaEtapaId: string
  ) {
    setEtapaId(
      novaEtapaId
    );

    const etapaSelecionada =
      etapas.find(
        (etapa) =>
          etapa.id ===
          novaEtapaId
      );

    if (!etapaSelecionada) {
      return;
    }

    setSetorId(
      etapaSelecionada.setor_id
    );

    setResponsavelId("");
  }

  function handleAlterarSetor(
    novoSetorId: string
  ) {
    if (
      !administrador
    ) {
      return;
    }

    setSetorId(
      novoSetorId
    );

    setResponsavelId("");
  }

  function handleAlterarInicio(
    valor: string
  ) {
    setCancelada(false);

    setDataInicio(
      valor
    );

    if (
      !valor &&
      dataConclusao
    ) {
      setDataConclusao("");
    }
  }

  function handleAlterarConclusao(
    valor: string
  ) {
    setCancelada(false);

    setDataConclusao(
      valor
    );

    if (
      valor &&
      !dataInicio
    ) {
      setDataInicio(
        valor
      );
    }
  }

  async function criarDemanda(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      carregandoPermissao
    ) {
      return;
    }

    if (
      !podeCriarDemanda
    ) {
      alert(
        "Você não possui permissão para criar demandas nesta execução."
      );

      return;
    }

    if (
      !administrador &&
      setorId !==
        perfil?.setor_id
    ) {
      alert(
        "Você só pode criar demandas para o seu próprio setor."
      );

      return;
    }

    if (
      !titulo.trim()
    ) {
      alert(
        "Informe o título da demanda."
      );

      return;
    }

    if (!etapaId) {
      alert(
        "Selecione a etapa à qual esta demanda pertence."
      );

      return;
    }

    if (!setorId) {
      alert(
        "A etapa selecionada não possui um setor válido."
      );

      return;
    }

    if (
      dataConclusao &&
      !checklistCompleto
    ) {
      alert(
        `Conclua todos os itens do checklist antes de criar a demanda como finalizada. Restam ${
          totalItensChecklist -
          totalItensConcluidos
        } item(ns).`
      );

      return;
    }

    if (
      dataInicio &&
      dataConclusao
    ) {
      const inicio =
        converterParaDataLocal(
          dataInicio
        );

      const conclusao =
        converterParaDataLocal(
          dataConclusao
        );

      if (
        inicio &&
        conclusao &&
        conclusao <
          inicio
      ) {
        alert(
          "A data de conclusão não pode ser anterior à data de início."
        );

        return;
      }
    }

    if (
      deveInformarMotivo &&
      !motivoAtraso.trim()
    ) {
      alert(
        "Informe o motivo do atraso."
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data: respostaAuth,
        error: erroAuth,
      } =
        await supabase.auth.getUser();

      if (
        erroAuth ||
        !respostaAuth.user
      ) {
        throw (
          erroAuth ||
          new Error(
            "Usuário não autenticado."
          )
        );
      }

      const {
        data: demandaCriada,
        error,
      } = await supabase
        .from("demandas_obras_execucao")
        .insert({
          obra_id:
            id,

          etapa_id:
            etapaId,

          titulo:
            titulo.trim(),

          descricao:
            descricao.trim() ||
            null,

          status:
            statusAutomatico,

          prioridade,

          setor_id:
            setorId,

          responsavel_id:
            responsavelId ||
            null,

          data_inicio:
            dataInicio ||
            null,

          data_conclusao:
            dataConclusao ||
            null,

          motivo_atraso:
            deveInformarMotivo
              ? motivoAtraso.trim()
              : null,

          criado_por:
            respostaAuth.user.id,
        })
        .select(
          "id"
        )
        .single();

      if (
        error ||
        !demandaCriada
      ) {
        throw (
          error ||
          new Error(
            "A demanda foi criada sem retornar um identificador."
          )
        );
      }

      if (
        itensChecklist.length >
        0
      ) {
        const agora =
          new Date()
            .toISOString()
            .slice(
              0,
              10
            );

        const {
          error:
            erroItens,
        } = await supabase
          .from("demanda_itens_obras_execucao")
          .insert(
            itensChecklist.map(
              (
                item,
                indice
              ) => ({
                demanda_id:
                  demandaCriada.id,

                titulo:
                  item.titulo,

                concluido:
                  item.concluido,

                ordem:
                  indice +
                  1,

                data_conclusao:
                  item.concluido
                    ? agora
                    : null,
              })
            )
          );

        if (erroItens) {
          await supabase
            .from("demandas_obras_execucao")
            .delete()
            .eq(
              "id",
              demandaCriada.id
            );

          throw erroItens;
        }
      }

      voltarParaDemandas();
    } catch (error) {
      console.error(
        "Erro ao criar demanda:",
        error
      );

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido.";

      alert(
        `Erro ao criar a demanda: ${mensagem}`
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    carregandoPermissao
  ) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />

          Carregando dados da obra...
        </div>
      </div>
    );
  }

  if (
    erroPermissao ||
    !obra
  ) {
    return (
      <div className="space-y-5 rounded-2xl border border-red-200 bg-red-50 p-8">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />

          <div>
            <h1 className="text-xl font-bold text-red-900">
              Não foi possível carregar a obra
            </h1>

            <p className="mt-1 text-sm text-red-700">
              {erroPermissao ||
                "A obra não foi encontrada."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            voltarParaDemandas
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          <ArrowLeft className="h-4 w-4" />

          Voltar para demandas
        </button>
      </div>
    );
  }

  if (
    !podeCriarDemanda
  ) {
    return (
      <div className="space-y-5 rounded-2xl border border-amber-200 bg-amber-50 p-8">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />

          <div>
            <h1 className="text-xl font-bold text-amber-900">
              Criação de demanda não permitida
            </h1>

            <p className="mt-1 text-sm text-amber-800">
              Para criar uma demanda, o usuário precisa estar vinculado a um setor. Administradores podem criar demandas para qualquer setor.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            voltarParaDemandas
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
        >
          <ArrowLeft className="h-4 w-4" />

          Voltar para demandas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={
          voltarParaDemandas
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />

        Voltar para demandas
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Nova demanda
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Cadastre uma nova atividade para a execução desta obra.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusVisual.className}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />

          {
            statusVisual.label
          }
        </span>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        A demanda será vinculada à{" "}
        <strong>
          {etapas.find(
            (
              etapa
            ) =>
              etapa.id ===
              etapaId
          )
            ? formatarNomeEtapa(
                etapas.find(
                  (
                    etapa
                  ) =>
                    etapa.id ===
                    etapaId
                )!
              )
            : "etapa selecionada"}
        </strong>
        {" "}e ao setor{" "}
        <strong>
          {setores.find(
            (
              setor
            ) =>
              setor.id ===
              setorId
          )?.nome ||
            "da etapa selecionada"}
        </strong>
        .
      </div>

      {erroOpcoes && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {
            erroOpcoes
          }
        </div>
      )}

      <form
        onSubmit={
          criarDemanda
        }
        className="space-y-6"
      >
        <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Informações da demanda
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Informe os dados principais, setor e responsável.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="nova-demanda-titulo"
              className="text-sm font-semibold text-gray-700"
            >
              Título
            </label>

            <input
              id="nova-demanda-titulo"
              value={
                titulo
              }
              onChange={(
                event
              ) =>
                setTitulo(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Ex.: Projeto hidráulico"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="nova-demanda-descricao"
              className="text-sm font-semibold text-gray-700"
            >
              Descrição
            </label>

            <textarea
              id="nova-demanda-descricao"
              value={
                descricao
              }
              onChange={(
                event
              ) =>
                setDescricao(
                  event.target.value
                )
              }
              rows={4}
              className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Descreva a atividade"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="nova-demanda-etapa"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700"
              >
                <Layers3 className="h-4 w-4 text-gray-500" />

                Etapa da obra *
              </label>

              <select
                id="nova-demanda-etapa"
                value={
                  etapaId
                }
                onChange={(
                  event
                ) =>
                  handleAlterarEtapa(
                    event.target.value
                  )
                }
                disabled={
                  carregandoEtapas ||
                  etapas.length ===
                    0
                }
                required
                className="h-11 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {carregandoEtapas
                    ? "Carregando etapas..."
                    : etapas.length === 0
                      ? "Nenhuma etapa disponível"
                      : "Selecione a etapa"}
                </option>

                {etapas.map(
                  (
                    etapa
                  ) => (
                    <option
                      key={
                        etapa.id
                      }
                      value={
                        etapa.id
                      }
                    >
                      {formatarNomeEtapa(
                        etapa
                      )}
                    </option>
                  )
                )}
              </select>

              <p className="text-xs text-gray-500">
                Selecione a etapa à qual esta demanda pertencerá.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="nova-demanda-setor"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700"
              >
                <Building2 className="h-4 w-4 text-gray-500" />

                Setor responsável
              </label>

              <select
                id="nova-demanda-setor"
                value={
                  setorId
                }
                onChange={(
                  event
                ) =>
                  handleAlterarSetor(
                    event.target.value
                  )
                }
                disabled={
                  true
                }
                required
                className="h-11 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {carregandoSetores
                    ? "Carregando setores..."
                    : "Selecione o setor"}
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
              </select>

              <p className="text-xs text-gray-500">
                O setor é definido automaticamente pela etapa selecionada.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="nova-demanda-responsavel"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700"
              >
                <UserRound className="h-4 w-4 text-gray-500" />

                Responsável
              </label>

              <select
                id="nova-demanda-responsavel"
                value={
                  responsavelId
                }
                onChange={(
                  event
                ) =>
                  setResponsavelId(
                    event.target.value
                  )
                }
                disabled={
                  !setorId ||
                  carregandoUsuarios
                }
                className="h-11 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {!setorId
                    ? "Selecione primeiro o setor"
                    : carregandoUsuarios
                      ? "Carregando pessoas..."
                      : "Sem responsável definido"}
                </option>

                {usuarios.map(
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

              {setorId &&
                !carregandoUsuarios &&
                usuarios.length ===
                  0 && (
                  <p className="text-xs text-amber-700">
                    Nenhum usuário ativo foi encontrado neste setor.
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="nova-demanda-prioridade"
                className="text-sm font-semibold text-gray-700"
              >
                Prioridade
              </label>

              <select
                id="nova-demanda-prioridade"
                value={
                  prioridade
                }
                onChange={(
                  event
                ) =>
                  setPrioridade(
                    event.target
                      .value as PrioridadeDemanda
                  )
                }
                className="h-11 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="baixa">
                  Baixa
                </option>

                <option value="media">
                  Média
                </option>

                <option value="alta">
                  Alta
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Data de inclusão
              </span>

              <div className="flex h-11 items-center gap-2 rounded-xl border bg-slate-50 px-3 text-sm font-medium text-slate-700">
                <CalendarDays className="h-4 w-4 text-slate-500" />

                Registrada automaticamente
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Checklist da demanda
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Adicione as tarefas menores que fazem parte desta demanda.
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                checklistCompleto &&
                totalItensChecklist >
                  0
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {totalItensConcluidos} de {totalItensChecklist} concluído(s)
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={
                novoItemChecklist
              }
              onChange={(
                event
              ) =>
                setNovoItemChecklist(
                  event.target.value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();

                  adicionarItemChecklist();
                }
              }}
              placeholder="Ex.: Calcular bombas"
              className="h-11 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={
                adicionarItemChecklist
              }
              disabled={
                !novoItemChecklist.trim()
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />

              Adicionar item
            </button>
          </div>

          {itensChecklist.length ===
          0 ? (
            <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-center text-sm text-gray-500">
              Nenhum item adicionado. O checklist é opcional.
            </div>
          ) : (
            <div className="space-y-2">
              {itensChecklist.map(
                (
                  item,
                  indice
                ) => (
                  <div
                    key={
                      item.idTemporario
                    }
                    className="flex items-center gap-3 rounded-xl border bg-slate-50 px-3 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={
                        item.concluido
                      }
                      onChange={() =>
                        alternarItemChecklist(
                          item.idTemporario
                        )
                      }
                      className="h-4 w-4 cursor-pointer"
                    />

                    <span className="text-xs font-semibold text-gray-400">
                      {indice +
                        1}.
                    </span>

                    <span
                      className={`min-w-0 flex-1 text-sm ${
                        item.concluido
                          ? "text-gray-400 line-through"
                          : "font-medium text-gray-800"
                      }`}
                    >
                      {item.titulo}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removerItemChecklist(
                          item.idTemporario
                        )
                      }
                      title="Excluir item"
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {totalItensChecklist >
            0 &&
            !checklistCompleto && (
              <p className="text-xs font-medium text-amber-700">
                Depois de criada, a demanda só poderá ser finalizada quando todos os itens forem concluídos.
              </p>
            )}
        </section>

        <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Execução e prazos
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              O status será definido automaticamente pelas datas.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="nova-demanda-data-inicio"
                className="text-sm font-semibold text-gray-700"
              >
                Data de início
              </label>

              <input
                id="nova-demanda-data-inicio"
                type="date"
                value={
                  dataInicio
                }
                onChange={(
                  event
                ) =>
                  handleAlterarInicio(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="nova-demanda-data-conclusao"
                className="text-sm font-semibold text-gray-700"
              >
                Data de conclusão
              </label>

              <input
                id="nova-demanda-data-conclusao"
                type="date"
                value={
                  dataConclusao
                }
                onChange={(
                  event
                ) =>
                  handleAlterarConclusao(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <span className="font-semibold">
              Prazo da demanda:
            </span>{" "}
            será definido automaticamente pelo prazo da etapa selecionada
            {prazoEtapaSelecionada
              ? ` (${new Intl.DateTimeFormat(
                  "pt-BR"
                ).format(
                  converterParaDataLocal(
                    prazoEtapaSelecionada
                  )!
                )})`
              : "."}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={
                cancelada
              }
              onChange={(
                event
              ) =>
                setCancelada(
                  event.target.checked
                )
              }
              className="mt-0.5 h-4 w-4 cursor-pointer"
            />

            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Criar como cancelada
              </span>

              <span className="mt-0.5 block text-xs text-gray-500">
                O cancelamento tem prioridade sobre as datas informadas.
              </span>
            </span>
          </label>

          {finalizadaComAtraso && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              A data de conclusão está depois do prazo. A demanda será criada como finalizada com atraso.
            </div>
          )}
        </section>

        {deveInformarMotivo && (
          <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div>
              <label
                htmlFor="nova-demanda-motivo-atraso"
                className="text-sm font-semibold text-amber-900"
              >
                Motivo do atraso
              </label>

              <p className="mt-1 text-xs text-amber-700">
                Obrigatório para demandas atrasadas ou concluídas depois do prazo.
              </p>
            </div>

            <textarea
              id="nova-demanda-motivo-atraso"
              value={
                motivoAtraso
              }
              onChange={(
                event
              ) =>
                setMotivoAtraso(
                  event.target.value
                )
              }
              required
              rows={3}
              className="w-full resize-y rounded-xl border border-amber-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              placeholder="Ex.: aguardando aprovação do cliente."
            />
          </section>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={
              voltarParaDemandas
            }
            disabled={
              loading
            }
            className="inline-flex h-11 items-center justify-center rounded-xl border bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={
              loading ||
              carregandoSetores ||
              carregandoUsuarios ||
              carregandoEtapas ||
              !etapaId ||
              !setorId
            }
            className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-6 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Criando..."
              : "Criar demanda"}
          </button>
        </div>
      </form>
    </div>
  );
}