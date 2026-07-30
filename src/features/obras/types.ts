export type StatusObra =
  | "recebida"
  | "em_analise"
  | "em_desenvolvimento"
  | "aguardando_cliente"
  | "concluida";


export interface Obra {
  id: string;

  codigo: string | null;

  cliente: string;
  razao_social: string | null;

  cnpj: string | null;
  email: string | null;
  telefone: string | null;

  cidade: string | null;
  estado: string | null;

  vazao: number | null;

  tipo_projeto: string | null;
  tipo_efluente: string | null;

  prazo_entrega: string | null;

  status: StatusObra | null;

  observacoes: string | null;

  criado_por: string | null;

  created_at: string;
  updated_at: string;
}