import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  ListTodo,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/obras/$id/historico"
)({
  component: HistoricoObraPage,
});

type AcaoHistorico =
  | "criou"
  | "editou"
  | "excluiu";

type EntidadeHistorico =
  | "obra"
  | "demanda"
  | "etapa"
  | "documento";

type UsuarioHistorico = {
  id: string;
  nome: string;
  email: string;
} | null;

type HistoricoObra = {
  id: string;
  obra_id: string;
  usuario_id: string | null;
  acao: AcaoHistorico;
  entidade: EntidadeHistorico;
  entidade_id: string | null;
  descricao: string | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  created_at: string;
  usuario: UsuarioHistorico;
};

type FiltroEntidade =
  | "todas"
  | EntidadeHistorico;

type CampoAlterado = {
  campo: string;
  anterior: unknown;
  novo: unknown;
};

type SetorHistorico = {
  id: string;
  nome: string;
};

type UsuarioOpcao = {
  id: string;
  nome: string;
  email: string;
};

type MapasNomes = {
  setores: Record<string, string>;
  usuarios: Record<string, string>;
};

const camposIgnorados = new Set([
  "id",
  "obra_id",
  "updated_at",
  "created_at",
]);

const nomesCampos: Record<string, string> = {
  codigo: "Código",
  nome_obra: "Nome da obra",
  cliente: "Cliente",
  cliente_id: "Cliente",
  setor_id: "Setor",
  titulo: "Título",
  descricao: "Descrição",
  status: "Status",
  prioridade: "Prioridade",
  responsavel_id: "Responsável",
  prazo: "Prazo",
  data_inicio: "Data de início",
  data_conclusao: "Data de conclusão",
  motivo_atraso: "Motivo do atraso",
  observacao: "Observação",
  observacoes: "Observações",
  obrigatoria: "Obrigatória",
  ordem: "Número da etapa",
  nome: "Nome",
  nome_arquivo: "Nome do arquivo",
  arquivo_nome: "Nome do arquivo",
  tipo_proposta: "Tipo de proposta",
  tipo_orcamentacao: "Tipo de orçamentação",
  complexidade: "Complexidade",
  vendedor: "Vendedor",
  vendedor_id: "Vendedor",
  data_entrada: "Data de entrada",
  data_entrega_esperada: "Data de entrega esperada",
};

const valoresTraduzidos: Record<string, string> = {
  nao_iniciada: "Não iniciada",
  em_andamento: "Em andamento",
  aguardando_outro_setor: "Aguardando outro setor",
  aguardando_cliente: "Aguardando cliente",
  bloqueada: "Bloqueada",
  concluida: "Concluída",

  baixa: "Baixa",
  media: "Média",
  alta: "Alta",

  recebida: "Recebida",
  pendente: "Pendente",
  cancelada: "Cancelada",
  finalizada: "Finalizada",

  baixa_prioridade: "Baixa",
  media_prioridade: "Média",
  alta_prioridade: "Alta",
  urgente: "Urgente",
};

function formatarDataHora(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function formatarNomeEntidade(
  entidade: EntidadeHistorico
) {
  switch (entidade) {
    case "obra":
      return "Obra";

    case "demanda":
      return "Demanda";

    case "etapa":
      return "Etapa";

    case "documento":
      return "Documento";

    default:
      return entidade;
  }
}

function formatarNomeAcao(
  acao: AcaoHistorico
) {
  switch (acao) {
    case "criou":
      return "Criou";

    case "editou":
      return "Editou";

    case "excluiu":
      return "Excluiu";

    default:
      return acao;
  }
}

function formatarValor(
  valor: unknown,
  campo: string,
  mapas: MapasNomes
): string {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "Não informado";
  }

  if (campo === "setor_id") {
    const setorId = String(valor);

    return (
      mapas.setores[setorId] ||
      "Setor não identificado"
    );
  }

  if (
    campo === "responsavel_id" ||
    campo === "vendedor_id" ||
    campo === "usuario_id"
  ) {
    const usuarioId = String(valor);

    return (
      mapas.usuarios[usuarioId] ||
      "Usuário não identificado"
    );
  }

  if (typeof valor === "boolean") {
    return valor ? "Sim" : "Não";
  }

  if (typeof valor === "object") {
    try {
      return JSON.stringify(valor);
    } catch {
      return String(valor);
    }
  }

  const texto = String(valor);

  const traducao =
    valoresTraduzidos[texto] ||
    valoresTraduzidos[texto.toLowerCase()];

  if (traducao) {
    return traducao;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto
      .split("-")
      .map(Number);

    return new Intl.DateTimeFormat(
      "pt-BR"
    ).format(
      new Date(
        ano,
        mes - 1,
        dia
      )
    );
  }

  return texto;
}

function obterCamposAlterados(
  registro: HistoricoObra
): CampoAlterado[] {
  if (
    registro.acao !== "editou" ||
    !registro.dados_anteriores ||
    !registro.dados_novos
  ) {
    return [];
  }

  const campos = new Set([
    ...Object.keys(
      registro.dados_anteriores
    ),
    ...Object.keys(
      registro.dados_novos
    ),
  ]);

  return Array.from(campos)
    .filter(
      (campo) =>
        !camposIgnorados.has(campo)
    )
    .map((campo) => ({
      campo,

      anterior:
        registro.dados_anteriores?.[
          campo
        ],

      novo:
        registro.dados_novos?.[
          campo
        ],
    }))
    .filter(
      (alteracao) =>
        JSON.stringify(
          alteracao.anterior
        ) !==
        JSON.stringify(
          alteracao.novo
        )
    );
}

function obterDadosRegistro(
  registro: HistoricoObra
) {
  return (
    registro.dados_novos ||
    registro.dados_anteriores
  );
}

function obterTituloRegistro(
  registro: HistoricoObra,
  mapas: MapasNomes
) {
  const dados =
    obterDadosRegistro(registro);

  if (!dados) {
    return null;
  }

  if (registro.entidade === "etapa") {
    const ordem =
      dados.ordem !== null &&
      dados.ordem !== undefined
        ? String(dados.ordem)
        : "?";

    const setorId =
      dados.setor_id
        ? String(dados.setor_id)
        : "";

    const setorNome =
      mapas.setores[setorId] ||
      "Setor não identificado";

    return `Etapa ${ordem} — ${setorNome}`;
  }

  if (registro.entidade === "demanda") {
    const titulo =
      dados.titulo ||
      dados.nome ||
      dados.descricao;

    return titulo
      ? String(titulo)
      : "Demanda sem título";
  }

  if (registro.entidade === "documento") {
    const nomeDocumento =
      dados.nome_arquivo ||
      dados.arquivo_nome ||
      dados.nome ||
      dados.titulo;

    return nomeDocumento
      ? String(nomeDocumento)
      : "Documento sem nome";
  }

  if (registro.entidade === "obra") {
    const identificacao =
      dados.codigo ||
      dados.nome_obra;

    return identificacao
      ? String(identificacao)
      : "Obra";
  }

  return null;
}

function obterTituloAcao(
  registro: HistoricoObra,
  mapas: MapasNomes
) {
  const acao =
    formatarNomeAcao(registro.acao);

  const tituloRegistro =
    obterTituloRegistro(
      registro,
      mapas
    );

  if (tituloRegistro) {
    return `${acao} ${tituloRegistro}`;
  }

  return `${acao} ${formatarNomeEntidade(
    registro.entidade
  ).toLowerCase()}`;
}

function obterIconeEntidade(
  entidade: EntidadeHistorico
) {
  switch (entidade) {
    case "obra":
      return Building2;

    case "demanda":
      return ListTodo;

    case "etapa":
      return CheckCircle2;

    case "documento":
      return FileText;

    default:
      return Activity;
  }
}

function obterIconeAcao(
  acao: AcaoHistorico
) {
  switch (acao) {
    case "criou":
      return Plus;

    case "editou":
      return Pencil;

    case "excluiu":
      return Trash2;

    default:
      return Activity;
  }
}

function obterClasseAcao(
  acao: AcaoHistorico
) {
  switch (acao) {
    case "criou":
      return "border-green-200 bg-green-50 text-green-700";

    case "editou":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "excluiu":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function HistoricoObraPage() {
  const { id: obraId } =
    Route.useParams();

  const [
    historico,
    setHistorico,
  ] = useState<HistoricoObra[]>([]);

  const [
    mapasNomes,
    setMapasNomes,
  ] = useState<MapasNomes>({
    setores: {},
    usuarios: {},
  });

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    filtroEntidade,
    setFiltroEntidade,
  ] = useState<FiltroEntidade>(
    "todas"
  );

  const carregarHistorico =
    useCallback(
      async (
        carregamentoInicial = true
      ) => {
        try {
          if (carregamentoInicial) {
            setCarregando(true);
          } else {
            setAtualizando(true);
          }

          setErro("");

          const [
            respostaHistorico,
            respostaSetores,
            respostaUsuarios,
          ] = await Promise.all([
            supabase
              .from("historico_obras")
              .select(`
                id,
                obra_id,
                usuario_id,
                acao,
                entidade,
                entidade_id,
                descricao,
                dados_anteriores,
                dados_novos,
                created_at,
                usuario:usuarios (
                  id,
                  nome,
                  email
                )
              `)
              .eq(
                "obra_id",
                obraId
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              ),

            supabase
              .from("setores")
              .select("id, nome"),

            supabase
              .from("usuarios")
              .select(
                "id, nome, email"
              ),
          ]);

          if (respostaHistorico.error) {
            throw respostaHistorico.error;
          }

          if (respostaSetores.error) {
            throw respostaSetores.error;
          }

          if (respostaUsuarios.error) {
            throw respostaUsuarios.error;
          }

          const setores =
            (respostaSetores.data ||
              []) as SetorHistorico[];

          const usuarios =
            (respostaUsuarios.data ||
              []) as UsuarioOpcao[];

          const mapaSetores =
            setores.reduce<
              Record<string, string>
            >(
              (
                acumulador,
                setor
              ) => {
                acumulador[setor.id] =
                  setor.nome;

                return acumulador;
              },
              {}
            );

          const mapaUsuarios =
            usuarios.reduce<
              Record<string, string>
            >(
              (
                acumulador,
                usuario
              ) => {
                acumulador[usuario.id] =
                  usuario.nome ||
                  usuario.email;

                return acumulador;
              },
              {}
            );

          setMapasNomes({
            setores: mapaSetores,
            usuarios: mapaUsuarios,
          });

          setHistorico(
            (
              respostaHistorico.data ||
              []
            ) as unknown as HistoricoObra[]
          );
        } catch (error) {
          console.error(
            "Erro ao carregar histórico da obra:",
            error
          );

          setErro(
            "Não foi possível carregar o histórico desta obra."
          );
        } finally {
          setCarregando(false);
          setAtualizando(false);
        }
      },
      [obraId]
    );

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  const historicoFiltrado =
    useMemo(() => {
      if (
        filtroEntidade === "todas"
      ) {
        return historico;
      }

      return historico.filter(
        (registro) =>
          registro.entidade ===
          filtroEntidade
      );
    }, [
      historico,
      filtroEntidade,
    ]);

  if (carregando) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />

          Carregando histórico...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Histórico da obra
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Acompanhe as alterações realizadas nesta obra.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            carregarHistorico(false)
          }
          disabled={atualizando}
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
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <label
          htmlFor="filtro-entidade-historico"
          className="text-sm font-semibold text-gray-700"
        >
          Filtrar atividade
        </label>

        <select
          id="filtro-entidade-historico"
          value={filtroEntidade}
          onChange={(event) =>
            setFiltroEntidade(
              event.target
                .value as FiltroEntidade
            )
          }
          className="mt-2 h-11 w-full max-w-sm cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="todas">
            Todas as atividades
          </option>

          <option value="obra">
            Alterações da obra
          </option>

          <option value="demanda">
            Demandas
          </option>

          <option value="etapa">
            Etapas
          </option>

          <option value="documento">
            Documentos
          </option>
        </select>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {erro}
        </div>
      )}

      {!erro &&
      historicoFiltrado.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <Clock3 className="mx-auto h-10 w-10 text-gray-400" />

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Nenhuma atividade registrada
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            As próximas alterações realizadas nesta obra aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="relative space-y-4">
          {historicoFiltrado.map(
            (registro) => {
              const IconeEntidade =
                obterIconeEntidade(
                  registro.entidade
                );

              const IconeAcao =
                obterIconeAcao(
                  registro.acao
                );

              const alteracoes =
                obterCamposAlterados(
                  registro
                );

              const tituloAcao =
                obterTituloAcao(
                  registro,
                  mapasNomes
                );

              const nomeUsuario =
                registro.usuario?.nome ||
                registro.usuario?.email ||
                "Usuário não identificado";

              return (
                <article
                  key={registro.id}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <IconeEntidade className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {tituloAcao}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${obterClasseAcao(
                              registro.acao
                            )}`}
                          >
                            <IconeAcao className="h-3.5 w-3.5" />

                            {formatarNomeAcao(
                              registro.acao
                            )}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5" />

                            {nomeUsuario}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />

                            {formatarDataHora(
                              registro.created_at
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {registro.acao ===
                    "editou" &&
                    alteracoes.length > 0 && (
                      <div className="mt-5 space-y-3 border-t pt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Campos alterados
                        </p>

                        {alteracoes.map(
                          (alteracao) => (
                            <div
                              key={
                                alteracao.campo
                              }
                              className="rounded-xl border bg-slate-50 p-4"
                            >
                              <p className="text-sm font-semibold text-gray-800">
                                {nomesCampos[
                                  alteracao.campo
                                ] ||
                                  alteracao.campo}
                              </p>

                              <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
                                <div>
                                  <span className="block text-xs font-medium text-gray-500">
                                    Antes
                                  </span>

                                  <span className="mt-1 block break-words text-gray-700">
                                    {formatarValor(
                                      alteracao.anterior,
                                      alteracao.campo,
                                      mapasNomes
                                    )}
                                  </span>
                                </div>

                                <div>
                                  <span className="block text-xs font-medium text-gray-500">
                                    Depois
                                  </span>

                                  <span className="mt-1 block break-words font-medium text-gray-900">
                                    {formatarValor(
                                      alteracao.novo,
                                      alteracao.campo,
                                      mapasNomes
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}