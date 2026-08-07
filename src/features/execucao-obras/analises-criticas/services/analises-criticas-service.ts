import {
  supabase,
} from "@/integrations/supabase/client";

import type {
  AnaliseCriticaDemanda,
  CriarAnaliseCriticaDados,
  StatusAnaliseCriticaDemanda,
  StatusAnaliseCriticaEtapa,
  StatusAnaliseCriticaObra,
} from "../types";

interface ReprovacaoHistoricaDemanda
  extends AnaliseCriticaDemanda {
  obra_id: string;
  etapa_id: string;
  grupo_revisao_id: string;
  numero_revisao: number;
  titulo: string;
}

export async function listarAnalisesCriticasAtuaisPorDemandas(
  demandaIds: string[]
): Promise<AnaliseCriticaDemanda[]> {
  if (
    demandaIds.length ===
    0
  ) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "analises_criticas_demandas_execucao_atuais"
    )
    .select(
      `
        id,
        demanda_id,
        resultado,
        observacao,
        analisado_por,
        created_at,
        analisado_por_nome,
        analisado_por_email
      `
    )
    .in(
      "demanda_id",
      demandaIds
    );

  if (error) {
    console.error(
      "Erro ao listar as análises críticas atuais das revisões:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ) as AnaliseCriticaDemanda[];
}

export async function listarReprovacoesHistoricasPorObra(
  obraId: string
): Promise<ReprovacaoHistoricaDemanda[]> {
  const {
    data: revisoes,
    error,
  } = await supabase
    .from(
      "demandas_obras_execucao"
    )
    .select(
      `
        id,
        obra_id,
        etapa_id,
        grupo_revisao_id,
        numero_revisao,
        titulo
      `
    )
    .eq(
      "obra_id",
      obraId
    );

  if (error) {
    console.error(
      "Erro ao listar revisões para o histórico de reprovações:",
      error
    );

    throw error;
  }

  const listaRevisoes =
    revisoes ?? [];

  const analises =
    await listarAnalisesCriticasAtuaisPorDemandas(
      listaRevisoes.map(
        (
          revisao
        ) =>
          revisao.id
      )
    );

  const analisesPorDemanda =
    new Map(
      analises.map(
        (
          analise
        ) => [
          analise.demanda_id,
          analise,
        ]
      )
    );

  return listaRevisoes
    .flatMap(
      (
        revisao
      ) => {
        const analise =
          analisesPorDemanda.get(
            revisao.id
          );

        if (
          !analise ||
          analise.resultado !==
            "reprovada"
        ) {
          return [];
        }

        return [
          {
            ...analise,

            obra_id:
              revisao.obra_id,

            etapa_id:
              revisao.etapa_id,

            grupo_revisao_id:
              revisao.grupo_revisao_id,

            numero_revisao:
              Number(
                revisao.numero_revisao ??
                  0
              ),

            titulo:
              revisao.titulo,
          },
        ];
      }
    )
    .sort(
      (
        analiseA,
        analiseB
      ) =>
        analiseB.numero_revisao -
        analiseA.numero_revisao
    );
}

function normalizarNumero(
  valor: unknown
): number {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero
  )
    ? numero
    : 0;
}

function validarDadosAnalise(
  dados: CriarAnaliseCriticaDados
): string | null {
  const observacao =
    dados.observacao?.trim() ||
    null;

  if (
    dados.resultado ===
      "reprovada" &&
    !observacao
  ) {
    throw new Error(
      "Informe a justificativa da reprovação."
    );
  }

  return observacao;
}

function normalizarStatusObra(
  item: any
): StatusAnaliseCriticaObra {
  return {
    obra_id:
      item.obra_id,

    codigo:
      item.codigo ?? null,

    nome_obra:
      item.nome_obra ?? null,

    total_etapas:
      normalizarNumero(
        item.total_etapas
      ),

    etapas_aprovadas:
      normalizarNumero(
        item.etapas_aprovadas
      ),

    etapas_reprovadas:
      normalizarNumero(
        item.etapas_reprovadas
      ),

    etapas_pendentes:
      normalizarNumero(
        item.etapas_pendentes
      ),

    status_analise:
      item.status_analise,
  };
}

function normalizarStatusEtapa(
  item: any
): StatusAnaliseCriticaEtapa {
  return {
    etapa_id:
      item.etapa_id,

    obra_id:
      item.obra_id,

    ordem:
      item.ordem ?? null,

    titulo:
      item.titulo ?? null,

    setor_id:
      item.setor_id,

    total_demandas:
      normalizarNumero(
        item.total_demandas
      ),

    demandas_aprovadas:
      normalizarNumero(
        item.demandas_aprovadas
      ),

    demandas_reprovadas:
      normalizarNumero(
        item.demandas_reprovadas
      ),

    demandas_pendentes:
      normalizarNumero(
        item.demandas_pendentes
      ),

    status_analise:
      item.status_analise,
  };
}

function normalizarStatusDemanda(
  item: any
): StatusAnaliseCriticaDemanda {
  return {
    demanda_id:
      item.demanda_id,

    obra_id:
      item.obra_id,

    etapa_id:
      item.etapa_id,

    grupo_revisao_id:
      item.grupo_revisao_id,

    numero_revisao:
      normalizarNumero(
        item.numero_revisao
      ),

    titulo:
      item.titulo,

    status_demanda:
      item.status_demanda,

    status_analise:
      item.status_analise,

    analise_id:
      item.analise_id ?? null,

    observacao:
      item.observacao ?? null,

    analisado_por:
      item.analisado_por ?? null,

    analisado_por_nome:
      item.analisado_por_nome ?? null,

    analisado_por_email:
      item.analisado_por_email ?? null,

    analisado_em:
      item.analisado_em ?? null,
  };
}

export async function buscarStatusAnaliseCriticaObra(
  obraId: string
): Promise<StatusAnaliseCriticaObra | null> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "status_analise_critica_obras_execucao"
    )
    .select("*")
    .eq(
      "obra_id",
      obraId
    )
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao buscar status da análise crítica da obra:",
      error
    );

    throw error;
  }

  if (!data) {
    return null;
  }

  return normalizarStatusObra(
    data
  );
}

export async function listarStatusAnaliseCriticaEtapas(
  obraId: string
): Promise<StatusAnaliseCriticaEtapa[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "status_analise_critica_etapas_execucao"
    )
    .select("*")
    .eq(
      "obra_id",
      obraId
    )
    .order(
      "ordem",
      {
        ascending:
          true,

        nullsFirst:
          false,
      }
    );

  if (error) {
    console.error(
      "Erro ao listar status das etapas na análise crítica:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ).map(
    normalizarStatusEtapa
  );
}

export async function listarStatusAnaliseCriticaDemandas(
  obraId: string
): Promise<StatusAnaliseCriticaDemanda[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "status_analise_critica_demandas_execucao"
    )
    .select("*")
    .eq(
      "obra_id",
      obraId
    )
    .order(
      "etapa_id",
      {
        ascending:
          true,
      }
    )
    .order(
      "titulo",
      {
        ascending:
          true,
      }
    );

  if (error) {
    console.error(
      "Erro ao listar demandas da análise crítica:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ).map(
    normalizarStatusDemanda
  );
}

export async function criarAnaliseCriticaDemanda(
  dados: CriarAnaliseCriticaDados
): Promise<void> {
  const observacao =
    validarDadosAnalise(
      dados
    );

  const {
    data: sessao,
    error: erroSessao,
  } = await supabase.auth.getUser();

  if (erroSessao) {
    console.error(
      "Erro ao identificar o usuário da análise crítica:",
      erroSessao
    );

    throw erroSessao;
  }

  const usuarioId =
    sessao.user?.id;

  if (!usuarioId) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const {
    error,
  } = await supabase
    .from(
      "analises_criticas_demandas_execucao"
    )
    .insert({
      demanda_id:
        dados.demanda_id,

      resultado:
        dados.resultado,

      observacao,

      analisado_por:
        usuarioId,
    });

  if (error) {
    console.error(
      "Erro ao registrar análise crítica da demanda da execução:",
      error
    );

    throw error;
  }
}

export async function editarAnaliseCriticaDemanda(
  analiseId: string,
  dados: CriarAnaliseCriticaDados
): Promise<void> {
  const observacao =
    validarDadosAnalise(
      dados
    );

  const {
    error,
  } = await supabase
    .from(
      "analises_criticas_demandas_execucao"
    )
    .update({
      resultado:
        dados.resultado,

      observacao,
    })
    .eq(
      "id",
      analiseId
    );

  if (error) {
    console.error(
      "Erro ao editar análise crítica da demanda da execução:",
      error
    );

    throw error;
  }
}

export async function excluirAnaliseCriticaDemanda(
  analiseId: string
): Promise<void> {
  const {
    error,
  } = await supabase
    .from(
      "analises_criticas_demandas_execucao"
    )
    .delete()
    .eq(
      "id",
      analiseId
    );

  if (error) {
    console.error(
      "Erro ao excluir análise crítica da demanda da execução:",
      error
    );

    throw error;
  }
}