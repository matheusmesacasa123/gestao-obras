import type { Obra } from "@/features/obras/types";

interface Props {
  obras: Obra[];
}

export function StatusObrasChart({ obras }: Props) {
  const total = obras.length || 1;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Helper para verificar se a obra está em aberto e atrasada
  const isAtrasada = (obra: Obra) => {
    if (obra.data_entrega || obra.status === "concluida" || obra.status === "entregue") {
      return false;
    }
    if (!obra.data_entrega_esperada) return false;
    const [ano, mes, dia] = obra.data_entrega_esperada.split("-").map(Number);
    const dataEsperada = new Date(ano, mes - 1, dia);
    return dataEsperada < hoje;
  };

  // Helper para verificar se foi concluída após a data esperada
  const isFinalizadaComAtraso = (obra: Obra) => {
    const isConcluida = obra.status === "concluida" || obra.status === "entregue" || !!obra.data_entrega;
    if (!isConcluida || !obra.data_entrega || !obra.data_entrega_esperada) {
      return false;
    }

    const [anoE, mesE, diaE] = obra.data_entrega_esperada.split("-").map(Number);
    const dataEsperada = new Date(anoE, mesE - 1, diaE);

    const [anoR, mesR, diaR] = obra.data_entrega.split("-").map(Number);
    const dataReal = new Date(anoR, mesR - 1, diaR);

    return dataReal > dataEsperada;
  };

  // 1. Em andamento (qualquer obra que não esteja concluída/entregue)
  const andamento = obras.filter(
    (obra) => obra.status !== "concluida" && obra.status !== "entregue" && !obra.data_entrega
  ).length;

  // 2. Concluídas (todas as finalizadas)
  const concluidas = obras.filter(
    (obra) => obra.status === "concluida" || obra.status === "entregue" || !!obra.data_entrega
  ).length;

  // 3. Atrasadas (obras ativas com prazo estourado)
  const atrasadas = obras.filter(isAtrasada).length;

  // 4. Finalizadas com atraso
  const finalizadasComAtraso = obras.filter(isFinalizadaComAtraso).length;

  const dados = [
    {
      nome: "Em andamento",
      valor: andamento,
      cor: "bg-blue-500",
    },
    {
      nome: "Concluídas",
      valor: concluidas,
      cor: "bg-green-500",
    },
    {
      nome: "Atrasadas",
      valor: atrasadas,
      cor: "bg-red-500",
    },
    {
      nome: "Finalizadas com atraso",
      valor: finalizadasComAtraso,
      cor: "bg-orange-500",
    },
  ];

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <h2 className="font-semibold text-lg mb-5">Status das Obras</h2>

      <div className="space-y-4">
        {dados.map((item) => (
          <div key={item.nome}>
            <div className="flex justify-between text-sm mb-1">
              <span>{item.nome}</span>
              <span className="font-medium">{item.valor}</span>
            </div>

            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${item.cor}`}
                style={{
                  width: `${(item.valor / total) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}