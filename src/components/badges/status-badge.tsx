import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  const classes: Record<string, string> = {
    aberta:
      "bg-blue-100 text-blue-700 hover:bg-blue-100",

    em_andamento:
      "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",

    concluida:
      "bg-green-100 text-green-700 hover:bg-green-100",

    cancelada:
      "bg-red-100 text-red-700 hover:bg-red-100",
  };

  return (
    <Badge
      className={
        classes[status] ??
        "bg-gray-100 text-gray-700"
      }
    >
      {status.replace("_", " ")}
    </Badge>
  );
}