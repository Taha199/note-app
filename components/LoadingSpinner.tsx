type LoadingSpinnerProps = {
  label?: string;
};

export function LoadingSpinner({ label = "Loading" }: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-zinc-500">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-stone-200 border-t-teal-600" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}
