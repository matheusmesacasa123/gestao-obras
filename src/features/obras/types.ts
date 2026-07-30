export type StatusObra =
  | "recebida"
  | "em_analise"
  | "em_desenvolvimento"
  | "aguardando_cliente"
  | "concluida";



export interface Obra {


  id: string;


  // Dados gerais

  codigo: string | null;

  cliente: string;

  razao_social: string | null;

  cnpj: string | null;

  email: string | null;

  telefone: string | null;


  cidade: string | null;

  estado: string | null;



  // Dados técnicos

  vazao: number | null;

  tipo_projeto: string | null;

  tipo_efluente: string | null;



  // Dados comerciais

  numero_proposta: string | null;

  revisao: number | null;

  motivo_revisao: string | null;

  vendedor: string | null;

  data_entrada: string | null;

  data_entrega_esperada: string | null;

  tipo_proposta: string | null;

  tipo_orcamentacao: string | null;



  // Informações da obra

  nome_obra: string | null;

  descricao: string | null;

  complexidade: string | null;

  responsavel_engenheiro: string | null;



  // Execução

  data_inicio: string | null;

  data_entrega: string | null;

  situacao_especial: string | null;

  motivo_atraso: string | null;



  // Controle atual

  prazo_entrega: string | null;

  status: StatusObra | null;


  observacoes: string | null;


  criado_por: string | null;


  created_at: string;

  updated_at: string;

}