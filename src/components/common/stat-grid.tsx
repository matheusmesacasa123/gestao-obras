import type { ReactNode } from "react";

interface StatGridProps {
  children: ReactNode;
}

export function StatGrid({
  children,
}: StatGridProps) {
  return (
    <div
      className="
        grid
        gap-4
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-5
      "
    >
      {children}
    </div>
  );
}