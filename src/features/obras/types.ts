export type StatusObra =
  | "recebida"
  | "em_analise"
  | "em_desenvolvimento"
  | "aguardando_cliente"
  | "concluida";

export type StatusEtapaObra =
  | "nao_iniciada"
  | "em_andamento"
  | "aguardando_outro_setor"
  | "aguardando_cliente"
  | "bloqueada"
  | "concluida";

export interface SetorObra {
  id: string;
  nome: string;
}

export interface ClienteObra {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
}

export interface EtapaObraResumo {
  id: string;
  obra_id: string;
  setor_id: string;
  responsavel_id: string | null;

  status: StatusEtapaObra;

  data_inicio: string | null;
  prazo: string | null;
  data_conclusao: string | null;

  observacao: string | null;

  obrigatoria: boolean;
  ordem: number | null;

  setor?: SetorObra | null;

  responsavel?: {
    id: string;
    nome: string;
    email: string;
  } | null;
}

export interface Obra {
  id: string;

  setor_id: string | null;
  cliente_id: string | null;

  setor?: SetorObra | null;
  clientes?: ClienteObra | null;
  etapas?: EtapaObraResumo[];

  codigo: string | null;
  cliente: string | null;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;

  vazao: number | null;
  tipo_projeto: string | null;
  tipo_efluente: string | null;

  numero_proposta: string | null;
  vendedor: string | null;
  data_entrada: string | null;
  data_entrega_esperada: string | null;
  tipo_proposta: string | null;
  tipo_orcamentacao: string | null;

  valor_orcado: number | null;
  custo_orcado: number | null;
  valor_vendido: number | null;
  custo_real: number | null;

  nome_obra: string | null;
  descricao: string | null;
  complexidade: string | null;
  responsavel_engenheiro: string | null;

  data_inicio: string | null;
  data_entrega: string | null;
  situacao_especial: string | null;
  motivo_atraso: string | null;

  prazo_entrega: string | null;
  status: StatusObra | null;
  observacoes: string | null;
  criado_por: string | null;

  progresso?: number | null;

  created_at: string;
  updated_at: string;
}

export interface HistoricoValoresObra {
  id: string;
  obra_id: string;


  valor_orcado_anterior: number | null;
  valor_orcado_novo: number | null;

  custo_orcado_anterior: number | null;
  custo_orcado_novo: number | null;

  valor_vendido_anterior: number | null;
  valor_vendido_novo: number | null;

  custo_real_anterior: number | null;
  custo_real_novo: number | null;

  motivo_alteracao: string;
  alterado_por: string | null;

  created_at: string;
}