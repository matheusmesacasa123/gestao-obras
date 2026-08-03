import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Save,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  atualizarCliente,
  getClienteComObras,
  type ClienteComObras,
} from "@/features/clientes/services/clientes-service";

export const Route =
  createFileRoute(
    "/_authenticated/clientes/$id"
  )({
    component:
      ClienteDetalhesPage,
  });

function formatarStatus(
  status?: string | null
) {
  if (!status) {
    return "Não informado";
  }

  return status
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        letra
      ) =>
        letra.toUpperCase()
    );
}

function formatarMoeda(
  valor?: number | null
) {
  return Number(
    valor ??
      0
  ).toLocaleString(
    "pt-BR",
    {
      style:
        "currency",
      currency:
        "BRL",
    }
  );
}

function formatarData(
  valor?: string | null
) {
  if (!valor) {
    return "Não informada";
  }

  return new Date(
    `${valor}T12:00:00`
  ).toLocaleDateString(
    "pt-BR"
  );
}

function formatarTelefone(
  valor: string
) {
  let apenasNumeros =
    valor.replace(
      /\D/g,
      ""
    );

  if (
    apenasNumeros.length >
    11
  ) {
    apenasNumeros =
      apenasNumeros.slice(
        0,
        11
      );
  }

  if (
    apenasNumeros.length >
    6
  ) {
    return `(${apenasNumeros.slice(
      0,
      2
    )}) ${apenasNumeros.slice(
      2,
      7
    )}-${apenasNumeros.slice(
      7
    )}`;
  }

  if (
    apenasNumeros.length >
    2
  ) {
    return `(${apenasNumeros.slice(
      0,
      2
    )}) ${apenasNumeros.slice(
      2
    )}`;
  }

  if (
    apenasNumeros.length >
    0
  ) {
    return `(${apenasNumeros}`;
  }

  return "";
}

function ClienteDetalhesPage() {
  const {
    id,
  } = Route.useParams();

  const navigate =
    useNavigate();

  const [
    cliente,
    setCliente,
  ] = useState<ClienteComObras | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    editando,
    setEditando,
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
    nome,
    setNome,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    telefone,
    setTelefone,
  ] = useState("");

  async function carregarCliente() {
    try {
      setLoading(
        true
      );

      setErro("");

      const data =
        await getClienteComObras(
          id
        );

      setCliente(
        data
      );
    } catch (error) {
      console.error(
        "Erro ao carregar cliente:",
        error
      );

      setErro(
        "Não foi possível carregar o cliente e suas obras."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    carregarCliente();
  }, [
    id,
  ]);

  const valorTotalVendido =
    useMemo(
      () =>
        cliente?.obras.reduce(
          (
            total,
            obra
          ) =>
            total +
            (
              Number(
                obra.valor_vendido
              ) ||
              0
            ),
          0
        ) ??
        0,
      [
        cliente,
      ]
    );

  function voltar() {
    navigate({
      to:
        "/clientes",
    });
  }

  function abrirObra(
    obraId: string
  ) {
    navigate({
      to:
        "/obras/$id",

      params: {
        id:
          obraId,
      },
    });
  }

  function iniciarEdicao() {
    if (!cliente) {
      return;
    }

    setNome(
      cliente.nome
    );

    setEmail(
      cliente.email ??
        ""
    );

    setTelefone(
      cliente.telefone ??
        ""
    );

    setEditando(
      true
    );
  }

  function cancelarEdicao() {
    setEditando(
      false
    );

    setNome("");
    setEmail("");
    setTelefone("");
  }

  async function salvarEdicao(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    if (!nome.trim()) {
      alert(
        "O nome do cliente é obrigatório."
      );

      return;
    }

    try {
      setSalvando(
        true
      );

      await atualizarCliente(
        id,
        {
          nome:
            nome.trim(),

          email:
            email.trim() ||
            null,

          telefone:
            telefone.trim() ||
            null,
        }
      );

      await carregarCliente();

      setEditando(
        false
      );
    } catch (error: any) {
      alert(
        "Erro ao atualizar cliente: " +
          (
            error?.message ||
            "Erro desconhecido"
          )
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-8">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          Carregando cliente...
        </div>
      </div>
    );
  }

  if (
    erro ||
    !cliente
  ) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-8">
        <button
          type="button"
          onClick={
            voltar
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />

          Voltar para clientes
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
          {erro ||
            "Cliente não encontrado."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-8">
      <button
        type="button"
        onClick={
          voltar
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />

        Voltar para clientes
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {
              cliente.nome
            }
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Dados do cliente e histórico de propostas vinculadas.
          </p>
        </div>

        {!editando && (
          <button
            type="button"
            onClick={
              iniciarEdicao
            }
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Edit3 className="h-4 w-4" />

            Editar cliente
          </button>
        )}
      </div>

      {editando ? (
        <form
          onSubmit={
            salvarEdicao
          }
          className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Editar cliente
            </h2>

            <button
              type="button"
              onClick={
                cancelarEdicao
              }
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Cancelar edição"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Nome *
              </span>

              <input
                type="text"
                value={
                  nome
                }
                onChange={(
                  event
                ) =>
                  setNome(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                E-mail
              </span>

              <input
                type="email"
                value={
                  email
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold text-gray-700">
                Telefone
              </span>

              <input
                type="text"
                value={
                  telefone
                }
                onChange={(
                  event
                ) =>
                  setTelefone(
                    formatarTelefone(
                      event.target.value
                    )
                  )
                }
                maxLength={
                  15
                }
                className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={
                cancelarEdicao
              }
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                salvando
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />

              {salvando
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </div>
        </form>
      ) : (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Informações do cliente
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Mail className="h-4 w-4" />

                E-mail
              </div>

              <p className="mt-2 font-semibold text-gray-900">
                {cliente.email ||
                  "Não informado"}
              </p>
            </div>

            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Phone className="h-4 w-4" />

                Telefone
              </div>

              <p className="mt-2 font-semibold text-gray-900">
                {cliente.telefone ||
                  "Não informado"}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Obras vinculadas
          </p>

          <strong className="mt-2 block text-2xl font-bold text-gray-900">
            {
              cliente.obras.length
            }
          </strong>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Valor total vendido
          </p>

          <strong className="mt-2 block text-2xl font-bold text-emerald-700">
            {formatarMoeda(
              valorTotalVendido
            )}
          </strong>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Histórico de propostas
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Obras e propostas cadastradas para este cliente.
          </p>
        </div>

        {cliente.obras.length ===
        0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <Building2 className="mx-auto h-8 w-8 text-gray-400" />

            <h3 className="mt-3 font-semibold text-gray-900">
              Nenhuma obra vinculada
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Este cliente ainda não possui obras cadastradas.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cliente.obras.map(
              (
                obra
              ) => (
                <button
                  key={
                    obra.id
                  }
                  type="button"
                  onClick={() =>
                    abrirObra(
                      obra.id
                    )
                  }
                  className="group rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        {obra.numero_proposta ||
                          obra.codigo ||
                          "Sem número"}
                        {" · "}
                        Rev.{" "}
                        {obra.revisao ??
                          0}
                      </p>

                      <h3 className="mt-1 truncate text-lg font-bold text-gray-900 group-hover:text-blue-700">
                        {obra.nome_obra ||
                          "Obra sem nome"}
                      </h3>
                    </div>

                    <Building2 className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-blue-600" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {formatarStatus(
                        obra.status
                      )}
                    </span>

                    {obra.tipo_proposta && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {
                          obra.tipo_proposta
                        }
                      </span>
                    )}

                    {obra.tipo_orcamentacao && (
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                        {
                          obra.tipo_orcamentacao
                        }
                      </span>
                    )}

                    {(obra.cidade ||
                      obra.estado) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        <MapPin className="h-3.5 w-3.5" />

                        {[
                          obra.cidade,
                          obra.estado,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            "/"
                          )}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                    <div>
                      <p className="flex items-center gap-1 text-xs text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />

                        Entrada
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {formatarData(
                          obra.data_entrada
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Valor vendido
                      </p>

                      <p className="mt-1 text-sm font-bold text-emerald-700">
                        {formatarMoeda(
                          obra.valor_vendido
                        )}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-blue-600">
                    Abrir obra
                  </p>
                </button>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}