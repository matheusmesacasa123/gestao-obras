import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  ArrowLeft,
  Building2,
  Loader2,
  Save,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "@/integrations/supabase/client";

import {
  criarObraExecucao,
} from "@/features/execucao-obras/services/execucao-obras-service";

import type {
  StatusObraExecucao,
} from "@/features/execucao-obras/types";

export const Route = createFileRoute(
  "/_authenticated/execucao-obras/nova"
)({
  component:
    NovaObraExecucaoPage,
});

type ClienteOpcao = {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
};

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

function NovaObraExecucaoPage() {
  const navigate =
    useNavigate();

  const [
    carregandoOpcoes,
    setCarregandoOpcoes,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    clientes,
    setClientes,
  ] = useState<ClienteOpcao[]>(
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
    clienteId,
    setClienteId,
  ] = useState("");

  const [
    novoClienteNome,
    setNovoClienteNome,
  ] = useState("");

  const [
    novoClienteCnpj,
    setNovoClienteCnpj,
  ] = useState("");

  const [
    novoClienteEmail,
    setNovoClienteEmail,
  ] = useState("");

  const [
    novoClienteTelefone,
    setNovoClienteTelefone,
  ] = useState("");

  const [
    codigo,
    setCodigo,
  ] = useState("");

  const [
    nomeObra,
    setNomeObra,
  ] = useState("");

  const [
    razaoSocial,
    setRazaoSocial,
  ] = useState("");

  const [
    cidade,
    setCidade,
  ] = useState("");

  const [
    estado,
    setEstado,
  ] = useState("");

  const [
    setorId,
    setSetorId,
  ] = useState("");

  const [
    responsavelId,
    setResponsavelId,
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
  ] = useState<StatusObraExecucao>(
    "nao_iniciada"
  );

  const [
    dataInicio,
    setDataInicio,
  ] = useState("");

  const [
    prazoEntrega,
    setPrazoEntrega,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  useEffect(() => {
    async function carregarOpcoes() {
      try {
        setCarregandoOpcoes(true);
        setErro("");

        const [
          respostaClientes,
          respostaSetores,
          respostaUsuarios,
        ] = await Promise.all([
          supabase
            .from("clientes")
            .select(
              "id, nome, cnpj, email, telefone"
            )
            .order(
              "nome"
            ),

          supabase
            .from("setores")
            .select(
              "id, nome"
            )
            .order(
              "nome"
            ),

          supabase
            .from("usuarios")
            .select(
              "id, nome, email, setor_id"
            )
            .order(
              "nome"
            ),
        ]);

        if (
          respostaClientes.error
        ) {
          throw respostaClientes.error;
        }

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

        setClientes(
          (
            respostaClientes.data ||
            []
          ) as ClienteOpcao[]
        );

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
          "Erro ao carregar opções do cadastro:",
          error
        );

        setErro(
          "Não foi possível carregar clientes, setores e responsáveis."
        );
      } finally {
        setCarregandoOpcoes(false);
      }
    }

    carregarOpcoes();
  }, []);

  const clienteSelecionado =
    useMemo(
      () =>
        clientes.find(
          (
            cliente
          ) =>
            cliente.id ===
            clienteId
        ) ||
        null,
      [
        clientes,
        clienteId,
      ]
    );

  const responsaveisDisponiveis =
    useMemo(() => {
      if (!setorId) {
        return usuarios;
      }

      return usuarios.filter(
        (
          usuario
        ) =>
          !usuario.setor_id ||
          usuario.setor_id ===
            setorId
      );
    }, [
      usuarios,
      setorId,
    ]);

  useEffect(() => {
    if (
      responsavelId &&
      !responsaveisDisponiveis.some(
        (
          usuario
        ) =>
          usuario.id ===
          responsavelId
      )
    ) {
      setResponsavelId("");
    }
  }, [
    responsavelId,
    responsaveisDisponiveis,
  ]);

  function voltar() {
    navigate({
      to:
        "/execucao-obras",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
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
      !clienteId &&
      !novoClienteNome.trim()
    ) {
      setErro(
        "Selecione um cliente existente ou informe um novo cliente."
      );

      return;
    }

    try {
      setSalvando(true);
      setErro("");

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

      let clienteIdFinal =
        clienteId ||
        null;

      let nomeClienteFinal =
        clienteSelecionado?.nome ||
        novoClienteNome.trim();

      let emailClienteFinal =
        clienteSelecionado?.email ||
        novoClienteEmail.trim() ||
        null;

      let telefoneClienteFinal =
        clienteSelecionado?.telefone ||
        novoClienteTelefone.trim() ||
        null;

      let cnpjClienteFinal =
        clienteSelecionado?.cnpj ||
        novoClienteCnpj.trim() ||
        null;

      if (
        !clienteIdFinal &&
        novoClienteNome.trim()
      ) {
        const {
          data: novoCliente,
          error: erroCliente,
        } = await supabase
          .from("clientes")
          .insert([
            {
              nome:
                novoClienteNome.trim(),

              cnpj:
                novoClienteCnpj.trim() ||
                null,

              email:
                novoClienteEmail.trim() ||
                null,

              telefone:
                novoClienteTelefone.trim() ||
                null,
            },
          ])
          .select(
            "id, nome, cnpj, email, telefone"
          )
          .single();

        if (erroCliente) {
          throw erroCliente;
        }

        clienteIdFinal =
          novoCliente.id;

        nomeClienteFinal =
          novoCliente.nome;

        cnpjClienteFinal =
          novoCliente.cnpj;

        emailClienteFinal =
          novoCliente.email;

        telefoneClienteFinal =
          novoCliente.telefone;
      }

      const vazaoNumerica =
        vazao.trim()
          ? Number(
              vazao.replace(
                ",",
                "."
              )
            )
          : null;

      if (
        vazaoNumerica !== null &&
        !Number.isFinite(
          vazaoNumerica
        )
      ) {
        setErro(
          "Informe uma vazão válida."
        );

        return;
      }

      await criarObraExecucao({
        cliente_id:
          clienteIdFinal,

        setor_id:
          setorId ||
          null,

        responsavel_id:
          responsavelId ||
          null,

        codigo:
          codigo.trim() ||
          null,

        cliente:
          nomeClienteFinal ||
          null,

        razao_social:
          razaoSocial.trim() ||
          null,

        cnpj:
          cnpjClienteFinal,

        email:
          emailClienteFinal,

        telefone:
          telefoneClienteFinal,

        cidade:
          cidade.trim() ||
          null,

        estado:
          estado.trim() ||
          null,

        nome_obra:
          nomeObra.trim(),

        descricao:
          descricao.trim() ||
          null,

        tipo_projeto:
          tipoProjeto.trim() ||
          null,

        tipo_efluente:
          tipoEfluente.trim() ||
          null,

        vazao:
          vazaoNumerica,

        status,

        data_inicio:
          dataInicio ||
          null,

        prazo_entrega:
          prazoEntrega ||
          null,

        observacoes:
          observacoes.trim() ||
          null,

        criado_por:
          respostaAuth.user.id,
      });

      voltar();
    } catch (error) {
      console.error(
        "Erro ao cadastrar obra:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a obra."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (
    carregandoOpcoes
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-7 w-7 animate-spin" />

          <p className="text-sm font-medium">
            Carregando cadastro...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={
              voltar
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />

            Voltar para obras
          </button>

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Execução
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Nova obra
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Cadastre uma obra diretamente, sem necessidade de orçamento vinculado.
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Building2 className="h-6 w-6" />
        </div>
      </header>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {erro}
        </div>
      )}

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-6"
      >
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Identificação
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Campo
              label="Código"
              value={
                codigo
              }
              onChange={
                setCodigo
              }
              placeholder="Ex.: OB-001"
            />

            <Campo
              label="Nome da obra *"
              value={
                nomeObra
              }
              onChange={
                setNomeObra
              }
              placeholder="Informe o nome da obra"
            />

            <Campo
              label="Razão social"
              value={
                razaoSocial
              }
              onChange={
                setRazaoSocial
              }
            />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={
                  status
                }
                onChange={(
                  event
                ) =>
                  setStatus(
                    event.target
                      .value as StatusObraExecucao
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Cliente
          </h2>

          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Cliente existente
              </label>

              <select
                value={
                  clienteId
                }
                onChange={(
                  event
                ) =>
                  setClienteId(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Cadastrar novo cliente
                </option>

                {clientes.map(
                  (
                    cliente
                  ) => (
                    <option
                      key={
                        cliente.id
                      }
                      value={
                        cliente.id
                      }
                    >
                      {cliente.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            {!clienteId && (
              <div className="grid gap-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 md:grid-cols-2">
                <Campo
                  label="Nome do novo cliente *"
                  value={
                    novoClienteNome
                  }
                  onChange={
                    setNovoClienteNome
                  }
                />

                <Campo
                  label="CNPJ"
                  value={
                    novoClienteCnpj
                  }
                  onChange={
                    setNovoClienteCnpj
                  }
                />

                <Campo
                  label="E-mail"
                  type="email"
                  value={
                    novoClienteEmail
                  }
                  onChange={
                    setNovoClienteEmail
                  }
                />

                <Campo
                  label="Telefone"
                  value={
                    novoClienteTelefone
                  }
                  onChange={
                    setNovoClienteTelefone
                  }
                />
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <Campo
                label="Cidade"
                value={
                  cidade
                }
                onChange={
                  setCidade
                }
              />

              <Campo
                label="Estado"
                value={
                  estado
                }
                onChange={
                  setEstado
                }
                placeholder="Ex.: SC"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Responsáveis
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Setor
              </label>

              <select
                value={
                  setorId
                }
                onChange={(
                  event
                ) =>
                  setSetorId(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Sem setor definido
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
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Responsável
              </label>

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
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Sem responsável definido
                </option>

                {responsaveisDisponiveis.map(
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
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Dados técnicos e prazo
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
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
              placeholder="Ex.: 10,5"
            />

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
              label="Prazo de entrega"
              type="date"
              value={
                prazoEntrega
              }
              onChange={
                setPrazoEntrega
              }
            />
          </div>

          <div className="mt-5 grid gap-5">
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
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={
              voltar
            }
            disabled={
              salvando
            }
            className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={
              salvando
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {salvando
              ? "Salvando..."
              : "Cadastrar obra"}
          </button>
        </div>
      </form>
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
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

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
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
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
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

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
        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}