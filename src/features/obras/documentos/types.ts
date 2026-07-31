export interface Documento {
  id: string;

  obra_id: string;

  setor_id: string | null;

  nome: string;

  categoria: string | null;

  arquivo_url: string;

  created_at: string;
}