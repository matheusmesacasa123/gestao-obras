export type StatusComercial =
  | "pendente_envio"
  | "aguardando_retorno"
  | "em_negociacao"
  | "em_espera"
  | "aceita"
  | "recusada"
  | "cancelada"
  | "substituida";

export type CategoriaRecusa =
  | "preco"
  | "prazo"
  | "escopo"
  | "concorrencia"
  | "projeto_cancelado"
  | "sem_orcamento"
  | "sem_retorno"
  | "outro";

export interface DemandaComercial {
  id: string;
  titulo: string;
  numero_revisao: number;
  grupo_revisao_id: string;
  status_revisao: string;
}

export interface UsuarioComercial {
  id: string;
  nome: string;
  email: string;
}

export interface DocumentoComercial {
  id: string;
  nome: string;
  arquivo_url: string;
}

export interface MovimentacaoComercial {
  id: string;
  acompanhamento_id: string;
  status_anterior: StatusComercial | null;
  status_novo: StatusComercial;
  data_movimentacao: string;
  usuario_id: string | null;
  observacao: string | null;
  motivo: string | null;
  created_at: string;
  usuario: UsuarioComercial | null;
}

export interface AcompanhamentoComercial {
  id: string;
  obra_id: string;
  demanda_id: string;
  status: StatusComercial;
  data_envio: string | null;
  data_ultimo_contato: string | null;
  data_proximo_contato: string | null;
  responsavel_id: string | null;
  documento_id: string | null;
  valor_proposta: number | null;
  numero_pedido: string | null;
  motivo_espera: string | null;
  motivo_recusa: string | null;
  categoria_recusa: CategoriaRecusa | null;
  observacao: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
  demanda: DemandaComercial;
  responsavel: UsuarioComercial | null;
  documento: DocumentoComercial | null;
  movimentacoes: MovimentacaoComercial[];
}