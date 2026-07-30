import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectionCardProps {
  title: string;
  children: ReactNode;
}

export function SectionCard({
  title,
  children,
}: SectionCardProps) {
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