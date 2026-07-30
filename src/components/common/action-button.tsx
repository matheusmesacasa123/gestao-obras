import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

export function ActionButton({
  children,
  onClick,
}: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="gap-2"
    >
      {children}
    </Button>
  );
}