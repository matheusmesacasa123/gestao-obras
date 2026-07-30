interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div
      className="
        border
        rounded-xl
        p-10
        text-center
      "
    >
      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      {description && (
        <p className="mt-2 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}