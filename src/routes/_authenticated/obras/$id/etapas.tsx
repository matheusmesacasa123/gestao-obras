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
  ChevronDown,
  CirclePlay,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  StickyNote,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  atualizarEtapaObra,
  concluirEtapaObra,
  criarEtapaObra,
  excluirEtapaObra,
  iniciarEtapaObra,
  listarEtapasDaObra,
  reabrirEtapaObra,
  type EtapaObra,
  type StatusEtapaObra,
} from "@/features/etapas/services/etapas-service";

import {
  useAuth,
} from "@/features/auth/auth-context";

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
  titulo: string;
  responsavel_id: string;
  status: StatusEtapaObra;
  data_inicio: string;
  prazo: string;
  observacao: string;
  obrigatoria: boolean;
};

type ResumoDemandasEtapa = {
  total: number;
  concluidas: number;
  todasConcluidas: boolean;
  maiorDataConclusao: string | null;
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

function obterDataHoje() {
  const hoje =
    new Date();

  const ano =
    hoje.getFullYear();

  const mes =
    String(
      hoje.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      hoje.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${ano}-${mes}-${dia}`;
}

function normalizarTexto(
  valor?: string | null
) {
  return (
    valor ||
    ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase();
}

function etapaEhEngenhariaComercial(
  etapa: EtapaObra
) {
  return (
    normalizarTexto(
      etapa.setor?.nome
    ) ===
    "engenharia comercial"
  );
}

function formatarCompetencia(
  valor?: string | null
) {
  if (!valor) {
    return "";
  }

  const [
    ano,
    mes,
  ] = valor
    .split("-")
    .map(Number);

  if (
    !ano ||
    !mes
  ) {
    return "";
  }

  const nomeMes =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        month:
          "long",
      }
    ).format(
      new Date(
        ano,
        mes - 1,
        1
      )
    );

  return `${
    nomeMes.charAt(0).toUpperCase() +
    nomeMes.slice(1)
  } de ${ano}`;
}


function obterDestinoPostIt(
  etapa: EtapaObra
) {
  if (
    etapa.status ===
      "concluida" &&
    etapa.data_conclusao
  ) {
    return {
      titulo:
        `Finalizados — ${formatarCompetencia(
          etapa.data_conclusao
        )}`,

      descricao:
        "O post-it físico deve ser arquivado no quadro de propostas finalizadas, na competência da data de conclusão.",

      classe:
        "border-green-200 bg-green-50 text-green-900",

      classeIcone:
        "bg-green-100 text-green-700",
    };
  }

  return {
    titulo:
      "Em andamento",

    descricao:
      "O post-it físico deve permanecer no quadro de propostas em andamento até a conclusão desta etapa.",

    classe:
      "border-amber-200 bg-amber-50 text-amber-900",

    classeIcone:
      "bg-amber-100 text-amber-700",
  };
}

function EtapasObraPage() {
  const {
    id: obraId,
  } = Route.useParams();

  const {
    obraRevisaoId,
  } = Route.useSearch();

  const {
    perfil,
  } = useAuth();

  const administrador =
    Boolean(
      perfil?.administrador
    );

  const setorUsuarioId =
    perfil?.setor_id ||
    null;

  const [
    etapas,
    setEtapas,
  ] = useState<EtapaObra[]>(
    []
  );

  const [
    etapaExpandidaId,
    setEtapaExpandidaId,
  ] = useState<string | null>(
    null
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
    resumoDemandasPorEtapa,
    setResumoDemandasPorEtapa,
  ] = useState<
    Record<
      string,
      ResumoDemandasEtapa
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
    etapaConclusaoPendente,
    setEtapaConclusaoPendente,
  ] = useState<EtapaObra | null>(
    null
  );

  const [
    dataConclusaoEscolhida,
    setDataConclusaoEscolhida,
  ] = useState(
    obterDataHoje()
  );

  const [
    escolhendoOutraData,
    setEscolhendoOutraData,
  ] = useState(false);

  const [
    salvandoConclusao,
    setSalvandoConclusao,
  ] = useState(false);

  const [
    mostrandoFormulario,
    setMostrandoFormulario,
  ] = useState(false);

  const [
    criando,
    setCriando,
  ] = useState(false);

  const [
    novoTitulo,
    setNovoTitulo,
  ] = useState("");

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

  const setoresDisponiveis =
    useMemo(
      () => {
        if (administrador) {
          return setores;
        }

        return setores.filter(
          (setor) =>
            setor.id ===
              setorUsuarioId
        );
      },
      [
        administrador,
        setorUsuarioId,
        setores,
      ]
    );

  const podeCriarEtapa =
    administrador
      ? setores.length > 0
      : Boolean(
          setorUsuarioId &&
          setores.some(
            (setor) =>
              setor.id ===
                setorUsuarioId
          )
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

      if (!obraRevisaoId) {
        setEtapas([]);
        setResumoDemandasPorEtapa({});
        return;
      }

      const [
        etapasEncontradas,
        respostaSetores,
        respostaUsuarios,
        respostaDemandas,
      ] = await Promise.all([
        listarEtapasDaObra(
          obraId,
          obraRevisaoId
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

        supabase
          .from("demandas")
          .select(
            "etapa_id, status, data_conclusao"
          )
          .eq(
            "obra_id",
            obraId
          )
          .eq(
            "obra_revisao_id",
            obraRevisaoId
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

      if (
        respostaDemandas.error
      ) {
        throw respostaDemandas.error;
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

      const novoResumoDemandas: Record<
        string,
        ResumoDemandasEtapa
      > = {};

      for (
        const demanda
        of respostaDemandas.data ||
        []
      ) {
        if (!demanda.etapa_id) {
          continue;
        }

        if (
          !novoResumoDemandas[
            demanda.etapa_id
          ]
        ) {
          novoResumoDemandas[
            demanda.etapa_id
          ] = {
            total:
              0,

            concluidas:
              0,

            todasConcluidas:
              false,

            maiorDataConclusao:
              null,
          };
        }

        novoResumoDemandas[
          demanda.etapa_id
        ].total +=
          1;

        if (
          demanda.status ===
          "concluida"
        ) {
          novoResumoDemandas[
            demanda.etapa_id
          ].concluidas +=
            1;

          if (
            demanda.data_conclusao &&
            (
              !novoResumoDemandas[
                demanda.etapa_id
              ].maiorDataConclusao ||
              demanda.data_conclusao >
                novoResumoDemandas[
                  demanda.etapa_id
                ].maiorDataConclusao!
            )
          ) {
            novoResumoDemandas[
              demanda.etapa_id
            ].maiorDataConclusao =
              demanda.data_conclusao;
          }
        }
      }

      for (
        const resumo
        of Object.values(
          novoResumoDemandas
        )
      ) {
        resumo.todasConcluidas =
          resumo.total >
            0 &&
          resumo.concluidas ===
            resumo.total;
      }

      setResumoDemandasPorEtapa(
        novoResumoDemandas
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
          titulo:
            etapa.titulo ||
            "",

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
        };
      }

      setEdicoes(
        novasEdicoes
      );

      if (administrador) {
        const setorAtualAindaExiste =
          setoresEncontrados.some(
            (setor) =>
              setor.id ===
                novoSetorId
          );

        if (!setorAtualAindaExiste) {
          setNovoSetorId(
            setoresEncontrados[0]?.id ||
              ""
          );
        }
      } else {
        setNovoSetorId(
          setorUsuarioId ||
            ""
        );
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
    obraRevisaoId,
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
      Boolean(
        setorUsuarioId
      ) &&
        etapa.setor_id ===
          setorUsuarioId
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

    if (!podeCriarEtapa) {
      setErro(
        "Você não possui um setor válido para criar uma etapa."
      );

      return;
    }

    if (!novoTitulo.trim()) {
      setErro(
        "Informe o título da etapa."
      );

      return;
    }

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
        "Você só pode criar uma etapa para o próprio setor."
      );

      return;
    }

    try {
      setCriando(true);

      await criarEtapaObra({
        obra_id:
          obraId,

        obra_revisao_id:
          obraRevisaoId,

        setor_id:
          novoSetorId,

        titulo:
          novoTitulo.trim(),

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
      });

      setMensagem(
        "Etapa criada com sucesso."
      );

      setNovoTitulo(
        ""
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

  function abrirConfirmacaoConclusao(
    etapa: EtapaObra
  ) {
    setErro("");
    setMensagem("");

    setEtapaConclusaoPendente(
      etapa
    );

    const maiorDataConclusao =
      resumoDemandasPorEtapa[
        etapa.id
      ]?.maiorDataConclusao;

    setDataConclusaoEscolhida(
      maiorDataConclusao ||
      obterDataHoje()
    );

    setEscolhendoOutraData(
      false
    );
  }

  function fecharConfirmacaoConclusao() {
    if (salvandoConclusao) {
      return;
    }

    setEtapaConclusaoPendente(
      null
    );

    setEscolhendoOutraData(
      false
    );

    setDataConclusaoEscolhida(
      obterDataHoje()
    );
  }

  async function confirmarConclusaoAplicacao(
    dataConclusao: string
  ) {
    if (
      !etapaConclusaoPendente
    ) {
      return;
    }

    if (!dataConclusao) {
      setErro(
        "Informe a data de finalização da proposta."
      );

      return;
    }

    try {
      setErro("");
      setMensagem("");
      setSalvandoConclusao(true);

      await atualizarEtapaObra(
        etapaConclusaoPendente.id,
        {
          status:
            "concluida",

          data_conclusao:
            dataConclusao,
        }
      );

      setMensagem(
        `Etapa concluída. O post-it pertence à competência de ${formatarCompetencia(
          dataConclusao
        )}.`
      );

      setEtapaConclusaoPendente(
        null
      );

      setEscolhendoOutraData(
        false
      );

      setDataConclusaoEscolhida(
        obterDataHoje()
      );

      await carregarDados();
    } catch (error: any) {
      console.error(
        "Erro ao concluir etapa da Engenharia Comercial:",
        error
      );

      const mensagemErro =
        error?.message ||
        error?.details ||
        error?.hint ||
        "Não foi possível concluir a etapa.";

      setErro(
        mensagemErro
      );

      window.alert(
        `Erro ao concluir etapa: ${mensagemErro}`
      );
    } finally {
      setSalvandoConclusao(false);
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

    if (!edicao.titulo.trim()) {
      setErro(
        "O título da etapa não pode ficar vazio."
      );

      return;
    }

    const resumoDemandas =
      resumoDemandasPorEtapa[
        etapa.id
      ];

    const podeConcluirPorDemandas =
      Boolean(
        resumoDemandas?.todasConcluidas
      );

    if (
      edicao.status ===
        "concluida" &&
      etapa.status !==
        "concluida" &&
      !podeConcluirPorDemandas
    ) {
      setErro(
        resumoDemandas?.total
          ? `Conclua todas as demandas desta etapa antes de finalizá-la. Restam ${
              resumoDemandas.total -
              resumoDemandas.concluidas
            } demanda(s).`
          : "Cadastre e conclua ao menos uma demanda nesta etapa antes de finalizá-la."
      );

      return;
    }

    if (
      etapaEhEngenhariaComercial(
        etapa
      ) &&
      edicao.status ===
        "concluida" &&
      etapa.status !==
        "concluida"
    ) {
      abrirConfirmacaoConclusao(
        etapa
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
          titulo:
            edicao.titulo.trim(),

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
      const resumoDemandas =
        resumoDemandasPorEtapa[
          etapa.id
        ];

      if (
        !resumoDemandas?.todasConcluidas
      ) {
        setErro(
          resumoDemandas?.total
            ? `Conclua todas as demandas desta etapa antes de finalizá-la. Restam ${
                resumoDemandas.total -
                resumoDemandas.concluidas
              } demanda(s).`
            : "Cadastre e conclua ao menos uma demanda nesta etapa antes de finalizá-la."
        );

        return;
      }
    }

    if (
      acao ===
        "concluir" &&
      etapaEhEngenhariaComercial(
        etapa
      )
    ) {
      abrirConfirmacaoConclusao(
        etapa
      );

      return;
    }

    if (
      acao ===
      "concluir"
    ) {
      const confirmado =
        window.confirm(
          `Deseja concluir a Etapa ${
            etapa.ordem ?? "sem número"
          } — ${
            etapa.setor?.nome ||
            "Setor não informado"
          } — ${
            etapa.titulo ||
            "Sem título"
          }?`
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

  async function excluirEtapa(
    etapa: EtapaObra
  ) {
    if (
      !podeEditarEtapa(
        etapa
      )
    ) {
      setErro(
        "Você não possui permissão para excluir esta etapa."
      );

      return;
    }

    const confirmado =
      window.confirm(
        `Deseja excluir a Etapa ${
          etapa.ordem ?? "sem número"
        } — ${
          etapa.setor?.nome ||
          "Setor não informado"
        } — ${
          etapa.titulo ||
          "Sem título"
        }? Esta ação não poderá ser desfeita.`
      );

    if (!confirmado) {
      return;
    }

    try {
      setErro("");
      setMensagem("");
      setExecutandoAcaoId(
        etapa.id
      );

      await excluirEtapaObra(
        etapa.id
      );

      setMensagem(
        "Etapa excluída com sucesso."
      );

      await carregarDados();
    } catch (error: any) {
      console.error(
        "Erro ao excluir etapa:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível excluir a etapa."
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

          {podeCriarEtapa && (
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
          )}
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

      {mostrandoFormulario &&
        podeCriarEtapa && (
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
              Adicione uma nova etapa ao fluxo desta obra. A numeração será definida automaticamente.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">
                Título da etapa *
              </label>

              <input
                type="text"
                value={
                  novoTitulo
                }
                onChange={(
                  event
                ) =>
                  setNovoTitulo(
                    event.target.value
                  )
                }
                placeholder="Ex.: Dimensionamento hidráulico"
                required
                className="h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

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
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
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
                  A etapa será criada para o seu setor.
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
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
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
              rows={2}
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
                !novoTitulo.trim() ||
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
        <div className="space-y-2">
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

              const visualizandoRevisaoAtual =
                true;

              const etapaExibida: EtapaObra =
                etapa;

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

              const destinoPostIt =
                etapaEhEngenhariaComercial(
                  etapaExibida
                )
                  ? obterDestinoPostIt(
                      etapaExibida
                    )
                  : null;

              const resumoDemandas =
                resumoDemandasPorEtapa[
                  etapa.id
                ] || {
                  total:
                    0,

                  concluidas:
                    0,

                  todasConcluidas:
                    false,

                  maiorDataConclusao:
                    null,
                };

              const podeConcluirPorDemandas =
                resumoDemandas.todasConcluidas;

              const expandida =
                etapaExpandidaId ===
                etapa.id;

              return (
                <article
                  key={
                    etapa.id
                  }
                  className={`overflow-hidden rounded-xl border shadow-sm ${
                    etapaExibida.status ===
                    "concluida"
                      ? "border-green-300 bg-green-50/40"
                      : "bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setEtapaExpandidaId(
                        expandida
                          ? null
                          : etapa.id
                      )
                    }
                    className="flex w-full cursor-pointer items-center gap-4 px-4 py-3 text-left transition hover:bg-slate-50/80"
                    aria-expanded={
                      expandida
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="truncate text-base font-bold text-gray-950">
                          {etapa.titulo ||
                            "Sem título"}
                        </h3>

                        <span className="text-xs font-medium text-gray-400">
                          Etapa{" "}
                          {etapa.ordem ??
                            indice +
                              1}
                        </span>

                        <span className="text-xs text-gray-300">
                          •
                        </span>

                        <span className="text-xs font-medium text-gray-500">
                          {etapa.setor?.nome ||
                            "Setor não informado"}
                        </span>

                        {etapa.obrigatoria && (
                          <>
                            <span className="text-xs text-gray-300">
                              •
                            </span>

                            <span className="text-xs font-medium text-gray-500">
                              Obrigatória
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />

                          Início:{" "}
                          <strong className="font-semibold text-gray-700">
                            {formatarData(
                              etapaExibida.data_inicio
                            )}
                          </strong>
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />

                          Prazo:{" "}
                          <strong className="font-semibold text-gray-700">
                            {formatarData(
                              etapaExibida.prazo
                            )}
                          </strong>
                        </span>

                        {etapaExibida.status ===
                          "concluida" && (
                          <span className="inline-flex items-center gap-1.5 text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />

                            Conclusão:{" "}
                            <strong className="font-semibold">
                              {formatarData(
                                etapaExibida.data_conclusao
                              )}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`hidden shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide sm:flex ${obterClasseStatus(
                        etapaExibida.status
                      )}`}
                    >
                      {etapaExibida.status ===
                        "concluida" && (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}

                      {obterLabelStatus(
                        etapaExibida.status
                      )}
                    </div>

                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                        expandida
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  <div className="border-t px-4 py-3 sm:hidden">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide ${obterClasseStatus(
                        etapaExibida.status
                      )}`}
                    >
                      {etapaExibida.status ===
                        "concluida" && (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}

                      {obterLabelStatus(
                        etapaExibida.status
                      )}
                    </div>
                  </div>

                  {expandida && (
                    <div className="border-t px-4 pb-4">
                  {destinoPostIt && (
                    <div
                      className={`mt-4 rounded-xl border p-3 ${destinoPostIt.classe}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${destinoPostIt.classeIcone}`}
                        >
                          <StickyNote className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                            Local do post-it físico
                          </p>

                          <p className="mt-1 text-base font-bold">
                            {
                              destinoPostIt.titulo
                            }
                          </p>

                          <p className="mt-1 text-sm leading-5 opacity-80">
                            {
                              destinoPostIt.descricao
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {visualizandoRevisaoAtual && (
                    <>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">
                        Título da etapa *
                      </label>

                      <input
                        type="text"
                        value={
                          edicao.titulo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarEdicao(
                            etapa.id,
                            "titulo",
                            event.target.value
                          )
                        }
                        disabled={
                          !podeEditar
                        }
                        required
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
                      />
                    </div>

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
                        className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
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
                              disabled={
                                opcao.valor ===
                                  "concluida" &&
                                etapa.status !==
                                  "concluida" &&
                                !podeConcluirPorDemandas
                              }
                            >
                              {
                                opcao.label
                              }
                            </option>
                          )
                        )}
                      </select>

                      {etapa.status !==
                        "concluida" && (
                        <p
                          className={`text-xs ${
                            podeConcluirPorDemandas
                              ? "font-medium text-green-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          {podeConcluirPorDemandas
                            ? `Todas as ${resumoDemandas.total} demanda(s) foram concluídas. A etapa pode ser finalizada.`
                            : resumoDemandas.total >
                                0
                              ? `${resumoDemandas.concluidas} de ${resumoDemandas.total} demanda(s) concluída(s).`
                              : "A etapa precisa ter ao menos uma demanda concluída para poder ser finalizada."}
                        </p>
                      )}
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
                          className="h-10 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
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
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
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
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
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

                  <div className="mt-4 space-y-2">
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
                      rows={2}
                      className="w-full resize-none rounded-lg border p-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
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
                              executando ||
                              !podeConcluirPorDemandas
                            }
                            title={
                              podeConcluirPorDemandas
                                ? "Concluir etapa"
                                : resumoDemandas.total >
                                    0
                                  ? `Conclua as ${
                                      resumoDemandas.total -
                                      resumoDemandas.concluidas
                                    } demanda(s) restante(s).`
                                  : "Cadastre e conclua ao menos uma demanda nesta etapa."
                            }
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
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
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            excluirEtapa(
                              etapa
                            )
                          }
                          disabled={
                            salvando ||
                            executando
                          }
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />

                          Excluir etapa
                        </button>

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
                      </div>
                    )}
                  </div>
                    </>
                  )}
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>
      )}
      {etapaConclusaoPendente && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharConfirmacaoConclusao();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Confirmar finalização
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                A data sugerida corresponde à conclusão mais recente entre as demandas desta etapa e define o mês de arquivamento do post-it da Engenharia Comercial.
              </p>
            </div>

            {!escolhendoOutraData ? (
              <div className="mt-6">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">
                    Você confirma que esta etapa foi finalizada em:
                  </p>

                  <p className="mt-2 text-lg font-bold text-blue-950">
                    {formatarData(
                      dataConclusaoEscolhida
                    )}
                  </p>

                  <p className="mt-1 text-xs text-blue-700">
                    Competência do post-it:{" "}
                    {formatarCompetencia(
                      dataConclusaoEscolhida
                    )}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={
                      fecharConfirmacaoConclusao
                    }
                    disabled={
                      salvandoConclusao
                    }
                    className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEscolhendoOutraData(
                        true
                      )
                    }
                    disabled={
                      salvandoConclusao
                    }
                    className="cursor-pointer rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Não, escolher outro dia
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      confirmarConclusaoAplicacao(
                        dataConclusaoEscolhida
                      )
                    }
                    disabled={
                      salvandoConclusao
                    }
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {salvandoConclusao && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    Sim, confirmar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <label
                  htmlFor="data-conclusao-aplicacao"
                  className="text-sm font-medium text-gray-800"
                >
                  Data em que a proposta foi finalizada
                </label>

                <input
                  id="data-conclusao-aplicacao"
                  type="date"
                  value={
                    dataConclusaoEscolhida
                  }
                  onChange={(
                    event
                  ) =>
                    setDataConclusaoEscolhida(
                      event.target.value
                    )
                  }
                  disabled={
                    salvandoConclusao
                  }
                  className="mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted"
                />

                {dataConclusaoEscolhida && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                    O post-it será arquivado na competência de{" "}
                    <strong>
                      {formatarCompetencia(
                        dataConclusaoEscolhida
                      )}
                    </strong>
                    .
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDataConclusaoEscolhida(
                        obterDataHoje()
                      );

                      setEscolhendoOutraData(
                        false
                      );
                    }}
                    disabled={
                      salvandoConclusao
                    }
                    className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      confirmarConclusaoAplicacao(
                        dataConclusaoEscolhida
                      )
                    }
                    disabled={
                      salvandoConclusao ||
                      !dataConclusaoEscolhida
                    }
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {salvandoConclusao ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}

                    Salvar conclusão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}