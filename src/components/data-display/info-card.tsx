import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InfoCardProps {
  title: string;
  children: ReactNode;
}

export function InfoCard({
  title,
  children,
}: InfoCardProps) {
  return (
    <Card>

      <CardHeader>

        <CardTitle>

          {title}

        </CardTitle>

      </CardHeader>

      <CardContent>

        {children}

      </CardContent>

    </Card>
  );
}