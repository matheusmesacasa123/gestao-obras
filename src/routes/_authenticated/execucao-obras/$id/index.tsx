import {
  createFileRoute,
  useLoaderData,
  useRouter,
} from "@tanstack/react-router";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Droplets,
  FileCheck2,
  Loader2,
  MapPin,
  Pencil,
  Save,
  UserRound,
  X,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  atualizarObraExecucao,
} from "@/features/execucao-obras/services/execucao-obras-service";

import type {
  StatusObraExecucao,
} from "@/features/execucao-obras/types";

import {
  supabase,
} from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/execucao-obras/$id/"
)({
  component:
    ObraExecucaoVisaoGeralPage,
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

function formatarData(
  data?: string | null
) {
  if (!data) {
    return "Não informado";
  }

  const [
    ano,
    mes,
    dia,
  ] = data
    .split("-")
    .map(Number);

  const dataFormatada =
    new Date(
      ano,
      mes - 1,
      dia
    );

  if (
    Number.isNaN(
      dataFormatada.getTime()
    )
  ) {
    return data;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    dataFormatada
  );
}

function formatarDataHora(
  data?: string | null
) {
  if (!data) {
    return "Não informado";
  }

  const dataFormatada =
    new Date(
      data
    );

  if (
    Number.isNaN(
      dataFormatada.getTime()
    )
  ) {
    return data;
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
    dataFormatada
  );
}

function formatarMoeda(
  valor?: number | null
) {
  if (
    valor === null ||
    valor === undefined
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

function ObraExecucaoVisaoGeralPage() {
  const obra =
    useLoaderData({
      from:
        "/_authenticated/execucao-obras/$id",
    });

  const router =
    useRouter();

  const [
    modalAberto,
    setModalAberto,
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
    erro,
    setErro,
  ] = useState<
    string | null
  >(
    null
  );

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
    nomeObra,
    setNomeObra,
  ] = useState("");

  const [
    tipoProjeto,
    setTipoProjeto,
  ] = useState("");

  const [
    tipoEfluente,
    setTipoEfluente,
  ] = useState("");

  const [
    vazao,
    setVazao,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    StatusObraExecucao
  >(
    "nao_iniciada"
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
    dataInicio,
    setDataInicio,
  ] = useState("");

  const [
    prazoEntrega,
    setPrazoEntrega,
  ] = useState("");

  const [
    dataEntrega,
    setDataEntrega,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  const [
    incluidoErp,
    setIncluidoErp,
  ] = useState(
    false
  );

  const [
    codigoErp,
    setCodigoErp,
  ] = useState("");

  const clienteExibicao =
    obra.cliente_relacionado?.nome ||
    obra.cliente ||
    "Não informado";

  const numeroProposta =
    obra.numero_proposta ||
    obra.orcamento?.numero_proposta ||
    obra.orcamento?.codigo ||
    "Não informado";

  const numeroErp =
    obra.codigo_erp ||
    "Ainda não lançado no ERP";

  const localizacao =
    [
      obra.cidade,
      obra.estado,
    ]
      .filter(Boolean)
      .join(" / ") ||
    "Não informado";

  useEffect(
    () => {
      if (!modalAberto) {
        return;
      }

      setNomeObra(
        obra.nome_obra ||
        ""
      );

      setTipoProjeto(
        obra.tipo_projeto ||
        ""
      );

      setTipoEfluente(
        obra.tipo_efluente ||
        ""
      );

      setVazao(
        obra.vazao !==
          null &&
        obra.vazao !==
          undefined
          ? String(
              obra.vazao
            )
          : ""
      );

      setStatus(
        obra.status
      );

      setSetorId(
        obra.setor_id ||
        ""
      );

      setResponsavelId(
        obra.responsavel_id ||
        ""
      );

      setDataInicio(
        obra.data_inicio ||
        ""
      );

      setPrazoEntrega(
        obra.prazo_entrega ||
        ""
      );

      setDataEntrega(
        obra.data_entrega ||
        ""
      );

      setDescricao(
        obra.descricao ||
        ""
      );

      setObservacoes(
        obra.observacoes ||
        ""
      );

      setIncluidoErp(
        obra.incluido_erp
      );

      setCodigoErp(
        obra.codigo_erp ||
        ""
      );

      setErro(
        null
      );
    },
    [
      modalAberto,
      obra,
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
            "Erro ao carregar opções da obra:",
            error
          );

          setErro(
            "Não foi possível carregar setores e responsáveis."
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

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(
      false
    );

    setErro(
      null
    );
  }

  async function handleSalvar(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !nomeObra.trim()
    ) {
      setErro(
        "Informe o nome da obra."
      );

      return;
    }

    if (
      incluidoErp &&
      !codigoErp.trim()
    ) {
      setErro(
        "Informe o código da obra no ERP."
      );

      return;
    }

    const vazaoConvertida =
      vazao.trim()
        ? Number(
            vazao.replace(
              ",",
              "."
            )
          )
        : null;

    if (
      vazaoConvertida !==
        null &&
      !Number.isFinite(
        vazaoConvertida
      )
    ) {
      setErro(
        "Informe uma vazão válida."
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

      await atualizarObraExecucao(
        obra.id,
        {
          nome_obra:
            nomeObra.trim(),

          tipo_projeto:
            tipoProjeto.trim() ||
            null,

          tipo_efluente:
            tipoEfluente.trim() ||
            null,

          vazao:
            vazaoConvertida,

          status,

          setor_id:
            setorId ||
            null,

          responsavel_id:
            responsavelId ||
            null,

          data_inicio:
            dataInicio ||
            null,

          prazo_entrega:
            prazoEntrega ||
            null,

          data_entrega:
            dataEntrega ||
            null,

          descricao:
            descricao.trim() ||
            null,

          observacoes:
            observacoes.trim() ||
            null,

          incluido_erp:
            incluidoErp,

          codigo_erp:
            incluidoErp
              ? codigoErp.trim()
              : null,
        }
      );

      await router.invalidate();

      setModalAberto(
        false
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar obra:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a obra."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  return (
    <>
      <div className="space-y-6">
        <section
          className={`rounded-2xl border p-6 shadow-sm ${
            obra.codigo_erp
              ? "border-slate-200 bg-white"
              : "border-amber-200 bg-amber-50/40"
          }`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Numeração ERP
              </span>

              <h1
                className={`mt-1 break-words text-3xl font-bold tracking-tight ${
                  obra.codigo_erp
                    ? "text-slate-950"
                    : "text-amber-700"
                }`}
              >
                {numeroErp}
              </h1>

              <div className="mt-4">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Proposta comercial
                </span>

                <p className="mt-1 text-base font-bold text-slate-800">
                  {numeroProposta}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setModalAberto(
                  true
                )
              }
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4" />

              Editar obra
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Informações gerais
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Dados principais da obra em execução.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InformacaoCard
              icone={
                Building2
              }
              titulo="Nome da obra"
              valor={
                obra.nome_obra ||
                "Não informado"
              }
            />

            <InformacaoCard
              icone={
                UserRound
              }
              titulo="Cliente"
              valor={
                clienteExibicao
              }
            />

            <InformacaoCard
              icone={
                MapPin
              }
              titulo="Local"
              valor={
                localizacao
              }
            />

            <InformacaoCard
              icone={
                ClipboardList
              }
              titulo="Tipo de projeto"
              valor={
                obra.tipo_projeto ||
                "Não informado"
              }
            />

            <InformacaoCard
              icone={
                Droplets
              }
              titulo="Tipo de efluente"
              valor={
                obra.tipo_efluente ||
                "Não informado"
              }
            />

            <InformacaoCard
              icone={
                Droplets
              }
              titulo="Vazão"
              valor={
                obra.vazao !==
                  null &&
                obra.vazao !==
                  undefined
                  ? `${obra.vazao} m³/dia`
                  : "Não informado"
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Prazos e responsáveis
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Informações de planejamento e acompanhamento.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InformacaoCard
              icone={
                CalendarDays
              }
              titulo="Data de início"
              valor={formatarData(
                obra.data_inicio
              )}
            />

            <InformacaoCard
              icone={
                CalendarDays
              }
              titulo="Prazo de entrega da obra"
              valor={formatarData(
                obra.prazo_entrega
              )}
            />

            <InformacaoCard
              icone={
                UserRound
              }
              titulo="Responsável"
              valor={
                obra.responsavel?.nome ||
                "Não informado"
              }
            />

            <InformacaoCard
              icone={
                ClipboardList
              }
              titulo="Setor"
              valor={
                obra.setor?.nome ||
                "Não informado"
              }
            />
          </div>
        </section>

        <section
          className={`rounded-2xl border p-6 shadow-sm ${
            obra.incluido_erp
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-5 w-5 ${
                    obra.incluido_erp
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                />

                <h2 className="text-xl font-bold text-slate-950">
                  Controle ERP
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Confirmação de inclusão da obra no sistema ERP.
              </p>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${
                obra.incluido_erp
                  ? "border-emerald-200 bg-white text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {obra.incluido_erp
                ? "Incluído no ERP"
                : "Pendente de inclusão"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <InformacaoCard
              icone={
                ClipboardList
              }
              titulo="Numeração ERP"
              valor={
                numeroErp
              }
            />

            <InformacaoCard
              icone={
                CalendarDays
              }
              titulo="Incluído em"
              valor={formatarDataHora(
                obra.incluido_erp_em
              )}
            />

            <InformacaoCard
              icone={
                UserRound
              }
              titulo="Incluído por"
              valor={
                obra.incluido_erp_usuario
                  ?.nome ||
                "Não informado"
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Origem comercial
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Vínculo entre a obra e a Orçamentação.
            </p>
          </div>

          {obra.orcamento_id ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InformacaoCard
                icone={
                  FileCheck2
                }
                titulo="Origem"
                valor="Orçamento aprovado"
              />

              <InformacaoCard
                icone={
                  ClipboardList
                }
                titulo="Código do orçamento"
                valor={
                  obra.orcamento?.codigo ||
                  "Não informado"
                }
              />

              <InformacaoCard
                icone={
                  FileCheck2
                }
                titulo="Número da proposta"
                valor={
                  obra.numero_proposta ||
                  obra.orcamento
                    ?.numero_proposta ||
                  "Não informado"
                }
              />

              <InformacaoCard
                icone={
                  CircleDollarSign
                }
                titulo="Valor vendido"
                valor={formatarMoeda(
                  obra.valor_vendido
                )}
              />
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">
                Esta obra foi cadastrada diretamente e não possui uma Orçamentação vinculada.
              </p>
            </div>
          )}
        </section>

        {(obra.descricao ||
          obra.observacoes) && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Descrição e observações
            </h2>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <TextoCard
                titulo="Descrição"
                valor={
                  obra.descricao ||
                  "Não informado"
                }
              />

              <TextoCard
                titulo="Observações"
                valor={
                  obra.observacoes ||
                  "Não informado"
                }
              />
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
            aria-labelledby="titulo-editar-obra"
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
                  id="titulo-editar-obra"
                  className="text-xl font-bold text-slate-950"
                >
                  Editar obra
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Atualize os dados da execução e o controle do ERP.
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
                handleSalvar
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
                  titulo="Identificação"
                  descricao="A proposta comercial e os dados do cliente são controlados pelo sistema. A numeração ERP é informada na seção Controle ERP."
                >
                  <CampoSomenteLeitura
                    label="Proposta comercial"
                    value={
                      numeroProposta
                    }
                  />

                  <Campo
                    label="Nome da obra *"
                    value={
                      nomeObra
                    }
                    onChange={
                      setNomeObra
                    }
                  />

                  <CampoSomenteLeitura
                    label="Cliente"
                    value={
                      obra.cliente_relacionado
                        ?.nome ||
                      obra.cliente ||
                      "Não informado"
                    }
                  />

                  <CampoSomenteLeitura
                    label="CNPJ"
                    value={
                      obra.cliente_relacionado
                        ?.cnpj ||
                      obra.cnpj ||
                      "Não informado"
                    }
                  />

                  <CampoSomenteLeitura
                    label="E-mail"
                    value={
                      obra.cliente_relacionado
                        ?.email ||
                      obra.email ||
                      "Não informado"
                    }
                  />

                  <CampoSomenteLeitura
                    label="Telefone"
                    value={
                      obra.cliente_relacionado
                        ?.telefone ||
                      obra.telefone ||
                      "Não informado"
                    }
                  />
                </FormularioSecao>

                <FormularioSecao
                  titulo="Execução"
                  descricao="Dados técnicos, responsáveis e prazos próprios da execução. O prazo da obra é independente do prazo da Orçamentação."
                >
                  <Campo
                    label="Tipo de projeto"
                    value={
                      tipoProjeto
                    }
                    onChange={
                      setTipoProjeto
                    }
                  />

                  <Campo
                    label="Tipo de efluente"
                    value={
                      tipoEfluente
                    }
                    onChange={
                      setTipoEfluente
                    }
                  />

                  <Campo
                    label="Vazão"
                    value={
                      vazao
                    }
                    onChange={
                      setVazao
                    }
                    placeholder="Ex.: 15,5"
                  />

                  <SelectCampo
                    label="Status"
                    value={
                      status
                    }
                    onChange={(
                      value
                    ) =>
                      setStatus(
                        value as StatusObraExecucao
                      )
                    }
                  >
                    <option value="nao_iniciada">
                      Não iniciada
                    </option>

                    <option value="em_andamento">
                      Em andamento
                    </option>

                    <option value="aguardando_cliente">
                      Aguardando cliente
                    </option>

                    <option value="paralisada">
                      Paralisada
                    </option>

                    <option value="atrasada">
                      Atrasada
                    </option>

                    <option value="concluida">
                      Concluída
                    </option>

                    <option value="cancelada">
                      Cancelada
                    </option>
                  </SelectCampo>

                  <SelectCampo
                    label="Setor"
                    value={
                      setorId
                    }
                    onChange={
                      setSetorId
                    }
                    disabled={
                      carregandoOpcoes
                    }
                  >
                    <option value="">
                      Não informado
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
                          {setor.nome}
                        </option>
                      )
                    )}
                  </SelectCampo>

                  <SelectCampo
                    label="Responsável"
                    value={
                      responsavelId
                    }
                    onChange={
                      setResponsavelId
                    }
                    disabled={
                      carregandoOpcoes
                    }
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
                          {usuario.nome ||
                            usuario.email}
                        </option>
                      )
                    )}
                  </SelectCampo>

                  <Campo
                    label="Data de início"
                    type="date"
                    value={
                      dataInicio
                    }
                    onChange={
                      setDataInicio
                    }
                  />

                  <Campo
                    label="Prazo de entrega da obra"
                    type="date"
                    value={
                      prazoEntrega
                    }
                    onChange={
                      setPrazoEntrega
                    }
                  />

                  <Campo
                    label="Data de entrega"
                    type="date"
                    value={
                      dataEntrega
                    }
                    onChange={
                      setDataEntrega
                    }
                  />
                </FormularioSecao>

                <FormularioSecao
                  titulo="Controle ERP"
                  descricao="Marque quando a obra estiver cadastrada no ERP."
                  colunas={1}
                >
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={
                          incluidoErp
                        }
                        onChange={(
                          event
                        ) =>
                          setIncluidoErp(
                            event.target.checked
                          )
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />

                      <span>
                        <span className="block text-sm font-bold text-slate-900">
                          Incluído no ERP
                        </span>

                        <span className="mt-1 block text-sm text-slate-500">
                          Ao marcar, o sistema registra automaticamente o usuário, a data e a hora.
                        </span>
                      </span>
                    </label>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                        incluidoErp
                          ? "mt-5 grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <Campo
                          label="Numeração ERP *"
                          value={
                            codigoErp
                          }
                          onChange={
                            setCodigoErp
                          }
                          placeholder="Informe a numeração gerada pelo ERP"
                        />
                      </div>
                    </div>
                  </div>
                </FormularioSecao>

                <FormularioSecao
                  titulo="Descrição e observações"
                  descricao="Informações complementares da obra."
                  colunas={1}
                >
                  <AreaTexto
                    label="Descrição"
                    value={
                      descricao
                    }
                    onChange={
                      setDescricao
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
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {salvando
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
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

interface CampoSomenteLeituraProps {
  label: string;
  value: string;
}

function CampoSomenteLeitura({
  label,
  value,
}: CampoSomenteLeituraProps) {
  return (
    <div className="block space-y-2">
      <span className="block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="flex min-h-11 w-full items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-medium text-slate-600">
        {value}
      </div>
    </div>
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
  disabled?: boolean;
  children:
    React.ReactNode;
}

function SelectCampo({
  label,
  value,
  onChange,
  disabled =
    false,
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
        disabled={
          disabled
        }
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100"
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

interface InformacaoCardProps {
  icone:
    typeof Building2;

  titulo: string;
  valor: string;
}

function InformacaoCard({
  icone: Icone,
  titulo,
  valor,
}: InformacaoCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icone className="h-4 w-4 shrink-0" />

        <span className="text-xs font-semibold uppercase tracking-wide">
          {titulo}
        </span>
      </div>

      <p className="mt-3 break-words text-sm font-bold text-slate-900">
        {valor}
      </p>
    </div>
  );
}

interface TextoCardProps {
  titulo: string;
  valor: string;
}

function TextoCard({
  titulo,
  valor,
}: TextoCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
      <h3 className="text-sm font-bold text-slate-800">
        {titulo}
      </h3>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {valor}
      </p>
    </div>
  );
}