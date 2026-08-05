import {
  createFileRoute,
  useLoaderData,
} from "@tanstack/react-router";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  atualizarReuniao,
  criarReuniao,
  excluirReuniao,
  getReunioesPorObra,
} from "@/features/reunioes/services/reunioes-service";

import type {
  Reuniao,
  StatusReuniao,
} from "@/features/reunioes/types";

import {
  supabase,
} from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/execucao-obras/$id/reunioes"
)({
  component:
    ReunioesObraPage,
});

interface SetorOpcao {
  id: string;
  nome: string;
}

interface UsuarioOpcao {
  id: string;
  nome: string;
  email: string;
}

const statusReuniaoInfo: Record<
  StatusReuniao,
  {
    label: string;
    className: string;
  }
> = {
  agendada: {
    label:
      "Agendada",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
  },

  realizada: {
    label:
      "Realizada",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  cancelada: {
    label:
      "Cancelada",
    className:
      "border-slate-300 bg-slate-100 text-slate-600",
  },
};

function formatarData(
  valor: string
) {
  const data =
    new Date(
      valor
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "long",
    }
  ).format(
    data
  );
}

function formatarHora(
  valor: string
) {
  const data =
    new Date(
      valor
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    data
  );
}

function formatarIntervalo(
  inicio: string,
  fim?: string | null
) {
  const inicioFormatado =
    formatarHora(
      inicio
    );

  if (!fim) {
    return inicioFormatado;
  }

  return `${inicioFormatado} às ${formatarHora(
    fim
  )}`;
}

function dataLocalParaIso(
  data: string,
  hora: string
) {
  return new Date(
    `${data}T${hora}:00`
  ).toISOString();
}

function separarDataHora(
  valor: string
) {
  const data =
    new Date(
      valor
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return {
      data:
        "",
      hora:
        "",
    };
  }

  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      data.getDate()
    ).padStart(
      2,
      "0"
    );

  const hora =
    String(
      data.getHours()
    ).padStart(
      2,
      "0"
    );

  const minuto =
    String(
      data.getMinutes()
    ).padStart(
      2,
      "0"
    );

  return {
    data:
      `${ano}-${mes}-${dia}`,

    hora:
      `${hora}:${minuto}`,
  };
}

function ReunioesObraPage() {
  const obra =
    useLoaderData({
      from:
        "/_authenticated/execucao-obras/$id",
    });

  const [
    reunioes,
    setReunioes,
  ] = useState<
    Reuniao[]
  >([]);

  const [
    carregando,
    setCarregando,
  ] = useState(
    true
  );

  const [
    erro,
    setErro,
  ] = useState<
    string | null
  >(
    null
  );

  const [
    modalAberto,
    setModalAberto,
  ] = useState(
    false
  );

  const [
    reuniaoEmEdicao,
    setReuniaoEmEdicao,
  ] = useState<
    Reuniao | null
  >(
    null
  );

  const [
    reuniaoParaExcluir,
    setReuniaoParaExcluir,
  ] = useState<
    Reuniao | null
  >(
    null
  );

  const [
    excluindo,
    setExcluindo,
  ] = useState(
    false
  );

  const [
    salvando,
    setSalvando,
  ] = useState(
    false
  );

  const [
    carregandoOpcoes,
    setCarregandoOpcoes,
  ] = useState(
    false
  );

  const [
    detalhesAbertos,
    setDetalhesAbertos,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const [
    setores,
    setSetores,
  ] = useState<
    SetorOpcao[]
  >([]);

  const [
    usuarios,
    setUsuarios,
  ] = useState<
    UsuarioOpcao[]
  >([]);

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    data,
    setData,
  ] = useState("");

  const [
    horaInicio,
    setHoraInicio,
  ] = useState("");

  const [
    horaFim,
    setHoraFim,
  ] = useState("");

  const [
    local,
    setLocal,
  ] = useState("");

  const [
    linkReuniao,
    setLinkReuniao,
  ] = useState("");

  const [
    pauta,
    setPauta,
  ] = useState("");

  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  const [
    decisoes,
    setDecisoes,
  ] = useState("");

  const [
    proximosPassos,
    setProximosPassos,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    StatusReuniao
  >(
    "agendada"
  );

  const [
    setorIds,
    setSetorIds,
  ] = useState<
    string[]
  >([]);

  const [
    participanteIds,
    setParticipanteIds,
  ] = useState<
    string[]
  >([]);

  const carregarReunioes =
    useCallback(
      async () => {
        try {
          setCarregando(
            true
          );

          setErro(
            null
          );

          const dados =
            await getReunioesPorObra(
              obra.id
            );

          setReunioes(
            dados
          );
        } catch (error) {
          console.error(
            "Erro ao carregar reuniões:",
            error
          );

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as reuniões."
          );
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        obra.id,
      ]
    );

  useEffect(
    () => {
      carregarReunioes();
    },
    [
      carregarReunioes,
    ]
  );

  useEffect(
    () => {
      if (
        !modalAberto ||
        setores.length >
          0 ||
        usuarios.length >
          0
      ) {
        return;
      }

      async function carregarOpcoes() {
        try {
          setCarregandoOpcoes(
            true
          );

          const [
            respostaSetores,
            respostaUsuarios,
          ] =
            await Promise.all([
              supabase
                .from(
                  "setores"
                )
                .select(
                  "id, nome"
                )
                .order(
                  "nome"
                ),

              supabase
                .from(
                  "usuarios"
                )
                .select(
                  "id, nome, email"
                )
                .eq(
                  "ativo",
                  true
                )
                .order(
                  "nome"
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

          setSetores(
            (
              respostaSetores.data ||
              []
            ) as SetorOpcao[]
          );

          setUsuarios(
            (
              respostaUsuarios.data ||
              []
            ) as UsuarioOpcao[]
          );
        } catch (error) {
          console.error(
            "Erro ao carregar setores e usuários:",
            error
          );

          setErro(
            "Não foi possível carregar setores e participantes."
          );
        } finally {
          setCarregandoOpcoes(
            false
          );
        }
      }

      carregarOpcoes();
    },
    [
      modalAberto,
      setores.length,
      usuarios.length,
    ]
  );

  const agora =
    new Date();

  const proximasReunioes =
    useMemo(
      () =>
        reunioes.filter(
          (
            reuniao
          ) =>
            reuniao.status ===
              "agendada" &&
            new Date(
              reuniao.inicio
            ) >=
              agora
        ),
      [
        reunioes,
      ]
    );

  const historicoReunioes =
    useMemo(
      () =>
        reunioes
          .filter(
            (
              reuniao
            ) =>
              reuniao.status !==
                "agendada" ||
              new Date(
                reuniao.inicio
              ) <
                agora
          )
          .sort(
            (
              reuniaoA,
              reuniaoB
            ) =>
              new Date(
                reuniaoB.inicio
              ).getTime() -
              new Date(
                reuniaoA.inicio
              ).getTime()
          ),
      [
        reunioes,
      ]
    );

  function limparFormulario() {
    setTitulo("");
    setData("");
    setHoraInicio("");
    setHoraFim("");
    setLocal("");
    setLinkReuniao("");
    setPauta("");
    setObservacoes("");
    setDecisoes("");
    setProximosPassos("");
    setStatus(
      "agendada"
    );
    setSetorIds([]);
    setParticipanteIds([]);
    setErro(null);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(
      false
    );

    setReuniaoEmEdicao(
      null
    );

    limparFormulario();
  }

  function abrirNovaReuniao() {
    setReuniaoEmEdicao(
      null
    );

    limparFormulario();

    setModalAberto(
      true
    );
  }

  function abrirEdicao(
    reuniao: Reuniao
  ) {
    const inicio =
      separarDataHora(
        reuniao.inicio
      );

    const fim =
      reuniao.fim
        ? separarDataHora(
            reuniao.fim
          )
        : {
            data:
              "",
            hora:
              "",
          };

    setReuniaoEmEdicao(
      reuniao
    );

    setTitulo(
      reuniao.titulo
    );

    setData(
      inicio.data
    );

    setHoraInicio(
      inicio.hora
    );

    setHoraFim(
      fim.hora
    );

    setLocal(
      reuniao.local ||
      ""
    );

    setLinkReuniao(
      reuniao.link_reuniao ||
      ""
    );

    setPauta(
      reuniao.pauta ||
      ""
    );

    setObservacoes(
      reuniao.observacoes ||
      ""
    );

    setDecisoes(
      reuniao.decisoes ||
      ""
    );

    setProximosPassos(
      reuniao.proximos_passos ||
      ""
    );

    setStatus(
      reuniao.status
    );

    setSetorIds(
      reuniao.setores?.map(
        (
          vinculo
        ) =>
          vinculo.setor_id
      ) ||
      []
    );

    setParticipanteIds(
      reuniao.participantes?.map(
        (
          vinculo
        ) =>
          vinculo.usuario_id
      ) ||
      []
    );

    setErro(
      null
    );

    setModalAberto(
      true
    );
  }

  function abrirExclusao(
    reuniao: Reuniao
  ) {
    setReuniaoParaExcluir(
      reuniao
    );

    setErro(
      null
    );
  }

  function fecharExclusao() {
    if (excluindo) {
      return;
    }

    setReuniaoParaExcluir(
      null
    );
  }

  async function confirmarExclusao() {
    if (
      !reuniaoParaExcluir
    ) {
      return;
    }

    try {
      setExcluindo(
        true
      );

      setErro(
        null
      );

      await excluirReuniao(
        reuniaoParaExcluir.id
      );

      setDetalhesAbertos(
        (
          estadoAtual
        ) => {
          const novoEstado = {
            ...estadoAtual,
          };

          delete novoEstado[
            reuniaoParaExcluir.id
          ];

          return novoEstado;
        }
      );

      setReuniaoParaExcluir(
        null
      );

      await carregarReunioes();
    } catch (error) {
      console.error(
        "Erro ao excluir reunião:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a reunião."
      );
    } finally {
      setExcluindo(
        false
      );
    }
  }

  function alternarSelecionado(
    id: string,
    selecionados: string[],
    atualizar: (
      ids: string[]
    ) => void
  ) {
    atualizar(
      selecionados.includes(
        id
      )
        ? selecionados.filter(
            (
              itemId
            ) =>
              itemId !==
              id
          )
        : [
            ...selecionados,
            id,
          ]
    );
  }

  function alternarDetalhes(
    id: string
  ) {
    setDetalhesAbertos(
      (
        estadoAtual
      ) => ({
        ...estadoAtual,

        [id]:
          !estadoAtual[
            id
          ],
      })
    );
  }

  async function handleSalvarReuniao(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !titulo.trim()
    ) {
      setErro(
        "Informe o título da reunião."
      );

      return;
    }

    if (
      !data ||
      !horaInicio
    ) {
      setErro(
        "Informe a data e o horário de início."
      );

      return;
    }

    const inicio =
      dataLocalParaIso(
        data,
        horaInicio
      );

    const fim =
      horaFim
        ? dataLocalParaIso(
            data,
            horaFim
          )
        : null;

    if (
      fim &&
      new Date(
        fim
      ) <=
        new Date(
          inicio
        )
    ) {
      setErro(
        "O horário final deve ser posterior ao horário inicial."
      );

      return;
    }

    try {
      setSalvando(
        true
      );

      setErro(
        null
      );

      const {
        data: usuarioData,
        error: usuarioError,
      } =
        await supabase.auth.getUser();

      if (
        usuarioError ||
        !usuarioData.user
      ) {
        throw new Error(
          "Não foi possível identificar o usuário autenticado."
        );
      }

      if (
        reuniaoEmEdicao
      ) {
        await atualizarReuniao(
          reuniaoEmEdicao.id,
          {
            titulo:
              titulo.trim(),

            inicio,

            fim,

            local:
              local.trim() ||
              null,

            link_reuniao:
              linkReuniao.trim() ||
              null,

            pauta:
              pauta.trim() ||
              null,

            observacoes:
              observacoes.trim() ||
              null,

            decisoes:
              decisoes.trim() ||
              null,

            proximos_passos:
              proximosPassos.trim() ||
              null,

            status,

            setor_ids:
              setorIds,

            participante_ids:
              participanteIds,
          }
        );
      } else {
        await criarReuniao({
          obra_id:
            obra.id,

          titulo:
            titulo.trim(),

          inicio,

          fim,

          local:
            local.trim() ||
            null,

          link_reuniao:
            linkReuniao.trim() ||
            null,

          pauta:
            pauta.trim() ||
            null,

          observacoes:
            observacoes.trim() ||
            null,

          decisoes:
            decisoes.trim() ||
            null,

          proximos_passos:
            proximosPassos.trim() ||
            null,

          status:
            "agendada",

          criado_por:
            usuarioData.user.id,

          setor_ids:
            setorIds,

          participante_ids:
            participanteIds,
        });
      }

      await carregarReunioes();

      setModalAberto(
        false
      );

      setReuniaoEmEdicao(
        null
      );

      limparFormulario();
    } catch (error) {
      console.error(
        "Erro ao criar reunião:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a reunião."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  if (
    carregando
  ) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-500" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Carregando reuniões...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Reuniões da obra
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Agendamentos, participantes, decisões e próximos passos.
              </p>
            </div>

            <button
              type="button"
              onClick={
                abrirNovaReuniao
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />

              Nova reunião
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5 text-sm">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
              {proximasReunioes.length} próxima(s)
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
              {historicoReunioes.length} no histórico
            </span>
          </div>
        </section>

        {erro && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">
              {erro}
            </p>
          </section>
        )}

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              Próximas reuniões
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Reuniões agendadas a partir de agora.
            </p>
          </div>

          {proximasReunioes.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />

              <h4 className="mt-4 text-base font-bold text-slate-950">
                Nenhuma reunião agendada
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                Cadastre uma nova reunião para esta obra.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {proximasReunioes.map(
                (
                  reuniao
                ) => (
                  <ReuniaoCard
                    key={
                      reuniao.id
                    }
                    reuniao={
                      reuniao
                    }
                    aberto={
                      Boolean(
                        detalhesAbertos[
                          reuniao.id
                        ]
                      )
                    }
                    onAlternar={() =>
                      alternarDetalhes(
                        reuniao.id
                      )
                    }
                    onEditar={() =>
                      abrirEdicao(
                        reuniao
                      )
                    }
                    onExcluir={() =>
                      abrirExclusao(
                        reuniao
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {historicoReunioes.length >
          0 && (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                Histórico
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Reuniões realizadas, canceladas ou já passadas.
              </p>
            </div>

            <div className="space-y-4">
              {historicoReunioes.map(
                (
                  reuniao
                ) => (
                  <ReuniaoCard
                    key={
                      reuniao.id
                    }
                    reuniao={
                      reuniao
                    }
                    aberto={
                      Boolean(
                        detalhesAbertos[
                          reuniao.id
                        ]
                      )
                    }
                    onAlternar={() =>
                      alternarDetalhes(
                        reuniao.id
                      )
                    }
                    onEditar={() =>
                      abrirEdicao(
                        reuniao
                      )
                    }
                    onExcluir={() =>
                      abrirExclusao(
                        reuniao
                      )
                    }
                  />
                )
              )}
            </div>
          </section>
        )}
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onMouseDown={
            fecharModal
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nova-reuniao"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b bg-slate-50 px-6 py-5">
              <div>
                <h2
                  id="titulo-nova-reuniao"
                  className="text-xl font-bold text-slate-950"
                >
                  {reuniaoEmEdicao
                    ? "Editar reunião"
                    : "Nova reunião"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {reuniaoEmEdicao
                    ? "Atualize o agendamento, participantes e registros da reunião."
                    : "Registre o agendamento, participantes e pauta."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharModal
                }
                disabled={
                  salvando
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950 disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                handleSalvarReuniao
              }
              className="flex max-h-[calc(92vh-92px)] flex-col"
            >
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {erro && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {erro}
                  </div>
                )}

                <FormularioSecao
                  titulo="Agendamento"
                  descricao="Data, horário e local da reunião."
                >
                  <Campo
                    label="Título *"
                    value={
                      titulo
                    }
                    onChange={
                      setTitulo
                    }
                  />

                  <Campo
                    label="Data *"
                    type="date"
                    value={
                      data
                    }
                    onChange={
                      setData
                    }
                  />

                  <Campo
                    label="Hora de início *"
                    type="time"
                    value={
                      horaInicio
                    }
                    onChange={
                      setHoraInicio
                    }
                  />

                  <Campo
                    label="Hora de término"
                    type="time"
                    value={
                      horaFim
                    }
                    onChange={
                      setHoraFim
                    }
                  />

                  <Campo
                    label="Local"
                    value={
                      local
                    }
                    onChange={
                      setLocal
                    }
                    placeholder="Ex.: Sala de reuniões"
                  />

                  <Campo
                    label="Link da reunião"
                    type="url"
                    value={
                      linkReuniao
                    }
                    onChange={
                      setLinkReuniao
                    }
                    placeholder="https://..."
                  />

                  {reuniaoEmEdicao && (
                    <SelectCampo
                      label="Status"
                      value={
                        status
                      }
                      onChange={(
                        value
                      ) =>
                        setStatus(
                          value as StatusReuniao
                        )
                      }
                    >
                      <option value="agendada">
                        Agendada
                      </option>

                      <option value="realizada">
                        Realizada
                      </option>

                      <option value="cancelada">
                        Cancelada
                      </option>
                    </SelectCampo>
                  )}
                </FormularioSecao>

                <FormularioSecao
                  titulo="Setores envolvidos"
                  descricao="Selecione todos os setores que participarão."
                  colunas={1}
                >
                  <SelecaoMultipla
                    carregando={
                      carregandoOpcoes
                    }
                    vazio="Nenhum setor cadastrado."
                    opcoes={setores.map(
                      (
                        setor
                      ) => ({
                        id:
                          setor.id,
                        label:
                          setor.nome,
                      })
                    )}
                    selecionados={
                      setorIds
                    }
                    onAlternar={(
                      id
                    ) =>
                      alternarSelecionado(
                        id,
                        setorIds,
                        setSetorIds
                      )
                    }
                  />
                </FormularioSecao>

                <FormularioSecao
                  titulo="Pessoas envolvidas"
                  descricao="Somente usuários cadastrados no sistema."
                  colunas={1}
                >
                  <SelecaoMultipla
                    carregando={
                      carregandoOpcoes
                    }
                    vazio="Nenhum usuário cadastrado."
                    pesquisavel
                    placeholderBusca="Digite o nome ou e-mail do colaborador"
                    opcoes={usuarios.map(
                      (
                        usuario
                      ) => ({
                        id:
                          usuario.id,
                        label:
                          usuario.nome ||
                          usuario.email,
                        descricao:
                          usuario.email,
                      })
                    )}
                    selecionados={
                      participanteIds
                    }
                    onAlternar={(
                      id
                    ) =>
                      alternarSelecionado(
                        id,
                        participanteIds,
                        setParticipanteIds
                      )
                    }
                  />
                </FormularioSecao>

                <FormularioSecao
                  titulo="Conteúdo da reunião"
                  descricao="Pauta e informações que serão registradas."
                  colunas={1}
                >
                  <AreaTexto
                    label="Pauta"
                    value={
                      pauta
                    }
                    onChange={
                      setPauta
                    }
                  />

                  <AreaTexto
                    label="Observações"
                    value={
                      observacoes
                    }
                    onChange={
                      setObservacoes
                    }
                  />

                  <AreaTexto
                    label="Decisões"
                    value={
                      decisoes
                    }
                    onChange={
                      setDecisoes
                    }
                  />

                  <AreaTexto
                    label="Próximos passos"
                    value={
                      proximosPassos
                    }
                    onChange={
                      setProximosPassos
                    }
                  />
                </FormularioSecao>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={
                    salvando
                  }
                  className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    salvando ||
                    carregandoOpcoes
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : reuniaoEmEdicao ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                  {salvando
                    ? "Salvando..."
                    : reuniaoEmEdicao
                      ? "Salvar alterações"
                      : "Criar reunião"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reuniaoParaExcluir && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
          onMouseDown={
            fecharExclusao
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-excluir-reuniao"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
            className="w-full max-w-md overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-red-100 bg-red-50 px-6 py-5">
              <div>
                <h2
                  id="titulo-excluir-reuniao"
                  className="text-xl font-bold text-red-900"
                >
                  Excluir reunião
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  Esta ação não poderá ser desfeita.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharExclusao
                }
                disabled={
                  excluindo
                }
                className="rounded-lg p-2 text-red-500 transition hover:bg-red-100 hover:text-red-900 disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm leading-6 text-slate-600">
                Tem certeza que deseja excluir a reunião{" "}
                <span className="font-bold text-slate-950">
                  {reuniaoParaExcluir.titulo}
                </span>
                ?
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Os vínculos com setores e participantes também serão removidos automaticamente.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  fecharExclusao
                }
                disabled={
                  excluindo
                }
                className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  confirmarExclusao
                }
                disabled={
                  excluindo
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {excluindo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                {excluindo
                  ? "Excluindo..."
                  : "Excluir reunião"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ReuniaoCardProps {
  reuniao: Reuniao;
  aberto: boolean;
  onAlternar: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}

function ReuniaoCard({
  reuniao,
  aberto,
  onAlternar,
  onEditar,
  onExcluir,
}: ReuniaoCardProps) {
  const status =
    statusReuniaoInfo[
      reuniao.status
    ];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={
          onAlternar
        }
        className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
        aria-expanded={
          aberto
        }
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-lg font-bold text-slate-950">
              {reuniao.titulo}
            </h4>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />

              {formatarData(
                reuniao.inicio
              )}
            </span>

            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" />

              {formatarIntervalo(
                reuniao.inicio,
                reuniao.fim
              )}
            </span>

            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />

              {reuniao.local ||
                "Local não informado"}
            </span>

            <span className="inline-flex items-center gap-2">
              <UsersRound className="h-4 w-4" />

              {reuniao.participantes
                ?.length ||
                0} participante(s)
            </span>
          </div>
        </div>

        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 ${
            aberto
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
          aberto
            ? "grid-rows-[1fr] translate-y-0 opacity-100"
            : "grid-rows-[0fr] -translate-y-1 opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-5 border-t border-slate-200 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <DetalheLista
                titulo="Setores envolvidos"
                itens={
                  reuniao.setores?.map(
                    (
                      vinculo
                    ) =>
                      vinculo.setor
                        ?.nome ||
                      "Setor não informado"
                  ) ||
                  []
                }
              />

              <DetalheLista
                titulo="Participantes"
                itens={
                  reuniao.participantes?.map(
                    (
                      vinculo
                    ) =>
                      vinculo.usuario
                        ?.nome ||
                      vinculo.usuario
                        ?.email ||
                      "Usuário não informado"
                  ) ||
                  []
                }
              />
            </div>

            {reuniao.link_reuniao && (
              <a
                href={
                  reuniao.link_reuniao
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />

                Abrir link da reunião
              </a>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <DetalheTexto
                titulo="Pauta"
                valor={
                  reuniao.pauta
                }
              />

              <DetalheTexto
                titulo="Observações"
                valor={
                  reuniao.observacoes
                }
              />

              <DetalheTexto
                titulo="Decisões"
                valor={
                  reuniao.decisoes
                }
              />

              <DetalheTexto
                titulo="Próximos passos"
                valor={
                  reuniao.proximos_passos
                }
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={
                    onEditar
                  }
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" />

                  Editar reunião
                </button>

                <button
                  type="button"
                  onClick={
                    onExcluir
                  }
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />

                  Excluir reunião
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="h-4 w-4" />

                Registrado por{" "}
              <span className="font-semibold text-slate-700">
                {reuniao.criador
                  ?.nome ||
                  "Usuário não informado"}
              </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

interface DetalheListaProps {
  titulo: string;
  itens: string[];
}

function DetalheLista({
  titulo,
  itens,
}: DetalheListaProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h5 className="text-sm font-bold text-slate-800">
        {titulo}
      </h5>

      {itens.length ===
      0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Não informado
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {itens.map(
            (
              item,
              indice
            ) => (
              <span
                key={`${item}-${indice}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {item}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}

interface DetalheTextoProps {
  titulo: string;
  valor?: string | null;
}

function DetalheTexto({
  titulo,
  valor,
}: DetalheTextoProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h5 className="text-sm font-bold text-slate-800">
        {titulo}
      </h5>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {valor ||
          "Não informado"}
      </p>
    </div>
  );
}

interface FormularioSecaoProps {
  titulo: string;
  descricao: string;
  children:
    React.ReactNode;
  colunas?: number;
}

function FormularioSecao({
  titulo,
  descricao,
  children,
  colunas =
    2,
}: FormularioSecaoProps) {
  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <h3 className="text-base font-bold text-slate-950">
        {titulo}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {descricao}
      </p>

      <div
        className={`mt-5 grid gap-4 ${
          colunas ===
          1
            ? "grid-cols-1"
            : "md:grid-cols-2"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

interface CampoProps {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  placeholder?: string;
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: CampoProps) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={
          type
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
      />
    </label>
  );
}

interface SelectCampoProps {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  children:
    React.ReactNode;
}

function SelectCampo({
  label,
  value,
  onChange,
  children,
}: SelectCampoProps) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
      >
        {children}
      </select>
    </label>
  );
}

interface AreaTextoProps {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}

function AreaTexto({
  label,
  value,
  onChange,
}: AreaTextoProps) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        rows={
          4
        }
        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
      />
    </label>
  );
}

interface SelecaoMultiplaProps {
  carregando: boolean;
  vazio: string;
  pesquisavel?: boolean;
  placeholderBusca?: string;
  opcoes: {
    id: string;
    label: string;
    descricao?: string;
  }[];
  selecionados: string[];
  onAlternar: (
    id: string
  ) => void;
}

function SelecaoMultipla({
  carregando,
  vazio,
  pesquisavel =
    false,
  placeholderBusca =
    "Buscar...",
  opcoes,
  selecionados,
  onAlternar,
}: SelecaoMultiplaProps) {
  const [
    busca,
    setBusca,
  ] = useState("");

  const buscaNormalizada =
    busca
      .trim()
      .toLocaleLowerCase(
        "pt-BR"
      )
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  const opcoesSelecionadas =
    opcoes.filter(
      (
        opcao
      ) =>
        selecionados.includes(
          opcao.id
        )
    );

  const opcoesFiltradas =
    opcoes.filter(
      (
        opcao
      ) => {
        if (
          selecionados.includes(
            opcao.id
          )
        ) {
          return false;
        }

        if (
          !pesquisavel
        ) {
          return true;
        }

        if (
          !buscaNormalizada
        ) {
          return false;
        }

        const textoOpcao =
          `${opcao.label} ${opcao.descricao || ""}`
            .toLocaleLowerCase(
              "pt-BR"
            )
            .normalize(
              "NFD"
            )
            .replace(
              /[\u0300-\u036f]/g,
              ""
            );

        return textoOpcao.includes(
          buscaNormalizada
        );
      }
    );

  if (carregando) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />

        Carregando opções...
      </div>
    );
  }

  if (
    opcoes.length ===
    0
  ) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        {vazio}
      </div>
    );
  }

  if (
    pesquisavel
  ) {
    return (
      <div className="space-y-3">
        {opcoesSelecionadas.length >
          0 && (
          <div className="flex flex-wrap gap-2">
            {opcoesSelecionadas.map(
              (
                opcao
              ) => (
                <span
                  key={
                    opcao.id
                  }
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700"
                >
                  <span className="truncate">
                    {opcao.label}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      onAlternar(
                        opcao.id
                      )
                    }
                    className="rounded-full p-0.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950"
                    aria-label={`Remover ${opcao.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )
            )}
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            name="buscar-participante"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={
              false
            }
            value={
              busca
            }
            onChange={(
              event
            ) =>
              setBusca(
                event.target.value
              )
            }
            placeholder={
              placeholderBusca
            }
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
        </div>

        {buscaNormalizada && (
          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {opcoesFiltradas.length >
            0 ? (
              <div className="divide-y divide-slate-100">
                {opcoesFiltradas.map(
                  (
                    opcao
                  ) => (
                    <button
                      key={
                        opcao.id
                      }
                      type="button"
                      onClick={() => {
                        onAlternar(
                          opcao.id
                        );

                        setBusca("");
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800">
                          {opcao.label}
                        </span>

                        {opcao.descricao && (
                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {opcao.descricao}
                          </span>
                        )}
                      </span>

                      <Plus className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="px-4 py-5 text-center text-sm text-slate-500">
                Nenhum colaborador encontrado.
              </div>
            )}
          </div>
        )}

        {!buscaNormalizada &&
          opcoesSelecionadas.length ===
            0 && (
          <p className="text-sm text-slate-500">
            Digite parte do nome ou e-mail para localizar e adicionar um colaborador.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
      <div className="divide-y divide-slate-100">
        {opcoes.map(
          (
            opcao
          ) => {
            const selecionado =
              selecionados.includes(
                opcao.id
              );

            return (
              <label
                key={
                  opcao.id
                }
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition ${
                  selecionado
                    ? "bg-slate-50"
                    : "hover:bg-slate-50/70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    selecionado
                  }
                  onChange={() =>
                    onAlternar(
                      opcao.id
                    )
                  }
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {opcao.label}
                  </span>

                  {opcao.descricao && (
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {opcao.descricao}
                    </span>
                  )}
                </span>
              </label>
            );
          }
        )}
      </div>
    </div>
  );
}