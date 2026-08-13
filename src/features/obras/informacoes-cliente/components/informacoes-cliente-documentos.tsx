import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  DragEvent,
} from "react";

import {
  Download,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  Presentation,
  Trash2,
  Upload,
} from "lucide-react";

import {
  excluirInformacaoClienteDocumento,
  enviarInformacaoClienteDocumento,
  listarInformacoesClienteDocumentos,
} from "../services/informacoes-cliente-documentos-service";

import type {
  InformacaoClienteDocumento,
} from "../services/informacoes-cliente-documentos-service";

interface InformacoesClienteDocumentosProps {
  obraId: string;
}

interface TipoArquivoVisual {
  rotulo: string;
  corIcone: string;
  corSelo: string;
  Icone: typeof FileText;
}

function obterExtensao(
  nome: string
) {
  const nomeSemConsulta =
    nome
      .split("?")[0]
      .trim();

  const partes =
    nomeSemConsulta.split(
      "."
    );

  return partes.length > 1
    ? partes.at(-1)?.toLowerCase() ??
        ""
    : "";
}

function obterTipoArquivo(
  nome: string
): TipoArquivoVisual {
  const extensao =
    obterExtensao(
      nome
    );

  if (
    [
      "xls",
      "xlsx",
      "xlsm",
      "csv",
      "ods",
    ].includes(
      extensao
    )
  ) {
    return {
      rotulo:
        "EXCEL",
      corIcone:
        "text-emerald-700",
      corSelo:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icone:
        FileSpreadsheet,
    };
  }

  if (
    [
      "doc",
      "docx",
      "odt",
      "rtf",
    ].includes(
      extensao
    )
  ) {
    return {
      rotulo:
        "WORD",
      corIcone:
        "text-blue-700",
      corSelo:
        "border-blue-200 bg-blue-50 text-blue-700",
      Icone:
        FileText,
    };
  }

  if (
    extensao ===
    "pdf"
  ) {
    return {
      rotulo:
        "PDF",
      corIcone:
        "text-red-700",
      corSelo:
        "border-red-200 bg-red-50 text-red-700",
      Icone:
        FileText,
    };
  }

  if (
    [
      "ppt",
      "pptx",
      "odp",
    ].includes(
      extensao
    )
  ) {
    return {
      rotulo:
        "POWERPOINT",
      corIcone:
        "text-orange-700",
      corSelo:
        "border-orange-200 bg-orange-50 text-orange-700",
      Icone:
        Presentation,
    };
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
    ].includes(
      extensao
    )
  ) {
    return {
      rotulo:
        "IMAGEM",
      corIcone:
        "text-violet-700",
      corSelo:
        "border-violet-200 bg-violet-50 text-violet-700",
      Icone:
        FileImage,
    };
  }

  if (
    [
      "zip",
      "rar",
      "7z",
      "tar",
      "gz",
    ].includes(
      extensao
    )
  ) {
    return {
      rotulo:
        "COMPACTADO",
      corIcone:
        "text-amber-700",
      corSelo:
        "border-amber-200 bg-amber-50 text-amber-700",
      Icone:
        FileArchive,
    };
  }

  return {
    rotulo:
      extensao
        ? extensao.toUpperCase()
        : "ARQUIVO",
    corIcone:
      "text-slate-600",
    corSelo:
      "border-slate-200 bg-slate-50 text-slate-600",
    Icone:
      FileText,
  };
}

export function InformacoesClienteDocumentos({
  obraId,
}: InformacoesClienteDocumentosProps) {
  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    documentos,
    setDocumentos,
  ] = useState<InformacaoClienteDocumento[]>(
    []
  );

  const [
    carregando,
    setCarregando,
  ] = useState(
    true
  );

  const [
    enviando,
    setEnviando,
  ] = useState(
    false
  );

  const [
    arrastando,
    setArrastando,
  ] = useState(
    false
  );

  const [
    excluindoId,
    setExcluindoId,
  ] = useState<
    string | null
  >(
    null
  );

  const [
    erro,
    setErro,
  ] = useState<
    string | null
  >(
    null
  );

  async function carregarDocumentos() {
    try {
      setErro(
        null
      );

      const resultado =
        await listarInformacoesClienteDocumentos(
          obraId
        );

      setDocumentos(
        resultado
      );
    } catch (error) {
      console.error(
        "Erro ao buscar informações do cliente:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os documentos."
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  useEffect(
    () => {
      void carregarDocumentos();
    },
    [
      obraId,
    ]
  );

  async function enviarArquivos(
    arquivos: File[]
  ) {
    if (
      arquivos.length ===
      0
    ) {
      return;
    }

    try {
      setEnviando(
        true
      );

      setErro(
        null
      );

      const enviados:
        InformacaoClienteDocumento[] =
          [];

      for (
        const arquivo
        of arquivos
      ) {
        const documento =
          await enviarInformacaoClienteDocumento(
            obraId,
            arquivo
          );

        enviados.push(
          documento
        );
      }

      setDocumentos(
        (
          estadoAtual
        ) => [
          ...enviados.reverse(),
          ...estadoAtual,
        ]
      );
    } catch (error) {
      console.error(
        "Erro ao enviar informações do cliente:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar os arquivos."
      );

      await carregarDocumentos();
    } finally {
      setEnviando(
        false
      );

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    }
  }

  function handleSelecionarArquivos(
    event: ChangeEvent<HTMLInputElement>
  ) {
    void enviarArquivos(
      Array.from(
        event.target.files ??
          []
      )
    );
  }

  function handleSoltarArquivos(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setArrastando(
      false
    );

    if (enviando) {
      return;
    }

    void enviarArquivos(
      Array.from(
        event.dataTransfer.files
      )
    );
  }

  async function handleExcluir(
    documento: InformacaoClienteDocumento
  ) {
    const confirmou =
      window.confirm(
        `Deseja excluir o arquivo "${documento.nome}"?`
      );

    if (!confirmou) {
      return;
    }

    try {
      setExcluindoId(
        documento.id
      );

      setErro(
        null
      );

      await excluirInformacaoClienteDocumento(
        documento
      );

      setDocumentos(
        (
          estadoAtual
        ) =>
          estadoAtual.filter(
            (
              item
            ) =>
              item.id !==
              documento.id
          )
      );
    } catch (error) {
      console.error(
        "Erro ao excluir informação do cliente:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o arquivo."
      );
    } finally {
      setExcluindoId(
        null
      );
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-gray-700" />

          <h2 className="text-lg font-bold text-gray-900">
            Informações do cliente
          </h2>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Anexe questionários, planilhas, memoriais e outros arquivos recebidos do cliente.
        </p>
      </div>

      <input
        ref={
          inputRef
        }
        type="file"
        multiple
        onChange={
          handleSelecionarArquivos
        }
        className="hidden"
      />

      <div
        onDragEnter={(
          event
        ) => {
          event.preventDefault();

          setArrastando(
            true
          );
        }}
        onDragOver={(
          event
        ) =>
          event.preventDefault()
        }
        onDragLeave={() =>
          setArrastando(
            false
          )
        }
        onDrop={
          handleSoltarArquivos
        }
        className={`rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          arrastando
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50/70"
        }`}
      >
        {enviando ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
        ) : (
          <Upload className="mx-auto h-8 w-8 text-gray-500" />
        )}

        <p className="mt-3 text-sm font-semibold text-gray-800">
          {enviando
            ? "Enviando arquivos..."
            : "Arraste os arquivos para cá"}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          ou selecione um ou vários arquivos do computador
        </p>

        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
          disabled={
            enviando
          }
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Paperclip className="h-4 w-4" />

          Selecionar arquivos
        </button>
      </div>

      {erro && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="flex items-center justify-center gap-2 py-5 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />

          Carregando arquivos...
        </div>
      ) : documentos.length ===
        0 ? (
        <div className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">
          Nenhuma informação do cliente foi anexada.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Arquivos anexados
            </h3>

            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
              {documentos.length}
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {documentos.map(
              (
                documento
              ) => {
                const tipo =
                  obterTipoArquivo(
                    documento.nome
                  );

                const Icone =
                  tipo.Icone;

                const excluindo =
                  excluindoId ===
                  documento.id;

                return (
                  <div
                    key={
                      documento.id
                    }
                    className="flex min-w-0 items-center gap-3 rounded-xl border bg-white p-3.5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                      <Icone
                        className={`h-6 w-6 ${tipo.corIcone}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        title={
                          documento.nome
                        }
                        className="truncate text-sm font-semibold text-gray-900"
                      >
                        {documento.nome}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${tipo.corSelo}`}
                        >
                          {tipo.rotulo}
                        </span>

                        <span className="text-xs text-gray-500">
                          {new Date(
                            documento.created_at
                          ).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    </div>

                    <a
                      href={
                        documento.arquivo_url
                      }
                      download
                      title="Baixar arquivo"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Download className="h-4 w-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        handleExcluir(
                          documento
                        )
                      }
                      disabled={
                        excluindo
                      }
                      title="Excluir arquivo"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {excluindo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </section>
  );
}