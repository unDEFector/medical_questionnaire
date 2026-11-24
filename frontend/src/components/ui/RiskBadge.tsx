import { cn } from "@/lib/utils";
import { riskLabels, type RiskLevel } from "@/types/ui";

export function RiskBadge({ risk, className }: { risk: RiskLevel | null; className?: string }) {
  if (!risk) return <span className="text-sm text-slate-400">Ожидает анкеты</span>;
  const styles = {
    low: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    moderate: "bg-amber-50 text-amber-700 ring-amber-600/10",
    high: "bg-red-50 text-red-700 ring-red-600/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        styles[risk],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {riskLabels[risk]}
    </span>
  );
}
