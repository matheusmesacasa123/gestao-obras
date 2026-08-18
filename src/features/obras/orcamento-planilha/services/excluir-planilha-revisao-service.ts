import {
  supabase,
} from '@/integrations/supabase/client'

export interface ExcluirPlanilhaRevisaoPayload {
  orcamentoId: string
  revisaoId: string
  importacaoId: string
}

export async function excluirPlanilhaRevisao({
  orcamentoId,
  revisaoId,
  importacaoId,
}: ExcluirPlanilhaRevisaoPayload) {
  const {
    error,
  } = await supabase.rpc(
    'excluir_planilha_revisao',
    {
      p_orcamento_id:
        orcamentoId,

      p_revisao_id:
        revisaoId,

      p_importacao_id:
        importacaoId,
    },
  )

  if (error) {
    if (
      error.message
        .toLocaleLowerCase('pt-BR')
        .includes(
          'permission',
        ) ||
      error.message
        .toLocaleLowerCase('pt-BR')
        .includes(
          'permissão',
        )
    ) {
      throw new Error(
        'Você não possui permissão para excluir esta planilha.',
      )
    }

    throw new Error(
      error.message ||
        'Não foi possível excluir a planilha.',
    )
  }
}