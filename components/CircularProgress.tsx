interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function progressColor(pct: number): string {
  if (pct === 0) return "#a8a29e";
  if (pct < 50) return "#F0A500";
  if (pct < 100) return "#3B8BD4";
  return "#3aaa5c";
}

export default function CircularProgress({
  percentage,
  size = 64,
  strokeWidth = 5,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage / 100);
  const color = progressColor(percentage);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${percentage}% complete`}
      role="img"
    >
      {/* Background track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-stone-200 dark:stroke-stone-700"
      />

      {/* Progress arc — rotated so it starts at 12 o'clock */}
      {percentage > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}

      {/* Center: percentage number */}
      <text
        x={cx}
        y={cy - size * 0.06}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: size * 0.24,
          fontWeight: 700,
          fontFamily: "inherit",
        }}
        className="fill-stone-700 dark:fill-stone-200"
      >
        {percentage}
      </text>

      {/* Center: % label */}
      <text
        x={cx}
        y={cy + size * 0.22}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: size * 0.15, fontFamily: "inherit" }}
        className="fill-stone-400 dark:fill-stone-500"
      >
        %
      </text>
    </svg>
  );
}
