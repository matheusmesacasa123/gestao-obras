import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  CirclePlay,
  CircleUserRound,
  CopyPlus,
  Download,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  History,
  ListTodo,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  supabase,
} from "@/integrations/supabase/client";

import {
  getDocumentosPorDemandas,
} from "@/features/obras/documentos/services/documentos-service";

import type {
  Documento,
} from "@/features/obras/documentos/types";

import {
  concluirDemanda,
  criarNovaRevisaoDemanda,
  deleteDemanda,
  iniciarDemanda,
  updateDemanda,
} from "../services/demandas-service";

import type {
  Demanda,
  StatusDemanda,
} from "../types";

export interface EtapaDemandaLista {
  id: string;
  titulo: string | null;
  ordem: number | null;
  setor_id: string;
}

interface DemandaListProps {
  demandas: Demanda[];
  etapas: EtapaDemandaLista[];
  obraId: string;
  onDelete?: () => void;
  onEdit?: (
    demanda: Demanda
  ) => void;
  onStatusChange?: () => void;
}

interface GrupoDemanda {
  grupoId: string;
  revisoes: Demanda[];
}

interface UsuarioResponsavelRevisao {
  id: string;
  nome: string;
  email: string;
  setor_id: string | null;
}

type TipoVisualDocumento =
  | "excel"
  | "word"
  | "pdf"
  | "powerpoint"
  | "imagem"
  | "compactado"
  | "generico";

function obterExtensaoDocumento(
  documento: Documento
) {
  const referencias = [
    documento.nome,
    documento.arquivo_url,
  ];

  for (const referencia of referencias) {
    if (!referencia) {
      continue;
    }

    const referenciaSemParametros =
      referencia
        .split("?")[0]
        .split("#")[0];

    const ultimoSegmento =
      referenciaSemParametros
        .split("/")
        .pop() || "";

    const partes =
      ultimoSegmento.split(".");

    if (partes.length < 2) {
      continue;
    }

    const extensao =
      (
        partes.pop() ||
        ""
      ).toLowerCase();

    if (extensao) {
      return extensao;
    }
  }

  return "";
}

function obterTipoVisualDocumento(
  extensao: string
): TipoVisualDocumento {
  if (
    [
      "xls",
      "xlsx",
      "xlsm",
      "xlsb",
      "csv",
      "ods",
    ].includes(extensao)
  ) {
    return "excel";
  }

  if (
    [
      "doc",
      "docx",
      "docm",
      "odt",
      "rtf",
    ].includes(extensao)
  ) {
    return "word";
  }

  if (extensao === "pdf") {
    return "pdf";
  }

  if (
    [
      "ppt",
      "pptx",
      "pptm",
      "odp",
    ].includes(extensao)
  ) {
    return "powerpoint";
  }

  if (
    [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "webp",
      "svg",
      "bmp",
      "tif",
      "tiff",
    ].includes(extensao)
  ) {
    return "imagem";
  }

  if (
    [
      "zip",
      "rar",
      "7z",
      "tar",
      "gz",
    ].includes(extensao)
  ) {
    return "compactado";
  }

  return "generico";
}

function obterVisualDocumento(
  documento: Documento
) {
  const extensao =
    obterExtensaoDocumento(
      documento
    );

  const tipo =
    obterTipoVisualDocumento(
      extensao
    );

  switch (tipo) {
    case "excel":
      return {
        Icone: FileSpreadsheet,
        rotulo: "EXCEL",
        classe:
          "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-500",
        classeRotulo:
          "bg-emerald-200/70 text-emerald-900",
      };

    case "word":
      return {
        Icone: FileText,
        rotulo: "WORD",
        classe:
          "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-300 hover:bg-blue-100 focus:ring-blue-500",
        classeRotulo:
          "bg-blue-200/70 text-blue-900",
      };

    case "pdf":
      return {
        Icone: FileText,
        rotulo: "PDF",
        classe:
          "border-red-200 bg-red-50 text-red-800 hover:border-red-300 hover:bg-red-100 focus:ring-red-500",
        classeRotulo:
          "bg-red-200/70 text-red-900",
      };

    case "powerpoint":
      return {
        Icone: FileText,
        rotulo: extensao.toUpperCase() || "PPT",
        classe:
          "border-orange-200 bg-orange-50 text-orange-800 hover:border-orange-300 hover:bg-orange-100 focus:ring-orange-500",
        classeRotulo:
          "bg-orange-200/70 text-orange-900",
      };

    case "imagem":
      return {
        Icone: FileImage,
        rotulo: extensao.toUpperCase() || "IMG",
        classe:
          "border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-300 hover:bg-violet-100 focus:ring-violet-500",
        classeRotulo:
          "bg-violet-200/70 text-violet-900",
      };

    case "compactado":
      return {
        Icone: FileArchive,
        rotulo: extensao.toUpperCase() || "ZIP",
        classe:
          "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 focus:ring-amber-500",
        classeRotulo:
          "bg-amber-200/70 text-amber-900",
      };

    default:
      return {
        Icone: FileText,
        rotulo: extensao.toUpperCase() || "ARQUIVO",
        classe:
          "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 focus:ring-slate-500",
        classeRotulo:
          "bg-slate-200 text-slate-800",
      };
  }
}

function formatarData(
  valor?: string | null
) {
  if (!valor) {
    return "Sem prazo";
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
  ).format(
    data
  );
}

function demandaFoiConcluidaComAtraso(
  demanda: Demanda
) {
  if (
    demanda.status !==
      "concluida" ||
    !demanda.prazo ||
    !demanda.data_conclusao
  ) {
    return false;
  }

  const prazo =
    demanda.prazo.slice(
      0,
      10
    );

  const dataConclusao =
    demanda.data_conclusao.slice(
      0,
      10
    );

  return (
    dataConclusao >
    prazo
  );
}

function demandaEstaEmAtraso(
  demanda: Demanda
) {
  if (
    (
      demanda.status !==
        "aberta" &&
      demanda.status !==
        "em_andamento"
    ) ||
    !demanda.prazo
  ) {
    return false;
  }

  const prazo =
    demanda.prazo.slice(
      0,
      10
    );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      prazo
    )
  ) {
    return false;
  }

  const hoje =
    new Date();

  const dataAtual = [
    hoje.getFullYear(),
    String(
      hoje.getMonth() +
        1
    ).padStart(
      2,
      "0"
    ),
    String(
      hoje.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");

  return prazo < dataAtual;
}

function obterLabelStatus(
  status?: StatusDemanda | null,
  concluidaComAtraso = false,
  emAtraso = false
) {
  if (emAtraso) {
    return "Em atraso";
  }

  if (
    status ===
      "concluida" &&
    concluidaComAtraso
  ) {
    return "Concluída com atraso";
  }

  switch (status) {
    case "em_andamento":
      return "Em andamento";

    case "concluida":
      return "Concluída";

    case "cancelada":
      return "Cancelada";

    default:
      return "Aberta";
  }
}

function obterClasseStatus(
  status?: StatusDemanda | null,
  concluidaComAtraso = false,
  emAtraso = false
) {
  if (emAtraso) {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (
    status ===
      "concluida" &&
    concluidaComAtraso
  ) {
    return "border-amber-300 bg-amber-100 text-amber-800";
  }

  switch (status) {
    case "em_andamento":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "concluida":
      return "border-green-200 bg-green-50 text-green-700";

    case "cancelada":
      return "border-gray-200 bg-gray-100 text-gray-600";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function formatarNumeroRevisao(
  numero: number
) {
  return `Rev. ${String(
    numero
  ).padStart(
    2,
    "0"
  )}`;
}

interface IdentidadeVisualDemanda {
  borda: string;
  fundo: string;
  marcador: string;
  titulo: string;
  detalhe: string;
  painel: string;
}

function obterIdentidadeVisualDemanda(): IdentidadeVisualDemanda {
  return {
    borda:
      "border-l-slate-700",

    fundo:
      "bg-white",

    marcador:
      "bg-slate-700",

    titulo:
      "text-slate-950",

    detalhe:
      "border-slate-300 bg-slate-100 text-slate-700",

    painel:
      "border-slate-200 bg-slate-50",
  };
}

export function DemandaList({
  demandas,
  etapas,
  onEdit,
  onStatusChange,
}: DemandaListProps) {
  const {
    perfil,
  } = useAuth();

  const [
    etapasAbertas,
    setEtapasAbertas,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const [
    revisaoSelecionadaPorGrupo,
    setRevisaoSelecionadaPorGrupo,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

  const [
    demandaIniciandoId,
    setDemandaIniciandoId,
  ] = useState<string | null>(
    null
  );

  const [
    demandaConcluindoId,
    setDemandaConcluindoId,
  ] = useState<string | null>(
    null
  );

  const [
    grupoCriandoRevisaoId,
    setGrupoCriandoRevisaoId,
  ] = useState<string | null>(
    null
  );

  const [
    demandaExcluindoId,
    setDemandaExcluindoId,
  ] = useState<string | null>(
    null
  );

  const [
    grupoNovaRevisao,
    setGrupoNovaRevisao,
  ] = useState<GrupoDemanda | null>(
    null
  );

  const [
    responsavelNovaRevisaoId,
    setResponsavelNovaRevisaoId,
  ] = useState("");

  const [
    prazoNovaRevisao,
    setPrazoNovaRevisao,
  ] = useState("");

  const [
    usuariosResponsaveis,
    setUsuariosResponsaveis,
  ] = useState<
    UsuarioResponsavelRevisao[]
  >([]);

  const [
    carregandoResponsaveis,
    setCarregandoResponsaveis,
  ] = useState(false);

  const [
    erroNovaRevisao,
    setErroNovaRevisao,
  ] = useState("");

  const [
    demandaEditandoPrazo,
    setDemandaEditandoPrazo,
  ] = useState<Demanda | null>(
    null
  );

  const [
    prazoEditado,
    setPrazoEditado,
  ] = useState("");

  const [
    salvandoPrazo,
    setSalvandoPrazo,
  ] = useState(false);

  const [
    erroPrazo,
    setErroPrazo,
  ] = useState("");

  const [
    documentosPorDemanda,
    setDocumentosPorDemanda,
  ] = useState<
    Record<
      string,
      Documento[]
    >
  >({});

  const [
    carregandoDocumentos,
    setCarregandoDocumentos,
  ] = useState(false);

  useEffect(() => {
    const demandaIds =
      Array.from(
        new Set(
          demandas.map(
            (
              demanda
            ) =>
              demanda.id
          )
        )
      );

    if (
      demandaIds.length ===
      0
    ) {
      setDocumentosPorDemanda(
        {}
      );

      setCarregandoDocumentos(
        false
      );

      return;
    }

    let ativo =
      true;

    async function carregarDocumentos() {
      try {
        setCarregandoDocumentos(
          true
        );

        const documentos =
          await getDocumentosPorDemandas(
            demandaIds
          );

        if (!ativo) {
          return;
        }

        const mapa =
          documentos.reduce<
            Record<
              string,
              Documento[]
            >
          >(
            (
              acumulador,
              documento
            ) => {
              const documentosDaDemanda =
                acumulador[
                  documento.demanda_id
                ] || [];

              acumulador[
                documento.demanda_id
              ] = [
                ...documentosDaDemanda,
                documento,
              ];

              return acumulador;
            },
            {}
          );

        setDocumentosPorDemanda(
          mapa
        );
      } catch (error) {
        console.error(
          "Erro ao carregar documentos das demandas:",
          error
        );

        if (ativo) {
          setDocumentosPorDemanda(
            {}
          );
        }
      } finally {
        if (ativo) {
          setCarregandoDocumentos(
            false
          );
        }
      }
    }

    void carregarDocumentos();

    return () => {
      ativo =
        false;
    };
  }, [
    demandas,
  ]);

  async function handleIniciarDemanda(
    demanda: Demanda
  ) {
    try {
      setDemandaIniciandoId(
        demanda.id
      );

      await iniciarDemanda(
        demanda.id
      );

      await onStatusChange?.();
    } catch (error: any) {
      console.error(
        "Erro ao iniciar demanda:",
        error
      );

      window.alert(
        error?.message ||
          "Não foi possível iniciar a demanda."
      );
    } finally {
      setDemandaIniciandoId(
        null
      );
    }
  }

  async function handleConcluirDemanda(
    demanda: Demanda
  ) {
    const confirmado =
      window.confirm(
        `Deseja concluir a demanda “${demanda.titulo}” na ${formatarNumeroRevisao(
          demanda.numero_revisao
        )}?`
      );

    if (!confirmado) {
      return;
    }

    try {
      setDemandaConcluindoId(
        demanda.id
      );

      await concluirDemanda(
        demanda.id
      );

      await onStatusChange?.();
    } catch (error: any) {
      console.error(
        "Erro ao concluir demanda:",
        error
      );

      window.alert(
        error?.message ||
          error?.details ||
          "Não foi possível concluir a demanda."
      );
    } finally {
      setDemandaConcluindoId(
        null
      );
    }
  }

  async function abrirModalNovaRevisao(
    grupo: GrupoDemanda
  ) {
    const revisaoMaisRecente =
      grupo.revisoes[0];

    if (
      !revisaoMaisRecente.setor_id
    ) {
      window.alert(
        "A demanda precisa possuir um setor antes de criar uma nova revisão."
      );

      return;
    }

    setGrupoNovaRevisao(
      grupo
    );

    setResponsavelNovaRevisaoId(
      ""
    );

    setPrazoNovaRevisao(
      ""
    );

    setUsuariosResponsaveis(
      []
    );

    setErroNovaRevisao(
      ""
    );

    try {
      setCarregandoResponsaveis(
        true
      );

      const {
        data,
        error,
      } = await supabase
        .from("usuarios")
        .select(
          "id, nome, email, setor_id"
        )
        .eq(
          "ativo",
          true
        )
        .eq(
          "setor_id",
          revisaoMaisRecente.setor_id
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

      setUsuariosResponsaveis(
        (
          data ??
          []
        ) as UsuarioResponsavelRevisao[]
      );
    } catch (error) {
      console.error(
        "Erro ao carregar responsáveis:",
        error
      );

      setErroNovaRevisao(
        "Não foi possível carregar os responsáveis deste setor."
      );
    } finally {
      setCarregandoResponsaveis(
        false
      );
    }
  }

  function fecharModalNovaRevisao() {
    if (
      grupoCriandoRevisaoId
    ) {
      return;
    }

    setGrupoNovaRevisao(
      null
    );

    setResponsavelNovaRevisaoId(
      ""
    );

    setPrazoNovaRevisao(
      ""
    );

    setUsuariosResponsaveis(
      []
    );

    setErroNovaRevisao(
      ""
    );
  }

  async function handleCriarNovaRevisao(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !grupoNovaRevisao
    ) {
      return;
    }

    if (
      !responsavelNovaRevisaoId
    ) {
      setErroNovaRevisao(
        "Selecione o responsável pela nova revisão."
      );

      return;
    }

    const revisaoMaisRecente =
      grupoNovaRevisao.revisoes[0];

    try {
      setErroNovaRevisao(
        ""
      );

      setGrupoCriandoRevisaoId(
        grupoNovaRevisao.grupoId
      );

      const novaDemandaId =
        await criarNovaRevisaoDemanda(
          revisaoMaisRecente.id,
          responsavelNovaRevisaoId,
          prazoNovaRevisao ||
            null
        );

      setRevisaoSelecionadaPorGrupo(
        (
          estadoAtual
        ) => ({
          ...estadoAtual,

          [grupoNovaRevisao.grupoId]:
            novaDemandaId,
        })
      );

      setGrupoNovaRevisao(
        null
      );

      setResponsavelNovaRevisaoId(
        ""
      );

      setPrazoNovaRevisao(
        ""
      );

      setUsuariosResponsaveis(
        []
      );

      await onStatusChange?.();
    } catch (error: any) {
      console.error(
        "Erro ao criar nova revisão da demanda:",
        error
      );

      setErroNovaRevisao(
        error?.message ||
          error?.details ||
          "Não foi possível criar a nova revisão."
      );
    } finally {
      setGrupoCriandoRevisaoId(
        null
      );
    }
  }

  function abrirModalEditarPrazo(
    demanda: Demanda
  ) {
    setDemandaEditandoPrazo(
      demanda
    );

    setPrazoEditado(
      demanda.prazo?.slice(
        0,
        10
      ) || ""
    );

    setErroPrazo("");
  }

  function fecharModalEditarPrazo() {
    if (salvandoPrazo) {
      return;
    }

    setDemandaEditandoPrazo(
      null
    );

    setPrazoEditado("");
    setErroPrazo("");
  }

  async function handleSalvarPrazo(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!demandaEditandoPrazo) {
      return;
    }

    try {
      setSalvandoPrazo(true);
      setErroPrazo("");

      await updateDemanda(
        demandaEditandoPrazo.id,
        {
          prazo:
            prazoEditado ||
            null,
        }
      );

      await onStatusChange?.();

      setDemandaEditandoPrazo(
        null
      );

      setPrazoEditado("");
    } catch (error: any) {
      console.error(
        "Erro ao atualizar o prazo da revisão:",
        error
      );

      setErroPrazo(
        error?.message ||
          error?.details ||
          "Não foi possível atualizar o prazo da revisão."
      );
    } finally {
      setSalvandoPrazo(false);
    }
  }

  async function handleExcluirRevisao(
    grupo: GrupoDemanda,
    demanda: Demanda
  ) {
    if (
      grupo.revisoes.length <=
      1
    ) {
      window.alert(
        "Não é possível excluir a única revisão da demanda."
      );

      return;
    }

    const confirmou =
      window.confirm(
        `Excluir definitivamente a ${formatarNumeroRevisao(
          demanda.numero_revisao
        )} da demanda “${demanda.titulo}”? O checklist, as observações e os acompanhamentos desta revisão também serão excluídos.`
      );

    if (!confirmou) {
      return;
    }

    try {
      setDemandaExcluindoId(
        demanda.id
      );

      await deleteDemanda(
        demanda.id
      );

      setRevisaoSelecionadaPorGrupo(
        (
          estadoAtual
        ) => {
          const novoEstado = {
            ...estadoAtual,
          };

          delete novoEstado[
            grupo.grupoId
          ];

          return novoEstado;
        }
      );

      await onStatusChange?.();
    } catch (error: any) {
      console.error(
        "Erro ao excluir revisão da demanda:",
        error
      );

      if (
        error?.code ===
        "23503"
      ) {
        window.alert(
          "Esta revisão possui documentos vinculados. Remova ou desvincule os documentos antes de excluir a revisão."
        );
      } else {
        window.alert(
          error?.message ||
            error?.details ||
            "Não foi possível excluir a revisão."
        );
      }
    } finally {
      setDemandaExcluindoId(
        null
      );
    }
  }

  const etapasOrdenadas =
    useMemo(
      () =>
        [...etapas].sort(
          (
            etapaA,
            etapaB
          ) =>
            (
              etapaA.ordem ??
              Number.MAX_SAFE_INTEGER
            ) -
            (
              etapaB.ordem ??
              Number.MAX_SAFE_INTEGER
            )
        ),
      [
        etapas,
      ]
    );

  const gruposPorEtapa =
    useMemo(() => {
      const resultado =
        new Map<
          string,
          GrupoDemanda[]
        >();

      for (
        const etapa
        of etapasOrdenadas
      ) {
        resultado.set(
          etapa.id,
          []
        );
      }

      const mapaTemporario =
        new Map<
          string,
          Map<
            string,
            Demanda[]
          >
        >();

      for (
        const demanda
        of demandas
      ) {
        if (!demanda.etapa_id) {
          continue;
        }

        const gruposDaEtapa =
          mapaTemporario.get(
            demanda.etapa_id
          ) ||
          new Map<
            string,
            Demanda[]
          >();

        const grupoId =
          demanda.grupo_revisao_id ||
          demanda.id;

        const revisoes =
          gruposDaEtapa.get(
            grupoId
          ) ||
          [];

        revisoes.push(
          demanda
        );

        gruposDaEtapa.set(
          grupoId,
          revisoes
        );

        mapaTemporario.set(
          demanda.etapa_id,
          gruposDaEtapa
        );
      }

      for (
        const etapa
        of etapasOrdenadas
      ) {
        const gruposDaEtapa =
          mapaTemporario.get(
            etapa.id
          );

        if (!gruposDaEtapa) {
          continue;
        }

        const grupos =
          Array.from(
            gruposDaEtapa.entries()
          )
            .map(
              ([
                grupoId,
                revisoes,
              ]) => ({
                grupoId,

                revisoes:
                  [...revisoes].sort(
                    (
                      revisaoA,
                      revisaoB
                    ) =>
                      revisaoB.numero_revisao -
                      revisaoA.numero_revisao
                  ),
              })
            )
            .sort(
              (
                grupoA,
                grupoB
              ) =>
                grupoA.revisoes[0].titulo.localeCompare(
                  grupoB.revisoes[0].titulo,
                  "pt-BR"
                )
            );

        resultado.set(
          etapa.id,
          grupos
        );
      }

      return resultado;
    }, [
      demandas,
      etapasOrdenadas,
    ]);

  if (
    etapasOrdenadas.length ===
    0
  ) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <h2 className="text-lg font-semibold">
          Nenhuma etapa cadastrada
        </h2>

        <p className="mt-2 text-muted-foreground">
          Cadastre uma etapa antes de criar demandas.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
      {etapasOrdenadas.map(
        (
          etapa
        ) => {
          const grupos =
            gruposPorEtapa.get(
              etapa.id
            ) ||
            [];

          const etapaAberta =
            Boolean(
              etapasAbertas[
                etapa.id
              ]
            );

          return (
            <section
              key={
                etapa.id
              }
              className="overflow-hidden rounded-2xl border bg-white shadow-sm [will-change:contents]"
            >
              <button
                type="button"
                onClick={() =>
                  setEtapasAbertas(
                    (
                      estadoAtual
                    ) => ({
                      ...estadoAtual,

                      [etapa.id]:
                        !estadoAtual[
                          etapa.id
                        ],
                    })
                  )
                }
                className={`flex w-full cursor-pointer items-center gap-3 bg-slate-50/70 px-4 py-4 text-left transition-colors duration-200 ease-out hover:bg-slate-100/80 motion-reduce:transition-none ${
                  etapaAberta
                    ? "border-b"
                    : ""
                }`}
              >
                <ChevronRight
                  className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                    etapaAberta
                      ? "rotate-90"
                      : "rotate-0"
                  }`}
                />

                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-gray-950">
                    Etapa{" "}
                    {etapa.ordem ??
                      "—"}{" "}
                    —{" "}
                    {etapa.titulo ||
                      "Sem título"}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {grupos.length} demanda(s)
                  </p>
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out motion-reduce:transition-none ${
                  etapaAberta
                    ? "grid-rows-[1fr] opacity-100"
                    : "pointer-events-none grid-rows-[0fr] opacity-0"
                }`}
                aria-hidden={
                  !etapaAberta
                }
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className={`divide-y transition-transform duration-250 ease-out motion-reduce:transition-none ${
                      etapaAberta
                        ? "translate-y-0"
                        : "-translate-y-1"
                    }`}
                  >
                  {grupos.length ===
                  0 ? (
                    <div className="px-5 py-8 text-center">
                      <ListTodo className="mx-auto h-8 w-8 text-gray-300" />

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        Nenhuma demanda nesta etapa
                      </p>
                    </div>
                  ) : (
                    grupos.map(
                      (
                        grupo
                      ) => {
                        const revisaoMaisRecente =
                          grupo.revisoes[0];

                        const revisaoSelecionadaId =
                          revisaoSelecionadaPorGrupo[
                            grupo.grupoId
                          ] ||
                          revisaoMaisRecente.id;

                        const demandaSelecionada =
                          grupo.revisoes.find(
                            (
                              revisao
                            ) =>
                              revisao.id ===
                              revisaoSelecionadaId
                          ) ||
                          revisaoMaisRecente;

                        const ehRevisaoMaisRecente =
                          demandaSelecionada.id ===
                          revisaoMaisRecente.id;

                        const itensPendentes =
                          (
                            demandaSelecionada.itens ??
                            []
                          ).filter(
                            (
                              item
                            ) =>
                              !item.concluido
                          ).length;

                        const podeConcluir =
                          demandaSelecionada.status ===
                            "em_andamento" &&
                          itensPendentes ===
                            0;

                        const administrador =
                          perfil?.administrador ===
                          true;

                        const podeGerenciar =
                          administrador ||
                          Boolean(
                            perfil?.setor_id &&
                            perfil.setor_id ===
                              demandaSelecionada.setor_id
                          );

                        const documentosDaDemanda =
                          documentosPorDemanda[
                            demandaSelecionada.id
                          ] || [];

                        const identidadeVisual =
                          obterIdentidadeVisualDemanda();

                        const demandaConcluida =
                          demandaSelecionada.status ===
                          "concluida";

                        const demandaConcluidaComAtraso =
                          demandaFoiConcluidaComAtraso(
                            demandaSelecionada
                          );

                        const demandaEmAtraso =
                          demandaEstaEmAtraso(
                            demandaSelecionada
                          );

                        const classeContainer =
                          demandaConcluida
                            ? "border-l-green-600 bg-green-50/70"
                            : `${identidadeVisual.borda} ${identidadeVisual.fundo}`;

                        const classeTitulo =
                          demandaConcluida
                            ? "text-green-950"
                            : identidadeVisual.titulo;

                        const classeMarcador =
                          demandaConcluida
                            ? "bg-green-600"
                            : identidadeVisual.marcador;

                        const classeDetalhe =
                          demandaConcluida
                            ? "border-green-300 bg-green-100 text-green-800"
                            : identidadeVisual.detalhe;

                        const classePainel =
                          demandaConcluida
                            ? "border-green-300 bg-green-100/70"
                            : identidadeVisual.painel;

                        return (
                          <article
                            key={
                              grupo.grupoId
                            }
                            className={`space-y-4 border-l-2 px-5 py-5 transition ${classeContainer}`}
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  onEdit?.(
                                    demandaSelecionada
                                  )
                                }
                                className="min-w-0 cursor-pointer text-left"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`h-2 w-2 shrink-0 rounded-full ${classeMarcador}`}
                                  />

                                  <h4
                                    className={`truncate text-sm font-extrabold ${classeTitulo}`}
                                  >
                                    {revisaoMaisRecente.titulo}
                                  </h4>

                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${classeDetalhe}`}
                                  >
                                    <History className="h-3.5 w-3.5" />

                                    {grupo.revisoes.length} revisão(ões)
                                  </span>
                                </div>

                                {demandaSelecionada.descricao && (
                                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                    {demandaSelecionada.descricao}
                                  </p>
                                )}
                              </button>

                              <div className="flex flex-wrap items-center gap-2">
                                <label
                                  htmlFor={`revisao-demanda-${grupo.grupoId}`}
                                  className="text-xs font-semibold text-gray-500"
                                >
                                  Revisão
                                </label>

                                <select
                                  id={`revisao-demanda-${grupo.grupoId}`}
                                  value={
                                    demandaSelecionada.id
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setRevisaoSelecionadaPorGrupo(
                                      (
                                        estadoAtual
                                      ) => ({
                                        ...estadoAtual,

                                        [grupo.grupoId]:
                                          event.target.value,
                                      })
                                    )
                                  }
                                  className="h-9 rounded-lg border bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500"
                                >
                                  {grupo.revisoes.map(
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
                                        {formatarNumeroRevisao(
                                          revisao.numero_revisao
                                        )}
                                        {revisao.id ===
                                        revisaoMaisRecente.id
                                          ? " — mais recente"
                                          : ""}
                                      </option>
                                    )
                                  )}
                                </select>

                                {podeGerenciar &&
                                  ehRevisaoMaisRecente && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirModalNovaRevisao(
                                        grupo
                                      )
                                    }
                                    disabled={
                                      grupoCriandoRevisaoId ===
                                      grupo.grupoId
                                    }
                                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {grupoCriandoRevisaoId ===
                                    grupo.grupoId ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CopyPlus className="h-4 w-4" />
                                    )}

                                    Nova revisão
                                  </button>
                                )}

                                {podeGerenciar && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirModalEditarPrazo(
                                        demandaSelecionada
                                      )
                                    }
                                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                  >
                                    <Pencil className="h-4 w-4" />

                                    Editar prazo
                                  </button>
                                )}

                                {podeGerenciar && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleExcluirRevisao(
                                        grupo,
                                        demandaSelecionada
                                      )
                                    }
                                    disabled={
                                      grupo.revisoes.length <=
                                        1 ||
                                      demandaExcluindoId ===
                                        demandaSelecionada.id
                                    }
                                    title={
                                      grupo.revisoes.length <=
                                      1
                                        ? "A única revisão da demanda não pode ser excluída."
                                        : `Excluir ${formatarNumeroRevisao(
                                            demandaSelecionada.numero_revisao
                                          )}`
                                    }
                                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {demandaExcluindoId ===
                                    demandaSelecionada.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}

                                    Excluir revisão
                                  </button>
                                )}
                              </div>
                            </div>

                            <div
                              className={`grid gap-3 rounded-xl border p-4 md:grid-cols-[130px_minmax(0,1fr)_180px_140px_auto] md:items-center ${classePainel}`}
                            >
                              <div>
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                                    demandaConcluida
                                      ? "border-green-300 bg-green-50 text-green-800"
                                      : `bg-white ${classeDetalhe}`
                                  }`}
                                >
                                  {formatarNumeroRevisao(
                                    demandaSelecionada.numero_revisao
                                  )}
                                </span>
                              </div>

                              <div>
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${obterClasseStatus(
                                    demandaSelecionada.status,
                                    demandaConcluidaComAtraso,
                                    demandaEmAtraso
                                  )}`}
                                >
                                  {obterLabelStatus(
                                    demandaSelecionada.status,
                                    demandaConcluidaComAtraso,
                                    demandaEmAtraso
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CircleUserRound className="h-4 w-4 shrink-0 text-gray-400" />

                                <span className="truncate">
                                  {demandaSelecionada.responsavel
                                    ?.nome ||
                                    "Sem responsável"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />

                                <span>
                                  {formatarData(
                                    demandaSelecionada.prazo
                                  )}
                                </span>
                              </div>

                              <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                                {podeGerenciar &&
                                  demandaSelecionada.status ===
                                    "aberta" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleIniciarDemanda(
                                        demandaSelecionada
                                      )
                                    }
                                    disabled={
                                      demandaIniciandoId ===
                                      demandaSelecionada.id
                                    }
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {demandaIniciandoId ===
                                    demandaSelecionada.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CirclePlay className="h-4 w-4" />
                                    )}

                                    Iniciar
                                  </button>
                                )}

                                {podeGerenciar &&
                                  demandaSelecionada.status ===
                                    "em_andamento" && (
                                  <div className="flex flex-col items-start gap-1 md:items-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConcluirDemanda(
                                          demandaSelecionada
                                        )
                                      }
                                      disabled={
                                        !podeConcluir ||
                                        demandaConcluindoId ===
                                          demandaSelecionada.id
                                      }
                                      title={
                                        itensPendentes >
                                        0
                                          ? `Conclua os ${itensPendentes} item(ns) pendente(s) antes de finalizar.`
                                          : "Concluir demanda"
                                      }
                                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                                    >
                                      {demandaConcluindoId ===
                                      demandaSelecionada.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CircleCheckBig className="h-4 w-4" />
                                      )}

                                      Concluir
                                    </button>

                                    {itensPendentes >
                                      0 && (
                                      <span className="text-[11px] font-medium text-amber-700">
                                        {itensPendentes} item(ns) pendente(s)
                                      </span>
                                    )}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    onEdit?.(
                                      demandaSelecionada
                                    )
                                  }
                                  className="cursor-pointer rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                  Abrir
                                </button>
                              </div>
                            </div>

                            {carregandoDocumentos ? (
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-medium text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" />

                                Verificando documentos anexados...
                              </div>
                            ) : documentosDaDemanda.length >
                              0 ? (
                              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center">
                                <div className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-700">
                                  <FileText className="h-4 w-4" />

                                  {documentosDaDemanda.length} documento(s)
                                </div>

                                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                                  {documentosDaDemanda.map(
                                    (
                                      documento
                                    ) => {
                                      const visual =
                                        obterVisualDocumento(
                                          documento
                                        );

                                      const IconeDocumento =
                                        visual.Icone;

                                      return (
                                      <a
                                        key={
                                          documento.id
                                        }
                                        href={
                                          documento.arquivo_url
                                        }
                                        download={
                                          documento.nome
                                        }
                                        title={`Baixar ${documento.nome}`}
                                        className={`inline-flex max-w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${visual.classe}`}
                                      >
                                        <IconeDocumento className="h-5 w-5 shrink-0" />

                                        <span
                                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold leading-none ${visual.classeRotulo}`}
                                        >
                                          {visual.rotulo}
                                        </span>

                                        <span className="max-w-64 truncate">
                                          {documento.nome}
                                        </span>

                                        <Download className="h-4 w-4 shrink-0 opacity-70" />
                                      </a>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </article>
                        );
                      }
                    )
                  )}
                  </div>
                </div>
              </div>
            </section>
          );
        }
      )}
      </div>

      {grupoNovaRevisao && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModalNovaRevisao();
            }
          }}
        >
          <form
            onSubmit={
              handleCriarNovaRevisao
            }
            className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl"
          >
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Criar nova revisão
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Selecione o responsável e, se houver, informe o prazo da{" "}
                {formatarNumeroRevisao(
                  grupoNovaRevisao.revisoes[0].numero_revisao +
                    1
                )}{" "}
                da demanda “{grupoNovaRevisao.revisoes[0].titulo}”.
              </p>
            </div>

            <label className="mt-6 block space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Responsável
              </span>

              <select
                value={
                  responsavelNovaRevisaoId
                }
                onChange={(
                  event
                ) => {
                  setResponsavelNovaRevisaoId(
                    event.target.value
                  );

                  setErroNovaRevisao(
                    ""
                  );
                }}
                disabled={
                  carregandoResponsaveis ||
                  Boolean(
                    grupoCriandoRevisaoId
                  )
                }
                required
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {carregandoResponsaveis
                    ? "Carregando responsáveis..."
                    : "Selecione o responsável"}
                </option>

                {usuariosResponsaveis.map(
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
                      {usuario.nome} — {usuario.email}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="mt-4 block space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Prazo da nova revisão (opcional)
              </span>

              <input
                type="date"
                value={
                  prazoNovaRevisao
                }
                onChange={(
                  event
                ) => {
                  setPrazoNovaRevisao(
                    event.target.value
                  );

                  setErroNovaRevisao(
                    ""
                  );
                }}
                disabled={
                  Boolean(
                    grupoCriandoRevisaoId
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <span className="block text-xs text-gray-500">
                Se não houver prazo definido, deixe este campo vazio.
              </span>
            </label>

            {!carregandoResponsaveis &&
              usuariosResponsaveis.length ===
                0 &&
              !erroNovaRevisao && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  Não há usuários ativos cadastrados no setor desta demanda.
                </p>
              )}

            {erroNovaRevisao && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {erroNovaRevisao}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  fecharModalNovaRevisao
                }
                disabled={
                  Boolean(
                    grupoCriandoRevisaoId
                  )
                }
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  carregandoResponsaveis ||
                  !responsavelNovaRevisaoId ||
                  usuariosResponsaveis.length ===
                    0 ||
                  Boolean(
                    grupoCriandoRevisaoId
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {grupoCriandoRevisaoId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CopyPlus className="h-4 w-4" />
                )}

                {grupoCriandoRevisaoId
                  ? "Criando..."
                  : "Criar revisão"}
              </button>
            </div>
          </form>
        </div>
      )}

      {demandaEditandoPrazo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModalEditarPrazo();
            }
          }}
        >
          <form
            onSubmit={
              handleSalvarPrazo
            }
            className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl"
          >
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Editar prazo da revisão
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Altere o prazo da{" "}
                {formatarNumeroRevisao(
                  demandaEditandoPrazo.numero_revisao
                )}{" "}
                da demanda “{demandaEditandoPrazo.titulo}”.
              </p>
            </div>

            <label className="mt-6 block space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Prazo da revisão
              </span>

              <input
                type="date"
                value={
                  prazoEditado
                }
                onChange={(
                  event
                ) => {
                  setPrazoEditado(
                    event.target.value
                  );

                  setErroPrazo("");
                }}
                disabled={
                  salvandoPrazo
                }
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <span className="block text-xs text-gray-500">
                Para deixar a revisão sem prazo, limpe a data antes de salvar.
              </span>
            </label>

            {erroPrazo && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {erroPrazo}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  fecharModalEditarPrazo
                }
                disabled={
                  salvandoPrazo
                }
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  salvandoPrazo
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvandoPrazo && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {salvandoPrazo
                  ? "Salvando..."
                  : "Salvar prazo"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}