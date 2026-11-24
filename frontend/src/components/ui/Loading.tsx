export function Loading({ label = "Загрузка данных" }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center" role="status">
      <span className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-800" role="alert">
      <p className="font-semibold">Что-то пошло не так</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}
