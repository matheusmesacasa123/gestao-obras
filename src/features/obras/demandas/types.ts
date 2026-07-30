export type StatusDemanda =
  | "aberta"
  | "em_andamento"
  | "concluida"
  | "cancelada";


export type PrioridadeDemanda =
  | "baixa"
  | "media"
  | "alta";


export interface Demanda {

  id: string;

  obra_id: string;

  titulo: string;

  descricao: string | null;

  status: StatusDemanda | null;

  prioridade: PrioridadeDemanda | null;

  responsavel_id: string | null;

  prazo: string | null;

  criado_por: string | null;

  created_at: string;

  updated_at: string;

}