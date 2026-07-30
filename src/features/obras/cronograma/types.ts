export interface CronogramaEtapa {


  id: string;


  obra_id: string;


  etapa: string;


  descricao: string | null;


  responsavel: string | null;


  data_inicio: string | null;


  data_fim: string | null;


  progresso: number;


  status: string;


  created_at: string;


}