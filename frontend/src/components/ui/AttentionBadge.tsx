import { cn } from "@/lib/utils";

export function AttentionBadge({
  attention,
  className,
}: {
  attention: boolean | null;
  className?: string;
}) {
  if (attention === null) return <span className="text-sm text-slate-400">Ожидает анкеты</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        attention
          ? "bg-red-50 text-red-700 ring-red-600/10"
          : "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {attention ? "Есть red flags" : "Red flags не отмечены"}
    </span>
  );
}
