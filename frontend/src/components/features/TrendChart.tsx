import type { TrendPoint } from "@/types/api";

export function TrendChart({ trends }: { trends: TrendPoint[] }) {
  const points = trends.slice(-8);
  if (!points.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        График появится после первой заполненной анкеты
      </div>
    );
  }

  const width = 620;
  const height = 220;
  const padding = 36;
  const weights = points.map((point) => point.weight_kg);
  const minWeight = Math.min(...weights) - 2;
  const maxWeight = Math.max(...weights) + 2;
  const x = (index: number) =>
    points.length === 1
      ? width / 2
      : padding + (index * (width - padding * 2)) / (points.length - 1);
  const weightY = (weight: number) =>
    height -
    padding -
    ((weight - minWeight) / Math.max(1, maxWeight - minWeight)) * (height - padding * 2);
  const weightPath = points
    .map((point, index) => `${index ? "L" : "M"}${x(index)},${weightY(point.weight_kg)}`)
    .join(" ");

  return (
    <div>
      <div className="mb-3 flex gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2 w-4 rounded bg-brand-500" />
          Масса тела, кг
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Динамика массы тела"
      >
        {[0, 1, 2, 3].map((line) => {
          const y = padding + (line * (height - padding * 2)) / 3;
          return (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#E8EEF3"
              strokeDasharray="4 5"
            />
          );
        })}
        <path
          d={weightPath}
          fill="none"
          stroke="#1683B5"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <g key={point.survey_id}>
            <circle
              cx={x(index)}
              cy={weightY(point.weight_kg)}
              r="5"
              fill="#1683B5"
              stroke="white"
              strokeWidth="2"
            >
              <title>{`Вес: ${point.weight_kg} кг`}</title>
            </circle>
            <text x={x(index)} y={height - 8} textAnchor="middle" fontSize="10" fill="#94A3B8">
              {new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(
                new Date(point.date),
              )}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
