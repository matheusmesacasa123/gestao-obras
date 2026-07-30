import { Badge } from "@/components/ui/badge";

interface PrioridadeBadgeProps {
  prioridade: string;
}

export function PrioridadeBadge({
  prioridade,
}: PrioridadeBadgeProps) {
  const classes: Record<string, string> = {
    baixa:
      "bg-gray-100 text-gray-700 hover:bg-gray-100",

    media:
      "bg-orange-100 text-orange-700 hover:bg-orange-100",

    alta:
      "bg-red-100 text-red-700 hover:bg-red-100",
  };

  return (
    <Badge
      className={
        classes[prioridade] ??
        "bg-gray-100 text-gray-700"
      }
    >
      {prioridade}
    </Badge>
  );
}