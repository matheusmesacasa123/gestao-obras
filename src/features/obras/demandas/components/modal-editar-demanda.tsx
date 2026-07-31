import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CirclePause,
  Clock3,
  ShieldAlert,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import * as Dialog from "@radix-ui/react-dialog";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  Demanda,
  PrioridadeDemanda,
  StatusDemanda,
} from "../types";

import {
  updateDemanda,
} from "../services/demandas-service";

interface ModalEditarDemandaProps {
  demanda: Demanda | null;
  obraId: string;
  obraSetorId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

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

interface RegistroSetor {
  setor_id: string | null;
}

function obterSomenteData(
  data?: string | null
): string {
  if (!data) {
    return "";
  }

  return data.split("T")[0];
}

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
  ] = obterSomenteData(data)
    .split("-")
    .map(Number);

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return null;
  }

  const dataLocal =
    new Date(
      ano,
      mes - 1,
      dia
    );

  dataLocal.setHours(
    0,
    0,
    0,
    0
  );

  return dataLocal;
}

function formatarDataHora(
  data?: string | null
): string {
  if (!data) {
    return "Não informado";
  }

  const dataConvertida =
    new Date(data);

  if (
    Number.isNaN(
      dataConvertida.getTime()
    )
  ) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  ).format(
    dataConvertida
  );
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

function ModalEditarDemanda({
  demanda,
  obraId,
  obraSetorId,
  onClose,
  onSuccess,
}: ModalEditarDemandaProps) {
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
    carregandoSetores,
    setCarregandoSetores,
  ] = useState(false);

  const [
    carregandoUsuarios,
    setCarregandoUsuarios,
  ] = useState(false);

  const [
    erroOpcoes,
    setErroOpcoes,
  ] = useState("");

  const [
    prazo,
    setPrazo,
  ] = useState("");

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
    salvando,
    setSalvando,
  ] = useState(false);

  const administrador =
    perfil?.administrador ===
    true;

  const demandaDoMeuSetor =
    Boolean(
      perfil?.setor_id &&
      demanda?.setor_id &&
      perfil.setor_id ===
        demanda.setor_id
    );

  const obraNoMeuSetor =
    Boolean(
      perfil?.setor_id &&
      obraSetorId &&
      perfil.setor_id ===
        obraSetorId
    );

  const podeEditar =
    administrador ||
    (
      demandaDoMeuSetor &&
      obraNoMeuSetor
    );

  useEffect(() => {
    if (!demanda) {
      return;
    }

    setTitulo(
      demanda.titulo ??
        ""
    );

    setDescricao(
      demanda.descricao ??
        ""
    );

    setPrioridade(
      demanda.prioridade ??
        "media"
    );

    setSetorId(
      demanda.setor_id ??
        demanda.responsavel
          ?.setor_id ??
        ""
    );

    setResponsavelId(
      demanda.responsavel_id ??
        ""
    );

    setPrazo(
      obterSomenteData(
        demanda.prazo
      )
    );

    setDataInicio(
      obterSomenteData(
        demanda.data_inicio
      )
    );

    setDataConclusao(
      obterSomenteData(
        demanda.data_conclusao
      )
    );

    setMotivoAtraso(
      demanda.motivo_atraso ??
        ""
    );

    setCancelada(
      demanda.status ===
        "cancelada"
    );
  }, [
    demanda,
  ]);

  useEffect(() => {
    if (
      !demanda ||
      !podeEditar
    ) {
      return;
    }

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

        setSetores(
          (
            data ??
            []
          ) as SetorOpcao[]
        );
      } catch (error) {
        console.error(
          "Erro ao carregar setores:",
          error
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

    carregarSetores();
  }, [
    demanda,
    podeEditar,
    administrador,
    perfil?.setor_id,
  ]);

  useEffect(() => {
    if (
      !demanda ||
      !podeEditar
    ) {
      return;
    }

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
            if (
              !responsavelAtual
            ) {
              return "";
            }

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
          "Erro ao carregar usuários do setor:",
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
    demanda,
    setorId,
    podeEditar,
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

  const finalizadaComAtraso =
    useMemo(() => {
      const dataPrazo =
        converterParaDataLocal(
          prazo
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
      prazo,
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
          prazo
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
      prazo,
      statusAutomatico,
    ]);

  const deveInformarMotivo =
    demandaAtrasada ||
    finalizadaComAtraso;

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

  async function validarPermissaoAtual(): Promise<boolean> {
    if (
      administrador
    ) {
      return true;
    }

    const setorUsuarioId =
      perfil?.setor_id;

    if (
      !setorUsuarioId ||
      !demanda
    ) {
      return false;
    }

    const [
      respostaObra,
      respostaDemanda,
    ] = await Promise.all([
      supabase
        .from("obras")
        .select(
          "setor_id"
        )
        .eq(
          "id",
          obraId
        )
        .single(),

      supabase
        .from("demandas")
        .select(
          "setor_id"
        )
        .eq(
          "id",
          demanda.id
        )
        .single(),
    ]);

    if (
      respostaObra.error ||
      respostaDemanda.error
    ) {
      console.error(
        "Erro ao validar permissão da demanda:",
        respostaObra.error ||
          respostaDemanda.error
      );

      throw new Error(
        "Não foi possível confirmar sua permissão."
      );
    }

    const obraAtual =
      respostaObra.data as RegistroSetor;

    const demandaAtual =
      respostaDemanda.data as RegistroSetor;

    return (
      obraAtual.setor_id ===
        setorUsuarioId &&
      demandaAtual.setor_id ===
        setorUsuarioId
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!demanda) {
      return;
    }

    if (!podeEditar) {
      alert(
        "Você não possui permissão para editar esta demanda."
      );

      onClose();

      return;
    }

    if (!titulo.trim()) {
      alert(
        "Informe o título da demanda."
      );

      return;
    }

    if (!setorId) {
      alert(
        "Selecione o setor responsável pela demanda."
      );

      return;
    }

    if (
      !administrador &&
      setorId !==
        perfil?.setor_id
    ) {
      alert(
        "Você não pode transferir esta demanda para outro setor."
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
      setSalvando(true);

      const permissaoAtual =
        await validarPermissaoAtual();

      if (
        !permissaoAtual
      ) {
        alert(
          "A obra ou a demanda não pertence mais ao seu setor. As alterações não foram salvas."
        );

        onClose();

        return;
      }

      await updateDemanda(
        demanda.id,
        {
          titulo:
            titulo.trim(),

          descricao:
            descricao.trim() ||
            null,

          status:
            statusAutomatico,

          prioridade,

          setor_id:
            administrador
              ? setorId
              : perfil?.setor_id ??
                setorId,

          responsavel_id:
            responsavelId ||
            null,

          prazo:
            prazo ||
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
        }
      );

      onSuccess();
    } catch (error) {
      console.error(
        "Erro ao atualizar demanda:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao salvar as alterações."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog.Root
      open={
        Boolean(demanda)
      }
      onOpenChange={(
        aberto
      ) => {
        if (!aberto) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[1px]" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-white shadow-2xl">
          {!podeEditar ? (
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <ShieldAlert className="h-7 w-7" />
                </div>

                <Dialog.Title className="mt-4 text-xl font-bold text-gray-900">
                  Edição não permitida
                </Dialog.Title>

                <Dialog.Description className="mt-2 max-w-md text-sm text-gray-600">
                  Você só pode alterar demandas do seu próprio setor enquanto a obra estiver atualmente nesse setor.
                </Dialog.Description>

                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b px-6 py-5 pr-16">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Dialog.Title className="text-2xl font-bold tracking-tight text-gray-900">
                      Editar demanda
                    </Dialog.Title>

                    <Dialog.Description className="mt-1 text-sm text-gray-500">
                      Atualize as informações e registre o andamento da atividade.
                    </Dialog.Description>
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
              </div>

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-6 p-6"
              >
                {erroOpcoes && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {
                      erroOpcoes
                    }
                  </div>
                )}

                <section className="space-y-4 rounded-2xl border bg-white p-5">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Informações da demanda
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Dados principais, setor e responsável pela atividade.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="editar-demanda-titulo"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Título
                    </label>

                    <input
                      id="editar-demanda-titulo"
                      type="text"
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
                      required
                      className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Título da demanda"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="editar-demanda-descricao"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Descrição
                    </label>

                    <textarea
                      id="editar-demanda-descricao"
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
                      placeholder="Descrição detalhada da demanda"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="editar-demanda-setor"
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                      >
                        <Building2 className="h-4 w-4 text-gray-500" />

                        Setor responsável
                      </label>

                      <select
                        id="editar-demanda-setor"
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
                          carregandoSetores ||
                          !administrador
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

                      {!administrador && (
                        <p className="text-xs text-gray-500">
                          O setor da demanda não pode ser alterado por usuários comuns.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="editar-demanda-responsavel"
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                      >
                        <UserRound className="h-4 w-4 text-gray-500" />

                        Responsável
                      </label>

                      <select
                        id="editar-demanda-responsavel"
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
                        htmlFor="editar-demanda-prioridade"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Prioridade
                      </label>

                      <select
                        id="editar-demanda-prioridade"
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

                        {formatarDataHora(
                          demanda?.created_at
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-2xl border bg-slate-50/60 p-5">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Execução e prazos
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      O status é atualizado automaticamente pelas datas informadas.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label
                        htmlFor="editar-demanda-data-inicio"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Data de início
                      </label>

                      <input
                        id="editar-demanda-data-inicio"
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
                        htmlFor="editar-demanda-prazo"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Prazo
                      </label>

                      <input
                        id="editar-demanda-prazo"
                        type="date"
                        value={
                          prazo
                        }
                        onChange={(
                          event
                        ) =>
                          setPrazo(
                            event.target.value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="editar-demanda-data-conclusao"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Data de conclusão
                      </label>

                      <input
                        id="editar-demanda-data-conclusao"
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

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4">
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
                        Marcar como cancelada
                      </span>

                      <span className="mt-0.5 block text-xs text-gray-500">
                        O cancelamento tem prioridade sobre as datas informadas.
                      </span>
                    </span>
                  </label>

                  {finalizadaComAtraso && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      A conclusão foi registrada depois do prazo. A demanda será exibida como finalizada com atraso.
                    </div>
                  )}
                </section>

                {deveInformarMotivo && (
                  <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div>
                      <label
                        htmlFor="editar-demanda-motivo-atraso"
                        className="text-sm font-semibold text-amber-900"
                      >
                        Motivo do atraso
                      </label>

                      <p className="mt-1 text-xs text-amber-700">
                        Obrigatório para demandas atrasadas ou concluídas depois do prazo.
                      </p>
                    </div>

                    <textarea
                      id="editar-demanda-motivo-atraso"
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

                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      onClose
                    }
                    disabled={
                      salvando
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      salvando ||
                      carregandoSetores ||
                      carregandoUsuarios
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {salvando
                      ? "Salvando..."
                      : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </>
          )}

          <Dialog.Close asChild>
            <button
              type="button"
              disabled={
                salvando
              }
              className="absolute right-5 top-5 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export {
  ModalEditarDemanda,
};

export default ModalEditarDemanda;