export function LoadingState({
  message = "Carregando...",
}: {
  message?: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-center
        py-16
      "
    >
      <p className="text-muted-foreground">
        {message}
      </p>
    </div>
  );
}