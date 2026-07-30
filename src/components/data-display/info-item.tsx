interface InfoItemProps {
  label: string;
  value?: string | number | null;
}

export function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div className="flex justify-between gap-6 border-b py-2">

      <span className="font-medium text-muted-foreground">

        {label}

      </span>

      <span>

        {value ?? "-"}

      </span>

    </div>
  );
}