export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function FieldWarning({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-amber-700 dark:text-amber-300">{message}</p>;
}
