import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  color?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "text-primary",
}: StatCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">

        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>

        {Icon && (
          <Icon
            className="h-5 w-5 text-muted-foreground"
          />
        )}

      </CardHeader>

      <CardContent>

        <div
          className={`text-3xl font-bold ${color}`}
        >
          {value}
        </div>

        {description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

      </CardContent>
    </Card>
  );
}