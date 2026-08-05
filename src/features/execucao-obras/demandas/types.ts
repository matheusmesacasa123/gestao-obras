export type StatusDemanda =
  | "aberta"
  | "em_andamento"
  | "concluida"
  | "cancelada";

export type PrioridadeDemanda =
  | "baixa"
  | "media"
  | "alta";

export interface SetorDemanda {
  id: string;
  nome: string;
}

export interface EtapaDemanda {
  id: string;
  obra_id: string;
  setor_id: string;
  titulo: string | null;
  ordem: number | null;
  status: string;
  data_inicio?: string | null;
  prazo?: string | null;
  data_conclusao?: string | null;

  setor:
    | SetorDemanda
    | null;
}

export interface ResponsavelDemanda {
  id: string;
  nome: string;
  email: string;
  setor_id: string | null;

  setor:
    | SetorDemanda
    | null;
}

export interface ItemDemanda {
  id: string;
  demanda_id: string;
  titulo: string;
  concluido: boolean;
  ordem: number;
  data_conclusao: string | null;
  created_at: string;
  updated_at: string;
}

export interface Demanda {
  id: string;

  obra_id: string;

  etapa_id:
    | string
    | null;

  etapa:
    | EtapaDemanda
    | null;

  titulo: string;

  descricao: string | null;

  status:
    | StatusDemanda
    | null;

  prioridade:
    | PrioridadeDemanda
    | null;

  setor_id:
    | string
    | null;

  setor:
    | SetorDemanda
    | null;

  responsavel_id:
    | string
    | null;

  responsavel:
    | ResponsavelDemanda
    | null;

  prazo: string | null;

  data_inicio:
    | string
    | null;

  data_conclusao:
    | string
    | null;

  motivo_atraso:
    | string
    | null;

  criado_por:
    | string
    | null;

  grupo_revisao_id: string;

  numero_revisao: number;

  revisao_anterior_id:
    | string
    | null;

  status_revisao: string;

  itens?:
    | ItemDemanda[];

  created_at: string;

  updated_at: string;
}