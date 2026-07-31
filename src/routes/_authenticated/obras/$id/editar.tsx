import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type SetorObra = {
  id: string;
  nome: string;
};

type ClienteObra = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
};

type PerfilUsuarioObra = {
  setor_id: string | null;
  administrador: boolean;
};

export const Route = createFileRoute(
  "/_authenticated/obras/$id/editar"
)({
  component: EditarObraPage,
});

function EditarObraPage() {
  const {
    id,
  } = Route.useParams();

  const navigate =
    useNavigate();

  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    setoresLista,
    setSetoresLista,
  ] = useState<SetorObra[]>(
    []
  );

  const [
    clientesLista,
    setClientesLista,
  ] = useState<ClienteObra[]>(
    []
  );

  const [
    clienteSelecionadoId,
    setClienteSelecionadoId,
  ] = useState("");

  const [
    exibindoNovoCliente,
    setExibindoNovoCliente,
  ] = useState(false);

  const [
    salvandoNovoCliente,
    setSalvandoNovoCliente,
  ] = useState(false);

  const [
    novoCliente,
    setNovoCliente,
  ] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  const [
    erroCliente,
    setErroCliente,
  ] = useState("");

  const [
    usuarioAdministrador,
    setUsuarioAdministrador,
  ] = useState(false);

  const [
    erroPermissoes,
    setErroPermissoes,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState<any>({
    codigo: "",
    setor_id: "",
    cliente: "",
    razao_social: "",
    cnpj: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",

    numero_proposta: "",
    revisao: "",
    motivo_revisao: "",
    vendedor: "",
    data_entrada: "",
    data_entrega_esperada: "",
    tipo_proposta: "",
    tipo_orcamentacao: "",

    nome_obra: "",
    descricao: "",
    complexidade: "",
    responsavel_engenheiro: "",

    vazao: "",
    tipo_projeto: "",
    tipo_efluente: "",

    data_inicio: "",
    data_entrega: "",
    situacao_especial: "",
    motivo_atraso: "",

    observacoes: "",
  });

  function formatarCnpj(
    valor: string
  ) {
    return valor
      .replace(
        /\D/g,
        ""
      )
      .slice(
        0,
        14
      )
      .replace(
        /^(\d{2})(\d)/,
        "$1.$2"
      )
      .replace(
        /^(\d{2})\.(\d{3})(\d)/,
        "$1.$2.$3"
      )
      .replace(
        /\.(\d{3})(\d)/,
        ".$1/$2"
      )
      .replace(
        /(\d{4})(\d)/,
        "$1-$2"
      );
  }

  function formatarTelefone(
    valor: string
  ) {
    return valor
      .replace(
        /\D/g,
        ""
      )
      .slice(
        0,
        11
      )
      .replace(
        /^(\d{2})(\d)/,
        "($1) $2"
      )
      .replace(
        /(\d{5})(\d)/,
        "$1-$2"
      );
  }

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErroPermissoes("");

      const respostaAuth =
        await supabase.auth.getUser();

      const usuarioAuth =
        respostaAuth.data.user;

      if (
        respostaAuth.error ||
        !usuarioAuth
      ) {
        throw (
          respostaAuth.error ||
          new Error(
            "Usuário não autenticado."
          )
        );
      }

      const [
        respostaObra,
        respostaPerfil,
        respostaClientes,
      ] = await Promise.all([
        supabase
          .from("obras")
          .select("*")
          .eq(
            "id",
            id
          )
          .single(),

        supabase
          .from("usuarios")
          .select(
            "setor_id, administrador"
          )
          .eq(
            "id",
            usuarioAuth.id
          )
          .single(),

        supabase
          .from("clientes")
          .select(
            "id, nome, email, telefone"
          )
          .order(
            "nome",
            {
              ascending: true,
            }
          ),
      ]);

      if (
        respostaObra.error
      ) {
        throw respostaObra.error;
      }

      if (
        respostaPerfil.error
      ) {
        throw respostaPerfil.error;
      }

      if (
        respostaClientes.error
      ) {
        throw respostaClientes.error;
      }

      const clientesEncontrados =
        (
          respostaClientes.data ||
          []
        ) as ClienteObra[];

      setClientesLista(
        clientesEncontrados
      );

      const clienteAtual =
        respostaObra.data.cliente
          ? clientesEncontrados.find(
              (cliente) =>
                cliente.nome ===
                respostaObra.data.cliente
            )
          : null;

      setClienteSelecionadoId(
        clienteAtual?.id ||
          (
            respostaObra.data.cliente
              ? "__cliente_atual__"
              : ""
          )
      );

      const perfil =
        respostaPerfil.data as PerfilUsuarioObra;

      const administrador =
        Boolean(
          perfil.administrador
        );

      setUsuarioAdministrador(
        administrador
      );

      let consultaSetores =
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
              ascending: true,
            }
          );

      if (!administrador) {
        if (
          !perfil.setor_id
        ) {
          setErroPermissoes(
            "Seu usuário ainda não possui um setor definido. Solicite o ajuste no painel administrativo."
          );

          setSetoresLista([]);
        } else {
          consultaSetores =
            consultaSetores.eq(
              "id",
              perfil.setor_id
            );
        }
      }

      if (
        administrador ||
        perfil.setor_id
      ) {
        const {
          data: setores,
          error: erroSetores,
        } =
          await consultaSetores;

        if (erroSetores) {
          throw erroSetores;
        }

        setSetoresLista(
          (
            setores || []
          ) as SetorObra[]
        );
      }

      setForm(
        (
          prevForm: any
        ) => ({
          ...prevForm,
          ...respostaObra.data,

          setor_id:
            respostaObra
              .data
              .setor_id ||
            perfil.setor_id ||
            "",
        })
      );
    } catch (error) {
      console.error(
        "Erro ao carregar obra e permissões:",
        error
      );

      setErroPermissoes(
        "Não foi possível carregar a obra ou as permissões do usuário."
      );
    } finally {
      setCarregando(false);
    }
  }

  function handleChange(
    event: React.ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >
  ) {
    const {
      name,
    } = event.target;

    let valor =
      event.target.value;

    if (
      name === "cnpj"
    ) {
      valor =
        formatarCnpj(
          valor
        );
    }

    if (
      name === "telefone"
    ) {
      valor =
        formatarTelefone(
          valor
        );
    }

    setForm(
      (
        prevForm: any
      ) => ({
        ...prevForm,
        [name]: valor,
      })
    );
  }

  function handleSelecionarCliente(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const clienteId =
      event.target.value;

    setClienteSelecionadoId(
      clienteId
    );

    if (!clienteId) {
      setForm(
        (
          prevForm: any
        ) => ({
          ...prevForm,
          cliente: "",
          email: "",
          telefone: "",
        })
      );

      return;
    }

    if (
      clienteId ===
      "__cliente_atual__"
    ) {
      return;
    }

    const cliente =
      clientesLista.find(
        (item) =>
          item.id ===
          clienteId
      );

    if (!cliente) {
      return;
    }

    setForm(
      (
        prevForm: any
      ) => ({
        ...prevForm,
        cliente:
          cliente.nome,
        email:
          cliente.email ||
          "",
        telefone:
          cliente.telefone ||
          "",
      })
    );
  }

  function handleNovoClienteChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const {
      name,
      value,
    } = event.target;

    setNovoCliente(
      (
        estadoAtual
      ) => ({
        ...estadoAtual,
        [name]:
          name ===
          "telefone"
            ? formatarTelefone(
                value
              )
            : value,
      })
    );
  }

  async function cadastrarClienteRapido() {
    const nomeTratado =
      novoCliente.nome.trim();

    if (!nomeTratado) {
      setErroCliente(
        "Informe o nome do cliente."
      );

      return;
    }

    try {
      setSalvandoNovoCliente(
        true
      );

      setErroCliente("");

      const {
        data,
        error,
      } = await supabase
        .from("clientes")
        .insert({
          nome:
            nomeTratado,

          email:
            novoCliente.email.trim() ||
            null,

          telefone:
            novoCliente.telefone.trim() ||
            null,
        })
        .select(
          "id, nome, email, telefone"
        )
        .single();

      if (error) {
        throw error;
      }

      const clienteCriado =
        data as ClienteObra;

      setClientesLista(
        (
          estadoAtual
        ) =>
          [
            ...estadoAtual,
            clienteCriado,
          ].sort(
            (
              clienteA,
              clienteB
            ) =>
              clienteA.nome.localeCompare(
                clienteB.nome,
                "pt-BR"
              )
          )
      );

      setClienteSelecionadoId(
        clienteCriado.id
      );

      setForm(
        (
          prevForm: any
        ) => ({
          ...prevForm,
          cliente:
            clienteCriado.nome,
          email:
            clienteCriado.email ||
            "",
          telefone:
            clienteCriado.telefone ||
            "",
        })
      );

      setNovoCliente({
        nome: "",
        email: "",
        telefone: "",
      });

      setExibindoNovoCliente(
        false
      );
    } catch (error) {
      console.error(
        "Erro ao cadastrar cliente:",
        error
      );

      setErroCliente(
        "Não foi possível cadastrar o cliente."
      );
    } finally {
      setSalvandoNovoCliente(
        false
      );
    }
  }

  async function salvar(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !form.setor_id
    ) {
      alert(
        "Selecione o setor responsável pela obra."
      );

      return;
    }

    try {
      setLoading(true);


      const {
        error,
      } = await supabase
        .from("obras")
        .update({
          codigo:
            form.codigo ||
            null,

          setor_id:
            form.setor_id,

          cliente:
            form.cliente,

          razao_social:
            form.razao_social ||
            null,

          cnpj:
            form.cnpj ||
            null,

          email:
            form.email ||
            null,

          telefone:
            form.telefone ||
            null,

          cidade:
            form.cidade ||
            null,

          estado:
            form.estado ||
            null,

          numero_proposta:
            form.numero_proposta ||
            null,

          revisao:
            form.revisao
              ? Number(
                  form.revisao
                )
              : null,

          motivo_revisao:
            form.motivo_revisao ||
            null,

          vendedor:
            form.vendedor ||
            null,

          data_entrada:
            form.data_entrada ||
            null,

          data_entrega_esperada:
            form.data_entrega_esperada ||
            null,

          tipo_proposta:
            form.tipo_proposta ||
            null,

          tipo_orcamentacao:
            form.tipo_orcamentacao ||
            null,

          nome_obra:
            form.nome_obra ||
            null,

          descricao:
            form.descricao ||
            null,

          complexidade:
            form.complexidade ||
            null,

          responsavel_engenheiro:
            form.responsavel_engenheiro ||
            null,

          vazao:
            form.vazao
              ? Number(
                  form.vazao
                )
              : null,

          tipo_projeto:
            form.tipo_projeto ||
            null,

          tipo_efluente:
            form.tipo_efluente ||
            null,

          data_inicio:
            form.data_inicio ||
            null,

          data_entrega:
            form.data_entrega ||
            null,

          situacao_especial:
            form.situacao_especial ||
            null,

          motivo_atraso:
            form.motivo_atraso ||
            null,


          observacoes:
            form.observacoes ||
            null,
        })
        .eq(
          "id",
          id
        );

      if (error) {
        throw error;
      }

      await router.invalidate();

      navigate({
        to:
          "/obras/$id",

        params: {
          id,
        },
      });
    } catch (error) {
      console.error(
        "Erro ao salvar obra:",
        error
      );

      alert(
        "Erro ao salvar alterações"
      );
    } finally {
      setLoading(false);
    }
  }


  if (carregando) {
    return (
      <div className="p-8">
        Carregando obra...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Editar Obra
        </h1>
      </div>

      <form
        onSubmit={salvar}
        className="space-y-8"
      >
        <div className="border rounded-2xl p-6 space-y-5 bg-white">
          <h2 className="text-xl font-semibold">
            Dados Gerais
          </h2>

          {erroPermissoes && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {erroPermissoes}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label
                htmlFor="setor_id"
                className="text-sm font-medium"
              >
                Setor responsável
              </label>

              <select
                id="setor_id"
                name="setor_id"
                value={
                  form.setor_id ??
                  ""
                }
                onChange={
                  handleChange
                }
                disabled={
                  !usuarioAdministrador
                }
                required
                className="border rounded-lg p-3 w-full bg-white disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  Selecione o setor responsável
                </option>

                {setoresLista.map(
                  (setor) => (
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

              {!usuarioAdministrador &&
                form.setor_id && (
                  <p className="text-xs text-muted-foreground">
                    Apenas administradores podem alterar o setor da obra.
                  </p>
                )}
            </div>

            {[
              [
                "codigo",
                "Código da obra",
              ],
              [
                "nome_obra",
                "Nome da obra",
              ],
              [
                "razao_social",
                "Razão social",
              ],
              [
                "cnpj",
                "CNPJ",
              ],
              [
                "email",
                "E-mail",
              ],
              [
                "telefone",
                "Telefone",
              ],
              [
                "cidade",
                "Cidade",
              ],
              [
                "estado",
                "Estado",
              ],
            ].map(
              (
                [
                  campo,
                  label,
                ]
              ) => (
                <div
                  key={
                    campo
                  }
                  className="space-y-2"
                >
                  <label className="text-sm font-medium">
                    {label}
                  </label>

                  <input
                    name={
                      campo
                    }
                    value={
                      form[
                        campo
                      ] ?? ""
                    }
                    onChange={
                      handleChange
                    }
                    className="border rounded-lg p-3 w-full"
                  />
                </div>
              )
            )}

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="cliente_selecionado"
                  className="text-sm font-medium"
                >
                  Cliente
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setErroCliente("");
                    setExibindoNovoCliente(
                      (
                        estadoAtual
                      ) =>
                        !estadoAtual
                    );
                  }}
                  className="cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                >
                  {exibindoNovoCliente
                    ? "Cancelar cadastro"
                    : "Novo cliente"}
                </button>
              </div>

              <select
                id="cliente_selecionado"
                value={
                  clienteSelecionadoId
                }
                onChange={
                  handleSelecionarCliente
                }
                className="border rounded-lg p-3 w-full bg-white"
              >
                <option value="">
                  Selecione o cliente
                </option>

                {clienteSelecionadoId ===
                  "__cliente_atual__" &&
                  form.cliente && (
                    <option value="__cliente_atual__">
                      {form.cliente} — cliente ainda não cadastrado
                    </option>
                  )}

                {clientesLista.map(
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
                      {
                        cliente.nome
                      }
                    </option>
                  )
                )}
              </select>

              {exibindoNovoCliente && (
                <div className="mt-3 space-y-4 rounded-xl border bg-slate-50 p-4">
                  <div>
                    <h3 className="font-semibold">
                      Cadastro rápido de cliente
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      O cliente será cadastrado e selecionado automaticamente nesta obra.
                    </p>
                  </div>

                  {erroCliente && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {erroCliente}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Nome
                      </label>

                      <input
                        type="text"
                        name="nome"
                        value={
                          novoCliente.nome
                        }
                        onChange={
                          handleNovoClienteChange
                        }
                        placeholder="Nome do cliente"
                        className="border rounded-lg p-3 w-full bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        E-mail
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={
                          novoCliente.email
                        }
                        onChange={
                          handleNovoClienteChange
                        }
                        placeholder="E-mail"
                        className="border rounded-lg p-3 w-full bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Telefone
                      </label>

                      <input
                        type="text"
                        name="telefone"
                        value={
                          novoCliente.telefone
                        }
                        onChange={
                          handleNovoClienteChange
                        }
                        placeholder="Telefone"
                        className="border rounded-lg p-3 w-full bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={
                        cadastrarClienteRapido
                      }
                      disabled={
                        salvandoNovoCliente
                      }
                      className="cursor-pointer rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {salvandoNovoCliente
                        ? "Cadastrando..."
                        : "Cadastrar cliente"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border rounded-2xl p-6 space-y-5 bg-white">
          <h2 className="text-xl font-semibold">
            Informações Comerciais
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              [
                "numero_proposta",
                "Nº Proposta",
              ],
              [
                "revisao",
                "Revisão",
              ],
              [
                "motivo_revisao",
                "Motivo da revisão",
              ],
              [
                "vendedor",
                "Vendedor",
              ],
              [
                "data_entrada",
                "Data Entrada",
              ],
              [
                "data_entrega_esperada",
                "Data Entrega Esperada",
              ],
              [
                "tipo_proposta",
                "Tipo de Proposta",
              ],
              [
                "tipo_orcamentacao",
                "Tipo de Orçamentação",
              ],
            ].map(
              (
                [
                  campo,
                  label,
                ]
              ) => (
                <div
                  key={
                    campo
                  }
                  className="space-y-2"
                >
                  <label className="text-sm font-medium">
                    {label}
                  </label>

                  <input
                    type={
                      campo.includes(
                        "data"
                      )
                        ? "date"
                        : "text"
                    }
                    name={
                      campo
                    }
                    value={
                      form[
                        campo
                      ] ?? ""
                    }
                    onChange={
                      handleChange
                    }
                    className="border rounded-lg p-3 w-full"
                  />
                </div>
              )
            )}
          </div>
        </div>

        <div className="border rounded-2xl p-6 space-y-5 bg-white">
          <h2 className="text-xl font-semibold">
            Dados Técnicos
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              [
                "vazao",
                "Vazão (m³/dia)",
              ],
              [
                "tipo_projeto",
                "Tipo de projeto",
              ],
              [
                "tipo_efluente",
                "Tipo de efluente",
              ],
              [
                "complexidade",
                "Complexidade",
              ],
              [
                "responsavel_engenheiro",
                "Responsável Eng.",
              ],
            ].map(
              (
                [
                  campo,
                  label,
                ]
              ) => (
                <div
                  key={
                    campo
                  }
                  className="space-y-2"
                >
                  <label className="text-sm font-medium">
                    {label}
                  </label>

                  <input
                    name={
                      campo
                    }
                    value={
                      form[
                        campo
                      ] ?? ""
                    }
                    onChange={
                      handleChange
                    }
                    className="border rounded-lg p-3 w-full"
                  />
                </div>
              )
            )}
          </div>
        </div>

        <div className="border rounded-2xl p-6 space-y-5 bg-white">
          <h2 className="text-xl font-semibold">
            Execução
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              [
                "data_inicio",
                "Data de início",
              ],
              [
                "data_entrega",
                "Data de entrega",
              ],
              [
                "situacao_especial",
                "Situação especial",
              ],
              [
                "motivo_atraso",
                "Motivo de atraso",
              ],
            ].map(
              (
                [
                  campo,
                  label,
                ]
              ) => (
                <div
                  key={
                    campo
                  }
                  className="space-y-2"
                >
                  <label className="text-sm font-medium">
                    {label}
                  </label>

                  <input
                    type={
                      campo.includes(
                        "data"
                      )
                        ? "date"
                        : "text"
                    }
                    name={
                      campo
                    }
                    value={
                      form[
                        campo
                      ] ?? ""
                    }
                    onChange={
                      handleChange
                    }
                    className="border rounded-lg p-3 w-full"
                  />
                </div>
              )
            )}

          </div>
        </div>

        <div className="border rounded-2xl p-6 space-y-3 bg-white">
          <label className="text-sm font-medium">
            Observações
          </label>

          <textarea
            name="observacoes"
            value={
              form.observacoes ??
              ""
            }
            onChange={
              handleChange
            }
            rows={5}
            className="border rounded-lg p-3 w-full"
          />
        </div>

        <button
          disabled={
            loading ||
            !form.setor_id ||
            Boolean(
              erroPermissoes
            )
          }
          type="submit"
          className="bg-black text-white px-8 py-3 rounded-xl cursor-pointer hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Salvando..."
            : "Salvar Alterações"}
        </button>
      </form>
    </div>
  );
}