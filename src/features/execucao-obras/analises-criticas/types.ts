export type ResultadoAnaliseCritica =
  | "aprovada"
  | "reprovada";

export type StatusAnaliseCritica =
  | "pendente"
  | "aprovada"
  | "reprovada";

export interface AnaliseCriticaDemanda {
  id: string;
  demanda_id: string;
  resultado: ResultadoAnaliseCritica;
  observacao: string | null;
  analisado_por: string | null;
  created_at: string;

  analisado_por_nome?: string | null;
  analisado_por_email?: string | null;
}

export interface StatusAnaliseCriticaDemanda {
  demanda_id: string;
  obra_id: string;
  etapa_id: string;
  grupo_revisao_id: string;
  numero_revisao: number;
  titulo: string;
  status_demanda: string;
  status_analise: StatusAnaliseCritica;

  analise_id: string | null;
  observacao: string | null;
  analisado_por: string | null;
  analisado_por_nome: string | null;
  analisado_por_email: string | null;
  analisado_em: string | null;
}

export interface StatusAnaliseCriticaEtapa {
  etapa_id: string;
  obra_id: string;
  ordem: number | null;
  titulo: string | null;
  setor_id: string;

  total_demandas: number;
  demandas_aprovadas: number;
  demandas_reprovadas: number;
  demandas_pendentes: number;

  status_analise: StatusAnaliseCritica;
}

export interface StatusAnaliseCriticaObra {
  obra_id: string;
  codigo: string | null;
  nome_obra: string | null;

  total_etapas: number;
  etapas_aprovadas: number;
  etapas_reprovadas: number;
  etapas_pendentes: number;

  status_analise: StatusAnaliseCritica;
}

export interface CriarAnaliseCriticaDados {
  demanda_id: string;
  resultado: ResultadoAnaliseCritica;
  observacao?: string | null;
}