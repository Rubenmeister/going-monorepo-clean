export function GoingLogo({
  textColor = '#ffffff',
  size = 26,
}: {
  textColor?: string;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Going icon mark — G arc + destination dot */}
      <svg
        width={size * 0.75}
        height={size}
        viewBox="44 26 121 111"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 139 43 A 55 55 0 1 0 155 82 L 108 82"
          stroke="#ff4c41"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="108" cy="82" r="8.5" fill="#ffd253" />
      </svg>
      <span
        style={{
          fontSize: size * 0.77,
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        Going
      </span>
    </div>
  );
}
