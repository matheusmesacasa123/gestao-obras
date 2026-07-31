import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";

import {
  useAuth,
} from "@/features/auth/auth-context";

import {
  atualizarCargo,
  atualizarSetor,
  atualizarUsuarioAdministrativo,
  criarCargo,
  criarSetor,
  excluirCargo,
  excluirSetor,
  listarCargos,
  listarSetores,
  listarUsuarios,
  verificarAdministrador,
  type Cargo,
  type Setor,
  type UsuarioAdministrativo,
} from "@/features/admin/services/admin-service";

export const Route = createFileRoute(
  "/_authenticated/admin"
)({
  component: AdminPage,
});

type AbaAdministrativa =
  | "usuarios"
  | "estrutura";

type EdicaoUsuario = {
  setor_id: string;
  cargo_id: string;
  administrador: boolean;
  ativo: boolean;
};

function AdminPage() {
  const {
    user,
  } = useAuth();

  const navigate = useNavigate();

  const [
    abaAtiva,
    setAbaAtiva,
  ] = useState<AbaAdministrativa>(
    "usuarios"
  );

  const [
    verificandoAcesso,
    setVerificandoAcesso,
  ] = useState(true);

  const [
    autorizado,
    setAutorizado,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    usuarios,
    setUsuarios,
  ] = useState<UsuarioAdministrativo[]>(
    []
  );

  const [
    setores,
    setSetores,
  ] = useState<Setor[]>([]);

  const [
    cargos,
    setCargos,
  ] = useState<Cargo[]>([]);

  const [
    edicoesUsuarios,
    setEdicoesUsuarios,
  ] = useState<
    Record<string, EdicaoUsuario>
  >({});

  const [
    salvandoUsuarioId,
    setSalvandoUsuarioId,
  ] = useState<string | null>(
    null
  );

  const [
    novoSetor,
    setNovoSetor,
  ] = useState("");

  const [
    novoCargo,
    setNovoCargo,
  ] = useState("");

  const [
    novoCargoSetorId,
    setNovoCargoSetorId,
  ] = useState("");

  const [
    editandoSetorId,
    setEditandoSetorId,
  ] = useState<string | null>(
    null
  );

  const [
    editandoCargoId,
    setEditandoCargoId,
  ] = useState<string | null>(
    null
  );

  const [
    nomeSetorEdicao,
    setNomeSetorEdicao,
  ] = useState("");

  const [
    nomeCargoEdicao,
    setNomeCargoEdicao,
  ] = useState("");

  const [
    setorCargoEdicao,
    setSetorCargoEdicao,
  ] = useState("");

  const [
    salvandoEstrutura,
    setSalvandoEstrutura,
  ] = useState(false);

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  useEffect(() => {
    async function validarAcesso() {
      if (!user?.id) {
        setAutorizado(false);
        setVerificandoAcesso(false);
        return;
      }

      const usuarioAdministrador =
        await verificarAdministrador(
          user.id
        );

      setAutorizado(
        usuarioAdministrador
      );

      setVerificandoAcesso(false);

      if (!usuarioAdministrador) {
        navigate({
          to: "/",
          replace: true,
        });
      }
    }

    validarAcesso();
  }, [
    user?.id,
    navigate,
  ]);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [
        respostaUsuarios,
        respostaSetores,
        respostaCargos,
      ] = await Promise.all([
        listarUsuarios(),
        listarSetores(),
        listarCargos(),
      ]);

      if (respostaUsuarios.error) {
        throw respostaUsuarios.error;
      }

      if (respostaSetores.error) {
        throw respostaSetores.error;
      }

      if (respostaCargos.error) {
        throw respostaCargos.error;
      }

      const usuariosEncontrados =
        respostaUsuarios.data as unknown as
          UsuarioAdministrativo[];

      const setoresEncontrados =
        respostaSetores.data as unknown as
          Setor[];

      const cargosEncontrados =
        respostaCargos.data as unknown as
          Cargo[];

      setUsuarios(
        usuariosEncontrados || []
      );

      setSetores(
        setoresEncontrados || []
      );

      setCargos(
        cargosEncontrados || []
      );

      const edicoes: Record<
        string,
        EdicaoUsuario
      > = {};

      for (
        const usuarioEncontrado
        of usuariosEncontrados || []
      ) {
        edicoes[
          usuarioEncontrado.id
        ] = {
          setor_id:
            usuarioEncontrado.setor_id ||
            "",
          cargo_id:
            usuarioEncontrado.cargo_id ||
            "",
          administrador:
            Boolean(
              usuarioEncontrado.administrador
            ),
          ativo:
            usuarioEncontrado.ativo !==
            false,
        };
      }

      setEdicoesUsuarios(
        edicoes
      );

      if (
        !novoCargoSetorId &&
        setoresEncontrados?.length
      ) {
        setNovoCargoSetorId(
          setoresEncontrados[0].id
        );
      }
    } catch (error) {
      console.error(
        "Erro ao carregar painel administrativo:",
        error
      );

      setErro(
        "Não foi possível carregar os dados administrativos."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (autorizado) {
      carregarDados();
    }
  }, [autorizado]);

  const setoresAtivos =
    useMemo(
      () =>
        setores.filter(
          (setor) => setor.ativo
        ),
      [setores]
    );

  const cargosDoSetorSelecionado =
    useMemo(
      () => {
        if (!novoCargoSetorId) {
          return [];
        }

        return cargos.filter(
          (cargo) =>
            cargo.setor_id ===
            novoCargoSetorId
        );
      },
      [
        cargos,
        novoCargoSetorId,
      ]
    );

  function obterCargosDoSetor(
    setorId: string,
    incluirInativos = false
  ) {
    return cargos.filter(
      (cargo) =>
        cargo.setor_id === setorId &&
        (
          incluirInativos ||
          cargo.ativo
        )
    );
  }

  function atualizarEdicaoUsuario(
    usuarioId: string,
    campo: keyof EdicaoUsuario,
    valor:
      | string
      | boolean
  ) {
    setEdicoesUsuarios(
      (estadoAtual) => ({
        ...estadoAtual,

        [usuarioId]: {
          ...estadoAtual[
            usuarioId
          ],

          [campo]: valor,
        },
      })
    );
  }

  function alterarSetorUsuario(
    usuarioId: string,
    setorId: string
  ) {
    setEdicoesUsuarios(
      (estadoAtual) => ({
        ...estadoAtual,

        [usuarioId]: {
          ...estadoAtual[
            usuarioId
          ],

          setor_id: setorId,
          cargo_id: "",
        },
      })
    );
  }

  async function salvarUsuario(
    usuarioId: string
  ) {
    const edicao =
      edicoesUsuarios[
        usuarioId
      ];

    if (!edicao) {
      return;
    }

    if (
      edicao.cargo_id &&
      !edicao.setor_id
    ) {
      setErro(
        "Selecione o setor antes de definir o cargo."
      );

      return;
    }

    try {
      setErro("");
      setMensagem("");
      setSalvandoUsuarioId(
        usuarioId
      );

      const {
        error,
      } =
        await atualizarUsuarioAdministrativo(
          usuarioId,
          {
            setor_id:
              edicao.setor_id ||
              null,

            cargo_id:
              edicao.cargo_id ||
              null,

            administrador:
              edicao.administrador,

            ativo:
              edicao.ativo,
          }
        );

      if (error) {
        throw error;
      }

      setMensagem(
        "Usuário atualizado com sucesso."
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao atualizar usuário:",
        error
      );

      setErro(
        "Não foi possível atualizar o usuário."
      );
    } finally {
      setSalvandoUsuarioId(
        null
      );
    }
  }

  async function handleCriarSetor(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const nomeTratado =
      novoSetor.trim();

    if (!nomeTratado) {
      setErro(
        "Informe o nome do setor."
      );

      return;
    }

    try {
      setSalvandoEstrutura(true);
      setErro("");
      setMensagem("");

      const {
        error,
      } = await criarSetor(
        nomeTratado
      );

      if (error) {
        throw error;
      }

      setNovoSetor("");

      setMensagem(
        "Setor criado com sucesso."
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao criar setor:",
        error
      );

      setErro(
        "Não foi possível criar o setor. Verifique se ele já existe."
      );
    } finally {
      setSalvandoEstrutura(false);
    }
  }

  async function handleCriarCargo(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const nomeTratado =
      novoCargo.trim();

    if (
      !nomeTratado ||
      !novoCargoSetorId
    ) {
      setErro(
        "Informe o cargo e o setor."
      );

      return;
    }

    try {
      setSalvandoEstrutura(true);
      setErro("");
      setMensagem("");

      const {
        error,
      } = await criarCargo(
        nomeTratado,
        novoCargoSetorId
      );

      if (error) {
        throw error;
      }

      setNovoCargo("");

      setMensagem(
        "Cargo criado com sucesso."
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao criar cargo:",
        error
      );

      setErro(
        "Não foi possível criar o cargo. Verifique se ele já existe nesse setor."
      );
    } finally {
      setSalvandoEstrutura(false);
    }
  }

  function iniciarEdicaoSetor(
    setor: Setor
  ) {
    setEditandoSetorId(
      setor.id
    );

    setNomeSetorEdicao(
      setor.nome
    );
  }

  async function salvarEdicaoSetor(
    setorId: string
  ) {
    const nomeTratado =
      nomeSetorEdicao.trim();

    if (!nomeTratado) {
      setErro(
        "Informe o nome do setor."
      );

      return;
    }

    try {
      setSalvandoEstrutura(true);
      setErro("");
      setMensagem("");

      const {
        error,
      } = await atualizarSetor(
        setorId,
        {
          nome: nomeTratado,
        }
      );

      if (error) {
        throw error;
      }

      setEditandoSetorId(
        null
      );

      setNomeSetorEdicao("");

      setMensagem(
        "Setor atualizado com sucesso."
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao editar setor:",
        error
      );

      setErro(
        "Não foi possível atualizar o setor."
      );
    } finally {
      setSalvandoEstrutura(false);
    }
  }

  async function handleExcluirSetor(
    setor: Setor
  ) {
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir o setor "${setor.nome}"?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setSalvandoEstrutura(true);
      setErro("");
      setMensagem("");

      const {
        error,
      } = await excluirSetor(
        setor.id
      );

      if (error) {
        throw error;
      }

      setMensagem(
        "Setor excluído com sucesso."
      );

      await carregarDados();
    } catch (error: any) {
      console.error(
        "Erro ao excluir setor:",
        error
      );

      const codigoErro =
        error?.code || "";

      if (codigoErro === "23503") {
        setErro(
          "Não é possível excluir este setor porque existem usuários, cargos ou obras vinculados a ele."
        );
      } else {
        setErro(
          error?.message ||
            "Não foi possível excluir o setor."
        );
      }
    } finally {
      setSalvandoEstrutura(false);
    }
  }

  function iniciarEdicaoCargo(
    cargo: Cargo
  ) {
    setEditandoCargoId(
      cargo.id
    );

    setNomeCargoEdicao(
      cargo.nome
    );

    setSetorCargoEdicao(
      cargo.setor_id
    );
  }

  async function salvarEdicaoCargo(
    cargoId: string
  ) {
    const nomeTratado =
      nomeCargoEdicao.trim();

    if (
      !nomeTratado ||
      !setorCargoEdicao
    ) {
      setErro(
        "Informe o cargo e o setor."
      );

      return;
    }

    try {
      setSalvandoEstrutura(true);
      setErro("");
      setMensagem("");

      const {
        error,
      } = await atualizarCargo(
        cargoId,
        {
          nome: nomeTratado,
          setor_id:
            setorCargoEdicao,
        }
      );

      if (error) {
        throw error;
      }

      setEditandoCargoId(
        null
      );

      setNomeCargoEdicao("");

      setSetorCargoEdicao("");

      setMensagem(
        "Cargo atualizado com sucesso."
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao editar cargo:",
        error
      );

      setErro(
        "Não foi possível atualizar o cargo."
      );
    } finally {
      setSalvandoEstrutura(false);
    }
  }

  async function handleExcluirCargo(
    cargo: Cargo
  ) {
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir o cargo "${cargo.nome}"?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setSalvandoEstrutura(true);
      setErro("");
      setMensagem("");

      const {
        error,
      } = await excluirCargo(
        cargo.id
      );

      if (error) {
        throw error;
      }

      setMensagem(
        "Cargo excluído com sucesso."
      );

      await carregarDados();
    } catch (error: any) {
      console.error(
        "Erro ao excluir cargo:",
        error
      );

      const codigoErro =
        error?.code || "";

      if (codigoErro === "23503") {
        setErro(
          "Não é possível excluir este cargo porque existem usuários vinculados a ele."
        );
      } else {
        setErro(
          error?.message ||
            "Não foi possível excluir o cargo."
        );
      }
    } finally {
      setSalvandoEstrutura(false);
    }
  }

  if (
    verificandoAcesso ||
    (
      autorizado &&
      carregando
    )
  ) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />

          Carregando painel administrativo...
        </div>
      </div>
    );
  }

  if (!autorizado) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Administração
            </h1>

            <p className="mt-1 text-muted-foreground">
              Gerencie usuários, setores e cargos do sistema.
            </p>
          </div>
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

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() =>
            setAbaAtiva(
              "usuarios"
            )
          }
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            abaAtiva ===
            "usuarios"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-muted-foreground hover:text-slate-950"
          }`}
        >
          <Users className="h-4 w-4" />

          Usuários
        </button>

        <button
          type="button"
          onClick={() =>
            setAbaAtiva(
              "estrutura"
            )
          }
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            abaAtiva ===
            "estrutura"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-muted-foreground hover:text-slate-950"
          }`}
        >
          <Building2 className="h-4 w-4" />

          Setores e cargos
        </button>
      </div>

      {abaAtiva ===
        "usuarios" && (
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold">
              Usuários do sistema
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Defina setor, cargo, situação e acesso administrativo.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead className="border-b bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-4">
                      Usuário
                    </th>

                    <th className="px-5 py-4">
                      Setor
                    </th>

                    <th className="px-5 py-4">
                      Cargo
                    </th>

                    <th className="px-5 py-4 text-center">
                      Administrador
                    </th>

                    <th className="px-5 py-4 text-center">
                      Ativo
                    </th>

                    <th className="px-5 py-4 text-right">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {usuarios.map(
                    (
                      usuarioEncontrado
                    ) => {
                      const edicao =
                        edicoesUsuarios[
                          usuarioEncontrado
                            .id
                        ];

                      if (!edicao) {
                        return null;
                      }

                      const cargosDisponiveis =
                        obterCargosDoSetor(
                          edicao.setor_id
                        );

                      const salvando =
                        salvandoUsuarioId ===
                        usuarioEncontrado.id;

                      return (
                        <tr
                          key={
                            usuarioEncontrado.id
                          }
                          className="align-middle"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-medium">
                                {
                                  usuarioEncontrado.nome
                                }
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  usuarioEncontrado.email
                                }
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                edicao.setor_id
                              }
                              onChange={(
                                event
                              ) =>
                                alterarSetorUsuario(
                                  usuarioEncontrado.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500"
                            >
                              <option value="">
                                Sem setor
                              </option>

                              {setoresAtivos.map(
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
                                    {
                                      setor.nome
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                edicao.cargo_id
                              }
                              onChange={(
                                event
                              ) =>
                                atualizarEdicaoUsuario(
                                  usuarioEncontrado.id,
                                  "cargo_id",
                                  event
                                    .target
                                    .value
                                )
                              }
                              disabled={
                                !edicao.setor_id
                              }
                              className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
                            >
                              <option value="">
                                Sem cargo
                              </option>

                              {cargosDisponiveis.map(
                                (
                                  cargo
                                ) => (
                                  <option
                                    key={
                                      cargo.id
                                    }
                                    value={
                                      cargo.id
                                    }
                                  >
                                    {
                                      cargo.nome
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={
                                edicao.administrador
                              }
                              onChange={(
                                event
                              ) =>
                                atualizarEdicaoUsuario(
                                  usuarioEncontrado.id,
                                  "administrador",
                                  event
                                    .target
                                    .checked
                                )
                              }
                              className="h-4 w-4 cursor-pointer"
                            />
                          </td>

                          <td className="px-5 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={
                                edicao.ativo
                              }
                              onChange={(
                                event
                              ) =>
                                atualizarEdicaoUsuario(
                                  usuarioEncontrado.id,
                                  "ativo",
                                  event
                                    .target
                                    .checked
                                )
                              }
                              className="h-4 w-4 cursor-pointer"
                            />
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                salvarUsuario(
                                  usuarioEncontrado.id
                                )
                              }
                              disabled={
                                salvando
                              }
                              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {salvando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}

                              Salvar
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {abaAtiva ===
        "estrutura" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />

                <h2 className="text-xl font-semibold">
                  Setores
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre e organize os setores da empresa.
              </p>
            </div>

            <form
              onSubmit={
                handleCriarSetor
              }
              className="flex gap-3"
            >
              <input
                type="text"
                value={
                  novoSetor
                }
                onChange={(
                  event
                ) =>
                  setNovoSetor(
                    event.target
                      .value
                  )
                }
                placeholder="Nome do novo setor"
                className="h-11 flex-1 rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={
                  salvandoEstrutura
                }
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />

                Adicionar
              </button>
            </form>

            <div className="space-y-3">
              {setores.map(
                (setor) => (
                  <div
                    key={
                      setor.id
                    }
                    className="rounded-xl border p-4"
                  >
                    {editandoSetorId ===
                    setor.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={
                            nomeSetorEdicao
                          }
                          onChange={(
                            event
                          ) =>
                            setNomeSetorEdicao(
                              event
                                .target
                                .value
                            )
                          }
                          className="h-10 flex-1 rounded-lg border px-3 text-sm outline-none focus:border-blue-500"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            salvarEdicaoSetor(
                              setor.id
                            )
                          }
                          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-slate-950 text-white"
                        >
                          <Save className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditandoSetorId(
                              null
                            )
                          }
                          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">
                            {
                              setor.nome
                            }
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              setor.ativo
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {setor.ativo
                              ? "Ativo"
                              : "Inativo"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              iniciarEdicaoSetor(
                                setor
                              )
                            }
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition hover:bg-muted"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleExcluirSetor(
                                setor
                              )
                            }
                            disabled={
                              salvandoEstrutura
                            }
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />

                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-5 w-5" />

                <h2 className="text-xl font-semibold">
                  Cargos
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre cargos e relacione-os aos setores.
              </p>
            </div>

            <form
              onSubmit={
                handleCriarCargo
              }
              className="space-y-3"
            >
              <input
                type="text"
                value={
                  novoCargo
                }
                onChange={(
                  event
                ) =>
                  setNovoCargo(
                    event.target
                      .value
                  )
                }
                placeholder="Nome do novo cargo"
                className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500"
              />

              <div className="flex gap-3">
                <select
                  value={
                    novoCargoSetorId
                  }
                  onChange={(
                    event
                  ) =>
                    setNovoCargoSetorId(
                      event.target
                        .value
                    )
                  }
                  className="h-11 flex-1 rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    Selecione o setor
                  </option>

                  {setoresAtivos.map(
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

                <button
                  type="submit"
                  disabled={
                    salvandoEstrutura
                  }
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />

                  Adicionar
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {!novoCargoSetorId ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Selecione um setor para visualizar os cargos.
                </div>
              ) : cargosDoSetorSelecionado.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhum cargo cadastrado neste setor.
                </div>
              ) : (
                cargosDoSetorSelecionado.map(
                  (cargo) => (
                  <div
                    key={
                      cargo.id
                    }
                    className="rounded-xl border p-4"
                  >
                    {editandoCargoId ===
                    cargo.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={
                            nomeCargoEdicao
                          }
                          onChange={(
                            event
                          ) =>
                            setNomeCargoEdicao(
                              event
                                .target
                                .value
                            )
                          }
                          className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-blue-500"
                        />

                        <select
                          value={
                            setorCargoEdicao
                          }
                          onChange={(
                            event
                          ) =>
                            setSetorCargoEdicao(
                              event
                                .target
                                .value
                            )
                          }
                          className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500"
                        >
                          {setoresAtivos.map(
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
                                {
                                  setor.nome
                                }
                              </option>
                            )
                          )}
                        </select>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditandoCargoId(
                                null
                              )
                            }
                            className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                          >
                            <X className="h-4 w-4" />

                            Cancelar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              salvarEdicaoCargo(
                                cargo.id
                              )
                            }
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm text-white"
                          >
                            <Save className="h-4 w-4" />

                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">
                            {
                              cargo.nome
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {cargo.setor
                              ?.nome ||
                              "Setor não informado"}
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              cargo.ativo
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {cargo.ativo
                              ? "Ativo"
                              : "Inativo"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              iniciarEdicaoCargo(
                                cargo
                              )
                            }
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition hover:bg-muted"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleExcluirCargo(
                                cargo
                              )
                            }
                            disabled={
                              salvandoEstrutura
                            }
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />

                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  )
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}