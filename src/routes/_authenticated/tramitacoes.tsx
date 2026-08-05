import { createFileRoute } from "@tanstack/react-router";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";

import {
  listarHistoricoTramitacoes,
  listarObrasParaTramitacao,
  listarSetoresDestino,
  tramitarObras,
  type HistoricoTramitacao,
  type ObraTramitacao,
  type SetorTramitacao,
} from "@/features/tramitacoes/services/tramitacoes-service";

export const Route = createFileRoute("/_authenticated/tramitacoes")({
  component: TramitacoesPage,
});

type AbaTramitacao = "tramitar" | "historico";

type AbaObras = "meu_setor" | "outros_setores";

function formatarDataHora(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function TramitacoesPage() {
  const { perfil } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState<AbaTramitacao>("tramitar");

  const [abaObrasAtiva, setAbaObrasAtiva] = useState<AbaObras>("meu_setor");

  const [obras, setObras] = useState<ObraTramitacao[]>([]);

  const [setores, setSetores] = useState<SetorTramitacao[]>([]);

  const [historico, setHistorico] = useState<HistoricoTramitacao[]>([]);

  const [obrasSelecionadas, setObrasSelecionadas] = useState<string[]>([]);

  const [setorDestinoId, setSetorDestinoId] = useState("");

  const [observacao, setObservacao] = useState("");

  const [busca, setBusca] = useState("");

  const [carregando, setCarregando] = useState(true);

  const [tramitando, setTramitando] = useState(false);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  const administrador = Boolean(perfil?.administrador);

  const setorUsuarioId = perfil?.setor_id || null;

  const obrasMeuSetor = useMemo(
    () => obras.filter((obra) => obra.setor_id === setorUsuarioId),
    [obras, setorUsuarioId],
  );

  const obrasOutrosSetores = useMemo(
    () => obras.filter((obra) => obra.setor_id !== setorUsuarioId),
    [obras, setorUsuarioId],
  );

  const obrasDaAba =
    abaObrasAtiva === "meu_setor" ? obrasMeuSetor : obrasOutrosSetores;

  const obrasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return obrasDaAba;
    }

    return obrasDaAba.filter((obra) => {
      const conteudo = [
        obra.codigo,
        obra.numero_proposta,
        obra.numero_obra,
        obra.nome_obra,
        obra.cliente,
        obra.setor?.nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return conteudo.includes(termo);
    });
  }, [obrasDaAba, busca]);

  const obrasSelecionadasDados = useMemo(
    () => obras.filter((obra) => obrasSelecionadas.includes(obra.id)),
    [obras, obrasSelecionadas],
  );

  const todasFiltradasSelecionadas =
    obrasFiltradas.length > 0 &&
    obrasFiltradas.every((obra) => obrasSelecionadas.includes(obra.id));

  async function carregarDados() {
    if (!perfil) {
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const [obrasEncontradas, setoresEncontrados, historicoEncontrado] =
        await Promise.all([
          listarObrasParaTramitacao(setorUsuarioId, administrador),

          listarSetoresDestino(),

          listarHistoricoTramitacoes(),
        ]);

      setObras(obrasEncontradas);

      setSetores(setoresEncontrados);

      setHistorico(historicoEncontrado);

      setObrasSelecionadas((selecionadasAtuais) =>
        selecionadasAtuais.filter((obraId) =>
          obrasEncontradas.some((obra) => obra.id === obraId),
        ),
      );
    } catch (error) {
      console.error("Erro ao carregar tramitações:", error);

      setErro("Não foi possível carregar os dados de tramitação.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (perfil) {
      carregarDados();
    }
  }, [perfil?.id, perfil?.setor_id, perfil?.administrador]);

  function trocarAbaObras(novaAba: AbaObras) {
    setAbaObrasAtiva(novaAba);

    setObrasSelecionadas([]);

    setMensagem("");

    setErro("");
  }

  function alternarSelecaoObra(obraId: string) {
    setObrasSelecionadas((estadoAtual) => {
      if (estadoAtual.includes(obraId)) {
        return estadoAtual.filter((idSelecionado) => idSelecionado !== obraId);
      }

      return [...estadoAtual, obraId];
    });
  }

  function alternarTodasFiltradas() {
    if (todasFiltradasSelecionadas) {
      const idsFiltrados = new Set(obrasFiltradas.map((obra) => obra.id));

      setObrasSelecionadas((estadoAtual) =>
        estadoAtual.filter((obraId) => !idsFiltrados.has(obraId)),
      );

      return;
    }

    setObrasSelecionadas((estadoAtual) =>
      Array.from(
        new Set([...estadoAtual, ...obrasFiltradas.map((obra) => obra.id)]),
      ),
    );
  }

  async function handleTramitar() {
    setErro("");
    setMensagem("");

    if (obrasSelecionadas.length === 0) {
      setErro("Selecione pelo menos uma obra.");

      return;
    }

    if (!setorDestinoId) {
      setErro("Selecione o setor de destino.");

      return;
    }

    const obraJaNoDestino = obrasSelecionadasDados.find(
      (obra) => obra.setor_id === setorDestinoId,
    );

    if (obraJaNoDestino) {
      setErro(
        `A obra ${
          obraJaNoDestino.codigo || obraJaNoDestino.nome_obra || "selecionada"
        } já pertence ao setor de destino.`,
      );

      return;
    }

    const setorDestino = setores.find((setor) => setor.id === setorDestinoId);

    const confirmado = window.confirm(
      `Deseja tramitar ${obrasSelecionadas.length} ${
        obrasSelecionadas.length === 1 ? "obra" : "obras"
      } para "${setorDestino?.nome || "o setor selecionado"}"?`,
    );

    if (!confirmado) {
      return;
    }

    try {
      setTramitando(true);

      const quantidade = await tramitarObras(
        obrasSelecionadas,
        setorDestinoId,
        observacao,
      );

      setMensagem(
        `${quantidade} ${
          quantidade === 1 ? "obra tramitada" : "obras tramitadas"
        } com sucesso.`,
      );

      setObrasSelecionadas([]);

      setSetorDestinoId("");

      setObservacao("");

      await carregarDados();
    } catch (error) {
      console.error("Erro ao tramitar obras:", error);

      const mensagemErro =
        error instanceof Error
          ? error.message
          : "Não foi possível realizar a tramitação.";

      setErro(mensagemErro);
    } finally {
      setTramitando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando tramitações...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Send className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">Tramitação</h1>

            <p className="mt-1 text-muted-foreground">
              Transfira obras entre os setores e acompanhe o histórico.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={carregarDados}
          disabled={tramitando}
          className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
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
          onClick={() => setAbaAtiva("tramitar")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            abaAtiva === "tramitar"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-muted-foreground hover:text-slate-950"
          }`}
        >
          <Send className="h-4 w-4" />
          Tramitar obras
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("historico")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            abaAtiva === "historico"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-muted-foreground hover:text-slate-950"
          }`}
        >
          <Clock3 className="h-4 w-4" />
          Histórico
        </button>
      </div>

      {abaAtiva === "tramitar" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="space-y-4 border-b p-5">
              <div>
                <h2 className="text-xl font-semibold">Obras disponíveis</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {administrador
                    ? "Como administrador, você pode tramitar obras de qualquer setor."
                    : "São exibidas para tramitação apenas as obras do seu setor."}
                </p>
              </div>

              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => trocarAbaObras("meu_setor")}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    abaObrasAtiva === "meu_setor"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-muted-foreground hover:text-slate-950"
                  }`}
                >
                  Obras do meu setor
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">
                    {obrasMeuSetor.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => trocarAbaObras("outros_setores")}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    abaObrasAtiva === "outros_setores"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-muted-foreground hover:text-slate-950"
                  }`}
                >
                  Obras de outros setores
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">
                    {obrasOutrosSetores.length}
                  </span>
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="text"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por código, obra, cliente ou setor..."
                  className="h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {obrasFiltradas.length === 0 ? (
              <div className="p-10 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />

                <p className="mt-4 font-medium">Nenhuma obra disponível</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {busca.trim()
                    ? "Não existem obras para tramitar com a busca atual."
                    : abaObrasAtiva === "meu_setor"
                      ? "Não existem obras disponíveis no seu setor."
                      : "Não existem obras disponíveis em outros setores."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={todasFiltradasSelecionadas}
                      onChange={alternarTodasFiltradas}
                      className="h-4 w-4 cursor-pointer"
                    />
                    Selecionar todas
                  </label>

                  <span className="text-xs text-muted-foreground">
                    {obrasSelecionadas.length} selecionada(s)
                  </span>
                </div>

                <div className="max-h-[560px] divide-y overflow-y-auto">
                  {obrasFiltradas.map((obra) => {
                    const selecionada = obrasSelecionadas.includes(obra.id);

                    return (
                      <label
                        key={obra.id}
                        className={`flex cursor-pointer items-start gap-3 px-5 py-3.5 transition hover:bg-muted/30 ${
                          selecionada ? "bg-blue-50/60" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selecionada}
                          onChange={() => alternarSelecaoObra(obra.id)}
                          className="mt-1 h-4 w-4 cursor-pointer"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p
                                className={`text-base font-bold leading-tight ${
                                  obra.numero_obra
                                    ? "text-slate-950"
                                    : "text-amber-700"
                                }`}
                              >
                                {obra.numero_obra || "Sem numeração ERP"}
                              </p>

                              <p className="mt-0.5 text-sm leading-tight text-slate-600">
                                Proposta{" "}
                                <span className="font-semibold text-slate-800">
                                  {obra.numero_proposta ||
                                    obra.codigo ||
                                    "não informada"}
                                </span>
                              </p>
                            </div>

                            <span className="rounded-full border bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                              {obra.setor?.nome || "Sem setor"}
                            </span>
                          </div>

                          <p className="mt-2 truncate text-sm font-medium leading-tight text-slate-700">
                            {obra.nome_obra || "Obra sem nome"}
                          </p>

                          <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
                            {obra.cliente || "Cliente não informado"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <aside className="h-fit space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold">Destino da tramitação</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Escolha o novo setor responsável pelas obras selecionadas.
              </p>
            </div>

            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Obras selecionadas
              </p>

              <p className="mt-1 text-2xl font-bold">
                {obrasSelecionadas.length}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="setor-destino" className="text-sm font-medium">
                Setor de destino
              </label>

              <select
                id="setor-destino"
                value={setorDestinoId}
                onChange={(event) => setSetorDestinoId(event.target.value)}
                className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Selecione o setor</option>

                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="observacao-tramitacao"
                className="text-sm font-medium"
              >
                Observação
              </label>

              <textarea
                id="observacao-tramitacao"
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                rows={4}
                placeholder="Motivo ou informação adicional da tramitação..."
                className="w-full resize-none rounded-lg border bg-white p-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleTramitar}
              disabled={
                tramitando || obrasSelecionadas.length === 0 || !setorDestinoId
              }
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tramitando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {tramitando ? "Tramitando..." : "Tramitar obras"}
            </button>
          </aside>
        </div>
      )}

      {abaAtiva === "historico" && (
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">Histórico de tramitações</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Registro de todas as movimentações realizadas entre setores.
            </p>
          </div>

          {historico.length === 0 ? (
            <div className="p-10 text-center">
              <Clock3 className="mx-auto h-10 w-10 text-muted-foreground" />

              <p className="mt-4 font-medium">Nenhuma tramitação registrada</p>
            </div>
          ) : (
            <div className="divide-y">
              {historico.map((tramitacao) => (
                <article key={tramitacao.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />

                        <p className="font-semibold">
                          {tramitacao.obra_codigo || "Sem código"}
                        </p>

                        <span className="text-sm text-muted-foreground">
                          {tramitacao.obra_nome || "Obra sem nome"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-lg border bg-slate-50 px-3 py-1.5">
                          {tramitacao.setor_origem_nome || "Sem setor"}
                        </span>

                        <ArrowRight className="h-4 w-4 text-muted-foreground" />

                        <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
                          {tramitacao.setor_destino_nome ||
                            "Setor não informado"}
                        </span>
                      </div>

                      {tramitacao.observacao && (
                        <p className="mt-3 text-sm text-slate-600">
                          {tramitacao.observacao}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800">
                        {tramitacao.usuario_nome || "Usuário não informado"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatarDataHora(tramitacao.created_at)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}