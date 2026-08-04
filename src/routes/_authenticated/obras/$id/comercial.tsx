import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Handshake,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Send,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import {
  getAcompanhamentosComerciaisPorObra,
  getDemandasComerciaisPorObra,
  getDocumentosComerciaisPorObra,
  getUsuariosAtivosComercial,
  registrarMovimentacaoComercial,
} from "@/features/obras/comercial/services/comercial-service";

import type {
  DemandaOpcaoComercial,
  DocumentoOpcaoComercial,
  UsuarioOpcaoComercial,
} from "@/features/obras/comercial/services/comercial-service";

import type {
  AcompanhamentoComercial,
  CategoriaRecusa,
  StatusComercial,
} from "@/features/obras/comercial/types";

export const Route =
  createFileRoute(
    "/_authenticated/obras/$id/comercial"
  )({
    component:
      ComercialPage,
  });

const statusLabels: Record<
  StatusComercial,
  string
> = {
  pendente_envio:
    "Pendente de envio",

  aguardando_retorno:
    "Aguardando retorno",

  em_negociacao:
    "Em negociação",

  em_espera:
    "Em espera",

  aceita:
    "Aceita",

  recusada:
    "Recusada",

  cancelada:
    "Cancelada",

  substituida:
    "Substituída",
};

const statusClasses: Record<
  StatusComercial,
  string
> = {
  pendente_envio:
    "border-slate-200 bg-slate-100 text-slate-700",

  aguardando_retorno:
    "border-blue-200 bg-blue-50 text-blue-700",

  em_negociacao:
    "border-violet-200 bg-violet-50 text-violet-700",

  em_espera:
    "border-amber-200 bg-amber-50 text-amber-700",

  aceita:
    "border-green-200 bg-green-50 text-green-700",

  recusada:
    "border-red-200 bg-red-50 text-red-700",

  cancelada:
    "border-gray-200 bg-gray-100 text-gray-600",

  substituida:
    "border-cyan-200 bg-cyan-50 text-cyan-700",
};

const categoriasRecusa: {
  value: CategoriaRecusa;
  label: string;
}[] = [
  {
    value:
      "preco",

    label:
      "Preço",
  },
  {
    value:
      "prazo",

    label:
      "Prazo",
  },
  {
    value:
      "escopo",

    label:
      "Escopo",
  },
  {
    value:
      "concorrencia",

    label:
      "Concorrência",
  },
  {
    value:
      "projeto_cancelado",

    label:
      "Projeto cancelado",
  },
  {
    value:
      "sem_orcamento",

    label:
      "Sem orçamento",
  },
  {
    value:
      "sem_retorno",

    label:
      "Sem retorno",
  },
  {
    value:
      "outro",

    label:
      "Outro",
  },
];

function formatarData(
  valor?: string | null
) {
  if (!valor) {
    return "Não informado";
  }

  const data =
    valor.includes("T")
      ? new Date(valor)
      : new Date(
          `${valor}T12:00:00`
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

function formatarDataHora(
  valor?: string | null
) {
  if (!valor) {
    return "Não informado";
  }

  const data =
    new Date(valor);

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
        "short",

      timeStyle:
        "short",
    }
  ).format(
    data
  );
}

function formatarMoeda(
  valor?: number | null
) {
  if (
    valor ===
      null ||
    valor ===
      undefined
  ) {
    return "Não informado";
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    valor
  );
}

function formatarEntradaMoeda(
  valor: string
) {
  const somenteNumeros =
    valor.replace(
      /\D/g,
      ""
    );

  if (!somenteNumeros) {
    return "";
  }

  const valorNumerico =
    Number(
      somenteNumeros
    ) /
    100;

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    valorNumerico
  );
}

function converterEntradaMoedaParaNumero(
  valor: string
) {
  const somenteNumeros =
    valor.replace(
      /\D/g,
      ""
    );

  if (!somenteNumeros) {
    return null;
  }

  return (
    Number(
      somenteNumeros
    ) /
    100
  );
}

function formatarRevisao(
  numero: number
) {
  return `Rev. ${String(
    numero
  ).padStart(
    2,
    "0"
  )}`;
}

function obterDataHoje() {
  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      agora.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${ano}-${mes}-${dia}`;
}

function ComercialPage() {
  const {
    id,
  } =
    Route.useParams();

  const [
    acompanhamentos,
    setAcompanhamentos,
  ] = useState<
    AcompanhamentoComercial[]
  >([]);

  const [
    demandas,
    setDemandas,
  ] = useState<
    DemandaOpcaoComercial[]
  >([]);

  const [
    usuarios,
    setUsuarios,
  ] = useState<
    UsuarioOpcaoComercial[]
  >([]);

  const [
    documentos,
    setDocumentos,
  ] = useState<
    DocumentoOpcaoComercial[]
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
    demandaInicialModalId,
    setDemandaInicialModalId,
  ] = useState<
    string | null
  >(
    null
  );

  const [
    acompanhamentosAbertos,
    setAcompanhamentosAbertos,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const carregarDados =
    useCallback(
      async () => {
        setCarregando(
          true
        );

        setErro(
          null
        );

        try {
          const [
            acompanhamentosCarregados,
            demandasCarregadas,
            usuariosCarregados,
            documentosCarregados,
          ] =
            await Promise.all([
              getAcompanhamentosComerciaisPorObra(
                id
              ),

              getDemandasComerciaisPorObra(
                id
              ),

              getUsuariosAtivosComercial(),

              getDocumentosComerciaisPorObra(
                id
              ),
            ]);

          setAcompanhamentos(
            acompanhamentosCarregados
          );

          setDemandas(
            demandasCarregadas
          );

          setUsuarios(
            usuariosCarregados
          );

          setDocumentos(
            documentosCarregados
          );
        } catch (error: any) {
          console.error(
            "Erro ao carregar acompanhamentos comerciais:",
            error
          );

          setErro(
            error?.message ||
              "Não foi possível carregar os acompanhamentos comerciais."
          );
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        id,
      ]
    );

  useEffect(
    () => {
      carregarDados();
    },
    [
      carregarDados,
    ]
  );

  const resumo =
    useMemo(
      () => ({
        pendenteEnvio:
          acompanhamentos.filter(
            (
              acompanhamento
            ) =>
              acompanhamento.status ===
              "pendente_envio"
          ).length,

        aguardandoRetorno:
          acompanhamentos.filter(
            (
              acompanhamento
            ) =>
              acompanhamento.status ===
              "aguardando_retorno"
          ).length,

        aceitas:
          acompanhamentos.filter(
            (
              acompanhamento
            ) =>
              acompanhamento.status ===
              "aceita"
          ).length,

        recusadas:
          acompanhamentos.filter(
            (
              acompanhamento
            ) =>
              acompanhamento.status ===
              "recusada"
          ).length,
      }),
      [
        acompanhamentos,
      ]
    );

  if (carregando) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border bg-white shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-gray-500" />

          <p className="mt-3 text-sm font-medium text-gray-600">
            Carregando acompanhamento comercial...
          </p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-base font-bold text-red-800">
          Não foi possível carregar a área comercial
        </h2>

        <p className="mt-2 text-sm text-red-700">
          {erro}
        </p>

        <button
          type="button"
          onClick={
            carregarDados
          }
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-950">
            Acompanhamento comercial
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Controle os envios, contatos, retornos e resultados das propostas apresentadas ao cliente.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            titulo="Aguardando envio"
            valor={String(
              resumo.pendenteEnvio
            )}
            descricao="Propostas ainda não enviadas"
            icone={Send}
          />

          <ResumoCard
            titulo="Aguardando retorno"
            valor={String(
              resumo.aguardandoRetorno
            )}
            descricao="Propostas enviadas ao cliente"
            icone={Clock3}
          />

          <ResumoCard
            titulo="Aceitas"
            valor={String(
              resumo.aceitas
            )}
            descricao="Propostas aprovadas"
            icone={CheckCircle2}
          />

          <ResumoCard
            titulo="Recusadas"
            valor={String(
              resumo.recusadas
            )}
            descricao="Propostas não aprovadas"
            icone={XCircle}
          />
        </div>

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-950">
                Propostas acompanhadas
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {acompanhamentos.length} acompanhamento(s) registrado(s) nesta obra.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDemandaInicialModalId(
                  null
                );

                setModalAberto(
                  true
                );
              }}
              disabled={
                demandas.length ===
                0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              <Plus className="h-4 w-4" />

              Registrar acompanhamento
            </button>
          </div>

          {acompanhamentos.length ===
          0 ? (
            <div className="px-6 py-14 text-center">
              <Handshake className="mx-auto h-9 w-9 text-gray-300" />

              <p className="mt-4 text-sm font-semibold text-gray-700">
                Nenhum acompanhamento comercial
              </p>

              <p className="mt-1 text-sm text-gray-500">
                A primeira proposta acompanhada aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {acompanhamentos.map(
                (
                  acompanhamento
                ) => (
                  <article
                    key={
                      acompanhamento.id
                    }
                    className="overflow-hidden"
                  >
                    {(() => {
                      const acompanhamentoAberto =
                        Boolean(
                          acompanhamentosAbertos[
                            acompanhamento.id
                          ]
                        );

                      return (
                        <>
                          <div className="flex flex-col gap-3 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                            <button
                              type="button"
                              onClick={() =>
                                setAcompanhamentosAbertos(
                                  (
                                    estadoAtual
                                  ) => ({
                                    ...estadoAtual,

                                    [acompanhamento.id]:
                                      !estadoAtual[
                                        acompanhamento.id
                                      ],
                                  })
                                )
                              }
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                              aria-expanded={
                                acompanhamentoAberto
                              }
                            >
                              <ChevronRight
                                className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                                  acompanhamentoAberto
                                    ? "rotate-90"
                                    : "rotate-0"
                                }`}
                              />

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="truncate text-base font-bold text-gray-950">
                                    {
                                      acompanhamento.demanda.titulo
                                    }
                                  </h4>

                                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                    {formatarRevisao(
                                      acompanhamento.demanda.numero_revisao
                                    )}
                                  </span>

                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[
                                      acompanhamento.status
                                    ]}`}
                                  >
                                    {
                                      statusLabels[
                                        acompanhamento.status
                                      ]
                                    }
                                  </span>
                                </div>

                                {acompanhamento.observacao && (
                                  <p className="mt-2 line-clamp-1 max-w-3xl text-sm text-gray-600">
                                    {
                                      acompanhamento.observacao
                                    }
                                  </p>
                                )}
                              </div>
                            </button>

                            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                              <div className="text-left lg:text-right">
                                <p className="text-xs font-semibold text-gray-500">
                                  Atualizado em
                                </p>

                                <p className="mt-1 text-sm font-bold text-gray-800">
                                  {formatarDataHora(
                                    acompanhamento.updated_at
                                  )}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setDemandaInicialModalId(
                                    acompanhamento.demanda_id
                                  );

                                  setModalAberto(
                                    true
                                  );
                                }}
                                className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />

                                Atualizar acompanhamento
                              </button>
                            </div>
                          </div>

                          <div
                            className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out motion-reduce:transition-none ${
                              acompanhamentoAberto
                                ? "grid-rows-[1fr] opacity-100"
                                : "pointer-events-none grid-rows-[0fr] opacity-0"
                            }`}
                            aria-hidden={
                              !acompanhamentoAberto
                            }
                          >
                            <div className="min-h-0 overflow-hidden">
                              <div
                                className={`space-y-5 border-t px-6 py-6 transition-transform duration-250 ease-out motion-reduce:transition-none ${
                                  acompanhamentoAberto
                                    ? "translate-y-0"
                                    : "-translate-y-1"
                                }`}
                              >
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <InformacaoComercial
                        titulo="Data de envio"
                        valor={formatarData(
                          acompanhamento.data_envio
                        )}
                        icone={Send}
                      />

                      <InformacaoComercial
                        titulo="Último contato"
                        valor={formatarData(
                          acompanhamento.data_ultimo_contato
                        )}
                        icone={MessageSquareText}
                      />

                      <InformacaoComercial
                        titulo="Próximo contato"
                        valor={formatarData(
                          acompanhamento.data_proximo_contato
                        )}
                        icone={CalendarClock}
                      />

                      <InformacaoComercial
                        titulo="Responsável"
                        valor={
                          acompanhamento.responsavel
                            ?.nome ||
                          "Não informado"
                        }
                        icone={UserRound}
                      />

                      <InformacaoComercial
                        titulo="Documento enviado"
                        valor={
                          acompanhamento.documento
                            ?.nome ||
                          "Não vinculado"
                        }
                        icone={FileText}
                      />

                      <InformacaoComercial
                        titulo="Valor da proposta"
                        valor={formatarMoeda(
                          acompanhamento.valor_proposta
                        )}
                        icone={Handshake}
                      />
<InformacaoComercial
                        titulo="Movimentações"
                        valor={`${acompanhamento.movimentacoes.length} registro(s)`}
                        icone={Clock3}
                      />
                    </div>

                    {(acompanhamento.motivo_espera ||
                      acompanhamento.motivo_recusa) && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                          Motivo registrado
                        </p>

                        <p className="mt-2 text-sm text-amber-900">
                          {acompanhamento.motivo_recusa ||
                            acompanhamento.motivo_espera}
                        </p>
                      </div>
                    )}

                    <div className="rounded-xl border bg-slate-50">
                      <div className="border-b px-4 py-3">
                        <h5 className="text-sm font-bold text-gray-900">
                          Histórico da proposta
                        </h5>
                      </div>

                      {acompanhamento.movimentacoes.length ===
                      0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">
                          Nenhuma movimentação registrada.
                        </div>
                      ) : (
                        <div className="divide-y">
                          {acompanhamento.movimentacoes.map(
                            (
                              movimentacao
                            ) => (
                              <div
                                key={
                                  movimentacao.id
                                }
                                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                              >
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[
                                        movimentacao.status_novo
                                      ]}`}
                                    >
                                      {
                                        statusLabels[
                                          movimentacao.status_novo
                                        ]
                                      }
                                    </span>

                                    {movimentacao.status_anterior && (
                                      <span className="text-xs text-gray-500">
                                        Anterior:{" "}
                                        {
                                          statusLabels[
                                            movimentacao.status_anterior
                                          ]
                                        }
                                      </span>
                                    )}
                                  </div>

                                  {(movimentacao.observacao ||
                                    movimentacao.motivo) && (
                                    <p className="mt-2 text-sm text-gray-600">
                                      {movimentacao.observacao ||
                                        movimentacao.motivo}
                                    </p>
                                  )}

                                  <p className="mt-2 text-xs text-gray-500">
                                    Registrado por{" "}
                                    <span className="font-semibold text-gray-700">
                                      {movimentacao.usuario
                                        ?.nome ||
                                        "Usuário não identificado"}
                                    </span>
                                  </p>
                                </div>

                                <span className="shrink-0 text-xs font-medium text-gray-500">
                                  {formatarDataHora(
                                    movimentacao.data_movimentacao
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {modalAberto && (
        <ModalRegistrarComercial
          demandas={
            demandas
          }
          usuarios={
            usuarios
          }
          documentos={
            documentos
          }
          acompanhamentos={
            acompanhamentos
          }
          demandaInicialId={
            demandaInicialModalId
          }
          onClose={() => {
            setModalAberto(
              false
            );

            setDemandaInicialModalId(
              null
            );
          }}
          onSaved={async () => {
            setModalAberto(
              false
            );

            setDemandaInicialModalId(
              null
            );

            await carregarDados();
          }}
        />
      )}
    </>
  );
}

interface ModalRegistrarComercialProps {
  demandas: DemandaOpcaoComercial[];
  usuarios: UsuarioOpcaoComercial[];
  documentos: DocumentoOpcaoComercial[];
  acompanhamentos: AcompanhamentoComercial[];
  demandaInicialId: string | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function ModalRegistrarComercial({
  demandas,
  usuarios,
  documentos,
  acompanhamentos,
  demandaInicialId,
  onClose,
  onSaved,
}: ModalRegistrarComercialProps) {
  const primeiraDemanda =
    demandas[0];

  const demandaInicialValida =
    demandaInicialId &&
    demandas.some(
      (
        demanda
      ) =>
        demanda.id ===
        demandaInicialId
    )
      ? demandaInicialId
      : primeiraDemanda?.id ||
        "";

  const [
    demandaId,
    setDemandaId,
  ] = useState(
    demandaInicialValida
  );

  const [
    statusNovo,
    setStatusNovo,
  ] = useState<StatusComercial>(
    "pendente_envio"
  );

  const [
    dataEnvio,
    setDataEnvio,
  ] = useState(
    ""
  );

  const [
    dataUltimoContato,
    setDataUltimoContato,
  ] = useState(
    obterDataHoje()
  );

  const [
    dataProximoContato,
    setDataProximoContato,
  ] = useState(
    ""
  );

  const [
    responsavelId,
    setResponsavelId,
  ] = useState(
    ""
  );

  const [
    documentoId,
    setDocumentoId,
  ] = useState(
    ""
  );

  const [
    valorProposta,
    setValorProposta,
  ] = useState(
    ""
  );

  const [
    motivoEspera,
    setMotivoEspera,
  ] = useState(
    ""
  );

  const [
    motivoRecusa,
    setMotivoRecusa,
  ] = useState(
    ""
  );

  const [
    categoriaRecusa,
    setCategoriaRecusa,
  ] = useState<
    CategoriaRecusa | ""
  >(
    ""
  );

  const [
    observacao,
    setObservacao,
  ] = useState(
    ""
  );

  const [
    salvando,
    setSalvando,
  ] = useState(
    false
  );

  const [
    erro,
    setErro,
  ] = useState<
    string | null
  >(
    null
  );

  const acompanhamentoAtual =
    acompanhamentos.find(
      (
        acompanhamento
      ) =>
        acompanhamento.demanda_id ===
        demandaId
    );

  useEffect(
    () => {
      if (!acompanhamentoAtual) {
        setStatusNovo(
          "pendente_envio"
        );

        setDataEnvio(
          ""
        );

        setDataUltimoContato(
          obterDataHoje()
        );

        setDataProximoContato(
          ""
        );

        setResponsavelId(
          ""
        );

        setDocumentoId(
          ""
        );

        setValorProposta(
          ""
        );

        setMotivoEspera(
          ""
        );

        setMotivoRecusa(
          ""
        );

        setCategoriaRecusa(
          ""
        );

        setObservacao(
          ""
        );

        return;
      }

      setStatusNovo(
        acompanhamentoAtual.status
      );

      setDataEnvio(
        acompanhamentoAtual.data_envio ||
          ""
      );

      setDataUltimoContato(
        acompanhamentoAtual.data_ultimo_contato ||
          obterDataHoje()
      );

      setDataProximoContato(
        acompanhamentoAtual.data_proximo_contato ||
          ""
      );

      setResponsavelId(
        acompanhamentoAtual.responsavel_id ||
          ""
      );

      setDocumentoId(
        acompanhamentoAtual.documento_id ||
          ""
      );

      setValorProposta(
        acompanhamentoAtual.valor_proposta !==
          null
          ? new Intl.NumberFormat(
              "pt-BR",
              {
                style:
                  "currency",

                currency:
                  "BRL",
              }
            ).format(
              acompanhamentoAtual.valor_proposta
            )
          : ""
      );

      setMotivoEspera(
        acompanhamentoAtual.motivo_espera ||
          ""
      );

      setMotivoRecusa(
        acompanhamentoAtual.motivo_recusa ||
          ""
      );

      setCategoriaRecusa(
        acompanhamentoAtual.categoria_recusa ||
          ""
      );

      setObservacao(
        ""
      );
    },
    [
      acompanhamentoAtual,
    ]
  );

  const documentosDaDemanda =
    documentos.filter(
      (
        documento
      ) =>
        documento.demanda_id ===
        demandaId
    );

  const exigeEnvio =
    statusNovo ===
    "aguardando_retorno";

  const exigeEspera =
    statusNovo ===
    "em_espera";

  const exigeRecusa =
    statusNovo ===
    "recusada";

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro(
      null
    );

    if (!demandaId) {
      setErro(
        "Selecione a demanda e a revisão."
      );

      return;
    }

    if (
      exigeEnvio &&
      !dataEnvio
    ) {
      setErro(
        "Informe a data de envio."
      );

      return;
    }

    if (
      exigeEspera &&
      (
        !motivoEspera.trim() ||
        !dataProximoContato
      )
    ) {
      setErro(
        "Para colocar em espera, informe o motivo e o próximo contato."
      );

      return;
    }

    if (
      exigeRecusa &&
      (
        !motivoRecusa.trim() ||
        !categoriaRecusa
      )
    ) {
      setErro(
        "Para recusar, informe a categoria e o motivo."
      );

      return;
    }

    const valorConvertido =
      converterEntradaMoedaParaNumero(
        valorProposta
      );

    try {
      setSalvando(
        true
      );

      await registrarMovimentacaoComercial({
        demandaId,
        statusNovo,

        dataEnvio:
          dataEnvio ||
          null,

        dataUltimoContato:
          dataUltimoContato ||
          null,

        dataProximoContato:
          dataProximoContato ||
          null,

        responsavelId:
          responsavelId ||
          null,

        documentoId:
          documentoId ||
          null,

        valorProposta:
          valorConvertido,

        motivoEspera:
          motivoEspera.trim() ||
          null,

        motivoRecusa:
          motivoRecusa.trim() ||
          null,

        categoriaRecusa:
          categoriaRecusa ||
          null,

        observacao:
          observacao.trim() ||
          null,
      });

      await onSaved();
    } catch (error: any) {
      console.error(
        "Erro ao registrar acompanhamento comercial:",
        error
      );

      setErro(
        error?.message ||
          error?.details ||
          "Não foi possível registrar o acompanhamento comercial."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onMouseDown={
        onClose
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-comercial"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b bg-slate-50 px-6 py-5">
          <div>
            <h2
              id="titulo-modal-comercial"
              className="text-xl font-bold text-gray-950"
            >
              {demandaInicialId
                ? "Atualizar acompanhamento"
                : "Registrar acompanhamento"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {demandaInicialId
                ? "Atualize o status, datas e informações desta proposta."
                : "Registre o envio, contato ou resultado de uma proposta."}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              salvando
            }
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="flex max-h-[calc(92vh-92px)] flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {erro && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {erro}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <Campo
                label="Demanda e revisão"
                obrigatorio
              >
                <select
                  value={
                    demandaId
                  }
                  onChange={(
                    event
                  ) => {
                    setDemandaId(
                      event.target.value
                    );

                    setDocumentoId(
                      ""
                    );
                  }}
                  disabled={
                    Boolean(
                      demandaInicialId
                    )
                  }
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600"
                >
                  {demandas.map(
                    (
                      demanda
                    ) => (
                      <option
                        key={
                          demanda.id
                        }
                        value={
                          demanda.id
                        }
                      >
                        {demanda.titulo} —{" "}
                        {formatarRevisao(
                          demanda.numero_revisao
                        )}
                      </option>
                    )
                  )}
                </select>

                {demandaInicialId && (
                  <p className="mt-1 text-xs text-gray-500">
                    Esta demanda foi selecionada pelo acompanhamento aberto.
                  </p>
                )}
              </Campo>

              <Campo
                label="Novo status"
                obrigatorio
              >
                <select
                  value={
                    statusNovo
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusNovo(
                      event.target.value as StatusComercial
                    )
                  }
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-black"
                >
                  {(
                    Object.keys(
                      statusLabels
                    ) as StatusComercial[]
                  ).map(
                    (
                      status
                    ) => (
                      <option
                        key={
                          status
                        }
                        value={
                          status
                        }
                      >
                        {
                          statusLabels[
                            status
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </Campo>

              <Campo
                label="Responsável comercial"
              >
                <select
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
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-black"
                >
                  <option value="">
                    Não informado
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
                        {usuario.nome}
                      </option>
                    )
                  )}
                </select>
              </Campo>

              <Campo
                label="Documento enviado"
              >
                <select
                  value={
                    documentoId
                  }
                  onChange={(
                    event
                  ) =>
                    setDocumentoId(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-black"
                >
                  <option value="">
                    Não vinculado
                  </option>

                  {documentosDaDemanda.map(
                    (
                      documento
                    ) => (
                      <option
                        key={
                          documento.id
                        }
                        value={
                          documento.id
                        }
                      >
                        {documento.nome}
                      </option>
                    )
                  )}
                </select>

                {documentosDaDemanda.length ===
                  0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Esta revisão ainda não possui documentos.
                  </p>
                )}
              </Campo>

              <Campo
                label="Data de envio"
                obrigatorio={
                  exigeEnvio
                }
              >
                <input
                  type="date"
                  value={
                    dataEnvio
                  }
                  onChange={(
                    event
                  ) =>
                    setDataEnvio(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-black"
                />
              </Campo>

              <Campo
                label="Último contato"
              >
                <input
                  type="date"
                  value={
                    dataUltimoContato
                  }
                  onChange={(
                    event
                  ) =>
                    setDataUltimoContato(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-black"
                />
              </Campo>

              <Campo
                label="Próximo contato"
                obrigatorio={
                  exigeEspera
                }
              >
                <input
                  type="date"
                  value={
                    dataProximoContato
                  }
                  onChange={(
                    event
                  ) =>
                    setDataProximoContato(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-black"
                />
              </Campo>

              <Campo
                label="Valor da proposta"
              >
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      valorProposta
                    }
                    onChange={(
                      event
                    ) =>
                      setValorProposta(
                        formatarEntradaMoeda(
                          event.target.value
                        )
                      )
                    }
                    placeholder="R$ 0,00"
                    className="h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-gray-800 outline-none transition placeholder:font-normal placeholder:text-gray-400 focus:border-black"
                  />
                </div>
              </Campo>

              {exigeRecusa && (
                <Campo
                  label="Categoria da recusa"
                  obrigatorio
                >
                  <select
                    value={
                      categoriaRecusa
                    }
                    onChange={(
                      event
                    ) =>
                      setCategoriaRecusa(
                        event.target.value as CategoriaRecusa | ""
                      )
                    }
                    className="h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-black"
                  >
                    <option value="">
                      Selecione
                    </option>

                    {categoriasRecusa.map(
                      (
                        categoria
                      ) => (
                        <option
                          key={
                            categoria.value
                          }
                          value={
                            categoria.value
                          }
                        >
                          {
                            categoria.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </Campo>
              )}
            </div>

            {exigeEspera && (
              <Campo
                label="Motivo da espera"
                obrigatorio
              >
                <textarea
                  value={
                    motivoEspera
                  }
                  onChange={(
                    event
                  ) =>
                    setMotivoEspera(
                      event.target.value
                    )
                  }
                  rows={
                    3
                  }
                  placeholder="Informe por que a proposta foi colocada em espera."
                  className="w-full resize-y rounded-xl border bg-white px-3 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-black"
                />
              </Campo>
            )}

            {exigeRecusa && (
              <Campo
                label="Motivo da recusa"
                obrigatorio
              >
                <textarea
                  value={
                    motivoRecusa
                  }
                  onChange={(
                    event
                  ) =>
                    setMotivoRecusa(
                      event.target.value
                    )
                  }
                  rows={
                    3
                  }
                  placeholder="Descreva o motivo informado pelo cliente."
                  className="w-full resize-y rounded-xl border bg-white px-3 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-black"
                />
              </Campo>
            )}

            <Campo
              label="Observação da movimentação"
            >
              <textarea
                value={
                  observacao
                }
                onChange={(
                  event
                ) =>
                  setObservacao(
                    event.target.value
                  )
                }
                rows={
                  4
                }
                placeholder="Registre detalhes do contato, negociação ou resultado."
                className="w-full resize-y rounded-xl border bg-white px-3 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-black"
              />
            </Campo>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                salvando
              }
              className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                salvando
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {salvando
                ? "Salvando..."
                : demandaInicialId
                  ? "Atualizar acompanhamento"
                  : "Salvar acompanhamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CampoProps {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}

function Campo({
  label,
  obrigatorio =
    false,
  children,
}: CampoProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">
        {label}

        {obrigatorio && (
          <span className="ml-1 text-red-600">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

interface ResumoCardProps {
  titulo: string;
  valor: string;
  descricao: string;
  icone: typeof Send;
}

function ResumoCard({
  titulo,
  valor,
  descricao,
  icone: Icone,
}: ResumoCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-600">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">
            {valor}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {descricao}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
          <Icone className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

interface InformacaoComercialProps {
  titulo: string;
  valor: string;
  icone: typeof Send;
}

function InformacaoComercial({
  titulo,
  valor,
  icone: Icone,
}: InformacaoComercialProps) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Icone className="h-4 w-4 shrink-0" />

        <span className="text-xs font-semibold">
          {titulo}
        </span>
      </div>

      <p className="mt-3 truncate text-sm font-bold text-gray-900">
        {valor}
      </p>
    </div>
  );
}