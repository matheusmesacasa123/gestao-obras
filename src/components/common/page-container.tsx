import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({
  children,
}: PageContainerProps) {
  return (
    <main
      className="
        flex
        flex-col
        gap-8
        p-8
        w-full
      "
    >
      {children}
    </main>
  );
}