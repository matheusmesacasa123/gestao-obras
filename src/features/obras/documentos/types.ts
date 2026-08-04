export interface SetorDocumento {
  id: string;
  nome: string;
}

export interface UsuarioDocumento {
  id: string;
  nome: string;
  email: string;
}

export interface DemandaDocumento {
  id: string;
  obra_id: string;
  etapa_id: string | null;
  setor_id: string | null;
  titulo: string;
  numero_revisao: number;
}

export interface EtapaDocumento {
  id: string;
  obra_id: string;
  setor_id: string;
  titulo: string | null;
  ordem: number | null;
  status: string;
  setor?: SetorDocumento | null;
}

export interface Documento {
  id: string;
  obra_id: string;
  demanda_id: string;
  demanda?: DemandaDocumento | null;
  etapa_id: string | null;
  etapa?: EtapaDocumento | null;
  setor_id: string | null;
  enviado_por: string | null;
  nome: string;
  categoria: string | null;
  arquivo_url: string;
  created_at: string;
  setor?: SetorDocumento | null;
  usuario?: UsuarioDocumento | null;
}