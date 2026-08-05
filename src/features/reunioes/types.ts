export type StatusReuniao =
  | "agendada"
  | "realizada"
  | "cancelada";

export interface ObraReuniao {
  id: string;
  codigo: string | null;
  nome_obra: string | null;
  cliente: string | null;
}

export interface SetorReuniao {
  id: string;
  nome: string;
}

export interface UsuarioReuniao {
  id: string;
  nome: string;
  email: string;
}

export interface ReuniaoSetorVinculo {
  reuniao_id: string;
  setor_id: string;
  created_at: string;

  setor?: SetorReuniao | null;
}

export interface ReuniaoParticipanteVinculo {
  reuniao_id: string;
  usuario_id: string;
  created_at: string;

  usuario?: UsuarioReuniao | null;
}

export interface Reuniao {
  id: string;
  obra_id: string;

  titulo: string;

  inicio: string;
  fim: string | null;

  local: string | null;
  link_reuniao: string | null;

  pauta: string | null;
  observacoes: string | null;
  decisoes: string | null;
  proximos_passos: string | null;

  status: StatusReuniao;

  criado_por: string;

  created_at: string;
  updated_at: string;

  obra?: ObraReuniao | null;
  criador?: UsuarioReuniao | null;

  setores?: ReuniaoSetorVinculo[];
  participantes?: ReuniaoParticipanteVinculo[];
}

export interface CriarReuniaoPayload {
  obra_id: string;
  titulo: string;

  inicio: string;
  fim?: string | null;

  local?: string | null;
  link_reuniao?: string | null;

  pauta?: string | null;
  observacoes?: string | null;
  decisoes?: string | null;
  proximos_passos?: string | null;

  status?: StatusReuniao;

  criado_por: string;

  setor_ids?: string[];
  participante_ids?: string[];
}

export interface AtualizarReuniaoPayload {
  titulo?: string;

  inicio?: string;
  fim?: string | null;

  local?: string | null;
  link_reuniao?: string | null;

  pauta?: string | null;
  observacoes?: string | null;
  decisoes?: string | null;
  proximos_passos?: string | null;

  status?: StatusReuniao;

  setor_ids?: string[];
  participante_ids?: string[];
}