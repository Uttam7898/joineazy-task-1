export function ProgressBar({ percent, label }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-moss transition-all"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

export function Badge({ children, tone = "moss" }) {
  const tones = {
    moss: "bg-moss/10 text-moss",
    clay: "bg-clay/15 text-clay",
    ink: "bg-ink/10 text-ink",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
