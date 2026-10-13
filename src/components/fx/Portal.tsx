/** Portal-ring loader: a blue ring that draws itself on a 1.8s loop. */
export function Portal({ size = 64, label }: { size?: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ overflow: 'visible', filter: 'drop-shadow(0 0 6px rgba(58,160,255,.8))', flex: 'none' }}
    >
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="2" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#8CCBFF"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset="100"
        transform="rotate(-90 50 50)"
      >
        <animate attributeName="stroke-dashoffset" values="100;0;-100" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
