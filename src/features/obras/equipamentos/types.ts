export interface Equipamento {

  id: string;

  obra_id: string;

  nome: string;

  fabricante: string | null;

  modelo: string | null;

  quantidade: number;

  status: string | null;

  observacoes: string | null;

  created_at: string;

}