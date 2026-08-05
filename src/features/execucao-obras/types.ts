export type StatusObraExecucao =
  | "nao_iniciada"
  | "em_andamento"
  | "aguardando_cliente"
  | "paralisada"
  | "atrasada"
  | "concluida"
  | "cancelada";

export interface SetorObraExecucao {
  id: string;
  nome: string;
}

export interface ClienteObraExecucao {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
}

export interface UsuarioObraExecucao {
  id: string;
  nome: string;
  email: string;
}

export interface OrcamentoVinculado {
  id: string;
  codigo: string | null;
  numero_proposta: string | null;
  status: string | null;
}

export interface ObraExecucao {
  id: string;

  orcamento_id: string | null;
  cliente_id: string | null;
  setor_id: string | null;
  responsavel_id: string | null;
  vendedor_id: string | null;

  codigo: string | null;
  cliente: string | null;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;

  nome_obra: string | null;
  descricao: string | null;

  tipo_projeto: string | null;
  tipo_efluente: string | null;
  vazao: number | null;

  numero_proposta: string | null;
  vendedor: string | null;

  valor_vendido: number | null;
  custo_orcado: number | null;

  status: StatusObraExecucao;

  data_inicio: string | null;
  prazo_entrega: string | null;
  data_entrega: string | null;

  incluido_erp: boolean;
  codigo_erp: string | null;
  incluido_erp_em: string | null;
  incluido_erp_por: string | null;

  observacoes: string | null;
  criado_por: string | null;

  created_at: string;
  updated_at: string;

  cliente_relacionado?: ClienteObraExecucao | null;
  setor?: SetorObraExecucao | null;
  responsavel?: UsuarioObraExecucao | null;
  incluido_erp_usuario?: UsuarioObraExecucao | null;
  orcamento?: OrcamentoVinculado | null;
}