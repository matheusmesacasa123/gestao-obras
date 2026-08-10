import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

import {
  criarObra,
  getObrasExecucaoDisponiveisParaVinculo,
  type ObraExecucaoDisponivelVinculo,
} from "@/features/obras/services/obras-service";

import {
  getClientes,
  type Cliente,
} from "@/features/clientes/services/clientes-service";

type SetorObra = {
  id: string;
  nome: string;
};

type VendedorObra = {
  id: string;
  nome: string;
  email: string;
};

type PerfilUsuarioObra = {
  setor_id: string | null;
  administrador: boolean;
};

export const Route = createFileRoute("/_authenticated/obras/nova")({
  component: NovaObraPage,
});

function NovaObraPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [clientesLista, setClientesLista] = useState<Cliente[]>([]);

  const [setoresLista, setSetoresLista] = useState<SetorObra[]>([]);

  const [vendedoresLista, setVendedoresLista] = useState<VendedorObra[]>([]);

  const [usarObraExistente, setUsarObraExistente] = useState(false);

  const [obrasExecucaoDisponiveis, setObrasExecucaoDisponiveis] = useState<
    ObraExecucaoDisponivelVinculo[]
  >([]);

  const [carregandoObrasExecucao, setCarregandoObrasExecucao] = useState(true);

  const [erroObrasExecucao, setErroObrasExecucao] = useState("");

  const [modoNovoCliente, setModoNovoCliente] = useState(false);

  const [usuarioAdministrador, setUsuarioAdministrador] = useState(false);

  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);

  const [carregandoVendedores, setCarregandoVendedores] = useState(true);

  const [erroPermissoes, setErroPermissoes] = useState("");

  const [erroVendedores, setErroVendedores] = useState("");

  const [form, setForm] = useState({
    obra_execucao_id: "",
    setor_id: "",

    cliente_id: "",
    novoClienteNome: "",
    novoClienteRazaoSocial: "",
    novoClienteCnpj: "",
    novoClienteEmail: "",
    novoClienteTelefone: "",

    cidade: "",
    estado: "",

    numero_proposta: "",

    vendedor_id: "",
    vendedor: "",

    data_entrada: "",
    data_entrega_esperada: "",
    tipo_proposta: "",
    tipo_orcamentacao: "",

    nome_obra: "",
    descricao: "",
    complexidade: "",

    vazao: "",
    tipo_projeto: "",
    tipo_efluente: "",

    status: "recebida",

    observacoes: "",
  });

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        setCarregandoPermissoes(true);

        setCarregandoVendedores(true);

        setCarregandoObrasExecucao(true);

        setErroPermissoes("");
        setErroVendedores("");
        setErroObrasExecucao("");

        const [clientes, respostaAuth, respostaCargoVendedor, obrasExecucao] =
          await Promise.all([
            getClientes(),

            supabase.auth.getUser(),

            supabase
              .from("cargos")
              .select("id, nome")
              .eq("nome", "Vendedor")
              .eq("ativo", true)
              .maybeSingle(),

            getObrasExecucaoDisponiveisParaVinculo(),
          ]);

        setClientesLista(clientes);

        setObrasExecucaoDisponiveis(obrasExecucao);

        const usuarioAuth = respostaAuth.data.user;

        if (respostaAuth.error || !usuarioAuth) {
          throw respostaAuth.error || new Error("Usuário não autenticado.");
        }

        if (respostaCargoVendedor.error) {
          throw respostaCargoVendedor.error;
        }

        if (respostaCargoVendedor.data?.id) {
          const { data: vendedores, error: erroBuscaVendedores } =
            await supabase
              .from("usuarios")
              .select("id, nome, email")
              .eq("cargo_id", respostaCargoVendedor.data.id)
              .eq("ativo", true)
              .order("nome", {
                ascending: true,
              });

          if (erroBuscaVendedores) {
            throw erroBuscaVendedores;
          }

          setVendedoresLista((vendedores || []) as VendedorObra[]);
        } else {
          setVendedoresLista([]);

          setErroVendedores('O cargo ativo "Vendedor" não foi encontrado.');
        }

        const { data: perfil, error: erroPerfil } = await supabase
          .from("usuarios")
          .select("setor_id, administrador")
          .eq("id", usuarioAuth.id)
          .single();

        if (erroPerfil) {
          throw erroPerfil;
        }

        const perfilUsuario = perfil as PerfilUsuarioObra;

        const administrador = Boolean(perfilUsuario.administrador);

        setUsuarioAdministrador(administrador);

        let consultaSetores = supabase
          .from("setores")
          .select("id, nome")
          .eq("ativo", true)
          .order("nome", {
            ascending: true,
          });

        if (!administrador) {
          if (!perfilUsuario.setor_id) {
            setSetoresLista([]);

            setErroPermissoes(
              "Seu usuário ainda não possui um setor definido. Solicite o ajuste no painel administrativo.",
            );

            return;
          }

          consultaSetores = consultaSetores.eq("id", perfilUsuario.setor_id);
        }

        const { data: setores, error: erroSetores } = await consultaSetores;

        if (erroSetores) {
          throw erroSetores;
        }

        const setoresEncontrados = (setores || []) as SetorObra[];

        setSetoresLista(setoresEncontrados);

        if (!administrador && perfilUsuario.setor_id) {
          setForm((estadoAtual) => ({
            ...estadoAtual,

            setor_id: perfilUsuario.setor_id || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais da obra:", error);

        setErroPermissoes(
          "Não foi possível carregar os dados necessários para cadastrar o orçamento.",
        );

        setErroObrasExecucao(
          "Não foi possível carregar as obras disponíveis para vínculo.",
        );
      } finally {
        setCarregandoPermissoes(false);

        setCarregandoVendedores(false);

        setCarregandoObrasExecucao(false);
      }
    }

    carregarDadosIniciais();
  }, []);

  function formatarCnpj(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function formatarTelefone(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name } = event.target;

    let valor = event.target.value;

    if (name === "novoClienteCnpj") {
      valor = formatarCnpj(valor);
    }

    if (name === "novoClienteTelefone") {
      valor = formatarTelefone(valor);
    }

    setForm((estadoAtual) => ({
      ...estadoAtual,

      [name]: valor,
    }));
  }

  function handleSelecionarVendedor(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const vendedorId = event.target.value;

    const vendedorSelecionado = vendedoresLista.find(
      (vendedor) => vendedor.id === vendedorId,
    );

    setForm((estadoAtual) => ({
      ...estadoAtual,

      vendedor_id: vendedorId,

      vendedor: vendedorSelecionado?.nome || "",
    }));
  }

  function handleAlterarOrigemOrcamento(vincularObraExistente: boolean) {
    setUsarObraExistente(vincularObraExistente);

    setForm((estadoAtual) => ({
      ...estadoAtual,

      obra_execucao_id: "",
    }));
  }

  function handleSelecionarObraExistente(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const obraExecucaoId = event.target.value;

    const obraSelecionada = obrasExecucaoDisponiveis.find(
      (obra) => obra.id === obraExecucaoId,
    );

    setForm((estadoAtual) => ({
      ...estadoAtual,

      obra_execucao_id: obraExecucaoId,

      nome_obra: obraSelecionada?.nome_obra || estadoAtual.nome_obra,

      cliente_id: obraSelecionada?.cliente_id || estadoAtual.cliente_id,

      setor_id: obraSelecionada?.setor_id || estadoAtual.setor_id,

      cidade: obraSelecionada?.cidade || estadoAtual.cidade,

      estado: obraSelecionada?.estado || estadoAtual.estado,
    }));

    if (obraSelecionada?.cliente_id) {
      setModoNovoCliente(false);
    }
  }

  const obraExecucaoSelecionada = obrasExecucaoDisponiveis.find(
    (obra) => obra.id === form.obra_execucao_id,
  );

  const clienteSelecionado = clientesLista.find(
    (cliente) => cliente.id === form.cliente_id,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (usarObraExistente && !form.obra_execucao_id) {
      alert("Selecione a obra existente no ERP.");

      return;
    }

    if (!form.setor_id) {
      alert("Selecione o setor responsável pela obra.");

      return;
    }

    try {
      setLoading(true);

      await criarObra({
        obra_execucao_id: usarObraExistente ? form.obra_execucao_id : null,

        setor_id: form.setor_id,

        cliente_id: form.cliente_id || null,

        novoClienteNome: modoNovoCliente ? form.novoClienteNome : undefined,

        novoClienteRazaoSocial: modoNovoCliente
          ? form.novoClienteRazaoSocial
          : undefined,

        novoClienteCnpj: modoNovoCliente ? form.novoClienteCnpj : undefined,

        novoClienteEmail: modoNovoCliente ? form.novoClienteEmail : undefined,

        novoClienteTelefone: modoNovoCliente
          ? form.novoClienteTelefone
          : undefined,

        cidade: form.cidade || null,

        estado: form.estado || null,

        numero_proposta: form.numero_proposta || null,

        vendedor_id: form.vendedor_id || null,

        vendedor: form.vendedor || null,

        data_entrada: form.data_entrada || null,

        data_entrega_esperada: form.data_entrega_esperada || null,

        tipo_proposta: form.tipo_proposta || null,

        tipo_orcamentacao: form.tipo_orcamentacao || null,

        nome_obra: form.nome_obra,

        descricao: form.descricao || null,

        complexidade: form.complexidade || null,

        vazao: form.vazao ? Number(form.vazao) : null,

        tipo_projeto: form.tipo_projeto || null,

        tipo_efluente: form.tipo_efluente || null,

        status: form.status,

        observacoes: form.observacoes || null,
      });

      navigate({
        to: "/obras",
      });
    } catch (error) {
      console.error("Erro ao criar obra:", error);

      const mensagem =
        error instanceof Error ? error.message : "Erro desconhecido.";

      alert(`Erro ao cadastrar orçamento: ${mensagem}`);
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const textareaClassName =
    "w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="max-w-5xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Novo orçamento
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Cadastro comercial e técnico do orçamento.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Origem do orçamento
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Informe se este orçamento pertence a uma obra já cadastrada no
              ERP.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleAlterarOrigemOrcamento(false)}
              className={`rounded-xl border p-4 text-left transition ${
                !usarObraExistente
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="font-semibold text-gray-900">
                Não, é um orçamento novo
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Se for aprovado, uma nova obra será criada automaticamente.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleAlterarOrigemOrcamento(true)}
              className={`rounded-xl border p-4 text-left transition ${
                usarObraExistente
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="font-semibold text-gray-900">
                Sim, já existe no ERP
              </p>

              <p className="mt-1 text-sm text-gray-500">
                O orçamento será vinculado à obra existente, sem criar outra.
              </p>
            </button>
          </div>

          {usarObraExistente && (
            <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="space-y-2">
                <label
                  htmlFor="obra_execucao_id"
                  className="text-sm font-semibold text-gray-700"
                >
                  Obra existente no ERP *
                </label>

                <select
                  id="obra_execucao_id"
                  name="obra_execucao_id"
                  value={form.obra_execucao_id}
                  onChange={handleSelecionarObraExistente}
                  disabled={carregandoObrasExecucao}
                  required={usarObraExistente}
                  className={`${inputClassName} cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100`}
                >
                  <option value="">
                    {carregandoObrasExecucao
                      ? "Carregando obras..."
                      : "Selecione a obra"}
                  </option>

                  {obrasExecucaoDisponiveis.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.codigo_erp} — {obra.nome_obra || "Obra sem nome"}
                    </option>
                  ))}
                </select>
              </div>

              {erroObrasExecucao && (
                <p className="text-sm text-red-700">{erroObrasExecucao}</p>
              )}

              {!carregandoObrasExecucao &&
                !erroObrasExecucao &&
                obrasExecucaoDisponiveis.length === 0 && (
                  <p className="text-sm text-amber-700">
                    Não existem obras com ERP disponíveis para vínculo.
                  </p>
                )}

              {obraExecucaoSelecionada && (
                <div className="grid gap-3 rounded-xl border border-blue-200 bg-white p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Número ERP
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {obraExecucaoSelecionada.codigo_erp}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Nome da obra
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {obraExecucaoSelecionada.nome_obra || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Cliente
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {obraExecucaoSelecionada.cliente || "Não informado"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Dados gerais e cliente
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Identificação da obra e vínculo com o cliente cadastrado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setModoNovoCliente((estadoAtual) => !estadoAtual);

                setForm((estadoAtual) => ({
                  ...estadoAtual,

                  cliente_id: "",

                  novoClienteNome: "",

                  novoClienteRazaoSocial: "",

                  novoClienteCnpj: "",

                  novoClienteEmail: "",

                  novoClienteTelefone: "",
                }));
              }}
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
            >
              {modoNovoCliente
                ? "Selecionar cliente existente"
                : "+ Cadastrar novo cliente"}
            </button>
          </div>

          {erroPermissoes && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {erroPermissoes}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="numero_proposta"
                className="text-sm font-semibold text-gray-700"
              >
                Número da proposta
              </label>

              <input
                id="numero_proposta"
                name="numero_proposta"
                placeholder="Ex.: 123/2026"
                value={form.numero_proposta}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="nome_obra"
                className="text-sm font-semibold text-gray-700"
              >
                Nome da obra
              </label>

              <input
                id="nome_obra"
                name="nome_obra"
                placeholder="Ex.: ETE Chapecó"
                value={form.nome_obra}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="setor_id"
                className="text-sm font-semibold text-gray-700"
              >
                Setor responsável *
              </label>

              <select
                id="setor_id"
                name="setor_id"
                value={form.setor_id}
                onChange={handleChange}
                disabled={carregandoPermissoes || !usuarioAdministrador}
                required
                className={`${inputClassName} cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100`}
              >
                <option value="">
                  {carregandoPermissoes
                    ? "Carregando setores..."
                    : "Selecione o setor"}
                </option>

                {setoresLista.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>

              {!usuarioAdministrador && form.setor_id && (
                <p className="text-xs text-gray-500">
                  A obra será vinculada automaticamente ao seu setor.
                </p>
              )}
            </div>

            {!modoNovoCliente ? (
              <div className="space-y-2">
                <label
                  htmlFor="cliente_id"
                  className="text-sm font-semibold text-gray-700"
                >
                  Cliente
                </label>

                <select
                  id="cliente_id"
                  name="cliente_id"
                  value={form.cliente_id}
                  onChange={handleChange}
                  className={`${inputClassName} cursor-pointer`}
                >
                  <option value="">Selecione um cliente</option>

                  {clientesLista.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="novoClienteNome"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Nome do novo cliente *
                  </label>

                  <input
                    id="novoClienteNome"
                    name="novoClienteNome"
                    placeholder="Nome do cliente"
                    value={form.novoClienteNome}
                    onChange={handleChange}
                    className={inputClassName}
                    required={modoNovoCliente}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="novoClienteRazaoSocial"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Razão social *
                  </label>

                  <input
                    id="novoClienteRazaoSocial"
                    name="novoClienteRazaoSocial"
                    placeholder="Razão social"
                    value={form.novoClienteRazaoSocial}
                    onChange={handleChange}
                    className={inputClassName}
                    required={modoNovoCliente}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="novoClienteCnpj"
                    className="text-sm font-semibold text-gray-700"
                  >
                    CNPJ *
                  </label>

                  <input
                    id="novoClienteCnpj"
                    name="novoClienteCnpj"
                    placeholder="00.000.000/0000-00"
                    value={form.novoClienteCnpj}
                    onChange={handleChange}
                    maxLength={18}
                    inputMode="numeric"
                    className={inputClassName}
                    required={modoNovoCliente}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="novoClienteEmail"
                    className="text-sm font-semibold text-gray-700"
                  >
                    E-mail
                  </label>

                  <input
                    id="novoClienteEmail"
                    name="novoClienteEmail"
                    type="email"
                    placeholder="cliente@empresa.com"
                    value={form.novoClienteEmail}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="novoClienteTelefone"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Telefone
                  </label>

                  <input
                    id="novoClienteTelefone"
                    name="novoClienteTelefone"
                    placeholder="(00) 00000-0000"
                    value={form.novoClienteTelefone}
                    onChange={handleChange}
                    maxLength={15}
                    className={inputClassName}
                  />
                </div>
              </>
            )}

            {!modoNovoCliente && clienteSelecionado && (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="cliente_razao_social"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Razão social
                  </label>

                  <input
                    id="cliente_razao_social"
                    value={clienteSelecionado.razao_social || "Não informada"}
                    disabled
                    className={`${inputClassName} cursor-not-allowed bg-gray-100 text-gray-600`}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cliente_cnpj"
                    className="text-sm font-semibold text-gray-700"
                  >
                    CNPJ
                  </label>

                  <input
                    id="cliente_cnpj"
                    value={clienteSelecionado.cnpj || "Não informado"}
                    disabled
                    className={`${inputClassName} cursor-not-allowed bg-gray-100 text-gray-600`}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label
                htmlFor="cidade"
                className="text-sm font-semibold text-gray-700"
              >
                Cidade
              </label>

              <input
                id="cidade"
                name="cidade"
                placeholder="Cidade"
                value={form.cidade}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="estado"
                className="text-sm font-semibold text-gray-700"
              >
                Estado
              </label>

              <input
                id="estado"
                name="estado"
                placeholder="Ex.: SC"
                value={form.estado}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Informações comerciais
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Dados da proposta e responsável comercial.
            </p>
          </div>

          {erroVendedores && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {erroVendedores}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="vendedor_id"
                className="text-sm font-semibold text-gray-700"
              >
                Vendedor
              </label>

              <select
                id="vendedor_id"
                name="vendedor_id"
                value={form.vendedor_id}
                onChange={handleSelecionarVendedor}
                disabled={carregandoVendedores}
                className={`${inputClassName} cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100`}
              >
                <option value="">
                  {carregandoVendedores
                    ? "Carregando vendedores..."
                    : "Selecione o vendedor"}
                </option>

                {vendedoresLista.map((vendedor) => (
                  <option key={vendedor.id} value={vendedor.id}>
                    {vendedor.nome}
                  </option>
                ))}
              </select>

              {!carregandoVendedores && vendedoresLista.length === 0 && (
                <p className="text-xs text-amber-700">
                  Nenhum usuário ativo com o cargo Vendedor foi encontrado.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="data_entrada"
                className="text-sm font-semibold text-gray-700"
              >
                Data de entrada
              </label>

              <input
                id="data_entrada"
                name="data_entrada"
                type="date"
                value={form.data_entrada}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="data_entrega_esperada"
                className="text-sm font-semibold text-gray-700"
              >
                Data de entrega esperada
              </label>

              <input
                id="data_entrega_esperada"
                name="data_entrega_esperada"
                type="date"
                value={form.data_entrega_esperada}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tipo_proposta"
                className="text-sm font-semibold text-gray-700"
              >
                Tipo de proposta
              </label>

              <select
                id="tipo_proposta"
                name="tipo_proposta"
                value={form.tipo_proposta}
                onChange={handleChange}
                className={`${inputClassName} cursor-pointer`}
              >
                <option value="">Selecione o tipo de proposta</option>

                <option value="Simplificado">Simplificado</option>

                <option value="Detalhado">Detalhado</option>

                <option value="Preliminar">Preliminar</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tipo_orcamentacao"
                className="text-sm font-semibold text-gray-700"
              >
                Tipo de orçamentação
              </label>

              <select
                id="tipo_orcamentacao"
                name="tipo_orcamentacao"
                value={form.tipo_orcamentacao}
                onChange={handleChange}
                className={`${inputClassName} cursor-pointer`}
              >
                <option value="">Selecione o tipo de orçamentação</option>

                <option value="Comp. Licitação">Comp. Licitação</option>

                <option value="Equipamentos">Equipamentos</option>

                <option value="ETA">ETA</option>

                <option value="Industrial">Industrial</option>

                <option value="Licitação">Licitação</option>

                <option value="Sanitário">Sanitário</option>

                <option value="Serviços">Serviços</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Dados técnicos
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Informações de dimensionamento e características do projeto.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="vazao"
                className="text-sm font-semibold text-gray-700"
              >
                Vazão (m³/dia)
              </label>

              <input
                id="vazao"
                name="vazao"
                type="number"
                min="0"
                step="any"
                placeholder="Ex.: 500"
                value={form.vazao}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tipo_projeto"
                className="text-sm font-semibold text-gray-700"
              >
                Tipo de projeto
              </label>

              <input
                id="tipo_projeto"
                name="tipo_projeto"
                placeholder="Ex.: ETE"
                value={form.tipo_projeto}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tipo_efluente"
                className="text-sm font-semibold text-gray-700"
              >
                Tipo de efluente
              </label>

              <input
                id="tipo_efluente"
                name="tipo_efluente"
                placeholder="Ex.: Sanitário"
                value={form.tipo_efluente}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="complexidade"
                className="text-sm font-semibold text-gray-700"
              >
                Complexidade
              </label>

              <select
                id="complexidade"
                name="complexidade"
                value={form.complexidade}
                onChange={handleChange}
                className={`${inputClassName} cursor-pointer`}
              >
                <option value="">Selecione a complexidade</option>

                <option value="Baixa">Baixa</option>

                <option value="Média">Média</option>

                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <label
              htmlFor="descricao"
              className="text-sm font-semibold text-gray-700"
            >
              Descrição da obra
            </label>

            <textarea
              id="descricao"
              name="descricao"
              placeholder="Descrição geral da obra"
              value={form.descricao}
              onChange={handleChange}
              rows={4}
              className={textareaClassName}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="observacoes"
              className="text-sm font-semibold text-gray-700"
            >
              Observações
            </label>

            <textarea
              id="observacoes"
              name="observacoes"
              placeholder="Observações adicionais"
              value={form.observacoes}
              onChange={handleChange}
              rows={4}
              className={textareaClassName}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              loading ||
              carregandoPermissoes ||
              carregandoVendedores ||
              !form.setor_id
            }
            className="rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Cadastrar orçamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
